"use client"; // 홈 · 내 예약 등 나머지 페이지용 에러 화면
import ErrorBox from "@/components/ErrorBox";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorBox error={error} retry={retry} />;
}
