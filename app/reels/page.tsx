import { Suspense } from "react";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { ReelsRoute } from "@/components/reels/ReelsRoute";

export default function ReelsPage() {
  return (
    <PhoneFrame>
      <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
        <ReelsRoute />
      </Suspense>
    </PhoneFrame>
  );
}
