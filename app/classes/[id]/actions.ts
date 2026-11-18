"use server";
// 클래스 신청 Server Action — 브라우저 검사는 누구나 끌 수 있으니 서버에서 한 번 더 검사해요
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EXPERIENCES, MESSAGE_MAX, isExperience } from "@/lib/class-rules";
import { getClass, getClassTaken } from "@/lib/classes";
import { isDemo } from "@/lib/demo";
import { demoApply } from "@/lib/demo-classes";
import { getSupabase } from "@/lib/supabase";

export type ApplyState = { error?: string };

export async function applyClass(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  // 1) 폼 값 꺼내기
  const classId = Number(formData.get("classId"));
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  const experience = formData.get("experience");
  const message = String(formData.get("message") ?? "").trim();

  // 2) 서버 검사 (supabase/schema-classes.sql 의 규칙과 같게)
  if (!Number.isInteger(classId)) return { error: "클래스 정보가 올바르지 않아요." };
  const cls = await getClass(classId);
  if (!cls) return { error: "없는 클래스예요." };

  if (name.length < 2 || name.length > 20) return { error: "이름은 2~20자로 써 주세요." };
  if (!/^010-\d{4}-\d{4}$/.test(phone)) return { error: "전화번호는 010-0000-0000 형식으로 써 주세요." };
  if (!/^\d{4}$/.test(pin)) return { error: "비밀번호는 숫자 4자리예요." };
  if (!isExperience(experience)) {
    return { error: `댄스 경험을 골라 주세요. (${Object.values(EXPERIENCES).join(" · ")})` };
  }
  if (message.length > MESSAGE_MAX) return { error: `하고 싶은 말은 ${MESSAGE_MAX}자까지 쓸 수 있어요.` };

  // ⭐ 정원 검사 (DB 트리거가 한 번 더 막아요)
  const taken = (await getClassTaken())[classId] ?? 0;
  if (taken >= cls.capacity) return { error: "정원이 다 찼어요. 다른 클래스를 골라 주세요." };

  const row = { class_id: classId, name, phone, pin, experience, message };

  // 🧪 미리보기 모드: Supabase 대신 서버 메모리
  if (isDemo()) {
    const result = demoApply(row);
    if (result.error) return { error: result.error };
    revalidatePath("/classes", "layout");
    redirect(`/classes/applied/${result.id}`);
  }

  // 3) 저장 (비밀번호는 DB 트리거가 암호화해요)
  const { data, error } = await getSupabase().from("dance_class_applications").insert(row).select("id").single();

  if (error) {
    console.error(error);
    if (error.code === "23505") return { error: "이 전화번호로 이미 신청한 클래스예요. '내 예약' 에서 확인해 주세요." };
    if (error.code === "P0001") return { error: error.message }; // DB 트리거의 검사 메시지 (정원 등)
    if (error.code === "42501") return { error: "신청 정책(RLS)이 없어요. schema-classes.sql 을 확인해 주세요." };
    if (error.code === "42P01") return { error: "클래스 표가 없어요. schema-classes.sql 을 먼저 실행해 주세요." };
    return { error: "신청 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." };
  }

  // 4) 목록의 남은 자리를 새로 고치고 → 신청 완료 페이지로
  revalidatePath("/classes", "layout");
  redirect(`/classes/applied/${data.id}`);
}
