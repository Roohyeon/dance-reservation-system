import { Skeleton } from "@montage-ui/core";

export default function Loading() {
  return (
    <div className="grid gap-6 pt-10 lg:grid-cols-[1fr_1.3fr]">
      <Skeleton variant="rectangle" width="100%" height={360} radius={16} />
      <Skeleton variant="rectangle" width="100%" height={520} radius={16} />
    </div>
  );
}
