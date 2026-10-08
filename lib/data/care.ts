// Mock care options for the booking flow. Clinics are fictional (inner-west
// Sydney, near the persona); nothing is ever really booked. The healthdirect
// number is real: a free 24/7 Australian nurse line.

export const HEALTHDIRECT_PHONE = "1800 022 222";
export const HEALTHDIRECT_TEL = "tel:1800022222";

export interface Clinic {
  id: string;
  name: string;
  kind: "GP clinic" | "Medical centre" | "Hospital";
  distance: string;
  billing: string; // "Bulk billing" etc.
}

export const CLINICS: Clinic[] = [
  { id: "c1", name: "Marrickville Family Practice", kind: "GP clinic", distance: "0.8 km", billing: "Bulk billing" },
  { id: "c2", name: "Enmore Road Medical", kind: "Medical centre", distance: "1.3 km", billing: "Bulk billing for concession" },
  { id: "c3", name: "Sydenham Health Hub", kind: "Medical centre", distance: "2.1 km", billing: "Mixed billing" },
  { id: "c4", name: "Inner West Hospital outpatients", kind: "Hospital", distance: "3.4 km", billing: "Referral needed" },
];

// Upcoming appointment slots, relative to today. Same for every clinic: it's
// a prototype, the point is the flow, not the timetable.
export const SLOT_DAYS = ["Today", "Tomorrow", "Thu"];
export const SLOT_TIMES: Record<string, string[]> = {
  Today: ["4:15 pm", "5:40 pm"],
  Tomorrow: ["8:30 am", "10:10 am", "1:45 pm", "6:00 pm"],
  Thu: ["9:00 am", "11:20 am", "3:30 pm"],
};

// Call back windows for "Schedule a call".
export const CALL_TIMES = ["In about 30 min", "Today, 6–7 pm", "Tomorrow, 8–9 am", "Tomorrow, 12–1 pm"];
