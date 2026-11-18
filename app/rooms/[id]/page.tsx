// 연습실 상세 + 예약 (/rooms/1?date=2026-11-18) — 서버 컴포넌트
// DB 읽기는 여기(주방)에서 하고, 시간 고르기 · 입력은 ReservationForm(테이블)에서
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ContentBadge, Typography } from "@montage-ui/core";
import { LinkTextButton } from "@/components/LinkButtons";
import ReservationForm from "@/components/ReservationForm";
import RoomTypeBadge, { RoomCover } from "@/components/RoomTypeBadge";
import { getBookings, getRoom } from "@/lib/rooms";
import {
  BOOK_DAYS,
  OPEN_HOUR,
  addDays,
  bookedHourSet,
  currentHourKST,
  MIN_PRICE,
  formatWon,
  isValidYmd,
  todayKST,
} from "@/lib/rules";

export default async function RoomPage({ params, searchParams }: PageProps<"/rooms/[id]">) {
  await connection();

  // Next.js 16: params 도 Promise
  const { id } = await params;
  const roomId = Number(id);
  if (!Number.isInteger(roomId) || roomId <= 0) notFound();

  const room = await getRoom(roomId);
  if (!room) notFound(); // /rooms/99 → 404

  // 날짜: 주소의 ?date= 가 올바르면 그 날, 아니면 오늘
  const today = todayKST();
  const maxDate = addDays(today, BOOK_DAYS);
  const { date: q } = await searchParams;
  const date = isValidYmd(q) && q >= today && q <= maxDate ? q : today;

  // 관계 표: 이 방(rooms) 의 이 날짜 예약(reservations)
  const bookings = await getBookings(room.id, date);
  const booked = [...bookedHourSet(bookings)];
  // 오늘이면 지금 시각까지는 "지난 시간"
  const pastUntil = date === today ? currentHourKST() : OPEN_HOUR - 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <LinkTextButton href="/rooms" color="assistive" size="small">
          ← 연습실 목록
        </LinkTextButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* 방 정보 — PC(lg 이상)에서는 스크롤해도 헤더 아래에 붙어서 따라와요 (sticky) */}
        <section className="h-fit overflow-hidden rounded-2xl border border-line-2 bg-bg lg:sticky lg:top-20">
          <RoomCover
            type={room.type}
            image={room.image_url}
            alt={`${room.name} 연습실 사진`}
            sizes="(min-width: 1024px) 420px, 100vw"
            className="h-56 text-7xl"
          />
          <div className="flex flex-col gap-5 p-6">
            <div className="flex items-center gap-2">
              <RoomTypeBadge type={room.type} />
              <Typography as="h1" variant="title3" weight="bold">
                {room.name}
              </Typography>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Info label="크기" value={`${room.size_m2}㎡`} />
              <Info label="최대 인원" value={`${room.capacity}명`} />
              <Info label="1시간당" value={`${formatWon(MIN_PRICE)}~`} />
            </dl>
            <div className="flex flex-col gap-2">
              <Typography variant="label2" weight="bold" color="semantic.foreground.neutral.tertiary">
                시설
              </Typography>
              <ul className="flex flex-wrap gap-1.5">
                {room.features.split(",").map((f) => (
                  <li key={f}>
                    <ContentBadge size="small" variant="outlined">
                      {f.trim()}
                    </ContentBadge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 예약 폼 (클라이언트 컴포넌트) */}
        <ReservationForm
          room={{ id: room.id, capacity: room.capacity }}
          date={date}
          minDate={today}
          maxDate={maxDate}
          booked={booked}
          pastUntil={pastUntil}
        />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-bg-2 p-3">
      <dt>
        <Typography variant="caption1" color="semantic.foreground.neutral.tertiary">
          {label}
        </Typography>
      </dt>
      <dd>
        <Typography variant="body2" weight="bold">
          {value}
        </Typography>
      </dd>
    </div>
  );
}
