-- =====================================================================
-- 연습실 예약 서비스 · Supabase 설정
-- 사용법: Supabase 대시보드 › SQL Editor › New query 에 전체 붙여 넣고 Run
--
-- ⚠️ 다른 프로젝트와 같은 Supabase 를 같이 써도 안전하게:
--    이 앱이 만드는 표 · 함수 · 정책은 전부 이름이 dance_ 로 시작해요.
--    지우는(drop) 것도 dance_ 로 시작하는 것만 → 다른 프로젝트의 표 · 함수는 건드리지 않아요.
--    여러 번 실행해도 돼요 (이 앱의 표만 지우고 다시 만들어요 · 예약 데이터는 초기화돼요)
-- =====================================================================

-- 0) 도구(확장) 켜기 — 이미 켜져 있으면 그대로 (다른 프로젝트에 영향 없음)
--    btree_gist : "같은 방 · 같은 날 · 시간 겹침" 을 DB 가 직접 막게 해 줌
--    pgcrypto   : 비밀번호 4자리를 암호화해서 저장
create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto  with schema extensions;

-- 이 앱 것만 정리 (dance_ 로 시작하는 것만)
drop table    if exists public.dance_reservations;   -- 트리거 · 정책도 같이 지워져요
drop table    if exists public.dance_rooms;
drop function if exists public.dance_find_my_reservations(text, text);
drop function if exists public.dance_cancel_my_reservation(bigint, text, text);
drop function if exists public.dance_before_reservation_insert();
drop function if exists public.dance_price_for(int, int);
drop function if exists public.dance_price_at(int);

-- ---------------------------------------------------------------------
-- 1) dance_rooms : 연습실 (4개 고정)
-- ---------------------------------------------------------------------
create table public.dance_rooms (
  id          bigint generated always as identity primary key,
  name        text    not null unique,
  type        text    not null check (type in ('dance', 'band', 'vocal')),
  size_m2     int     not null check (size_m2 > 0),
  capacity    int     not null check (capacity > 0),
  features    text    not null default '',
  image_url   text,
  created_at  timestamptz not null default now()
);

-- 연습실 4개 넣기 (숫자는 마음대로 바꿔도 돼요)
-- 요금은 방마다가 아니라 시간대별 공통 → 아래 dance_price_at 함수 (lib/rules.ts 의 PRICE_BANDS 와 같게)
-- image_url: 대표 이미지 (Next.js 프로젝트의 public/rooms/ 폴더)
insert into public.dance_rooms (name, type, size_m2, capacity, features, image_url) values
  ('댄스 A', 'dance', 50,  6, '전신거울, 블루투스 스피커, 마루 바닥',     '/rooms/dance-a.png'),
  ('댄스 B', 'dance', 30,  4, '전신거울, 블루투스 스피커',                '/rooms/dance-b.png'),
  ('밴드',   'band',  35,  6, '드럼, 기타·베이스 앰프, 키보드, 마이크', '/rooms/band.png'),
  ('보컬',   'vocal', 10,  2, '마이크, 반사판, 업라이트 피아노',         '/rooms/vocal.png');

-- 시간대별 1시간 요금: 10~14시 8,000원 · 15~18시 9,000원 · 19~22시 10,000원
create function public.dance_price_at(h int)
returns int
language sql
immutable
as $$
  select case
    when h < 15 then 8000
    when h < 19 then 9000
    else 10000
  end;
$$;

-- start 시부터 hours 시간 요금 합계 (칸마다 그 시간대 요금을 더함)
create function public.dance_price_for(p_start int, p_hours int)
returns int
language sql
immutable
as $$
  select coalesce(sum(public.dance_price_at(h)), 0)::int
  from generate_series(p_start, p_start + p_hours - 1) as h;
$$;

-- ---------------------------------------------------------------------
-- 2) dance_reservations : 예약
-- ---------------------------------------------------------------------
create table public.dance_reservations (
  id          bigint generated always as identity primary key,
  room_id     bigint  not null references public.dance_rooms(id),
  guest_name  text    not null check (char_length(guest_name) between 2 and 20),
  phone       text    not null check (phone ~ '^010-[0-9]{4}-[0-9]{4}$'),
  date        date    not null,
  start_hour  int     not null check (start_hour between 10 and 22),
  hours       int     not null check (hours >= 1),          -- 최대 시간 제한 없음 (23시 마감만)
  people      int     not null check (people >= 1),
  pin         text    not null,               -- 암호화된 비밀번호 (아래 트리거)
  created_at  timestamptz not null default now(),

  -- 끝나는 시간이 23시를 넘으면 안 돼요
  check (start_hour + hours <= 23),

  -- ⭐ 같은 방 · 같은 날짜에 시간이 겹치는 예약 금지 (서버 검사를 통과해도 DB 가 한 번 더 막음)
  constraint dance_no_overlap exclude using gist (
    room_id with =,
    date    with =,
    int4range(start_hour, start_hour + hours) with &&
  )
);

-- 저장 직전 검사 + 비밀번호 암호화
create function public.dance_before_reservation_insert()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  max_people int;
begin
  -- 비밀번호는 숫자 4자리
  if new.pin !~ '^[0-9]{4}$' then
    raise exception '비밀번호는 숫자 4자리여야 해요';
  end if;

  -- 날짜: 오늘(한국 시간) ~ 30일 이내
  if new.date < (now() at time zone 'Asia/Seoul')::date
     or new.date > (now() at time zone 'Asia/Seoul')::date + 30 then
    raise exception '예약은 오늘부터 30일 이내만 가능해요';
  end if;

  -- 인원: 그 방의 최대 인원까지
  select capacity into max_people from public.dance_rooms where id = new.room_id;
  if new.people > max_people then
    raise exception '이 연습실은 최대 %명까지 예약할 수 있어요', max_people;
  end if;

  new.pin := crypt(new.pin, gen_salt('bf'));
  return new;
end;
$$;

create trigger dance_reservations_before_insert
  before insert on public.dance_reservations
  for each row execute function public.dance_before_reservation_insert();

-- ---------------------------------------------------------------------
-- 3) RLS (금고 규칙)
-- ---------------------------------------------------------------------
alter table public.dance_rooms        enable row level security;
alter table public.dance_reservations enable row level security;

-- dance_rooms : 읽기만. 추가/수정/삭제 정책이 없으니 → 방은 4개에서 늘어나지 않아요
create policy "dance: 누구나 연습실 읽기" on public.dance_rooms
  for select to anon, authenticated using (true);

-- dance_reservations : 읽기 + 추가
create policy "dance: 누구나 예약 읽기" on public.dance_reservations
  for select to anon, authenticated using (true);
create policy "dance: 누구나 예약 추가" on public.dance_reservations
  for insert to anon, authenticated with check (true);

-- 이름 · 전화번호 · 비밀번호는 브라우저로 나가지 않게 "칸 단위" 로 막기
-- (시간표를 그리는 데 필요한 칸만 읽을 수 있어요)
revoke select on public.dance_reservations from anon, authenticated;
grant  select (id, room_id, date, start_hour, hours, people, created_at)
  on public.dance_reservations to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) 내 예약 조회 · 취소 (★★★) — 전화번호 + 비밀번호가 맞을 때만
--    security definer : 함수 안에서만 이름/전화번호를 볼 수 있어요
-- ---------------------------------------------------------------------
create function public.dance_find_my_reservations(p_phone text, p_pin text)
returns table (
  id bigint, room_name text, date date, start_hour int, hours int,
  people int, guest_name text, total_price int
)
language sql
security definer
set search_path = public, extensions
as $$
  select r.id, rm.name, r.date, r.start_hour, r.hours,
         r.people, r.guest_name,
         public.dance_price_for(r.start_hour, r.hours) + greatest(r.people - 4, 0) * 2000  -- 시간 요금 + 추가 인원(4명 초과 1인당 2,000원)
  from public.dance_reservations r
  join public.dance_rooms rm on rm.id = r.room_id
  where r.phone = p_phone
    and r.pin = crypt(p_pin, r.pin)
  order by r.date, r.start_hour;
$$;

create function public.dance_cancel_my_reservation(p_id bigint, p_phone text, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.dance_reservations
  where id = p_id
    and phone = p_phone
    and pin = crypt(p_pin, pin);
  return found;   -- 지웠으면 true, 못 찾았으면 false
end;
$$;

revoke execute on function public.dance_find_my_reservations(text, text)        from public;
revoke execute on function public.dance_cancel_my_reservation(bigint, text, text) from public;
grant  execute on function public.dance_find_my_reservations(text, text)        to anon, authenticated;
grant  execute on function public.dance_cancel_my_reservation(bigint, text, text) to anon, authenticated;

-- 확인: 아래 결과에 4줄이 나오면 성공
select id, name, type, capacity from public.dance_rooms order by id;
