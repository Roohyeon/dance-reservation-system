// 댄스 클래스를 Supabase 에서 읽어 오는 함수 모음 (서버에서만 사용)
// 페이지에서는 먼저 await connection() 을 불러서 "요청마다 새로 읽게" 해요
import { isDemo } from "./demo";
import { demoApplication, demoClasses, demoTaken } from "./demo-classes";
import { getSupabase } from "./supabase";
import type { ApplicationSummary, DanceClass, DanceGenre } from "./types";

/** 클래스 목록 (장르를 주면 그 장르만) */
export async function getClasses(genre?: DanceGenre): Promise<DanceClass[]> {
  if (isDemo()) return demoClasses.filter((c) => !genre || c.genre === genre); // 🧪 미리보기
  let query = getSupabase().from("dance_classes").select("*").order("id");
  if (genre) query = query.eq("genre", genre);
  const { data, error } = await query;
  if (error) throw new Error(`클래스를 불러오지 못했어요: ${error.message}`);
  return data as DanceClass[];
}

/** 클래스 하나 (없으면 null → 404) */
export async function getClass(id: number): Promise<DanceClass | null> {
  if (isDemo()) return demoClasses.find((c) => c.id === id) ?? null; // 🧪 미리보기
  const { data, error } = await getSupabase().from("dance_classes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`클래스를 불러오지 못했어요: ${error.message}`);
  return data as DanceClass | null;
}

/** 클래스별 신청 인원 { 클래스 id: 인원 } — 개인정보 없이 숫자만 (DB 함수) */
export async function getClassTaken(): Promise<Record<number, number>> {
  if (isDemo()) return demoTaken(); // 🧪 미리보기
  const { data, error } = await getSupabase().rpc("dance_class_taken");
  if (error) throw new Error(`신청 현황을 불러오지 못했어요: ${error.message}`);
  const out: Record<number, number> = {};
  for (const r of data as { class_id: number; taken: number }[]) out[r.class_id] = r.taken;
  return out;
}

/** 신청 하나 + 클래스 정보 (신청 완료 페이지) */
export async function getApplication(id: number): Promise<ApplicationSummary | null> {
  if (isDemo()) return demoApplication(id); // 🧪 미리보기
  const { data, error } = await getSupabase()
    .from("dance_class_applications")
    .select("id, class_id, created_at, dance_classes(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`신청 내역을 불러오지 못했어요: ${error.message}`);
  return data as unknown as ApplicationSummary | null;
}
