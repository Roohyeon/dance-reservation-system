"use server";
// 내 예약 조회 · 취소 Server Action — 연습실 예약 + 클래스 신청을 한 번에
// DB 함수(dance_find_my_reservations · dance_find_my_applications · 취소 함수들)가
// 전화번호 + 비밀번호가 맞을 때만 동작해요
import { revalidatePath } from "next/cache";
import { demoCancel, demoFindMine, isDemo } from "@/lib/demo";
import { demoCancelApplication, demoFindMyApplications } from "@/lib/demo-classes";
import { getSupabase } from "@/lib/supabase";
import type { MyApplication, MyReservation } from "@/lib/types";

export type MyState = {
  phone: string;
  pin: string;
  results?: MyReservation[]; // 연습실 예약 (없으면 아직 조회 안 함)
  applications?: MyApplication[]; // 클래스 신청
  error?: string;
  message?: string;
  notice?: string; // 클래스 표가 아직 없을 때 같은 안내
};

// "lookup" 조회 · "cancel" 연습실 예약 취소 · "cancel-class" 클래스 신청 취소
type Intent = "lookup" | "cancel" | "cancel-class";

export async function myReservations(prev: MyState, formData: FormData): Promise<MyState> {
  const intent = (formData.get("intent") ?? "lookup") as Intent;
  const phone = String(formData.get("phone") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

  // 서버 검사
  if (!/^010-\d{4}-\d{4}$/.test(phone)) {
    return { phone, pin, error: "전화번호는 010-0000-0000 형식으로 써 주세요." };
  }
  if (!/^\d{4}$/.test(pin)) return { phone, pin, error: "비밀번호는 숫자 4자리예요." };

  const id = Number(formData.get("id"));

  // 🧪 미리보기 모드: Supabase 대신 서버 메모리에서 조회 · 취소
  if (isDemo()) {
    let message: string | undefined;
    if (intent === "cancel") {
      if (!demoCancel(id, phone, pin)) return { ...prev, error: "취소할 예약을 찾지 못했어요." };
      message = `예약 #${id} 을(를) 취소했어요.`;
    }
    if (intent === "cancel-class") {
      if (!demoCancelApplication(id, phone, pin)) return { ...prev, error: "취소할 신청을 찾지 못했어요." };
      message = `클래스 신청 #${id} 을(를) 취소했어요.`;
    }
    if (message) revalidatePath("/", "layout");
    return {
      phone,
      pin,
      results: demoFindMine(phone, pin),
      applications: demoFindMyApplications(phone, pin),
      message,
    };
  }

  const supabase = getSupabase();
  let message: string | undefined;

  // 취소
  if (intent === "cancel" || intent === "cancel-class") {
    const fn = intent === "cancel" ? "dance_cancel_my_reservation" : "dance_cancel_my_application";
    const what = intent === "cancel" ? "예약" : "클래스 신청";
    const { data: ok, error } = await supabase.rpc(fn, { p_id: id, p_phone: phone, p_pin: pin });
    if (error) {
      console.error(error);
      return { ...prev, error: "취소 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." };
    }
    if (!ok) return { ...prev, error: `취소할 ${what}을(를) 찾지 못했어요.` };
    message = `${what} #${id} 을(를) 취소했어요.`;
    revalidatePath("/", "layout"); // 시간표 · 남은 자리 새로 고치기
  }

  // 조회 (취소 뒤에도 목록을 다시 보여 줘요) — 연습실 예약 · 클래스 신청을 동시에
  const [rooms, classes] = await Promise.all([
    supabase.rpc("dance_find_my_reservations", { p_phone: phone, p_pin: pin }),
    supabase.rpc("dance_find_my_applications", { p_phone: phone, p_pin: pin }),
  ]);

  if (rooms.error) {
    console.error(rooms.error);
    return { phone, pin, error: "조회 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." };
  }

  // 클래스 표(schema-classes.sql)를 아직 안 만들었어도 연습실 예약은 보여 줘요
  let notice: string | undefined;
  if (classes.error) {
    console.error(classes.error);
    notice = "클래스 신청 내역은 지금 불러올 수 없어요.";
  }

  return {
    phone,
    pin,
    results: rooms.data as MyReservation[],
    applications: classes.error ? [] : (classes.data as MyApplication[]),
    message,
    notice,
  };
}
