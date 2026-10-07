"use client";

import { motion } from "motion/react";
import { Bookmark, Ellipsis, Heart, MessageCircle, Repeat2, Send } from "lucide-react";
import type { Reel } from "@/lib/types";

// The familiar short-video overlay: action rail, creator row and caption.
// Kept generic (no platform branding) so testers focus on Crumb.

interface Props {
  reel: Reel;
  liked: boolean;
  onLike: () => void;
  onOpenCaption: () => void;
  bottomInset: number;
}

export function ReelChrome({ reel, liked, onLike, onOpenCaption, bottomInset }: Props) {
  return (
    <>
      {/* Right action rail */}
      <div
        data-interactive
        className="absolute right-2 z-10 flex w-12 flex-col items-center gap-[18px] text-white"
        style={{ bottom: bottomInset + 14 }}
      >
        <RailButton label={liked ? "Unlike" : "Like"} count={reel.stats.likes} onClick={onLike}>
          <motion.span
            key={String(liked)}
            initial={{ scale: liked ? 0.6 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex"
          >
            <Heart size={27} strokeWidth={1.9} fill={liked ? "#FF3040" : "none"} color={liked ? "#FF3040" : "white"} />
          </motion.span>
        </RailButton>
        <RailButton label="Comments" count={reel.stats.comments} onClick={onOpenCaption}>
          <MessageCircle size={26} strokeWidth={1.9} style={{ transform: "scaleX(-1)" }} />
        </RailButton>
        <RailButton label="Repost" count={reel.stats.reposts}>
          <Repeat2 size={27} strokeWidth={1.9} />
        </RailButton>
        <RailButton label="Share" count={reel.stats.shares}>
          <Send size={25} strokeWidth={1.9} />
        </RailButton>
        <RailButton label="Save">
          <Bookmark size={25} strokeWidth={1.9} />
        </RailButton>
        <RailButton label="More">
          <Ellipsis size={24} strokeWidth={2} />
        </RailButton>
      </div>

      {/* Creator row + caption */}
      <div className="absolute left-3.5 right-16 z-10 text-white" style={{ bottom: bottomInset + 12 }}>
        <div className="flex items-center gap-2.5">
          <Avatar reel={reel} size={34} />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[14px] font-semibold">{reel.creator.handle}</div>
            <div className="truncate text-[12px] opacity-80">
              {reel.paidPartner ? `Paid partnership with ${reel.paidPartner}` : reel.creator.name}
            </div>
          </div>
          <span className="ml-1 rounded-lg border border-white/60 px-3 py-[3px] text-[13px] font-semibold">Follow</span>
        </div>
        <button
          type="button"
          data-interactive
          onClick={onOpenCaption}
          className="mt-2.5 line-clamp-2 text-left text-[13.5px] leading-[1.3] text-white/95"
        >
          {reel.caption}
        </button>
      </div>
    </>
  );
}

function RailButton({
  children,
  count,
  label,
  onClick,
}: {
  children: React.ReactNode;
  count?: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center gap-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] active:scale-90"
    >
      {children}
      {count && <span className="text-[11.5px] font-semibold">{count}</span>}
    </button>
  );
}

export function Avatar({ reel, size }: { reel: Reel; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full p-[2px]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${reel.creator.ring[0]}, ${reel.creator.ring[1]})`,
      }}
    >
      <span
        className="flex size-full items-center justify-center rounded-full border-2 border-black text-[11px] font-bold text-white"
        style={{ background: `linear-gradient(160deg, ${reel.theme.to}, ${reel.theme.from})` }}
      >
        {reel.creator.initials}
      </span>
    </span>
  );
}
