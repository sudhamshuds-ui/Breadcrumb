"use client";

import { useEffect, useState } from "react";
import type { Review } from "@/lib/types";
import { Chip } from "./CareSheet";
import { Sheet } from "./Sheet";

type Bought = Review["bought"];
type Verdict = NonNullable<Review["verdict"]>;

const BOUGHT: [Bought, string][] = [
  ["yes", "Yes"],
  ["no", "No"],
  ["considering", "Thinking about it"],
];
const VERDICT: [Verdict, string][] = [
  ["worth_it", "Worth it"],
  ["not_worth_it", "Not worth it"],
  ["unsure", "Not sure yet"],
];

interface Props {
  open: boolean;
  productName: string;
  onClose: () => void;
  onPost: (r: { bought: Bought; verdict: Verdict; text: string }) => void;
}

export function ReviewSheet({ open, productName, onClose, onPost }: Props) {
  const [bought, setBought] = useState<Bought | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    setBought(null);
    setVerdict(null);
    setText("");
  }, [open]);

  const ready = bought && verdict && text.trim().length >= 3;

  return (
    <Sheet open={open} title="Write a review" onClose={onClose}>
      <p className="text-[14px] leading-normal text-crumb-body">{productName}</p>

      <Label>Did you buy it?</Label>
      <div className="flex flex-wrap gap-2">
        {BOUGHT.map(([v, label]) => (
          <Chip key={v} on={bought === v} onClick={() => setBought(v)}>
            {label}
          </Chip>
        ))}
      </div>

      <Label>Was it worth it?</Label>
      <div className="flex flex-wrap gap-2">
        {VERDICT.map(([v, label]) => (
          <Chip key={v} on={verdict === v} onClick={() => setVerdict(v)}>
            {label}
          </Chip>
        ))}
      </div>

      <Label>What should others know?</Label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={400}
        placeholder="What happened when you tried it, or why you didn't"
        className="w-full resize-none rounded-2xl bg-crumb-card p-3.5 text-[15px] leading-normal ring-1 ring-crumb-hairline outline-none placeholder:text-crumb-muted focus:ring-crumb-hairline-strong"
      />

      <p className="mt-3 text-[12.5px] leading-normal text-crumb-muted">
        Moderators check reviews before everyone can see them. Yours shows on this phone straight away.
      </p>

      <button
        type="button"
        disabled={!ready}
        onClick={() => ready && onPost({ bought: bought!, verdict: verdict!, text })}
        className="mt-4 mb-2 h-12 w-full rounded-full bg-crumb-accent text-[15px] font-medium text-white active:bg-crumb-accent-active disabled:bg-crumb-hairline-strong disabled:text-crumb-surface"
      >
        Post review
      </button>
    </Sheet>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 mb-2 text-[14px] font-medium">{children}</p>;
}
