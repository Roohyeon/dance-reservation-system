"use client";
// Montage 버튼 · 칩을 Next.js 링크로 쓰는 부품
// 왜 따로? 서버 컴포넌트에서 as={Link} 처럼 "함수(컴포넌트)" 를 넘기면
// "Functions cannot be passed directly to Client Components" 에러가 나요.
// 그래서 as={Link} 는 여기(클라이언트) 안에서만 쓰고, 서버에서는 href 같은 값만 넘겨요.
import Link from "next/link";
import { Button, Chip, TextButton } from "@montage-ui/core";
import type { ButtonProps, ChipProps, TextButtonProps } from "@montage-ui/core";

type LinkExtra = { href: string; className?: string };

export function LinkButton({ href, ...props }: ButtonProps & LinkExtra) {
  return <Button as={Link} href={href} {...props} />;
}

export function LinkTextButton({ href, ...props }: TextButtonProps & LinkExtra) {
  return <TextButton as={Link} href={href} {...props} />;
}

export function LinkChip({ href, ...props }: ChipProps & LinkExtra) {
  return <Chip as={Link} href={href} {...props} />;
}
