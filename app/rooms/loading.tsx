// /rooms 를 불러오는 동안 보이는 화면
import { Skeleton } from "@montage-ui/core";
import CardsSkeleton from "@/components/CardsSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton variant="text" width={120} height={32} />
      <CardsSkeleton />
    </div>
  );
}
