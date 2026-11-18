// /classes 를 불러오는 동안
import { Skeleton } from "@montage-ui/core";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton variant="text" width={140} height={32} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} variant="rectangle" width="100%" height={200} radius={16} />
        ))}
      </div>
    </div>
  );
}
