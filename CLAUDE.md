@AGENTS.md

# 연습실 예약 서비스 (D26 개인 미션)

연습실 4개(댄스 A · 댄스 B · 밴드 · 보컬)를 예약하는 Next.js 16 + Supabase 연습 앱. 만드는 사람은 초보.

## 규칙
- 코드를 쓰기 전에 `node_modules/next/dist/docs` 의 문서를 먼저 확인 (Next.js 16 은 바뀐 게 많음)
- 한국어 주석 · 초보가 읽을 수 있게
- 기본은 서버 컴포넌트, 버튼 · 입력 · 상태가 필요할 때만 "use client"
- 비밀값은 .env.local 에만, secret key 는 쓰지 않음 (publishable key 만)
- 파일을 만들거나 고치기 전에 무엇을 바꿀지 먼저 말하기
- DB 구조와 검사 규칙은 `supabase/schema.sql` 이 기준 — 서버 검사(Server Action)도 같은 규칙으로
- Supabase 를 다른 프로젝트와 같이 써요 → 이 앱의 표 · 함수 · 정책 이름은 모두 `dance_` 로 시작 (drop 도 dance_ 만)

## 디자인 (Montage)
- 화면 부품은 Montage(`@montage-ui/core` · `icon` · `nextjs`, 셋 다 같은 버전) — Tailwind 는 배치 · 간격만
- 색은 Montage 토큰: Typography `color="semantic.foreground.neutral.primary"` · Tailwind 는 `bg-bg` `border-line-2` 등 (app/globals.css)
- Montage global.css 는 globals.css 에서 `layer(montage)` 로 불러옴 (레이어 없이 넣으면 Tailwind 배치가 깨짐)
- 서버 컴포넌트에서 `as={Link}` 금지 → `components/LinkButtons.tsx` 의 LinkButton · LinkTextButton · LinkChip 사용
