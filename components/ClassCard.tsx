// 댄스 클래스 카드 + 장르 배지 (서버 컴포넌트 + Montage)
import Link from "next/link";
import { ContentBadge, Typography } from "@montage-ui/core";
import { GENRES } from "@/lib/class-rules";
import { formatWon } from "@/lib/rules";
import type { DanceClass, DanceGenre } from "@/lib/types";

export function GenreBadge({ genre, size = "small" }: { genre: DanceGenre; size?: "xsmall" | "small" | "medium" }) {
  const g = GENRES[genre];
  return (
    <ContentBadge size={size} color="accent" accentColor={g.fg} accentBackgroundColor={g.bg}>
      {g.label}
    </ContentBadge>
  );
}

/** 남은 자리 표시 — 마감이면 회색 */
export function SeatsLeft({ capacity, taken }: { capacity: number; taken: number }) {
  const left = Math.max(0, capacity - taken);
  return (
    <Typography
      variant="caption1"
      weight="bold"
      color={left > 0 ? "semantic.foreground.positive.primary" : "semantic.foreground.disable.primary"}
    >
      {left > 0 ? `남은 자리 ${left} / ${capacity}` : "마감"}
    </Typography>
  );
}

export default function ClassCard({ cls, taken }: { cls: DanceClass; taken: number }) {
  return (
    <Link
      href={`/classes/${cls.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-line-2 bg-bg p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--semantic-elevation-shadow-normal-medium)]"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <GenreBadge genre={cls.genre} size="xsmall" />
        <ContentBadge size="xsmall" variant="outlined">
          {cls.level}
        </ContentBadge>
      </div>
      <Typography as="h3" variant="headline1" weight="bold">
        {cls.title}
      </Typography>
      <div className="flex flex-col gap-0.5">
        <Typography variant="label1" color="semantic.foreground.neutral.secondary">
          {cls.days} {cls.start_time}–{cls.end_time}
        </Typography>
        <Typography variant="label2" color="semantic.foreground.neutral.tertiary">
          {cls.room_name} · 월 {cls.sessions_per_month}회
        </Typography>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        <Typography variant="body1" weight="bold" className="whitespace-nowrap">
          {formatWon(cls.price)}
          <Typography as="span" variant="label2" color="semantic.foreground.neutral.tertiary">
            {" "}/ 월
          </Typography>
        </Typography>
        <SeatsLeft capacity={cls.capacity} taken={taken} />
      </div>
    </Link>
  );
}
