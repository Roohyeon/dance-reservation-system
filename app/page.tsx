// 홈 (/) — 히어로(배경 사진 + DANCE)는 바로 보이고, 연습실 카드는 DB 에서 읽어서 이어서 보여 줘요
import { Suspense } from "react";
import Image from "next/image";
import { connection } from "next/server";
import { Typography } from "@montage-ui/core";
import { LinkButton } from "@/components/LinkButtons";
import CardsSkeleton from "@/components/CardsSkeleton";
import RoomCard from "@/components/RoomCard";
import { getBookedHoursByRoom, getRooms } from "@/lib/rooms";
import { todayKST } from "@/lib/rules";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-14">
      {/* 히어로 — 화면 폭 100% 배경 사진 위에 DANCE + 버튼이 차례로 페이드업
          본문(main)은 가운데 폭이 정해져 있어서, 이 칸만 화면 끝까지 넓혀요 (w-screen + 가운데로 옮기기) */}
      <section className="relative left-1/2 -mt-10 flex h-[400px] w-screen -translate-x-1/2 items-center justify-center overflow-hidden sm:h-[520px]">
        {/* 배경 사진: 원본 8.4MB → Next.js 가 화면 크기에 맞게 줄여서 보내요. 첫 화면이라 먼저 불러오기(preload) */}
        <Image src="/hero/bg.jpg" alt="" fill preload sizes="100vw" className="object-cover" />
        {/* 글자가 잘 보이게 살짝 어둡게 */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />

        <div className="relative flex flex-col items-center gap-8 px-4 text-center">
          <h1 className="animate-fade-up motion-reduce:animate-none text-6xl font-black tracking-[0.25em] text-white drop-shadow-lg sm:text-8xl">
            DANSOO
          </h1>
          {/* DANCE 다음에 0.5초 늦게 · "동작 줄이기" 설정이면 움직임 없이 */}
          <div className="animate-fade-up [animation-delay:0.5s] motion-reduce:animate-none flex flex-wrap justify-center gap-2">
            <LinkButton href="/rooms" size="large">
              연습실 보러 가기
            </LinkButton>
            <LinkButton
              href="/my"
              size="large"
              variant="outlined"
              color="assistive"
              // 어두운 배경 위라 흰 글씨 · 흰 테두리 · 반투명 배경
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.7)", backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              내 예약 확인
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <Typography as="h2" variant="title3" weight="bold">
          오늘의 연습실
        </Typography>
        <Suspense fallback={<CardsSkeleton />}>
          <TodayRooms />
        </Suspense>
      </section>
    </div>
  );
}

// DB 를 읽는 부분만 따로 — Suspense 안에서 불러와요
async function TodayRooms() {
  await connection(); // 요청마다 새로 읽기 (빌드 때 미리 만들지 않음)
  const [rooms, booked] = await Promise.all([getRooms(), getBookedHoursByRoom(todayKST())]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} bookedHoursToday={booked[room.id] ?? 0} />
      ))}
    </div>
  );
}
