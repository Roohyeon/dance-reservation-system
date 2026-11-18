// 클래스 상세 + 신청 (/classes/1) — 서버 컴포넌트, 신청 폼만 클라이언트
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ContentBadge, Typography } from "@montage-ui/core";
import ClassApplyForm from "@/components/ClassApplyForm";
import { GenreBadge, SeatsLeft } from "@/components/ClassCard";
import { LinkTextButton } from "@/components/LinkButtons";
import { getClass, getClassTaken } from "@/lib/classes";
import { formatWon } from "@/lib/rules";

export default async function ClassPage({ params }: PageProps<"/classes/[id]">) {
  await connection();

  const { id } = await params;
  const classId = Number(id);
  if (!Number.isInteger(classId) || classId <= 0) notFound();

  const [cls, takenMap] = await Promise.all([getClass(classId), getClassTaken()]);
  if (!cls) notFound(); // /classes/99 → 404

  const taken = takenMap[cls.id] ?? 0;
  const full = taken >= cls.capacity;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <LinkTextButton href="/classes" color="assistive" size="small">
          ← 클래스 목록
        </LinkTextButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* 클래스 정보 — PC 에서는 스크롤해도 따라와요 */}
        <section className="flex h-fit flex-col gap-5 rounded-2xl border border-line-2 bg-bg p-6 lg:sticky lg:top-20">
          <div className="flex flex-wrap items-center gap-1.5">
            <GenreBadge genre={cls.genre} />
            <ContentBadge size="small" variant="outlined">
              {cls.level}
            </ContentBadge>
          </div>
          <Typography as="h1" variant="title3" weight="bold">
            {cls.title}
          </Typography>
          <Typography variant="body2" color="semantic.foreground.neutral.secondary">
            {cls.description}
          </Typography>

          <dl className="grid grid-cols-2 gap-2">
            <Info label="요일 · 시간" value={`${cls.days} ${cls.start_time}–${cls.end_time}`} />
            <Info label="연습실" value={cls.room_name} />
            <Info label="수업 횟수" value={`월 ${cls.sessions_per_month}회`} />
            <Info label="수강료" value={`${formatWon(cls.price)} / 월`} />
          </dl>

          <div className="flex items-center justify-between rounded-xl bg-bg-2 px-4 py-3">
            <Typography variant="label2" color="semantic.foreground.neutral.tertiary">
              정원 {cls.capacity}명
            </Typography>
            <SeatsLeft capacity={cls.capacity} taken={taken} />
          </div>
        </section>

        <ClassApplyForm classId={cls.id} price={cls.price} full={full} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-bg-2 p-3">
      <dt>
        <Typography variant="caption1" color="semantic.foreground.neutral.tertiary">
          {label}
        </Typography>
      </dt>
      <dd>
        <Typography variant="body2" weight="bold">
          {value}
        </Typography>
      </dd>
    </div>
  );
}
