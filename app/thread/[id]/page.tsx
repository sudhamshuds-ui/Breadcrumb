import { Suspense } from "react";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { ThreadStub } from "@/components/thread/ThreadStub";

// Placeholder until the Breadcrumb platform is designed. It proves the
// deep link works and returns to the same reel and time.
export default function ThreadPage() {
  return (
    <PhoneFrame>
      <Suspense fallback={<div className="absolute inset-0 bg-white" />}>
        <ThreadStub />
      </Suspense>
    </PhoneFrame>
  );
}
