// 🧪 미리보기 모드(DEMO=1)용 클래스 데이터 — Supabase 대신 서버 메모리
// supabase/schema-classes.sql 에 넣는 8개와 같은 값
import type { ApplicationSummary, DanceClass, Experience, MyApplication } from "./types";

export const demoClasses: DanceClass[] = [
  { id: 1, genre: "hiphop", title: "힙합 기초 그루브", level: "입문", days: "화 · 목", start_time: "19:00", end_time: "20:30", room_name: "댄스 A", sessions_per_month: 8, price: 120000, capacity: 6, description: "바운스 · 락킹 리듬부터 차근차근. 처음이어도 괜찮아요." },
  { id: 2, genre: "hiphop", title: "힙합 코레오", level: "중급", days: "토", start_time: "16:00", end_time: "18:00", room_name: "댄스 A", sessions_per_month: 4, price: 90000, capacity: 6, description: "한 곡 안무를 4주 동안 완성해요. 기본 그루브가 되는 분께 추천." },
  { id: 3, genre: "girls_hiphop", title: "걸스힙합 베이직", level: "입문", days: "월 · 수", start_time: "20:00", end_time: "21:30", room_name: "댄스 B", sessions_per_month: 8, price: 120000, capacity: 4, description: "힙합 기본기에 라인과 무드를 더해요." },
  { id: 4, genre: "waacking", title: "왁킹 입문", level: "입문", days: "토", start_time: "14:00", end_time: "16:00", room_name: "댄스 B", sessions_per_month: 4, price: 80000, capacity: 4, description: "암 롤 · 포즈 · 음악 해석까지, 왁킹의 기본을 배워요." },
  { id: 5, genre: "locking", title: "락킹 펀더멘털", level: "입문", days: "금", start_time: "19:00", end_time: "20:30", room_name: "댄스 A", sessions_per_month: 4, price: 70000, capacity: 6, description: "락 · 포인트 · 리스트 롤 등 락킹 기본 동작과 리듬." },
  { id: 6, genre: "popping", title: "팝핀 히트 & 웨이브", level: "초급", days: "수", start_time: "19:00", end_time: "20:30", room_name: "댄스 A", sessions_per_month: 4, price: 70000, capacity: 6, description: "히트(팝)와 웨이브, 애니메이션 기초를 연습해요." },
  { id: 7, genre: "kpop", title: "K-POP 커버 입문", level: "입문", days: "화 · 목", start_time: "20:00", end_time: "21:30", room_name: "댄스 B", sessions_per_month: 8, price: 130000, capacity: 4, description: "요즘 인기곡 커버 안무를 쉽게 나눠서 배워요." },
  { id: 8, genre: "kpop", title: "K-POP 커버 영상반", level: "초급", days: "일", start_time: "13:00", end_time: "15:00", room_name: "댄스 A", sessions_per_month: 4, price: 90000, capacity: 6, description: "4주차에 커버 영상을 같이 찍어요." },
];

type AppRow = {
  id: number;
  class_id: number;
  name: string;
  phone: string;
  experience: Experience;
  message: string;
  pin: string;
  created_at: string;
};

// 서버 메모리 (개발 중 파일을 고쳐도 사라지지 않게 globalThis 에 보관)
const store = globalThis as unknown as { __demoApps?: AppRow[]; __demoAppNextId?: number };

function apps(): AppRow[] {
  if (!store.__demoApps) {
    // 처음에 들어 있는 다른 사람들의 신청 — 걸스힙합(정원 4)은 마감 상태로
    const seed = (class_id: number, n: number) =>
      Array.from({ length: n }, () => ({
        class_id, name: "수강생", phone: "010-0000-0000", experience: "none" as Experience, message: "", pin: "0000",
      }));
    const initial = [...seed(1, 3), ...seed(3, 4), ...seed(7, 2), ...seed(8, 1)];
    store.__demoApps = initial.map((r, i) => ({ ...r, id: i + 1, created_at: new Date().toISOString() }));
    store.__demoAppNextId = initial.length + 1;
  }
  return store.__demoApps;
}

/** { 클래스 id: 신청 인원 } */
export function demoTaken(): Record<number, number> {
  const out: Record<number, number> = {};
  for (const a of apps()) out[a.class_id] = (out[a.class_id] ?? 0) + 1;
  return out;
}

/** 신청 저장 → 새 신청 번호, 정원 초과 · 중복이면 에러 메시지 */
export function demoApply(input: Omit<AppRow, "id" | "created_at">): { id?: number; error?: string } {
  const cls = demoClasses.find((c) => c.id === input.class_id);
  if (!cls) return { error: "없는 클래스예요." };
  if (apps().some((a) => a.class_id === input.class_id && a.phone === input.phone)) {
    return { error: "이 전화번호로 이미 신청한 클래스예요." };
  }
  if ((demoTaken()[cls.id] ?? 0) >= cls.capacity) return { error: "정원이 다 찼어요." };
  const id = store.__demoAppNextId ?? apps().length + 1;
  apps().push({ ...input, id, created_at: new Date().toISOString() });
  store.__demoAppNextId = id + 1;
  return { id };
}

export function demoApplication(id: number): ApplicationSummary | null {
  const a = apps().find((x) => x.id === id);
  const cls = a && demoClasses.find((c) => c.id === a.class_id);
  if (!a || !cls) return null;
  return { id: a.id, class_id: a.class_id, created_at: a.created_at, dance_classes: cls };
}

/** dance_find_my_applications 와 같은 일 */
export function demoFindMyApplications(phone: string, pin: string): MyApplication[] {
  return apps()
    .filter((a) => a.phone === phone && a.pin === pin)
    .map((a) => {
      const c = demoClasses.find((x) => x.id === a.class_id)!;
      return {
        id: a.id, class_id: c.id, genre: c.genre, title: c.title, level: c.level, days: c.days,
        start_time: c.start_time, end_time: c.end_time, room_name: c.room_name, price: c.price,
        name: a.name, created_at: a.created_at,
      };
    })
    .reverse();
}

/** dance_cancel_my_application 과 같은 일 → 지웠으면 true */
export function demoCancelApplication(id: number, phone: string, pin: string): boolean {
  const list = apps();
  const i = list.findIndex((a) => a.id === id && a.phone === phone && a.pin === pin);
  if (i === -1) return false;
  list.splice(i, 1);
  return true;
}
