-- =====================================================================
-- 댄스 클래스 (오프라인 수업) 신청 · Supabase 설정
-- 사용법: Supabase 대시보드 › SQL Editor › New query 에 전체 붙여 넣고 Run
--
-- ✅ schema.sql(연습실 · 예약) 을 먼저 실행한 다음에 실행해요.
-- ✅ 이 파일은 클래스 표만 만들어요 → 이미 있는 연습실 · 예약 데이터는 그대로예요.
-- ✅ 이름은 모두 dance_ 로 시작 → 같은 DB 를 쓰는 다른 프로젝트와 안 겹쳐요.
--    여러 번 실행해도 돼요 (클래스 · 신청 표만 지우고 다시 만들어요 · 신청 데이터는 초기화)
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;  -- 비밀번호 암호화 (이미 켜져 있으면 그대로)

-- 이 파일이 만드는 것만 정리 (dance_ 로 시작하는 클래스 관련만)
drop table    if exists public.dance_class_applications;
drop table    if exists public.dance_classes;
drop function if exists public.dance_class_taken();
drop function if exists public.dance_find_my_applications(text, text);
drop function if exists public.dance_cancel_my_application(bigint, text, text);
drop function if exists public.dance_before_application_insert();

-- ---------------------------------------------------------------------
-- 1) dance_classes : 클래스 (장르 6개)
-- ---------------------------------------------------------------------
create table public.dance_classes (
  id                 bigint generated always as identity primary key,
  genre              text not null check (genre in ('hiphop', 'girls_hiphop', 'waacking', 'locking', 'popping', 'kpop')),
  title              text not null,
  level              text not null,                       -- 입문 · 초급 · 중급
  days               text not null,                       -- "화 · 목"
  start_time         text not null,                       -- "19:00"
  end_time           text not null,                       -- "20:30"
  room_name          text not null,                       -- 수업하는 연습실 (댄스 A · 댄스 B)
  sessions_per_month int  not null check (sessions_per_month > 0),
  price              int  not null check (price >= 0),    -- 한 달 수강료
  capacity           int  not null check (capacity > 0),  -- 정원 (연습실 최대 인원 이하)
  description        text not null default '',
  created_at         timestamptz not null default now()
);

-- 클래스 넣기 (숫자 · 시간은 마음대로 바꿔도 돼요 · 정원은 연습실 최대 인원 이하로: 댄스 A 6명 · 댄스 B 4명)
insert into public.dance_classes
  (genre, title, level, days, start_time, end_time, room_name, sessions_per_month, price, capacity, description) values
  ('hiphop',       '힙합 기초 그루브',    '입문', '화 · 목', '19:00', '20:30', '댄스 A', 8, 120000, 6, '바운스 · 락킹 리듬부터 차근차근. 처음이어도 괜찮아요.'),
  ('hiphop',       '힙합 코레오',         '중급', '토',      '16:00', '18:00', '댄스 A', 4,  90000, 6, '한 곡 안무를 4주 동안 완성해요. 기본 그루브가 되는 분께 추천.'),
  ('girls_hiphop', '걸스힙합 베이직',     '입문', '월 · 수', '20:00', '21:30', '댄스 B', 8, 120000, 4, '힙합 기본기에 라인과 무드를 더해요.'),
  ('waacking',     '왁킹 입문',           '입문', '토',      '14:00', '16:00', '댄스 B', 4,  80000, 4, '암 롤 · 포즈 · 음악 해석까지, 왁킹의 기본을 배워요.'),
  ('locking',      '락킹 펀더멘털',       '입문', '금',      '19:00', '20:30', '댄스 A', 4,  70000, 6, '락 · 포인트 · 리스트 롤 등 락킹 기본 동작과 리듬.'),
  ('popping',      '팝핀 히트 & 웨이브',  '초급', '수',      '19:00', '20:30', '댄스 A', 4,  70000, 6, '히트(팝)와 웨이브, 애니메이션 기초를 연습해요.'),
  ('kpop',         'K-POP 커버 입문',     '입문', '화 · 목', '20:00', '21:30', '댄스 B', 8, 130000, 4, '요즘 인기곡 커버 안무를 쉽게 나눠서 배워요.'),
  ('kpop',         'K-POP 커버 영상반',   '초급', '일',      '13:00', '15:00', '댄스 A', 4,  90000, 6, '4주차에 커버 영상을 같이 찍어요.');

-- ---------------------------------------------------------------------
-- 2) dance_class_applications : 클래스 신청
-- ---------------------------------------------------------------------
create table public.dance_class_applications (
  id          bigint generated always as identity primary key,
  class_id    bigint not null references public.dance_classes(id) on delete cascade,
  name        text   not null check (char_length(name) between 2 and 20),
  phone       text   not null check (phone ~ '^010-[0-9]{4}-[0-9]{4}$'),
  experience  text   not null check (experience in ('none', 'under1', 'over1')),  -- 처음 · 1년 미만 · 1년 이상
  message     text   not null default '' check (char_length(message) <= 200),
  pin         text   not null,                     -- 암호화된 비밀번호 (아래 트리거)
  created_at  timestamptz not null default now(),

  -- ⭐ 같은 전화번호로 같은 클래스 중복 신청 금지
  constraint dance_class_applications_once unique (class_id, phone)
);

-- 저장 직전 검사: 비밀번호 4자리 · 정원 · 비밀번호 암호화
create function public.dance_before_application_insert()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  max_people int;
  taken      int;
begin
  if new.pin !~ '^[0-9]{4}$' then
    raise exception '비밀번호는 숫자 4자리여야 해요';
  end if;

  -- 그 클래스 줄을 잠가서 동시에 신청해도 정원을 넘지 않게
  select capacity into max_people from public.dance_classes where id = new.class_id for update;
  select count(*) into taken from public.dance_class_applications where class_id = new.class_id;
  if taken >= max_people then
    raise exception '정원이 다 찼어요';
  end if;

  new.pin := crypt(new.pin, gen_salt('bf'));
  return new;
end;
$$;

create trigger dance_class_applications_before_insert
  before insert on public.dance_class_applications
  for each row execute function public.dance_before_application_insert();

-- ---------------------------------------------------------------------
-- 3) RLS (금고 규칙)
-- ---------------------------------------------------------------------
alter table public.dance_classes            enable row level security;
alter table public.dance_class_applications enable row level security;

-- 클래스 : 읽기만 (추가 · 수정 · 삭제는 대시보드에서만)
create policy "dance: 누구나 클래스 읽기" on public.dance_classes
  for select to anon, authenticated using (true);

-- 신청 : 추가 + 완료 화면용 읽기
create policy "dance: 누구나 클래스 신청" on public.dance_class_applications
  for insert to anon, authenticated with check (true);
create policy "dance: 신청 완료 화면 읽기" on public.dance_class_applications
  for select to anon, authenticated using (true);

-- 이름 · 전화번호 · 경험 · 메시지 · 비밀번호는 브라우저에서 못 읽게 "칸 단위" 로 막기
revoke select on public.dance_class_applications from anon, authenticated;
grant  select (id, class_id, created_at) on public.dance_class_applications to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) 남은 자리 · 내 신청 조회 · 취소 — 개인정보는 함수 안에서만
-- ---------------------------------------------------------------------

-- 클래스별 신청 인원 (남은 자리 계산용 · 숫자만 알려 줘요)
create function public.dance_class_taken()
returns table (class_id bigint, taken int)
language sql
security definer
set search_path = public
as $$
  select class_id, count(*)::int from public.dance_class_applications group by class_id;
$$;

-- 내 신청 조회 (전화번호 + 비밀번호가 맞을 때만)
create function public.dance_find_my_applications(p_phone text, p_pin text)
returns table (
  id bigint, class_id bigint, genre text, title text, level text,
  days text, start_time text, end_time text, room_name text, price int,
  name text, created_at timestamptz
)
language sql
security definer
set search_path = public, extensions
as $$
  select a.id, c.id, c.genre, c.title, c.level,
         c.days, c.start_time, c.end_time, c.room_name, c.price,
         a.name, a.created_at
  from public.dance_class_applications a
  join public.dance_classes c on c.id = a.class_id
  where a.phone = p_phone
    and a.pin = crypt(p_pin, a.pin)
  order by a.created_at desc;
$$;

-- 내 신청 취소 (전화번호 + 비밀번호가 맞을 때만)
create function public.dance_cancel_my_application(p_id bigint, p_phone text, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.dance_class_applications
  where id = p_id
    and phone = p_phone
    and pin = crypt(p_pin, pin);
  return found;
end;
$$;

revoke execute on function public.dance_class_taken()                            from public;
revoke execute on function public.dance_find_my_applications(text, text)          from public;
revoke execute on function public.dance_cancel_my_application(bigint, text, text) from public;
grant  execute on function public.dance_class_taken()                            to anon, authenticated;
grant  execute on function public.dance_find_my_applications(text, text)          to anon, authenticated;
grant  execute on function public.dance_cancel_my_application(bigint, text, text) to anon, authenticated;

-- 확인: 아래 결과에 클래스 8줄이 나오면 성공
select id, genre, title, level, days, start_time, room_name, capacity from public.dance_classes order by id;
