// 연습실 목록 (/rooms, /rooms?type=dance) — 서버 컴포넌트
import { connection } from "next/server";
import { Typography } from "@montage-ui/core";
import { LinkChip } from "@/components/LinkButtons";
import RoomCard from "@/components/RoomCard";
import { getBookedHoursByRoom, getRooms } from "@/lib/rooms";
import { ROOM_TYPES, isRoomType, todayKST } from "@/lib/rules";

const TABS = [
  { value: undefined, label: "전체" },
  ...Object.entries(ROOM_TYPES).map(([value, t]) => ({ value, label: `${t.emoji} ${t.label}` })),
];

export default async function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  await connection();

  // Next.js 16: searchParams 는 Promise 라서 await 로 꺼내요
  const { type } = await searchParams;
  const selected = isRoomType(type) ? type : undefined;

  const [rooms, booked] = await Promise.all([getRooms(selected), getBookedHoursByRoom(todayKST())]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography as="h1" variant="title2" weight="bold">
          연습실
        </Typography>
        <Typography variant="body2" color="semantic.foreground.neutral.secondary">
          원하는 방을 눌러 시간을 골라 주세요.
        </Typography>
      </div>

      {/* 종류 탭 — Montage Chip 을 링크로 (LinkChip) */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <LinkChip
            key={tab.label}
            href={tab.value ? `/rooms?type=${tab.value}` : "/rooms"}
            active={tab.value === selected}
            size="large"
          >
            {tab.label}
          </LinkChip>
        ))}
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <Typography variant="body2" color="semantic.foreground.neutral.tertiary">
            아직 연습실이 없어요. Supabase 에서 schema.sql 을 실행했는지 확인해 주세요.
          </Typography>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} bookedHoursToday={booked[room.id] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
