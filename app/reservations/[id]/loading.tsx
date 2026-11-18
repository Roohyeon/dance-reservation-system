import { Skeleton } from "@montage-ui/core";

export default function Loading() {
  return (
    <div className="mx-auto mt-16 max-w-lg">
      <Skeleton variant="rectangle" width="100%" height={400} radius={16} />
    </div>
  );
}
