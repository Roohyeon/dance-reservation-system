"use client";
// Montage 디자인 시스템 준비 — 테마 + 스타일(Emotion) 을 서버 렌더링과 맞춰 주는 틀
// 공식 예시는 layout.tsx 전체를 "use client" 로 만들지만,
// 우리는 이 파일만 클라이언트로 두고 layout 은 서버 컴포넌트로 유지해요
import { ThemeProvider } from "@montage-ui/core";
import { AppRouterCacheProvider } from "@montage-ui/nextjs";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {/* prepend: Montage 스타일을 먼저 넣어서 Tailwind 배치 클래스가 이기게 */}
      <AppRouterCacheProvider options={{ prepend: true }}>{children}</AppRouterCacheProvider>
    </ThemeProvider>
  );
}
