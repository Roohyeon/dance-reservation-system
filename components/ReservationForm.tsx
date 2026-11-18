"use client";
// 예약 폼 (테이블 위 벨) — 날짜 바꾸기 · 시간 칸 클릭 · 입력 · 오류 메시지가 있어서 클라이언트 컴포넌트
// 화면 부품은 Montage: DateCalendar · TextField · IconButton · SectionMessage · Button + 직접 만든 TimeGrid
// 인원은 입력칸 없이 기본 4명 포함 + 추가 인원 스테퍼로만 늘려요
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  DateCalendar,
  FormControl,
  FormControlField,
  FormControlLabel,
  FormControlMessage,
  IconButton,
  SectionMessage,
  TextField,
  Typography,
} from "@montage-ui/core";
import { IconMinus, IconPlus } from "@montage-ui/icon";
import type { DateType } from "@montage-ui/core";
import { reserve, type ReserveState } from "@/app/rooms/[id]/actions";
import TimeGrid, { type TimeRange } from "@/components/TimeGrid";
import {
  BASE_PEOPLE,
  EXTRA_PERSON_FEE,
  HOURS,
  extraPeopleFee,
  formatDateKo,
  formatTimeRange,
  formatWon,
  priceFor,
} from "@/lib/rules";
import { formatPhone } from "@/lib/format";

type Props = {
  room: { id: number; capacity: number };
  date: string; // 지금 보고 있는 날짜
  minDate: string;
  maxDate: string;
  booked: number[]; // 이미 예약된 시간 칸
  pastUntil: number; // 이 시각까지는 지난 시간
};

const initialState: ReserveState = {};

// Montage DateCalendar 는 폭이 276px 로 고정이라, 폼 폭에 맞게 꽉 채워요.
// 날짜 동그라미 크기는 그대로 두고 칸 사이 간격만 넓혀서 모양이 찌그러지지 않게 해요.
const calendarFullWidth = {
  width: "100%",
  "& [role=grid], & [role=radiogroup]": { width: "100%" }, // 스크롤 영역 (날짜 · 연/월 보기)
  "& [data-role=date-calendar-header], & [data-role=date-calendar-header] > div": { width: "100%" }, // 머리줄
  "& [role=row]": { width: "100%", justifyContent: "space-between" }, // 요일 줄 · 날짜 줄
  "& [role=rowgroup]": { width: "100%" },
};

// "2026-11-18" → 한국 시간 그날 0시의 Date (DateCalendar 용)
function kstDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00+09:00`);
}

// DateCalendar 값(Date · 문자열) → "2026-11-18" (한국 시간 기준), 올바르지 않으면 null
function toYmd(v: DateType): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export default function ReservationForm({ room, date, minDate, maxDate, booked, pastUntil }: Props) {
  const router = useRouter();
  const [isChangingDate, startDateChange] = useTransition();
  const [state, formAction, pending] = useActionState(reserve, initialState);

  // 입력값은 상태로 들고 있어서, 오류가 나도 지워지지 않아요
  // 고른 시간 (어느 날짜에서 골랐는지도 같이 기억)
  const [pick, setPick] = useState<(TimeRange & { date: string }) | null>(null);
  const [extra, setExtra] = useState(0); // 추가 인원 (1인당 2,000원)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  // 인원 = 기본 인원(입력 없이 자동, 4명 · 방 최대가 더 작으면 그 인원) + 추가 인원(− +, 방 최대 인원까지)
  const baseIncluded = Math.min(BASE_PEOPLE, room.capacity); // 보컬(최대 2명)은 2명
  const extraMax = Math.max(0, room.capacity - BASE_PEOPLE); // 댄스 A(6명)는 2명까지 추가, 댄스 B(4명)는 추가 없음
  const totalPeople = baseIncluded + extra; // DB 에 저장하는 인원
  function stepExtra(diff: number) {
    setExtra((n) => Math.min(extraMax, Math.max(0, n + diff)));
  }

  // 날짜가 바뀌면 고른 시간은 자동으로 풀려요
  const range: TimeRange | null = pick?.date === date ? { start: pick.start, hours: pick.hours } : null;
  const timePrice = range ? priceFor(range.start, range.hours) : 0; // 시간대별 요금 합계
  const extraFee = extraPeopleFee(totalPeople); // 4명 초과 1인당 2,000원
  const total = range ? timePrice + extraFee : 0;

  const bookedSet = new Set(booked);
  const openCount = HOURS.filter((h) => h > pastUntil && !bookedSet.has(h)).length;

  function changeDate(next: string) {
    if (!next) return;
    // 주소의 ?date= 를 바꾸면 서버가 그 날 시간표를 새로 읽어 와요
    startDateChange(() => {
      router.replace(`/rooms/${room.id}?date=${next}`, { scroll: false });
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-7 rounded-2xl border border-line-2 bg-bg p-6">
      <Typography as="h2" variant="heading1" weight="bold">
        예약하기
      </Typography>

      {/* 서버로 같이 보낼 값 */}
      <input type="hidden" name="roomId" value={room.id} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="startHour" value={range?.start ?? ""} />
      <input type="hidden" name="hours" value={range?.hours ?? ""} />
      <input type="hidden" name="people" value={totalPeople} />

      {/* 1. 날짜 — 한 달 캘린더를 항상 펼쳐 둬요 (Montage DateCalendar) */}
      <div className="flex flex-col gap-2">
        <Typography variant="label1" weight="bold">
          1. 날짜
        </Typography>
        <div
          className={`overflow-hidden rounded-xl border border-line-2 ${
            isChangingDate ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <DateCalendar
            sx={calendarFullWidth}
            value={kstDate(date)}
            min={kstDate(minDate)} // 오늘 이전은 선택 불가
            max={kstDate(maxDate)} // 30일 이후도 선택 불가
            locale="ko-KR"
            timezone="Asia/Seoul"
            onChange={(v) => {
              const next = toYmd(v);
              if (next && next >= minDate && next <= maxDate && next !== date) changeDate(next);
            }}
          />
        </div>
      </div>

      {/* 2. 시간 — 타임그리드에서 시작 · 끝을 눌러 골라요 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Typography variant="label1" weight="bold">
            2. 시간 · {formatDateKo(date)}
          </Typography>
          <Typography
            variant="label2"
            weight="bold"
            color={range ? "semantic.foreground.brand.primary" : "semantic.foreground.neutral.tertiary"}
          >
            {range
              ? `선택: ${formatTimeRange(range.start, range.hours)} (${range.hours}시간)`
              : openCount > 0
                ? "시작 칸 → 끝 칸 순서로 눌러요"
                : "이 날은 마감됐어요"}
          </Typography>
        </div>
        <div className={isChangingDate ? "pointer-events-none opacity-40" : ""}>
          <TimeGrid
            booked={booked}
            pastUntil={pastUntil}
            value={range}
            onChange={(next) => setPick(next ? { ...next, date } : null)}
            disabled={isChangingDate}
          />
        </div>
      </div>

      {/* 3. 추가 인원 — 안내 아래 오른쪽에 − n명 + 스테퍼 (기본 4명을 넘을 때, 1인당 2,000원)
          모든 연습실에 같은 구성으로 보여 주고, 최대 인원이 기본 인원 이하인 방(댄스 B · 보컬)은 버튼만 막아요 */}
      <div className="flex flex-col gap-3">
        <Typography variant="label1" weight="bold">
          3. 추가 인원
        </Typography>
        <SectionMessage variant="info">
          기본 {BASE_PEOPLE}명까지는 시간 요금에 포함돼요. {BASE_PEOPLE}명보다 많으면 1인당{" "}
          {formatWon(EXTRA_PERSON_FEE)}이 추가돼요. (이 연습실은 최대 {room.capacity}명)
        </SectionMessage>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <Typography variant="label2" color="semantic.foreground.neutral.secondary">
            {extraMax > 0
              ? `총 ${totalPeople}명${extra > 0 ? ` · 추가 요금 ${formatWon(extraFee)}` : ""}`
              : `이 연습실은 최대 ${room.capacity}명이라 추가 인원을 받을 수 없어요`}
          </Typography>
          <div className="flex items-center rounded-xl border border-line-2">
            <IconButton
              type="button"
              size={20}
              aria-label="추가 인원 줄이기"
              disabled={extra <= 0}
              onClick={() => stepExtra(-1)}
              sx={{ margin: "10px 14px" }}
            >
              <IconMinus />
            </IconButton>
            <span aria-live="polite" className="min-w-14 text-center">
              <Typography variant="body1" weight="bold">
                {extra}명
              </Typography>
            </span>
            <IconButton
              type="button"
              size={20}
              aria-label="추가 인원 늘리기"
              disabled={extra >= extraMax}
              onClick={() => stepExtra(1)}
              sx={{ margin: "10px 14px" }}
            >
              <IconPlus />
            </IconButton>
          </div>
        </div>
      </div>

      {/* 4. 예약자 정보 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <FormControl>
          <FormControlLabel required>이름</FormControlLabel>
          <FormControlField>
            <TextField
              name="name"
              required
              minLength={2}
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
            />
          </FormControlField>
        </FormControl>
        <FormControl>
          <FormControlLabel required>전화번호</FormControlLabel>
          <FormControlField>
            <TextField
              name="phone"
              required
              inputMode="numeric"
              pattern="010-[0-9]{4}-[0-9]{4}"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="010-1234-5678"
            />
          </FormControlField>
        </FormControl>
        <FormControl>
          <FormControlLabel required>비밀번호</FormControlLabel>
          <FormControlField>
            <TextField
              name="pin"
              type="password"
              required
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="숫자 4자리"
            />
          </FormControlField>
          <FormControlMessage>조회 · 취소할 때 써요</FormControlMessage>
        </FormControl>
      </div>

      {/* 요약 + 버튼 */}
      <div className="flex flex-col gap-4 border-t border-line-2 pt-5">
        <div className="flex items-center justify-between gap-2">
          <Typography variant="body2" color="semantic.foreground.neutral.secondary">
            {range ? `${formatDateKo(date)} ${formatTimeRange(range.start, range.hours)}` : "시간을 골라 주세요"}
          </Typography>
          <Typography variant="heading2" weight="bold">
            {formatWon(total)}
          </Typography>
        </div>
        {range && extraFee > 0 && (
          <Typography variant="caption1" color="semantic.foreground.neutral.tertiary" align="right">
            시간 요금 {formatWon(timePrice)} + 추가 인원 {extra}명 {formatWon(extraFee)}
          </Typography>
        )}

        {state.error && (
          <div role="alert">
            <SectionMessage variant="negative">{state.error}</SectionMessage>
          </div>
        )}

        <Button type="submit" size="large" fullWidth disabled={!range} loading={pending}>
          {pending ? "예약하는 중…" : "예약하기"}
        </Button>
      </div>
    </form>
  );
}
