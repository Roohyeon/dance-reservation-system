// 연습실 상세를 불러오는 동안
import { Skeleton } from "@montage-ui/core";

export default function Loading() {
  return (
    <div className="grid gap-6 pt-10 lg:grid-cols-[1fr_1.4fr]">
      <Skeleton variant="rectangle" width="100%" height={380} radius={16} />
      <Skeleton variant="rectangle" width="100%" height={520} radius={16} />
    </div>
  );
}
