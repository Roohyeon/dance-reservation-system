// 카드 자리 표시 (불러오는 중 화면) — Montage Skeleton
import { Skeleton } from "@montage-ui/core";

export default function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} variant="rectangle" width="100%" height={300} radius={16} />
      ))}
    </div>
  );
}
