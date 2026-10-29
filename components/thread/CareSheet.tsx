"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, ChevronLeft, ChevronRight, Headset, MapPin, PhoneCall, Stethoscope } from "lucide-react";
import type { CareTopic } from "@/lib/types";
import { CALL_TIMES, CLINICS, HEALTHDIRECT_PHONE, HEALTHDIRECT_TEL, SLOT_DAYS, SLOT_TIMES, type Clinic } from "@/lib/data/care";
import { Modal } from "./Modal";

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

// Mock booking flow, in a modal card: nothing is really booked. It lets testers go all the way
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
    <Modal open={open} title={title} onClose={onClose}>
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
              <p className="mb-1 px-1.5 text-[14px] leading-normal text-crumb-body">{care.first}</p>
              <Option tone="primary" icon={<Stethoscope size={21} />} title="Book a GP appointment" sub="Clinics near you, times this week" onClick={() => setStep({ name: "clinic" })} />
              <Option tone="blue" icon={<PhoneCall size={20} />} title="Schedule a call" sub={`With a ${care.professionals.map(lower).join(" or ")}`} onClick={() => setStep({ name: "call" })} />
              <Option tone="green" icon={<Headset size={20} />} title="Call healthdirect" sub={`${HEALTHDIRECT_PHONE} · free, 24/7`} href={HEALTHDIRECT_TEL} />
            </div>
          )}

          {step.name === "clinic" && (
            <div className="flex flex-col gap-2.5">
              <p className="mb-1 flex items-center gap-1.5 px-1.5 text-[13px] text-crumb-muted">
                <MapPin size={14} /> Near Marrickville NSW
              </p>
              {CLINICS.map((c) => (
                <ClinicRow key={c.id} clinic={c} onClick={() => setStep({ name: "slot", clinic: c })} />
              ))}
            </div>
          )}

          {step.name === "slot" && (
            <div>
              <div className="overflow-hidden rounded-[22px] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={step.clinic.image} alt="" className="h-36 w-full object-cover" />
                <div className="px-3.5 py-3">
                  <p className="text-[16px] font-medium">{step.clinic.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-crumb-muted">
                    {step.clinic.kind} · {step.clinic.distance} <BillingTag billing={step.clinic.billing} />
                  </p>
                </div>
              </div>
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
    </Modal>
  );
}

// "Dietitian" -> "dietitian", but "GP" stays "GP".
const lower = (p: string) => (p === p.toUpperCase() ? p : p.toLowerCase());

// Colour carries the order: booking a GP is the main way in (solid accent),
// a call and the nurse line follow with their own soft tint; list rows
// (clinics) borrow the GP's warm tint.
const TONES = {
  primary: { card: "bg-crumb-accent text-white active:bg-crumb-accent-active", icon: "bg-white/20 text-white", sub: "text-white/85", chevron: "text-white/80" },
  blue: { card: "bg-white text-crumb-ink active:bg-white/70", icon: "bg-[#E3ECFB] text-[#1E4C9A]", sub: "text-crumb-muted", chevron: "text-crumb-muted" },
  green: { card: "bg-white text-crumb-ink active:bg-white/70", icon: "bg-[#DFF3E8] text-[#1F6B4A]", sub: "text-crumb-muted", chevron: "text-crumb-muted" },
  warm: { card: "bg-white text-crumb-ink active:bg-white/70", icon: "bg-[#FDEBDD] text-[#B83A00]", sub: "text-crumb-muted", chevron: "text-crumb-muted" },
} as const;

function Option({
  icon,
  title,
  sub,
  tone = "warm",
  onClick,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  tone?: keyof typeof TONES;
  onClick?: () => void;
  href?: string;
}) {
  const t = TONES[tone];
  const inner = (
    <>
      <span className={"flex size-11 shrink-0 items-center justify-center rounded-full " + t.icon}>{icon}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[15.5px] font-medium">{title}</span>
        <span className={"block truncate text-[13px] " + t.sub}>{sub}</span>
      </span>
      <ChevronRight size={18} className={"shrink-0 " + t.chevron} />
    </>
  );
  const cls = "flex items-center gap-3 rounded-[22px] p-3 transition-colors " + t.card;
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

// A clinic as a place you can picture: its front, its name, how far, and how
// it bills, with bulk billing called out because cost decides a lot.
function ClinicRow({ clinic: c, onClick }: { clinic: Clinic; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-[22px] bg-white p-2 pr-3 text-left active:bg-white/70">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.image} alt="" className="size-[68px] shrink-0 rounded-[16px] object-cover" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug font-medium">{c.name}</span>
        <span className="mt-0.5 block text-[13px] text-crumb-muted">
          {c.kind} · {c.distance}
        </span>
        <span className="mt-1 block">
          <BillingTag billing={c.billing} />
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-crumb-muted" />
    </button>
  );
}

function BillingTag({ billing }: { billing: string }) {
  const bulk = billing.startsWith("Bulk billing");
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={bulk ? { background: "#DFF3E8", color: "#1F6B4A" } : { background: "#F1F0EC", color: "#5a5852" }}
    >
      {billing}
    </span>
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
