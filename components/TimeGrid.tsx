"use client";
// 세로 타임그리드 — 칸을 눌러 시작 · 끝을 골라요 (클릭이 있어서 클라이언트 컴포넌트)
//  1) 첫 클릭 = 시작 (1시간)
//  2) 아래 칸 클릭 = 끝 (시간 제한 없음 · 중간에 예약된 칸이 있으면 안 돼요)
//  3) 시작보다 위 · 닿을 수 없는 칸을 누르면 거기서 새로 시작, 1시간짜리 시작 칸을 다시 누르면 선택 해제
//  예약 가능한 칸은 시간대별 요금 색(파스텔)으로 연하게 칠하고 오른쪽에 가격을 보여 줘요
import { Typography } from "@montage-ui/core";
import { CLOSE_HOUR, HOURS, PRICE_BANDS, bandAt, formatWon } from "@/lib/rules";

export type TimeRange = { start: number; hours: number };

type Props = {
  booked: number[]; // 이미 예약된 시간 칸
  pastUntil: number; // 이 시각까지는 지난 시간
  value: TimeRange | null;
  onChange: (next: TimeRange | null) => void;
  disabled?: boolean;
};

const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;

export default function TimeGrid({ booked, pastUntil, value, onChange, disabled }: Props) {
  const bookedSet = new Set(booked);
  const isPast = (h: number) => h <= pastUntil;
  const isOpen = (h: number) => !isPast(h) && !bookedSet.has(h);
  // start 부터 n 시간이 전부 비어 있는지
  const canFit = (start: number, n: number) => {
    if (n < 1 || start + n > CLOSE_HOUR) return false;
    for (let h = start; h < start + n; h++) if (!isOpen(h)) return false;
    return true;
  };

  const end = value ? value.start + value.hours - 1 : null; // 마지막 칸 (포함)
  const isSelected = (h: number) => value !== null && h >= value.start && h <= end!;
  // 지금 선택에서 "끝" 으로 고를 수 있는 칸
  const isReachable = (h: number) => value !== null && h > value.start && canFit(value.start, h - value.start + 1);

  function handleClick(h: number) {
    if (!isOpen(h)) return;
    if (value && h === value.start && value.hours === 1) return onChange(null); // 해제
    if (value && isReachable(h)) return onChange({ start: value.start, hours: h - value.start + 1 }); // 끝 정하기
    onChange({ start: h, hours: 1 }); // 새로 시작
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="시간 선택" className="grid grid-cols-[3.5rem_1fr] gap-x-3">
        {HOURS.map((h, i) => {
          const past = isPast(h);
          const isBooked = !past && bookedSet.has(h);
          const selected = isSelected(h);
          const dim = value !== null && !selected && isOpen(h) && !isReachable(h);
          const band = bandAt(h);
          const showPrice = selected || (!past && !isBooked);
  
          // 이어진 칸끼리는 붙여서 하나의 블록처럼
          const prevSame =
            i > 0 &&
            ((selected && isSelected(h - 1)) || (isBooked && !isPast(h - 1) && bookedSet.has(h - 1)) || (past && isPast(h - 1)));
          const nextSame =
            i < HOURS.length - 1 &&
            ((selected && isSelected(h + 1)) || (isBooked && bookedSet.has(h + 1)) || (past && isPast(h + 1)));
  
          let label = "";
          if (past) label = prevSame ? "" : "지난 시간";
          else if (isBooked) label = prevSame ? "" : "예약됨";
          else if (selected && h === value!.start) label = `${pad(h)} 시작`;
          else if (selected && h === end) label = `${pad(h + 1)} 끝`;
          else if (!selected && !dim) label = "예약 가능";
  
          const tone = selected
            ? "bg-[var(--semantic-surface-brand-primary)] text-white border-transparent"
            : isBooked
              ? "border-transparent text-fg-3 [background:repeating-linear-gradient(-45deg,var(--semantic-background-neutral-secondary)_0_6px,var(--semantic-line-neutral-secondary)_6px_7px)]"
              : past
                ? "border-transparent bg-bg-2 text-[var(--semantic-foreground-disable-primary)]"
                : dim
                  ? "border-transparent text-fg-3 opacity-50 hover:opacity-100"
                  : "border-transparent text-fg-2 hover:border-brand hover:text-brand";
  
          return (
            <div key={h} className="contents">
              {/* 왼쪽 시간 눈금 */}
              <div className={`-translate-y-2 text-right ${prevSame ? "" : "mt-1"}`}>
                <Typography variant="caption1" color="semantic.foreground.neutral.tertiary">
                  {pad(h)}
                </Typography>
              </div>
              {/* 오른쪽 칸 */}
              <button
                type="button"
                disabled={disabled || !isOpen(h)}
                aria-pressed={selected}
                aria-label={`${pad(h)}–${pad(h + 1)} ${past ? "지난 시간" : isBooked ? "예약됨" : selected ? "선택됨" : "예약 가능"}${showPrice ? ` ${formatWon(band.price)}` : ""}`}
                // 예약 가능한 칸만 시간대 파스텔 색
                style={!selected && !past && !isBooked ? { background: band.bg } : undefined}
                onClick={() => handleClick(h)}
                className={[
                  "flex h-11 items-center border px-4 text-left text-sm font-semibold transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  "disabled:cursor-not-allowed",
                  prevSame ? "rounded-t-none border-t-0" : "mt-1 rounded-t-xl",
                  nextSame ? "rounded-b-none" : "rounded-b-xl",
                  tone,
                ].join(" ")}
              >
                <span>{label}</span>
                {showPrice && (
                  <span className={`ml-auto text-xs font-medium ${selected ? "text-white/85" : "text-fg-3"}`}>
                    {formatWon(band.price)}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 시간표 아래: 시간대별 요금 안내 */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 pl-[4.25rem] pt-1">
        {PRICE_BANDS.map((b) => (
          <li key={b.from} className="flex items-center gap-1.5">
            <span className="size-3 rounded-full" style={{ background: b.bg, boxShadow: `inset 0 0 0 1.5px ${b.dot}` }} />
            <Typography variant="caption1" color="semantic.foreground.neutral.secondary">
              {pad(b.from)}–{pad(b.to)} · {formatWon(b.price)}
            </Typography>
          </li>
        ))}
      </ul>
    </div>
  );
}
