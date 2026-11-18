// 없는 주소 · 없는 연습실 · 없는 예약 → 404 화면
import { Typography } from "@montage-ui/core";
import { LinkButton } from "@/components/LinkButtons";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <Typography variant="display1" weight="bold" color="semantic.foreground.disable.primary">
        404
      </Typography>
      <Typography variant="heading2" weight="bold">
        찾는 페이지가 없어요
      </Typography>
      <Typography variant="body2" color="semantic.foreground.neutral.secondary">
        연습실은 댄스 A · 댄스 B · 밴드 · 보컬 4곳이에요.
      </Typography>
      <LinkButton href="/rooms" className="mt-4">
        연습실 목록으로
      </LinkButton>
    </div>
  );
}
