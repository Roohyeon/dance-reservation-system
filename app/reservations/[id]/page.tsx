// 예약 완료 (/reservations/12) — 서버 컴포넌트
// 이름 · 전화번호는 DB 에서 막아 둬서 여기서는 못 읽어요 (개인정보 보호)
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SectionMessage, Typography } from "@montage-ui/core";
import { LinkButton } from "@/components/LinkButtons";
import { getReservation } from "@/lib/rooms";
import { BASE_PEOPLE, ROOM_TYPES, extraPeopleFee, formatDateKo, formatTimeRange, formatWon, totalPrice } from "@/lib/rules";

export default async function ReservationDonePage({ params }: PageProps<"/reservations/[id]">) {
  await connection();

  const { id } = await params;
  const reservationId = Number(id);
  if (!Number.isInteger(reservationId) || reservationId <= 0) notFound();

  const r = await getReservation(reservationId);
  if (!r) notFound();

  const t = ROOM_TYPES[r.rooms.type];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-5xl">🎉</span>
        <Typography as="h1" variant="title3" weight="bold" className="mt-2">
          예약됐어요
        </Typography>
        <Typography variant="body2" color="semantic.foreground.neutral.tertiary">
          예약 번호 #{r.id}
        </Typography>
      </div>

      <dl className="divide-y divide-[var(--semantic-line-neutral-secondary)] rounded-2xl border border-line-2 bg-bg">
        <Row label="연습실" value={`${t.emoji} ${r.rooms.name}`} />
        <Row label="날짜" value={formatDateKo(r.date)} />
        <Row label="시간" value={`${formatTimeRange(r.start_hour, r.hours)} (${r.hours}시간)`} />
        <Row
          label="인원"
          value={r.people > BASE_PEOPLE ? `${r.people}명 (추가 ${r.people - BASE_PEOPLE}명 +${formatWon(extraPeopleFee(r.people))})` : `${r.people}명`}
        />
        <Row label="금액" value={formatWon(totalPrice(r.start_hour, r.hours, r.people))} strong />
      </dl>

      <SectionMessage variant="info">
        예약 확인 · 취소는 &apos;내 예약&apos; 에서 전화번호와 비밀번호 4자리로 할 수 있어요.
      </SectionMessage>

      <div className="grid grid-cols-2 gap-2">
        <LinkButton href={`/rooms/${r.room_id}?date=${r.date}`} size="large" variant="outlined" color="assistive" fullWidth>
          시간표 보기
        </LinkButton>
        <LinkButton href="/my" size="large" fullWidth>
          내 예약
        </LinkButton>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <dt>
        <Typography variant="body2" color="semantic.foreground.neutral.tertiary">
          {label}
        </Typography>
      </dt>
      <dd>
        <Typography variant={strong ? "heading2" : "body1"} weight="bold">
          {value}
        </Typography>
      </dd>
    </div>
  );
}
