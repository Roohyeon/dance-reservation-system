// 클래스 신청 완료 (/classes/applied/3) — 서버 컴포넌트
// 이름 · 전화번호는 DB 에서 막아 둬서 여기서는 못 읽어요 (개인정보 보호)
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SectionMessage, Typography } from "@montage-ui/core";
import { GenreBadge } from "@/components/ClassCard";
import { LinkButton } from "@/components/LinkButtons";
import { getApplication } from "@/lib/classes";
import { formatWon } from "@/lib/rules";

export const metadata = { title: "신청 완료 · 클래스 신청" };

export default async function AppliedPage({ params }: PageProps<"/classes/applied/[id]">) {
  await connection();

  const { id } = await params;
  const appId = Number(id);
  if (!Number.isInteger(appId) || appId <= 0) notFound();

  const app = await getApplication(appId);
  if (!app) notFound();
  const c = app.dance_classes;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-5xl">💃</span>
        <Typography as="h1" variant="title3" weight="bold" className="mt-2">
          클래스 신청이 완료됐어요
        </Typography>
        <Typography variant="body2" color="semantic.foreground.neutral.tertiary">
          신청 번호 #{app.id}
        </Typography>
      </div>

      <dl className="divide-y divide-[var(--semantic-line-neutral-secondary)] rounded-2xl border border-line-2 bg-bg">
        <div className="flex items-center justify-between px-5 py-4">
          <dt>
            <Typography variant="body2" color="semantic.foreground.neutral.tertiary">
              클래스
            </Typography>
          </dt>
          <dd className="flex items-center gap-2">
            <GenreBadge genre={c.genre} size="xsmall" />
            <Typography variant="body1" weight="bold">
              {c.title}
            </Typography>
          </dd>
        </div>
        <Row label="레벨" value={c.level} />
        <Row label="요일 · 시간" value={`${c.days} ${c.start_time}–${c.end_time}`} />
        <Row label="연습실" value={`${c.room_name} · 월 ${c.sessions_per_month}회`} />
        <Row label="수강료" value={`${formatWon(c.price)} / 월`} strong />
      </dl>

      <SectionMessage variant="info">
        수강료는 첫 수업 때 현장에서 결제해요. 신청 확인 · 취소는 &apos;내 예약&apos; 에서 전화번호와 비밀번호 4자리로 할
        수 있어요.
      </SectionMessage>

      <div className="grid grid-cols-2 gap-2">
        <LinkButton href="/classes" size="large" variant="outlined" color="assistive" fullWidth>
          다른 클래스 보기
        </LinkButton>
        <LinkButton href="/my" size="large" fullWidth>
          내 예약
        </LinkButton>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <dt>
        <Typography variant="body2" color="semantic.foreground.neutral.tertiary">
          {label}
        </Typography>
      </dt>
      <dd>
        <Typography variant={strong ? "heading2" : "body1"} weight="bold">
          {value}
        </Typography>
      </dd>
    </div>
  );
}
