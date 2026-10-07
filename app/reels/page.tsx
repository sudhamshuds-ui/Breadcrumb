import { Suspense } from "react";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { ReelsApp } from "@/components/reels/ReelsApp";

export default function ReelsPage() {
  return (
    <PhoneFrame>
      <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
        <ReelsApp />
      </Suspense>
    </PhoneFrame>
  );
}
