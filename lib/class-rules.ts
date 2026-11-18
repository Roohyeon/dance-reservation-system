// 댄스 클래스 규칙 · 표시용 도우미 (서버 · 클라이언트 둘 다 써도 되는 것만)
import type { ThemeColorsToken } from "@montage-ui/core";
import type { DanceGenre, Experience } from "./types";

// 장르 6개 — 이름 · Montage 색 (글자색 · 배경색)
export const GENRES: Record<DanceGenre, { label: string; fg: ThemeColorsToken; bg: ThemeColorsToken }> = {
  hiphop: { label: "힙합", fg: "semantic.foreground.accent.cyan", bg: "semantic.surface.accent.cyan" },
  girls_hiphop: { label: "걸스힙합", fg: "semantic.foreground.accent.pink", bg: "semantic.surface.accent.pink" },
  waacking: { label: "왁킹", fg: "semantic.foreground.accent.purple", bg: "semantic.surface.accent.purple" },
  locking: { label: "락킹", fg: "semantic.foreground.accent.lime", bg: "semantic.surface.accent.lime" },
  popping: { label: "팝핀", fg: "semantic.foreground.accent.violet", bg: "semantic.surface.accent.violet" },
  kpop: { label: "K-POP", fg: "semantic.foreground.brand.primary", bg: "semantic.surface.brand.subtle" },
};

export const GENRE_KEYS = Object.keys(GENRES) as DanceGenre[];

export function isGenre(v: unknown): v is DanceGenre {
  return typeof v === "string" && v in GENRES;
}

// 댄스 경험 (신청 폼 · 서버 검사 · DB 체크 규칙과 같게)
export const EXPERIENCES: Record<Experience, string> = {
  none: "처음이에요",
  under1: "1년 미만",
  over1: "1년 이상",
};

export function isExperience(v: unknown): v is Experience {
  return typeof v === "string" && v in EXPERIENCES;
}

export const MESSAGE_MAX = 200; // 하고 싶은 말 최대 글자 수
