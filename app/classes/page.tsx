// 댄스 클래스 목록 (/classes, /classes?genre=kpop) — 서버 컴포넌트
import { connection } from "next/server";
import { Typography } from "@montage-ui/core";
import ClassCard from "@/components/ClassCard";
import { LinkChip } from "@/components/LinkButtons";
import { GENRES, GENRE_KEYS, isGenre } from "@/lib/class-rules";
import { getClassTaken, getClasses } from "@/lib/classes";

export const metadata = { title: "클래스 신청 · 연습실 예약" };

export default async function ClassesPage({ searchParams }: PageProps<"/classes">) {
  await connection();

  const { genre } = await searchParams;
  const selected = isGenre(genre) ? genre : undefined;

  const [classes, taken] = await Promise.all([getClasses(selected), getClassTaken()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography as="h1" variant="title2" weight="bold">
          클래스 신청
        </Typography>
        <Typography variant="body2" color="semantic.foreground.neutral.secondary">
          강사와 함께하는 오프라인 댄스 수업이에요. 장르를 골라 신청해 주세요.
        </Typography>
      </div>

      {/* 장르 칩 — 링크라서 서버 컴포넌트 그대로 */}
      <div className="flex flex-wrap gap-2">
        <LinkChip href="/classes" active={!selected} size="large">
          전체
        </LinkChip>
        {GENRE_KEYS.map((g) => (
          <LinkChip key={g} href={`/classes?genre=${g}`} active={g === selected} size="large">
            {GENRES[g].label}
          </LinkChip>
        ))}
      </div>

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <Typography variant="body2" color="semantic.foreground.neutral.tertiary">
            이 장르는 아직 열린 클래스가 없어요.
          </Typography>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <ClassCard key={c.id} cls={c} taken={taken[c.id] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
