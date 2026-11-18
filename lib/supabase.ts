// Supabase 창구 — 서버 컴포넌트 · Server Action 에서만 불러 쓰기
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  // NEXT_PUBLIC_ 값 = 브라우저로 나가도 되는 값 (주소 · publishable key)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      ".env.local 에 NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 넣어 주세요. (넣은 뒤 npm run dev 를 껐다 켜기)",
    );
  }

  // 로그인 기능이 없으니 세션은 저장하지 않아요
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
