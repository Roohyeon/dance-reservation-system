// 🧪 미리보기 모드 — .env.local 에 DEMO=1 이 있을 때만 Supabase 대신 "서버 메모리" 를 써요
// 예약 · 조회 · 취소가 진짜처럼 동작하지만, 서버를 껐다 켜면 처음 상태로 돌아가요
// Supabase 를 연결하면 .env.local 에서 DEMO=1 줄만 지우면 돼요
import { addDays, todayKST, totalPrice } from "./rules";
import type { Booking, MyReservation, ReservationSummary, Room } from "./types";

/** DEMO 는 NEXT_PUBLIC_ 이 없어서 서버에서만 읽혀요 */
export function isDemo(): boolean {
  return process.env.DEMO === "1";
}

// supabase/schema.sql 에 넣는 4개와 같은 값
export const demoRooms: Room[] = [
  { id: 1, name: "댄스 A", type: "dance", size_m2: 50, capacity: 6, features: "전신거울, 블루투스 스피커, 마루 바닥", image_url: "/rooms/dance-a.png" },
  { id: 2, name: "댄스 B", type: "dance", size_m2: 30, capacity: 4, features: "전신거울, 블루투스 스피커", image_url: "/rooms/dance-b.png" },
  { id: 3, name: "밴드", type: "band", size_m2: 35, capacity: 6, features: "드럼, 기타·베이스 앰프, 키보드, 마이크", image_url: "/rooms/band.png" },
  { id: 4, name: "보컬", type: "vocal", size_m2: 10, capacity: 2, features: "마이크, 반사판, 업라이트 피아노", image_url: "/rooms/vocal.png" },
];

// reservations 표 한 줄과 같은 모양 (미리보기라 비밀번호는 그냥 저장)
type DemoRow = {
  id: number;
  room_id: number;
  guest_name: string;
  phone: string;
  date: string;
  start_hour: number;
  hours: number;
  people: number;
  pin: string;
  created_at: string;
};

// 서버 메모리 (개발 중 파일을 고쳐도 사라지지 않게 globalThis 에 보관)
const store = globalThis as unknown as { __demoRows?: DemoRow[]; __demoNextId?: number };

function rows(): DemoRow[] {
  if (!store.__demoRows) {
    const today = todayKST();
    const tomorrow = addDays(today, 1);
    const seed = (room_id: number, date: string, start_hour: number, hours: number, name: string) => ({
      room_id, date, start_hour, hours, guest_name: name,
      phone: "010-0000-0000", pin: "0000", people: 1,
    });
    // 처음에 들어 있는 다른 사람들의 예약
    const initial = [
      seed(1, today, 13, 2, "김댄스"),
      seed(1, today, 20, 3, "이크루"),
      seed(2, today, 15, 3, "박안무"),
      seed(3, today, 12, 3, "최밴드"),
      seed(3, today, 18, 2, "정드럼"),
      seed(4, today, 14, 1, "한보컬"),
      seed(4, today, 19, 2, "윤노래"),
      seed(1, tomorrow, 10, 3, "김댄스"),
      seed(3, tomorrow, 19, 3, "최밴드"),
    ];
    store.__demoRows = initial.map((r, i) => ({ ...r, id: i + 1, created_at: new Date().toISOString() }));
    store.__demoNextId = initial.length + 1;
  }
  return store.__demoRows;
}

export function demoBookings(roomId: number, date: string): Booking[] {
  return rows()
    .filter((r) => r.room_id === roomId && r.date === date)
    .map(({ start_hour, hours }) => ({ start_hour, hours }));
}

export function demoReservation(id: number): ReservationSummary | null {
  const r = rows().find((row) => row.id === id);
  if (!r) return null;
  const room = demoRooms.find((rm) => rm.id === r.room_id)!;
  return {
    id: r.id,
    room_id: r.room_id,
    date: r.date,
    start_hour: r.start_hour,
    hours: r.hours,
    people: r.people,
    created_at: r.created_at,
    rooms: { name: room.name, type: room.type },
  };
}

/** 예약 추가 → 새 예약 번호 (겹침 검사는 Server Action 에서 이미 했어요) */
export function demoInsert(input: Omit<DemoRow, "id" | "created_at">): number {
  const id = store.__demoNextId ?? rows().length + 1;
  rows().push({ ...input, id, created_at: new Date().toISOString() });
  store.__demoNextId = id + 1;
  return id;
}

/** dance_find_my_reservations 와 같은 일 */
export function demoFindMine(phone: string, pin: string): MyReservation[] {
  return rows()
    .filter((r) => r.phone === phone && r.pin === pin)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_hour - b.start_hour)
    .map((r) => {
      const room = demoRooms.find((rm) => rm.id === r.room_id)!;
      return {
        id: r.id,
        room_name: room.name,
        date: r.date,
        start_hour: r.start_hour,
        hours: r.hours,
        people: r.people,
        guest_name: r.guest_name,
        total_price: totalPrice(r.start_hour, r.hours, r.people),
      };
    });
}

/** dance_cancel_my_reservation 과 같은 일 → 지웠으면 true */
export function demoCancel(id: number, phone: string, pin: string): boolean {
  const list = rows();
  const i = list.findIndex((r) => r.id === id && r.phone === phone && r.pin === pin);
  if (i === -1) return false;
  list.splice(i, 1);
  return true;
}
