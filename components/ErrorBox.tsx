"use client";
// 문제가 생겼을 때 보여 주는 상자 — error.tsx 들이 같이 써요
// (버튼 클릭이 있어서 클라이언트 컴포넌트)
import { useEffect } from "react";
import { Button, Typography } from "@montage-ui/core";

export default function ErrorBox({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-line-2 bg-bg p-10 text-center">
      <span className="text-4xl">😵</span>
      <Typography variant="heading2" weight="bold">
        문제가 생겼어요
      </Typography>
      <Typography variant="body2" color="semantic.foreground.neutral.secondary">
        잠시 후 다시 시도해 주세요. 계속되면 .env.local 값과 Supabase 정책(RLS)을 확인해 주세요.
      </Typography>
      <Button className="mt-3" onClick={() => retry()}>
        다시 시도
      </Button>
    </div>
  );
}
