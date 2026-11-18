"use client";
// 클래스 신청 폼 — 입력 · 오류 메시지 · "신청하는 중…" 이 있어서 클라이언트 컴포넌트
import { useActionState, useState } from "react";
import {
  Button,
  Chip,
  FormControl,
  FormControlField,
  FormControlLabel,
  FormControlMessage,
  SectionMessage,
  TextArea,
  TextField,
  Typography,
} from "@montage-ui/core";
import { applyClass, type ApplyState } from "@/app/classes/[id]/actions";
import { EXPERIENCES, MESSAGE_MAX } from "@/lib/class-rules";
import { formatPhone } from "@/lib/format";
import { formatWon } from "@/lib/rules";
import type { Experience } from "@/lib/types";

type Props = {
  classId: number;
  price: number;
  full: boolean; // 정원 마감이면 폼을 막아요
};

const initialState: ApplyState = {};

export default function ClassApplyForm({ classId, price, full }: Props) {
  const [state, formAction, pending] = useActionState(applyClass, initialState);

  // 입력값은 상태로 들고 있어서, 오류가 나도 지워지지 않아요
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [experience, setExperience] = useState<Experience | null>(null);
  const [message, setMessage] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-2xl border border-line-2 bg-bg p-6">
      <Typography as="h2" variant="heading1" weight="bold">
        수업 신청하기
      </Typography>

      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="experience" value={experience ?? ""} />

      {full && <SectionMessage variant="cautionary">정원이 다 찼어요. 다른 클래스를 골라 주세요.</SectionMessage>}

      <fieldset disabled={full} className="flex flex-col gap-6">
        {/* 1. 신청자 정보 */}
        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

        {/* 2. 댄스 경험 — 칩 중 하나 고르기 */}
        <div className="flex flex-col gap-2">
          <Typography variant="label1" weight="bold">
            댄스 경험 <span className="text-[var(--semantic-foreground-negative-primary)]">*</span>
          </Typography>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="댄스 경험">
            {(Object.keys(EXPERIENCES) as Experience[]).map((k) => (
              <Chip
                key={k}
                type="button"
                size="large"
                role="radio"
                aria-checked={experience === k}
                active={experience === k}
                onClick={() => setExperience(k)}
              >
                {EXPERIENCES[k]}
              </Chip>
            ))}
          </div>
        </div>

        {/* 3. 하고 싶은 말 (선택) */}
        <FormControl>
          <FormControlLabel>하고 싶은 말 (선택)</FormControlLabel>
          <FormControlField>
            <TextArea
              name="message"
              width="100%"
              minRows={3}
              maxLength={MESSAGE_MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="배우고 싶은 곡, 궁금한 점을 적어 주세요."
            />
          </FormControlField>
          <FormControlMessage>
            {message.length} / {MESSAGE_MAX}
          </FormControlMessage>
        </FormControl>

        {/* 4. 조회 · 취소용 비밀번호 */}
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
          <FormControlMessage>&apos;내 예약&apos; 에서 신청 조회 · 취소할 때 써요</FormControlMessage>
        </FormControl>
      </fieldset>

      {/* 요약 + 버튼 */}
      <div className="flex flex-col gap-4 border-t border-line-2 pt-5">
        <div className="flex items-center justify-between gap-2">
          <Typography variant="body2" color="semantic.foreground.neutral.secondary">
            한 달 수강료 (첫 수업 때 현장 결제)
          </Typography>
          <Typography variant="heading2" weight="bold">
            {formatWon(price)}
          </Typography>
        </div>

        {state.error && (
          <div role="alert">
            <SectionMessage variant="negative">{state.error}</SectionMessage>
          </div>
        )}

        <Button type="submit" size="large" fullWidth disabled={full || !experience} loading={pending}>
          {pending ? "신청하는 중…" : full ? "마감" : "신청하기"}
        </Button>
      </div>
    </form>
  );
}
