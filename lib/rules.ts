// 예약 규칙 · 날짜 계산 · 표시용 도우미 (서버 · 클라이언트 둘 다 써도 되는 것만)
import type { RoomType } from "./types";

export const OPEN_HOUR = 10; // 10시 오픈
export const CLOSE_HOUR = 23; // 23시 마감 (마지막 시작은 22시)
// (최대 이용 시간 제한 없음 — 23시 마감 전까지 이어서 예약 가능)
export const BOOK_DAYS = 30; // 오늘부터 30일 이내

// 10, 11, ... 22 — 시간표 칸
export const HOURS = Array.from(
  { length: CLOSE_HOUR - OPEN_HOUR },
  (_, i) => OPEN_HOUR + i,
);

// ---- 시간대별 요금 (모든 연습실 공통) ----
// from ≤ 시 < to 인 칸이 그 요금. 색은 타임그리드의 파스텔 배경
export const PRICE_BANDS = [
  { from: 10, to: 15, price: 8000, label: "낮", bg: "#EAF8F0", dot: "#7FD3A6" }, // 연한 민트
  { from: 15, to: 19, price: 9000, label: "오후", bg: "#FFF7DD", dot: "#F4CC5A" }, // 연한 노랑
  { from: 19, to: 23, price: 10000, label: "저녁", bg: "#FCEFF6", dot: "#EE9CC6" }, // 연한 분홍
] as const;

export const MIN_PRICE = Math.min(...PRICE_BANDS.map((b) => b.price)); // 8,000원

/** 그 시(h)가 속한 요금대 */
export function bandAt(h: number) {
  return PRICE_BANDS.find((b) => h >= b.from && h < b.to) ?? PRICE_BANDS[PRICE_BANDS.length - 1];
}

/** 1시간 요금 */
export function priceAt(h: number): number {
  return bandAt(h).price;
}

/** start 시부터 hours 시간 — 칸마다 그 시간대 요금을 더해요 (14~17시 = 8,000 + 9,000 + 9,000) */
export function priceFor(start: number, hours: number): number {
  let sum = 0;
  for (let h = start; h < start + hours; h++) sum += priceAt(h);
  return sum;
}

// ---- 인원 요금 ----
export const BASE_PEOPLE = 4; // 기본 요금에 포함되는 인원
export const EXTRA_PERSON_FEE = 2000; // 기본 인원보다 많으면 1인당 (예약 1건에 한 번)

/** 추가 인원 요금: 4명 초과분 × 2,000원 */
export function extraPeopleFee(people: number): number {
  return Math.max(0, people - BASE_PEOPLE) * EXTRA_PERSON_FEE;
}

/** 최종 금액 = 시간대별 요금 합계 + 추가 인원 요금 */
export function totalPrice(start: number, hours: number, people: number): number {
  return priceFor(start, hours) + extraPeopleFee(people);
}

// ---- 대표 이미지 보이는 위치 ----
// 1:1 칸을 빈 곳 없이 채우면(object-cover) 가로로 긴 사진은 좌우가 잘려요.
// 댄스 B(1408×739)는 가운데 기준이면 왼쪽 "DANCE DREAM" 네온이 잘려서 왼쪽으로 옮겨요.
export const IMAGE_POSITION: Record<string, string> = {
  "/rooms/dance-b.png": "20% 50%",
};

// 종류별 이름 · 이모지 · Montage accent 색 (pink · lime · violet)
export const ROOM_TYPES: Record<
  RoomType,
  { label: string; emoji: string; accent: "pink" | "lime" | "violet" }
> = {
  dance: { label: "댄스", emoji: "💃", accent: "pink" },
  band: { label: "밴드", emoji: "🎸", accent: "lime" },
  vocal: { label: "보컬", emoji: "🎤", accent: "violet" },
};

export function isRoomType(v: unknown): v is RoomType {
  return v === "dance" || v === "band" || v === "vocal";
}

// ---- 날짜 (항상 한국 시간 기준) ----
// ⚠️ new Date() 는 "지금" 이라서, 서버 컴포넌트에서는 await connection() 다음에 써야 해요

/** 오늘 날짜 "2026-11-18" */
export function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 지금 몇 시인지 (0~23) */
export function currentHourKST(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
}

/** "2026-11-18" + 3일 → "2026-11-21" */
export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidYmd(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

// ---- 화면 표시 ----

/** "2026-11-18" → "11월 18일 (수)" */
export function formatDateKo(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  const week = ["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()];
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${week})`;
}

/** 15000 → "15,000원" */
export function formatWon(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

/** (10, 2) → "10:00 – 12:00" */
export function formatTimeRange(start: number, hours: number): string {
  const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return `${pad(start)} – ${pad(start + hours)}`;
}

/** 예약 목록 → 막힌 시간 칸 [10, 11, 15] */
export function bookedHourSet(bookings: { start_hour: number; hours: number }[]): Set<number> {
  const set = new Set<number>();
  for (const b of bookings) {
    for (let h = b.start_hour; h < b.start_hour + b.hours; h++) set.add(h);
  }
  return set;
}
