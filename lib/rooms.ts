// Supabase 에서 읽어 오는 함수 모음 (서버에서만 사용)
// 페이지에서는 먼저 await connection() 을 불러서 "요청마다 새로 읽게" 해요
import { demoBookings, demoReservation, demoRooms, isDemo } from "./demo";
import { getSupabase } from "./supabase";
import type { Booking, ReservationSummary, Room, RoomType } from "./types";

/** 연습실 목록 (종류를 주면 그 종류만) */
export async function getRooms(type?: RoomType): Promise<Room[]> {
  if (isDemo()) return demoRooms.filter((r) => !type || r.type === type); // 🧪 미리보기
  let query = getSupabase().from("dance_rooms").select("*").order("id");
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw new Error(`연습실을 불러오지 못했어요: ${error.message}`);
  return data as Room[];
}

/** 연습실 하나 (없으면 null → 404) */
export async function getRoom(id: number): Promise<Room | null> {
  if (isDemo()) return demoRooms.find((r) => r.id === id) ?? null; // 🧪 미리보기
  const { data, error } = await getSupabase()
    .from("dance_rooms")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`연습실을 불러오지 못했어요: ${error.message}`);
  return data as Room | null;
}

/** 그 방 · 그 날짜에 이미 잡힌 예약 (시간표용) */
export async function getBookings(roomId: number, date: string): Promise<Booking[]> {
  if (isDemo()) return demoBookings(roomId, date); // 🧪 미리보기
  const { data, error } = await getSupabase()
    .from("dance_reservations")
    .select("start_hour, hours")
    .eq("room_id", roomId)
    .eq("date", date);
  if (error) throw new Error(`예약 현황을 불러오지 못했어요: ${error.message}`);
  return data as Booking[];
}

/** 그 날짜에 방마다 예약된 시간 합계 { 방 id: 시간 } — 목록 카드에 표시 */
export async function getBookedHoursByRoom(date: string): Promise<Record<number, number>> {
  if (isDemo()) {
    // 🧪 미리보기
    return Object.fromEntries(
      demoRooms.map((r) => [r.id, demoBookings(r.id, date).reduce((sum, b) => sum + b.hours, 0)]),
    ) as Record<number, number>;
  }
  const { data, error } = await getSupabase()
    .from("dance_reservations")
    .select("room_id, hours")
    .eq("date", date);
  if (error) throw new Error(`예약 현황을 불러오지 못했어요: ${error.message}`);

  const result: Record<number, number> = {};
  for (const r of data as { room_id: number; hours: number }[]) {
    result[r.room_id] = (result[r.room_id] ?? 0) + r.hours;
  }
  return result;
}

/** 예약 하나 + 연습실 정보 (예약 완료 페이지) */
export async function getReservation(id: number): Promise<ReservationSummary | null> {
  if (isDemo()) return demoReservation(id); // 🧪 미리보기
  const { data, error } = await getSupabase()
    .from("dance_reservations")
    .select("id, room_id, date, start_hour, hours, people, created_at, rooms:dance_rooms(name, type)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`예약을 불러오지 못했어요: ${error.message}`);
  return data as unknown as ReservationSummary | null;
}
