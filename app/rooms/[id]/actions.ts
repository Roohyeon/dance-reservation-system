"use server";
// 예약 저장 Server Action (주문서) — 브라우저 검사는 누구나 끌 수 있으니 서버에서 한 번 더 검사해요
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { demoInsert, isDemo } from "@/lib/demo";
import { getBookings, getRoom } from "@/lib/rooms";
import {
  BOOK_DAYS,
  CLOSE_HOUR,
  OPEN_HOUR,
  addDays,
  bookedHourSet,
  currentHourKST,
  isValidYmd,
  todayKST,
} from "@/lib/rules";
import { getSupabase } from "@/lib/supabase";

export type ReserveState = { error?: string };

export async function reserve(_prev: ReserveState, formData: FormData): Promise<ReserveState> {
  // 1) 폼 값 꺼내기
  const roomId = Number(formData.get("roomId"));
  const date = String(formData.get("date") ?? "");
  const startHour = Number(formData.get("startHour") || NaN);
  const hours = Number(formData.get("hours"));
  const people = Number(formData.get("people"));
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

  // 2) 서버 검사 (supabase/schema.sql 의 규칙과 같게)
  if (!Number.isInteger(roomId)) return { error: "연습실 정보가 올바르지 않아요." };
  const room = await getRoom(roomId);
  if (!room) return { error: "없는 연습실이에요." };

  if (name.length < 2 || name.length > 20) return { error: "이름은 2~20자로 써 주세요." };
  if (!/^010-\d{4}-\d{4}$/.test(phone)) return { error: "전화번호는 010-0000-0000 형식으로 써 주세요." };
  if (!/^\d{4}$/.test(pin)) return { error: "비밀번호는 숫자 4자리예요." };

  const today = todayKST();
  if (!isValidYmd(date) || date < today || date > addDays(today, BOOK_DAYS)) {
    return { error: `예약은 오늘부터 ${BOOK_DAYS}일 이내만 가능해요.` };
  }

  if (!Number.isInteger(startHour) || startHour < OPEN_HOUR || startHour >= CLOSE_HOUR) {
    return { error: "시간표에서 시작 시간을 골라 주세요." };
  }
  if (!Number.isInteger(hours) || hours < 1) {
    return { error: "이용 시간을 골라 주세요." };
  }
  if (startHour + hours > CLOSE_HOUR) return { error: `${CLOSE_HOUR}시 전에 끝나야 해요.` };
  if (date === today && startHour <= currentHourKST()) return { error: "이미 지난 시간이에요." };

  if (!Number.isInteger(people) || people < 1 || people > room.capacity) {
    return { error: `${room.name}은(는) 최대 ${room.capacity}명까지 예약할 수 있어요.` };
  }

  // ⭐ 중복 예약 검사 — 같은 방 · 같은 날 · 겹치는 시간
  const taken = bookedHourSet(await getBookings(roomId, date));
  for (let h = startHour; h < startHour + hours; h++) {
    if (taken.has(h)) return { error: "이미 예약된 시간이 포함돼 있어요. 다른 시간을 골라 주세요." };
  }

  // 🧪 미리보기 모드: Supabase 대신 서버 메모리에 저장
  if (isDemo()) {
    const newId = demoInsert({ room_id: roomId, guest_name: name, phone, date, start_hour: startHour, hours, people, pin });
    revalidatePath("/", "layout");
    redirect(`/reservations/${newId}`);
  }

  // 3) 저장 (비밀번호는 DB 트리거가 암호화해요)
  const { data, error } = await getSupabase()
    .from("dance_reservations")
    .insert({
      room_id: roomId,
      guest_name: name,
      phone,
      date,
      start_hour: startHour,
      hours,
      people,
      pin,
    })
    .select("id")
    .single();

  if (error) {
    console.error(error);
    if (error.code === "23P01") {
      // DB 의 dance_no_overlap 규칙 — 거의 동시에 다른 사람이 예약한 경우
      return { error: "방금 다른 분이 이 시간을 예약했어요. 다른 시간을 골라 주세요." };
    }
    if (error.code === "P0001") return { error: error.message }; // DB 트리거의 검사 메시지
    if (error.code === "42501") return { error: "예약 추가 정책(RLS)이 없어요. schema.sql 을 확인해 주세요." };
    return { error: "저장 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." };
  }

  // 4) 목록 · 상세를 새로 고치고 → 예약 완료 페이지로 (redirect 는 try/catch 밖에서)
  revalidatePath("/", "layout");
  redirect(`/reservations/${data.id}`);
}
