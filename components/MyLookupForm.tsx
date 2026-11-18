"use client";
// 내 예약 조회 · 취소 폼 — 연습실 예약 + 클래스 신청 (입력 · 결과 상태가 있어서 클라이언트 컴포넌트)
// 취소 확인은 브라우저 confirm 대신 Montage Alert(모달)
import { startTransition, useActionState, useState } from "react";
import {
  Alert,
  AlertActionArea,
  AlertActionAreaButton,
  AlertContainer,
  AlertContent,
  AlertDescription,
  AlertHeading,
  Button,
  FormControl,
  FormControlField,
  FormControlLabel,
  SectionMessage,
  TextField,
  Typography,
} from "@montage-ui/core";
import { myReservations, type MyState } from "@/app/my/actions";
import { GENRES } from "@/lib/class-rules";
import { formatPhone } from "@/lib/format";
import { formatDateKo, formatTimeRange, formatWon } from "@/lib/rules";
import type { MyApplication, MyReservation } from "@/lib/types";

const initialState: MyState = { phone: "", pin: "" };

// 취소 확인 모달에 띄울 대상 — 연습실 예약 또는 클래스 신청
type Target = { kind: "room"; item: MyReservation } | { kind: "class"; item: MyApplication };

export default function MyLookupForm() {
  const [state, formAction, pending] = useActionState(myReservations, initialState);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const [cancellingKey, setCancellingKey] = useState<string | null>(null); // 지금 취소 중인 줄 ("room-3")

  // 모달에서 "취소" → 같은 Server Action 에 취소 요청 (확인한 전화번호 · 비밀번호와 함께)
  function confirmCancel() {
    if (!target) return;
    const fd = new FormData();
    fd.set("intent", target.kind === "room" ? "cancel" : "cancel-class");
    fd.set("id", String(target.item.id));
    fd.set("phone", state.phone);
    fd.set("pin", state.pin);
    setCancellingKey(`${target.kind}-${target.item.id}`);
    setTarget(null);
    startTransition(() => formAction(fd));
  }

  const rooms = state.results;
  const classes = state.applications ?? [];
  const searched = rooms !== undefined;
  const nothing = searched && rooms.length === 0 && classes.length === 0;

  // 취소 버튼 (컴포넌트 안에서 컴포넌트를 만들지 않고 함수로 그려요)
  function renderCancel({ kind, item }: Target) {
    const key = `${kind}-${item.id}`;
    return (
      <Button
        type="button"
        size="small"
        variant="outlined"
        color="assistive"
        disabled={pending}
        onClick={() => setTarget({ kind, item } as Target)}
      >
        {pending && cancellingKey === key ? "취소하는 중…" : kind === "room" ? "예약 취소" : "신청 취소"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 조회 폼 */}
      <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-line-2 bg-bg p-6">
        <input type="hidden" name="intent" value="lookup" />
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
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
          </FormControl>
          <Button type="submit" size="large" loading={pending}>
            조회
          </Button>
        </div>

        {state.error && (
          <div role="alert">
            <SectionMessage variant="negative">{state.error}</SectionMessage>
          </div>
        )}
        {state.message && (
          <div role="status">
            <SectionMessage variant="positive">{state.message}</SectionMessage>
          </div>
        )}
        {state.notice && <SectionMessage variant="cautionary">{state.notice}</SectionMessage>}
      </form>

      {/* 조회 결과 */}
      {nothing && (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <Typography variant="body2" color="semantic.foreground.neutral.tertiary">
            예약 · 신청 내역이 없어요. 전화번호와 비밀번호를 다시 확인해 주세요.
          </Typography>
        </div>
      )}

      {searched && !nothing && (
        <>
          {/* 연습실 예약 */}
          <section className="flex flex-col gap-3">
            <Typography as="h2" variant="heading2" weight="bold">
              연습실 예약 <span className="text-fg-3">{rooms.length}</span>
            </Typography>
            {rooms.length === 0 ? (
              <Empty text="연습실 예약이 없어요." />
            ) : (
              <ul className="flex flex-col gap-3">
                {rooms.map((r) => (
                  <Item
                    key={r.id}
                    title={`${r.room_name} · ${formatDateKo(r.date)} ${formatTimeRange(r.start_hour, r.hours)}`}
                    sub={`#${r.id} · ${r.guest_name} · ${r.people}명 · ${formatWon(r.total_price)}`}
                    action={renderCancel({ kind: "room", item: r })}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* 클래스 신청 */}
          <section className="flex flex-col gap-3">
            <Typography as="h2" variant="heading2" weight="bold">
              클래스 신청 <span className="text-fg-3">{classes.length}</span>
            </Typography>
            {classes.length === 0 ? (
              <Empty text="클래스 신청이 없어요." />
            ) : (
              <ul className="flex flex-col gap-3">
                {classes.map((a) => (
                  <Item
                    key={a.id}
                    title={`${GENRES[a.genre].label} · ${a.title} (${a.level})`}
                    sub={`#${a.id} · ${a.name} · ${a.days} ${a.start_time}–${a.end_time} · ${a.room_name} · ${formatWon(a.price)} / 월`}
                    action={renderCancel({ kind: "class", item: a })}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {/* 취소 확인 모달 (Montage Alert) — 닫기 · 바깥 클릭 · Esc 는 아무 일 없이 닫혀요 */}
      <Alert open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertContainer>
          <AlertContent>
            <AlertHeading>{target?.kind === "class" ? "클래스 신청을 취소할까요?" : "예약을 취소할까요?"}</AlertHeading>
            <AlertDescription>
              {target?.kind === "room" && (
                <>
                  {target.item.room_name} · {formatDateKo(target.item.date)}
                  <br />
                  {formatTimeRange(target.item.start_hour, target.item.hours)} · {target.item.people}명 ·{" "}
                  {formatWon(target.item.total_price)}
                </>
              )}
              {target?.kind === "class" && (
                <>
                  {GENRES[target.item.genre].label} · {target.item.title} ({target.item.level})
                  <br />
                  {target.item.days} {target.item.start_time}–{target.item.end_time} · {target.item.room_name}
                </>
              )}
              <br />
              취소하면 되돌릴 수 없어요.
            </AlertDescription>
          </AlertContent>
          <AlertActionArea>
            <AlertActionAreaButton variant="assistive">닫기</AlertActionAreaButton>
            <AlertActionAreaButton variant="negative" onClick={confirmCancel}>
              {target?.kind === "class" ? "신청 취소" : "예약 취소"}
            </AlertActionAreaButton>
          </AlertActionArea>
        </AlertContainer>
      </Alert>
    </div>
  );
}

function Item({ title, sub, action }: { title: string; sub: string; action: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-2 bg-bg p-5">
      <div className="flex flex-col gap-1">
        <Typography variant="body1" weight="bold">
          {title}
        </Typography>
        <Typography variant="label2" color="semantic.foreground.neutral.tertiary">
          {sub}
        </Typography>
      </div>
      {action}
    </li>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-6 text-center">
      <Typography variant="label1" color="semantic.foreground.neutral.tertiary">
        {text}
      </Typography>
    </div>
  );
}
