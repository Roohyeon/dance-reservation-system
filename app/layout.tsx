// 모든 페이지를 감싸는 틀 — 공통 헤더 · 푸터 (서버 컴포넌트)
import type { Metadata } from "next";
import Link from "next/link";
import { Typography } from "@montage-ui/core";
import { LinkTextButton } from "@/components/LinkButtons";
import Providers from "@/components/Providers";
import { isDemo } from "@/lib/demo";
import "./globals.css"; // Montage 기본 스타일(global.css)도 이 안에서 불러와요

export const metadata: Metadata = {
  title: "연습실 예약",
  description: "댄스 A · 댄스 B · 밴드 · 보컬 연습실을 1시간 단위로 예약해요",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Montage 는 Pretendard 글꼴을 써요 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-jp-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col overflow-x-clip">
        <Providers>
          {isDemo() && (
            <div className="bg-[var(--semantic-surface-cautionary-primary)] px-4 py-2 text-center">
              <Typography variant="label2" weight="bold" color="semantic.foreground.cautionary.primary">
                🧪 미리보기 모드 — 서버 메모리에 저장돼요 (서버를 껐다 켜면 처음으로)
              </Typography>
            </div>
          )}

          <header className="sticky top-0 z-10 border-b border-line-2 bg-bg">
            {/* 모바일: 로고 아래 줄에 탭 (넘치면 가로로 밀어서) · PC: 한 줄 */}
            <nav className="mx-auto flex max-w-5xl flex-col gap-1 px-4 pt-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-0">
              <Link href="/" className="flex items-center gap-2">
                <Typography variant="headline1" weight="bold">
                  댄수
                </Typography>
              </Link>
              <div className="-mx-4 flex items-center gap-5 overflow-x-auto whitespace-nowrap px-4 py-2 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 sm:py-0">
                <LinkTextButton href="/rooms" color="assistive">
                  연습실
                </LinkTextButton>
                <LinkTextButton href="/classes" color="assistive">
                  클래스 신청
                </LinkTextButton>
                <LinkTextButton href="/my" color="assistive">
                  내 예약
                </LinkTextButton>
                <LinkTextButton href="/learn" color="assistive">
                  오늘 배운 내용
                </LinkTextButton>
              </div>
            </nav>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>

          <footer className="border-t border-line-2 bg-bg py-8 text-center">
            <Typography variant="caption1" color="semantic.foreground.neutral.tertiary">
              매일 10:00 – 23:00 · 1시간 단위 · 기본 4명 (추가 1인당 2,000원)
            </Typography>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
