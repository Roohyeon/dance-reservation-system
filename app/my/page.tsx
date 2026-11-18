// 내 예약 조회 · 취소 (/my) — 페이지는 서버 컴포넌트, 폼만 클라이언트
import { Typography } from "@montage-ui/core";
import MyLookupForm from "@/components/MyLookupForm";

export const metadata = { title: "내 예약 · 연습실 예약" };

export default function MyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography as="h1" variant="title2" weight="bold">
          내 예약
        </Typography>
        <Typography variant="body2" color="semantic.foreground.neutral.secondary">
          예약할 때 쓴 전화번호와 비밀번호 4자리로 찾아요.
        </Typography>
      </div>
      <MyLookupForm />
    </div>
  );
}
