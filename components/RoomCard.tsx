// 연습실 카드 — 홈 · 목록에서 같은 모양으로 재사용 (서버 컴포넌트 + Montage)
import Link from "next/link";
import { Typography } from "@montage-ui/core";
import RoomTypeBadge, { RoomCover } from "@/components/RoomTypeBadge";
import { HOURS, MIN_PRICE, formatWon } from "@/lib/rules";
import type { Room } from "@/lib/types";

type Props = {
  room: Room;
  bookedHoursToday?: number; // 오늘 예약된 시간 합계 (있을 때만 표시)
};

export default function RoomCard({ room, bookedHoursToday }: Props) {
  const left = bookedHoursToday === undefined ? null : HOURS.length - bookedHoursToday;

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line-2 bg-bg transition hover:-translate-y-0.5 hover:shadow-[var(--semantic-elevation-shadow-normal-medium)]"
    >
      <RoomCover
        type={room.type}
        image={room.image_url}
        alt={`${room.name} 연습실 사진`}
        sizes="(min-width: 1024px) 250px, (min-width: 640px) 50vw, 100vw"
        className="h-40 text-5xl"
      />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-2">
          <RoomTypeBadge type={room.type} size="xsmall" />
          <Typography as="h3" variant="headline1" weight="bold">
            {room.name}
          </Typography>
        </div>

        <Typography variant="label2" color="semantic.foreground.neutral.tertiary">
          {room.size_m2}㎡ · 최대 {room.capacity}명
        </Typography>
        <Typography variant="label1" color="semantic.foreground.neutral.secondary">
          {room.features}
        </Typography>

        <div className="mt-auto flex flex-col gap-0.5 pt-3">
          {left !== null && (
            <Typography
              variant="caption1"
              weight="bold"
              color={left > 0 ? "semantic.foreground.positive.primary" : "semantic.foreground.disable.primary"}
            >
              {left > 0 ? `오늘 ${left}시간 남음` : "오늘 마감"}
            </Typography>
          )}
          <Typography variant="body1" weight="bold" className="whitespace-nowrap">
            <Typography as="span" variant="label2" color="semantic.foreground.neutral.tertiary">
              1시간당{" "}
            </Typography>
            {formatWon(MIN_PRICE)}~
          </Typography>
        </div>
      </div>
    </Link>
  );
}
