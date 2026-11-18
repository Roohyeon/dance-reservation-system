// 오늘 배운 내용 (/learn) — D26 수업 내용을 이 프로젝트에 어떻게 적용했는지 정리
// DB 를 읽지 않는 정적 페이지라 서버 컴포넌트만으로 충분해요
import { ContentBadge, SectionMessage, Typography } from "@montage-ui/core";

export const metadata = { title: "오늘 배운 내용 · 연습실 예약" };

type Lesson = {
  no: string;
  title: string;
  analogy?: string; // 수업에서 쓴 비유
  summary: string;
  applied: string[]; // 이 프로젝트에 적용한 것
  files: string[];
};

const LESSONS: Lesson[] = [
  {
    no: "1",
    title: "폴더 = 주소",
    analogy: "건물의 방",
    summary: "app 폴더 안에 폴더를 만들면 그대로 주소가 돼요. Flask 의 @app.route 대신 폴더를 만들어요.",
    applied: [
      "/ 홈 · /rooms 연습실 목록 · /rooms/[id] 상세 + 예약 · /classes 클래스 목록 · /classes/[id] 클래스 신청",
      "/reservations/[id] 예약 완료 · /my 내 예약 조회/취소 · /learn 지금 이 페이지",
      "[id] 동적 주소 — 없는 연습실(/rooms/99)은 notFound() 로 404 화면",
    ],
    files: ["app/rooms/[id]/page.tsx", "app/not-found.tsx"],
  },
  {
    no: "2",
    title: "layout · 컴포넌트",
    analogy: "입구 간판 · 같은 모양 접시",
    summary: "모든 페이지에 공통인 헤더는 layout 에 한 번, 반복되는 모양은 컴포넌트로 만들어 재사용해요.",
    applied: [
      "layout.tsx — 헤더(연습실 · 내 예약 · 오늘 배운 내용) · 푸터 · 미리보기 띠",
      "RoomCard — 홈과 목록에서 같은 카드 재사용 (대표 이미지 · 종류 배지 · 오늘 남은 시간)",
      "TimeGrid · RoomTypeBadge · CardsSkeleton · LinkButtons 도 따로 부품으로",
    ],
    files: ["app/layout.tsx", "components/RoomCard.tsx", "components/TimeGrid.tsx"],
  },
  {
    no: "3",
    title: "서버 컴포넌트 vs 클라이언트 컴포넌트",
    analogy: "주방 · 테이블 위 벨",
    summary: "기본은 서버 컴포넌트(DB 읽기 · 비밀은 주방에서). 클릭 · 입력 · 상태가 필요할 때만 맨 위에 \"use client\".",
    applied: [
      "서버: 모든 page.tsx · layout · RoomCard · RoomTypeBadge · not-found — DB 를 읽고 완성된 화면만 보내요",
      "클라이언트: ReservationForm (캘린더 · 타임그리드 · 인원 ▲▼ · 입력) · TimeGrid (칸 클릭) · MyLookupForm (조회 폼)",
      "클라이언트: error.tsx (다시 시도 버튼) · Providers (Montage 테마) · LinkButtons (as={Link})",
    ],
    files: ["components/ReservationForm.tsx", "components/Providers.tsx"],
  },
  {
    no: "4",
    title: ".env.local · NEXT_PUBLIC_",
    summary: "NEXT_PUBLIC_ 이 붙은 값은 브라우저로 나가요. 그래서 publishable key 만 넣고 secret key 는 쓰지 않아요.",
    applied: [
      "NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 두 개만 사용",
      "미리보기 스위치 DEMO=1 은 NEXT_PUBLIC_ 을 안 붙여서 서버에서만 읽혀요",
      ".env.local 은 .gitignore 에 들어 있어 깃에 안 올라가요 · 값이 없으면 알아보기 쉬운 에러",
    ],
    files: ["lib/supabase.ts", ".env.local"],
  },
  {
    no: "5",
    title: "Supabase 에서 읽기",
    summary: "서버 컴포넌트에서 DB 를 읽고, 요청마다 새로 읽게 해요. 불러오는 중 · 문제 화면도 같이.",
    applied: [
      "lib/rooms.ts — getRooms · getRoom · getBookings(방 + 날짜 예약) · getReservation",
      "await connection() 으로 빌드 때 미리 만들지 않고 요청마다 새로 읽기",
      "loading.tsx (Montage Skeleton) · error.tsx · 404 — 관계 표: 방(rooms) ↔ 예약(reservations) 로 시간표 · 남은 시간",
    ],
    files: ["lib/rooms.ts", "app/rooms/loading.tsx", "app/rooms/error.tsx"],
  },
  {
    no: "6",
    title: "Supabase 에 쓰기 — Server Action",
    analogy: "주문서",
    summary: "폼(클라이언트) → Server Action(서버) → 검사 → insert → revalidatePath → 이동. 브라우저 검사는 편의, 서버 검사는 안전.",
    applied: [
      "reserve() — 이름 · 전화번호 · 날짜(30일 이내) · 시간(23시 마감) · 인원(방 최대) · 비밀번호 · 중복 예약을 서버에서 다시 검사",
      "useActionState — 검사에 걸리면 throw 대신 메시지를 돌려줘서 빨간 SectionMessage, 쓴 내용은 그대로",
      "저장되면 revalidatePath 로 시간표를 새로 고치고 redirect 로 예약 완료 페이지 · 버튼은 \"예약하는 중…\"",
    ],
    files: ["app/rooms/[id]/actions.ts", "app/my/actions.ts"],
  },
  {
    no: "7",
    title: "RLS — 금고 규칙",
    summary: "publishable key 는 누구나 볼 수 있는 출입증이라, 무엇을 읽고 쓸 수 있는지는 DB 의 RLS 정책이 정해요.",
    applied: [
      "dance_rooms 는 읽기 정책만 → 연습실은 4개에서 늘어나지 않아요 · 표 · 함수 이름은 모두 dance_ 로 시작해서 다른 프로젝트와 같은 DB 를 써도 안 겹쳐요",
      "dance_reservations 는 읽기 + 추가, 단 이름 · 전화번호 · 비밀번호 칸은 칸 단위로 막음 (시간표에 필요한 칸만)",
      "같은 방 · 같은 날 · 겹치는 시간은 DB 규칙(dance_no_overlap)이 한 번 더 막고, 비밀번호는 암호화 저장 · 조회/취소는 번호+비밀번호가 맞을 때만",
    ],
    files: ["supabase/schema.sql"],
  },
];

// Next.js 16 에서 직접 부딪히고 고친 것 (AI 가 옛날 방식으로 쓰기 쉬운 곳)
const NEXT16: { problem: string; fix: string }[] = [
  { problem: "params · searchParams 가 Promise", fix: "const { id } = await params" },
  { problem: "cacheComponents 가 기본으로 켜져 있음", fix: "DB 읽기는 await connection() + loading.tsx / <Suspense> 안에서" },
  { problem: "error.tsx 의 reset", fix: "Next 16 은 retry 로 이름이 바뀜" },
  { problem: "<Image priority>", fix: "Next 16 은 preload 로 바뀜 (우리는 fill + sizes 로 자동 크기 조절)" },
  {
    problem: "서버 컴포넌트에서 <Button as={Link}> → 빌드 에러",
    fix: "함수(컴포넌트)는 서버 → 클라이언트로 못 넘겨요 · LinkButtons 클라이언트 부품으로 감싸기",
  },
  {
    problem: "Montage global.css 가 Tailwind 배치를 덮어씀",
    fix: "globals.css 에서 @import … layer(montage) 로 가장 약한 레이어에",
  },
];

const CHECKS: { label: string; detail: string; pending?: boolean }[] = [
  { label: "정상 예약", detail: "예약 → 완료 페이지 → 시간표에서 그 칸이 회색" },
  { label: "서버 검사", detail: "개발자 도구로 막힌 값을 넣어도 서버가 거절 · 쓴 내용 유지" },
  { label: "404", detail: "/rooms/99 · /reservations/999 → 찾는 페이지가 없어요" },
  { label: "DB", detail: "Table Editor 에 한 줄 · 비밀번호는 암호화된 값 — Supabase 연결 후 확인 예정", pending: true },
];

const EXTRAS = [
  "Montage 디자인 시스템 적용 — 버튼 · 입력칸 · 캘린더 · 배지 · 메시지 · 스켈레톤",
  "펼쳐진 캘린더 + 세로 타임그리드에서 시작 · 끝 칸을 눌러 시간 고르기",
  "시간대별 요금(8,000 · 9,000 · 10,000원)을 파스텔 색으로 · 칸마다 가격 표시",
  "기본 4명 + 추가 인원 스테퍼(1인당 2,000원) · 방마다 최대 인원",
  "로그인 없이 전화번호 + 비밀번호 4자리로 내 예약 조회 · 취소",
  "댄스 클래스 오프라인 수업 신청 — 장르 6개 · 정원(남은 자리) · 중복 신청 막기 · 내 예약에서 신청 조회 · 취소",
  "Supabase 없이도 돌아가는 미리보기 모드(DEMO=1, 서버 메모리)",
];

export default function LearnPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          <ContentBadge size="small" color="accent">
            D26 · 11월 18일
          </ContentBadge>
          <ContentBadge size="small" variant="outlined">
            Next.js 16 + Supabase
          </ContentBadge>
        </div>
        <Typography as="h1" variant="title2" weight="bold">
          오늘 배운 내용
        </Typography>
        <Typography variant="body1" color="semantic.foreground.neutral.secondary">
          &ldquo;DB 와 비밀은 주방(서버)에서, 누르고 바뀌는 건 테이블(클라이언트)에서.&rdquo; — 수업에서 배운 것을 이
          연습실 예약 서비스에 어떻게 적용했는지 정리했어요.
        </Typography>
      </header>

      {/* 수업 흐름 순서로 */}
      <section className="flex flex-col gap-4">
        {LESSONS.map((l) => (
          <article key={l.no} className="flex flex-col gap-3 rounded-2xl border border-line-2 bg-bg p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-[var(--semantic-surface-brand-primary)] text-sm font-bold text-white">
                {l.no}
              </span>
              <Typography as="h2" variant="heading2" weight="bold">
                {l.title}
              </Typography>
              {l.analogy && (
                <ContentBadge size="xsmall" variant="outlined">
                  비유: {l.analogy}
                </ContentBadge>
              )}
            </div>
            <Typography variant="body2" color="semantic.foreground.neutral.secondary">
              {l.summary}
            </Typography>
            <div className="rounded-xl bg-bg-2 p-4">
              <Typography variant="label2" weight="bold" color="semantic.foreground.brand.primary">
                이 프로젝트에 적용
              </Typography>
              <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
                {l.applied.map((a) => (
                  <li key={a}>
                    <Typography variant="body2" className="[overflow-wrap:anywhere]">{a}</Typography>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {l.files.map((f) => (
                <code key={f} className="rounded-md bg-bg-2 px-2 py-0.5 font-mono text-xs text-fg-2">
                  {f}
                </code>
              ))}
            </div>
          </article>
        ))}
      </section>

      {/* Next.js 16 주의점 */}
      <section className="flex flex-col gap-3">
        <Typography as="h2" variant="title3" weight="bold">
          Next.js 16 에서 부딪히고 고친 것
        </Typography>
        <div className="overflow-hidden rounded-2xl border border-line-2 bg-bg">
          {NEXT16.map((n, i) => (
            <div
              key={n.problem}
              className={`grid gap-1 px-5 py-4 sm:grid-cols-[1fr_1.2fr] sm:gap-6 ${i > 0 ? "border-t border-line-2" : ""}`}
            >
              <Typography variant="body2" weight="bold">
                {n.problem}
              </Typography>
              <Typography variant="body2" color="semantic.foreground.neutral.secondary">
                → {n.fix}
              </Typography>
            </div>
          ))}
        </div>
      </section>

      {/* 확인 4개 */}
      <section className="flex flex-col gap-3">
        <Typography as="h2" variant="title3" weight="bold">
          확인 4개
        </Typography>
        <Typography variant="label2" color="semantic.foreground.neutral.tertiary">
          지금은 미리보기 모드(DEMO=1)로 확인했어요. DB 항목은 Supabase 에 schema.sql 을 실행한 뒤 확인해요.
        </Typography>
        <div className="grid gap-3 sm:grid-cols-2">
          {CHECKS.map((c) => (
            <div key={c.label} className="flex gap-3 rounded-2xl border border-line-2 bg-bg p-4">
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                  c.pending ? "bg-[var(--semantic-foreground-disable-primary)]" : "bg-[var(--semantic-foreground-positive-primary)]"
                }`}
              >
                {c.pending ? "…" : "✓"}
              </span>
              <div className="flex flex-col gap-0.5">
                <Typography variant="body2" weight="bold">
                  {c.label}
                </Typography>
                <Typography variant="label2" color="semantic.foreground.neutral.tertiary">
                  {c.detail}
                </Typography>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 직접 더한 것 */}
      <section className="flex flex-col gap-3">
        <Typography as="h2" variant="title3" weight="bold">
          수업 예제에서 더 나아간 것
        </Typography>
        <ul className="flex flex-col gap-2 rounded-2xl border border-line-2 bg-bg p-6">
          {EXTRAS.map((e) => (
            <li key={e} className="flex gap-2">
              <span className="text-brand">✓</span>
              <Typography variant="body2">{e}</Typography>
            </li>
          ))}
        </ul>
      </section>

      {/* 포트폴리오 한 줄 */}
      <SectionMessage variant="info">
        <b>포트폴리오 한 줄</b> — Next.js 16 + Supabase 로 연습실 예약 서비스의 목록 · 상세 · 예약 · 완료 · 내 예약
        화면을 만들고, 서버 컴포넌트로 읽기 · Server Action + 서버 검사로 저장 · RLS 와 DB 규칙으로 개인정보와 중복
        예약을 막았어요.
      </SectionMessage>
    </div>
  );
}
