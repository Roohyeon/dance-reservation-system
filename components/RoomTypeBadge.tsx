// 종류 배지 (댄스 · 밴드 · 보컬) — Montage ContentBadge + 대표 이미지(RoomCover)
import Image from "next/image";
import { ContentBadge } from "@montage-ui/core";
import { IMAGE_POSITION, ROOM_TYPES } from "@/lib/rules";
import type { RoomType } from "@/lib/types";

export default function RoomTypeBadge({ type, size = "small" }: { type: RoomType; size?: "xsmall" | "small" | "medium" }) {
  const t = ROOM_TYPES[type];
  return (
    <ContentBadge
      size={size}
      color="accent"
      accentColor={`semantic.foreground.accent.${t.accent}`}
      accentBackgroundColor={`semantic.surface.accent.${t.accent}`}
    >
      {t.label}
    </ContentBadge>
  );
}

type CoverProps = {
  type: RoomType;
  image?: string | null; // rooms.image_url (예: "/rooms/dance-a.png")
  alt?: string;
  sizes?: string; // 화면에서 차지하는 폭 — 알맞은 크기로 줄여 받기 위해
  className?: string;
};

/** 연습실 대표 이미지 — 사진이 있으면 사진, 없으면 색 블록 + 이모지 */
export function RoomCover({ type, image, alt = "", sizes = "100vw", className = "" }: CoverProps) {
  const t = ROOM_TYPES[type];
  if (image) {
    return (
      // fill 을 쓰려면 부모가 relative 여야 해요
      <div className={`relative overflow-hidden ${className}`}>
        {/* Next.js Image: 원본(약 1.5MB)을 화면 크기에 맞게 줄여서 보내 줘요 */}
        <Image
          src={image}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover" // 칸을 빈 곳 없이 꽉 채우기
          style={{ objectPosition: IMAGE_POSITION[image] ?? "50% 50%" }} // 사진마다 보이는 위치
        />
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ background: `var(--semantic-surface-accent-${t.accent})` }}
    >
      <span aria-hidden>{t.emoji}</span>
    </div>
  );
}
