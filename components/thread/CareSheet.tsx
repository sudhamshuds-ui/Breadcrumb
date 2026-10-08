"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, ChevronLeft, ChevronRight, MapPin, Phone, PhoneCall, Stethoscope } from "lucide-react";
import type { CareTopic } from "@/lib/types";
import { CALL_TIMES, CLINICS, HEALTHDIRECT_PHONE, HEALTHDIRECT_TEL, SLOT_DAYS, SLOT_TIMES, type Clinic } from "@/lib/data/care";
import { Sheet } from "./Sheet";

export type CareStart = "choose" | "clinic" | "call";

type Step =
  | { name: "choose" }
  | { name: "clinic" }
  | { name: "slot"; clinic: Clinic }
  | { name: "call" }
  | { name: "done"; what: string; when: string; where: string };

interface Props {
  open: boolean;
  start: CareStart;
  care: CareTopic;
  onClose: () => void;
}

// Mock booking flow: nothing is really booked. It lets testers go all the way
// from "this reel" to "an appointment with a professional".
export function CareSheet({ open, start, care, onClose }: Props) {
  const [step, setStep] = useState<Step>({ name: start } as Step);
  const [day, setDay] = useState(SLOT_DAYS[1]);
  const [pro, setPro] = useState(care.professionals[0]);

  useEffect(() => {
    if (open) setStep({ name: start } as Step);
  }, [open, start]);

  const title =
    step.name === "done"
      ? "You're booked in"
      : step.name === "call"
        ? "Schedule a call"
        : step.name === "choose"
          ? "Talk to a professional"
          : "Book an appointment";

  const back = step.name === "slot" ? () => setStep({ name: "clinic" }) : step.name !== "choose" && step.name !== "done" && start === "choose" ? () => setStep({ name: "choose" }) : null;

  return (
    <Sheet open={open} title={title} onClose={onClose}>
      {back && (
        <button type="button" onClick={back} className="-mt-1 mb-2 flex items-center gap-0.5 text-[14px] text-crumb-body">
          <ChevronLeft size={16} /> Back
        </button>
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={step.name + ("clinic" in step ? step.clinic.id : "")}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="pb-2"
        >
          {step.name === "choose" && (
            <div className="flex flex-col gap-2.5">
              <p className="mb-1 text-[14px] leading-normal text-crumb-body">{care.first}</p>
              <Option icon={<CalendarCheck size={20} />} title="Book a GP appointment" sub="Clinics near you, with times this week" onClick={() => setStep({ name: "clinic" })} />
              <Option icon={<PhoneCall size={20} />} title="Schedule a call" sub={`With a ${care.professionals.map(lower).join(" or ")}`} onClick={() => setStep({ name: "call" })} />
              <Option icon={<Phone size={20} />} title={`Call healthdirect, ${HEALTHDIRECT_PHONE}`} sub="Free nurse advice, any time of day" href={HEALTHDIRECT_TEL} />
            </div>
          )}

          {step.name === "clinic" && (
            <div className="flex flex-col gap-2.5">
              <p className="mb-1 flex items-center gap-1.5 text-[13px] text-crumb-muted">
                <MapPin size={14} /> Near Marrickville NSW
              </p>
              {CLINICS.map((c) => (
                <Option
                  key={c.id}
                  icon={<Stethoscope size={20} />}
                  title={c.name}
                  sub={`${c.kind} · ${c.distance} · ${c.billing}`}
                  onClick={() => setStep({ name: "slot", clinic: c })}
                />
              ))}
            </div>
          )}

          {step.name === "slot" && (
            <div>
              <p className="text-[15px] font-medium">{step.clinic.name}</p>
              <p className="mt-0.5 text-[13px] text-crumb-muted">
                {step.clinic.distance} · {step.clinic.billing}
              </p>
              {step.clinic.kind === "Hospital" && (
                <p className="mt-2 rounded-2xl bg-crumb-card p-3 text-[13px] leading-normal text-crumb-body ring-1 ring-crumb-hairline">
                  Outpatient clinics usually need a GP referral. A GP visit first is often the quickest way in.
                </p>
              )}
              <div className="mt-4 flex gap-2">
                {SLOT_DAYS.map((d) => (
                  <Chip key={d} on={d === day} onClick={() => setDay(d)}>
                    {d}
                  </Chip>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {SLOT_TIMES[day].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setStep({ name: "done", what: "GP appointment", when: `${day}, ${time}`, where: step.clinic.name })}
                    className="h-12 rounded-2xl bg-crumb-card text-[15px] font-medium ring-1 ring-crumb-hairline active:ring-crumb-accent"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step.name === "call" && (
            <div>
              <p className="text-[14px] leading-normal text-crumb-body">Pick who you&apos;d like to talk to, and when they should call you.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {care.professionals.map((p) => (
                  <Chip key={p} on={p === pro} onClick={() => setPro(p)}>
                    {p}
                  </Chip>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {CALL_TIMES.map((when) => (
                  <button
                    key={when}
                    type="button"
                    onClick={() => setStep({ name: "done", what: `Phone call with a ${lower(pro)}`, when, where: "They'll call your mobile" })}
                    className="flex h-12 items-center justify-between rounded-2xl bg-crumb-card px-4 text-[15px] ring-1 ring-crumb-hairline active:ring-crumb-accent"
                  >
                    {when}
                    <ChevronRight size={16} className="text-crumb-muted" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step.name === "done" && (
            <div className="flex flex-col items-center pt-2 text-center">
              <motion.span
                className="flex size-14 items-center justify-center rounded-full bg-crumb-accent text-white"
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
              >
                <CalendarCheck size={26} />
              </motion.span>
              <p className="mt-4 text-[18px] tracking-[-0.01em]">{step.what}</p>
              <p className="mt-1 text-[15px] text-crumb-body">{step.when}</p>
              <p className="text-[14px] text-crumb-muted">{step.where}</p>
              <p className="mt-4 max-w-[280px] text-[12.5px] leading-normal text-crumb-muted">
                Prototype only: nothing was booked. In the real app this would add it to your calendar.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 h-12 w-full rounded-full bg-crumb-ink text-[15px] font-medium text-crumb-surface active:opacity-85"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  );
}

// "Dietitian" -> "dietitian", but "GP" stays "GP".
const lower = (p: string) => (p === p.toUpperCase() ? p : p.toLowerCase());

function Option({
  icon,
  title,
  sub,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-crumb-surface text-crumb-ink ring-1 ring-crumb-hairline">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="block truncate text-[13px] text-crumb-muted">{sub}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-crumb-muted" />
    </>
  );
  const cls = "flex items-center gap-3 rounded-[22px] bg-crumb-card p-3 ring-1 ring-crumb-hairline active:ring-crumb-hairline-strong";
  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={
        "h-9 rounded-full px-4 text-[14px] font-medium ring-1 " +
        (on ? "bg-crumb-ink text-crumb-surface ring-crumb-ink" : "bg-crumb-card text-crumb-ink ring-crumb-hairline")
      }
    >
      {children}
    </button>
  );
}
