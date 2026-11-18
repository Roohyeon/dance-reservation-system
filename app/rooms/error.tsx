"use client"; // 에러 화면은 꼭 클라이언트 컴포넌트
// Next.js 16: 다시 시도 함수 이름이 reset → retry 로 바뀌었어요
import ErrorBox from "@/components/ErrorBox";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorBox error={error} retry={retry} />;
}
