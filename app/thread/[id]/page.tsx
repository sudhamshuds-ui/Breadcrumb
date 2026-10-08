import { Suspense } from "react";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { ThreadStub } from "@/components/thread/ThreadStub";
import { ThreadView } from "@/components/thread/ThreadView";
import { getThread } from "@/lib/data/threads";
import { reels } from "@/lib/data/reels";

type Params = Promise<{ id: string }>;

// A Breadcrumb thread: one reel, one product. Reels without a thread yet
// (and /thread/new) show the "start a thread" placeholder.
export default function ThreadPage({ params }: { params: Params }) {
  return (
    <PhoneFrame>
      <Suspense fallback={<div className="absolute inset-0 bg-crumb-surface" />}>
        <ThreadContent params={params} />
      </Suspense>
    </PhoneFrame>
  );
}

// Reads the URL inside the Suspense boundary so the frame shows instantly.
async function ThreadContent({ params }: { params: Params }) {
  const { id } = await params;
  const thread = getThread(id);
  const reel = thread && reels.find((r) => r.id === thread.reelId);
  return thread && reel ? <ThreadView thread={thread} reel={reel} /> : <ThreadStub />;
}

export function generateStaticParams() {
  return [{ id: "t1" }, { id: "t2" }, { id: "t4" }, { id: "t5" }, { id: "new" }];
}
