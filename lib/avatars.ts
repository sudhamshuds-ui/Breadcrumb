// Profile pictures. The tester ("you") has a fixed picture; everyone else
// (friends, commenters, reviewers) gets a stock portrait from
// public/avatars/stock-01.jpg … stock-32.jpg (randomuser.me). 01-24: odd
// numbers are women, even numbers men; 25-32 are assigned by name below. Each known person has their own face, the same
// everywhere they appear.

export const MY_AVATAR = "/avatars/me.jpg";

const STOCK_COUNT = 32;

const ASSIGNED: Record<string, number> = {
  // Friends (share sheet, thread reviews)
  jess: 1,
  tom: 2,
  priya: 3,
  sam: 4,
  ana: 5,
  dave: 6,
  // Commenters
  "mapleleaf.marcy": 7,
  "goodeveryday.kai": 8,
  deb_on_the_go: 9,
  "archer.citylights": 10,
  "rach.ellis62": 11,
  "ryan.k.80": 12,
  "flareup.fiona": 13,
  "two.of.us.91": 14,
  "sazza.w": 15,
  "insight.music.k": 16,
  "dayzen.rae": 17,
  "homekid.fanpage": 18,
  "dr.hosnie.f": 19,
  "punk.vomit": 20,
  "sana.herbs": 21,
  "_brose.guini": 22,
  "louis.hu.design": 24,
  // Thread reviewers and discussion
  "mel.chen": 23,
  "nat.w": 25,
  liam: 26,
  "sarah.j.runs": 27,
  "kev.on.the.tools": 28,
  "dr.anika.r": 29,
  "greens.and.gains": 30,
  "renee.eats": 31,
  "lifts.and.lattes": 32,
};

export function avatarFor(name: string): string {
  const key = name.toLowerCase();
  let n = ASSIGNED[key];
  if (!n) {
    // Someone new (e.g. added later): pick a face from their name.
    let hash = 0;
    for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    n = (hash % STOCK_COUNT) + 1;
  }
  return `/avatars/stock-${String(n).padStart(2, "0")}.jpg`;
}
