import type { Thread } from "@/lib/types";

// Fictional community threads around real clips. People, reviews, discussion
// and creator history are made up; they talk about the topic, never about a
// brand's service. Every source is real and was checked (2026-10-09): links
// go to PubMed / PMC, healthdirect, the TGA (via RACGP newsGP), the FDA and
// the National Psoriasis Foundation. Summaries are ours, in plain language.

export const threads: Thread[] = [
  {
    id: "t1",
    reelId: "r1",
    productName: "Online weight-loss treatment plans",
    trust: {
      money: "disclosed",
      evidence: "mixed",
      community: { reviews: 9, positive: 4, friends: 2 },
    },
    evidenceNote:
      "Weight-loss medicines worked for many people in trials, alongside diet and activity. They need a prescription, regular check-ins and can have side effects.",
    friendNames: ["Priya", "Tom"],
    creator: {
      postsReviewed: 23,
      postsFlagged: 14,
      disclosed: [12, 14],
      note: "Most posts are about weight loss; recent ones are paid partnerships.",
    },
    care: {
      topic: "weight management",
      first: "A GP can talk through options, check your blood pressure and other health first, and refer you on.",
      professionals: ["GP", "Dietitian"],
    },
    reviews: [
      {
        id: "rv1",
        author: "Priya",
        isFriend: true,
        bought: "considering",
        verdict: "unsure",
        text: "Asked my GP about these medicines first. Worth knowing the ongoing cost and the side effects before signing up to anything.",
        helpful: 14,
        postedAgo: "1w",
      },
      {
        id: "rv2",
        author: "Tom",
        isFriend: true,
        bought: "no",
        verdict: "unsure",
        text: "My sister tried an online program. The check-ins were short, so she kept seeing her own GP as well.",
        helpful: 9,
        postedAgo: "3w",
      },
      {
        id: "rv1c",
        author: "Liam",
        isFriend: false,
        relation: "contact",
        bought: "yes",
        verdict: "worth_it",
        text: "It did work for me, but the first month of nausea was rough. Go in knowing it's a long-term thing, not a quick fix.",
        helpful: 11,
        postedAgo: "5d",
      },
      {
        id: "rv1d",
        author: "nat.w",
        isFriend: false,
        bought: "yes",
        verdict: "not_worth_it",
        text: "Stopped after three months. The price went up once the intro offer ended and I couldn't keep it going.",
        helpful: 6,
        postedAgo: "2w",
      },
    ],
    sources: [
      {
        title: "Once-weekly semaglutide in adults with overweight or obesity (STEP 1)",
        publisher: "New England Journal of Medicine",
        type: "Clinical trial",
        year: "2021",
        summary:
          "In 1,961 adults over 68 weeks, people on weekly semaglutide lost about 15% of their body weight on average, compared with about 2% on placebo. Nausea and other stomach side effects were common, and the drug's maker funded the trial.",
        url: "https://pubmed.ncbi.nlm.nih.gov/33567185/",
      },
      {
        title: "Weight loss medicine",
        publisher: "healthdirect",
        type: "Health service",
        summary:
          "Explains the prescription weight-loss medicines used in Australia and their common digestive side effects. It also notes they aren't currently covered by Medicare.",
        url: "https://www.healthdirect.gov.au/weight-loss-medicine",
      },
      {
        title: "TGA warns of online semaglutide scams",
        publisher: "RACGP newsGP",
        type: "Regulator",
        summary:
          "Australia's medicines regulator found some weight-loss injections sold online didn't contain what the label said. It advises getting them only through a pharmacy with a valid prescription.",
        url: "https://www1.racgp.org.au/newsgp/clinical/tga-warns-of-online-semaglutide-scams",
      },
    ],
    discussion: [
      {
        id: "d1",
        author: "mel.chen",
        role: "Pharmacist",
        text: "Worth knowing: these medicines need ongoing check-ins and the dose changes over months. Ask whoever prescribes how often you'll actually speak to a clinician.",
        votes: 41,
        postedAgo: "4d",
        replies: [
          {
            id: "d1r1",
            author: "Priya",
            isFriend: true,
            text: "This is exactly what I wanted to know, thanks.",
            votes: 6,
            postedAgo: "3d",
          },
        ],
      },
      {
        id: "d2",
        author: "kev.on.the.tools",
        text: "Is this cheaper than just going through my own GP though?",
        votes: 12,
        postedAgo: "6d",
        replies: [
          {
            id: "d2r1",
            author: "mel.chen",
            role: "Pharmacist",
            text: "Depends. The GP visit may be bulk-billed, but the medicine itself usually isn't subsidised for weight loss, so it costs about the same either way.",
            votes: 18,
            postedAgo: "5d",
          },
        ],
      },
      {
        id: "d3",
        author: "sarah.j.runs",
        text: "Did it for 6 months through an online service. It worked, but the nausea was rough for the first few weeks.",
        votes: 9,
        postedAgo: "1w",
      },
    ],
    lastModerated: "2 days ago",
  },
  {
    id: "t2",
    reelId: "r2",
    productName: "Broc Shot sulforaphane supplement",
    trust: {
      money: "disclosed",
      evidence: "not_supported",
      community: { reviews: 21, positive: 6, friends: 3 },
    },
    evidenceNote:
      "Lab and mouse studies suggest sulforaphane can calm skin inflammation, but we found no human trials in psoriasis. The foundation's seal checks that a product is gentle on skin, not that it treats psoriasis.",
    friendNames: ["Jess", "Sam", "Ana"],
    creator: {
      postsReviewed: 41,
      postsFlagged: 29,
      disclosed: [27, 29],
      note: "Posts often feature products the creator is paid to promote.",
    },
    care: {
      topic: "psoriasis",
      first: "A GP can look at your skin, suggest treatments with good evidence and refer you to a dermatologist.",
      professionals: ["GP", "Pharmacist"],
    },
    reviews: [
      {
        id: "rv3",
        author: "Jess",
        isFriend: true,
        bought: "no",
        verdict: "not_worth_it",
        text: "My dermatologist said there isn't good evidence for supplements in psoriasis yet. I stuck with my prescribed cream.",
        helpful: 31,
        postedAgo: "4d",
      },
      {
        id: "rv4",
        author: "Sam",
        isFriend: true,
        bought: "yes",
        verdict: "unsure",
        text: "Took it for a month. Didn't notice a change, but my flare-ups come and go anyway, so hard to tell.",
        helpful: 12,
        postedAgo: "2w",
      },
      {
        id: "rv4c",
        author: "Ana",
        isFriend: true,
        bought: "considering",
        verdict: "unsure",
        text: "The 'recognised by the foundation' bit nearly sold me. Glad I read what the seal actually means first.",
        helpful: 8,
        postedAgo: "6d",
      },
      {
        id: "rv4d",
        author: "greens.and.gains",
        isFriend: false,
        bought: "yes",
        verdict: "worth_it",
        text: "Easy to take and my skin feels a bit calmer, but I also changed my moisturiser around the same time.",
        helpful: 4,
        postedAgo: "3w",
      },
    ],
    sources: [
      {
        title: "Sulforaphane ameliorates the severity of psoriasis and SLE by modulating effector cells and reducing oxidative stress",
        publisher: "Frontiers in Pharmacology",
        type: "Lab study",
        year: "2022",
        summary:
          "In mice with psoriasis-like skin, sulforaphane reduced skin lesions and inflammation. It's an animal study, so it doesn't show the same effect in people.",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8814458/",
      },
      {
        title: "Seal of Recognition review process",
        publisher: "National Psoriasis Foundation",
        type: "Patient organisation",
        summary:
          "The seal goes to products shown to be non-irritating and safe for people with psoriasis. It doesn't mean a product treats or improves psoriasis.",
        url: "https://www.psoriasis.org/seal-of-recognition-review-process/",
      },
      {
        title: "Medicines for psoriasis",
        publisher: "healthdirect",
        type: "Health service",
        summary:
          "Covers treatments with good evidence, from creams to light therapy and prescription medicines. A GP or dermatologist can match treatment to how severe it is.",
        url: "https://www.healthdirect.gov.au/medicines-for-psoriasis",
      },
    ],
    discussion: [
      {
        id: "d4",
        author: "dr.anika.r",
        role: "Dermatologist",
        text: "Sulforaphane is interesting in the lab, but there's no human psoriasis trial yet. If flares are hard to manage, there are treatments with real evidence behind them.",
        votes: 88,
        postedAgo: "2d",
      },
      {
        id: "d5",
        author: "flareup.fiona",
        text: "The 'recognised by the foundation' line made me think it was a treatment. Good to know what the seal actually covers.",
        votes: 54,
        postedAgo: "3d",
        replies: [
          {
            id: "d5r1",
            author: "Jess",
            isFriend: true,
            text: "Same, I nearly bought it.",
            votes: 7,
            postedAgo: "3d",
          },
        ],
      },
      {
        id: "d6",
        author: "greens.and.gains",
        text: "Can't hurt to try though?",
        votes: 6,
        postedAgo: "4d",
        replies: [
          {
            id: "d6r1",
            author: "dr.anika.r",
            role: "Dermatologist",
            text: "Usually low risk, but check with a pharmacist if you take other medicines, and don't stop a prescribed treatment for it.",
            votes: 22,
            postedAgo: "4d",
          },
        ],
      },
    ],
    lastModerated: "yesterday",
  },
  {
    id: "t4",
    reelId: "r4",
    productName: "Daily supplement stack (creatine, magnesium, vitamin D, omega-3)",
    trust: {
      money: "detected",
      evidence: "mixed",
      community: { reviews: 12, positive: 7, friends: 1 },
    },
    moneyNote: "Offers 1-on-1 coaching in the caption",
    evidenceNote:
      "Creatine is well studied for strength training. The other claims are weaker: vitamin D didn't raise testosterone in a trial of men with low levels, and magnesium's sleep benefit comes from a few small trials.",
    friendNames: ["Tom"],
    creator: {
      postsReviewed: 12,
      postsFlagged: 3,
      note: "Fitness tips; sells his own coaching. No brand partnerships found.",
    },
    care: {
      topic: "supplements and testosterone",
      first: "A GP can order a blood test to see whether you're actually low in vitamin D or testosterone before you buy anything.",
      professionals: ["GP", "Pharmacist"],
    },
    reviews: [
      {
        id: "rv5",
        author: "Tom",
        isFriend: true,
        bought: "yes",
        verdict: "worth_it",
        text: "Creatine is well studied. The vitamin D and testosterone bit, less so. My GP said it only matters if you're actually low.",
        helpful: 18,
        postedAgo: "6d",
      },
      {
        id: "rv5c",
        author: "Dave",
        isFriend: false,
        relation: "contact",
        bought: "yes",
        verdict: "unsure",
        text: "Been on creatine two years, no complaints. Never noticed anything from the magnesium.",
        helpful: 9,
        postedAgo: "1w",
      },
      {
        id: "rv5d",
        author: "lifts.and.lattes",
        isFriend: false,
        bought: "considering",
        verdict: "unsure",
        text: "Four supplements a day adds up. Going to start with a blood test and go from there.",
        helpful: 5,
        postedAgo: "2w",
      },
    ],
    sources: [
      {
        title: "Position stand: safety and efficacy of creatine supplementation in exercise, sport and medicine",
        publisher: "Journal of the International Society of Sports Nutrition",
        type: "Position stand",
        year: "2017",
        summary:
          "An expert review concluding that creatine monohydrate reliably improves gains from high-intensity training. It found no good evidence of harm in healthy people at recommended doses.",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5469049/",
      },
      {
        title: "Effects of vitamin D supplementation on androgens in men with low testosterone levels",
        publisher: "European Journal of Nutrition",
        type: "Clinical trial",
        year: "2019",
        summary:
          "In 100 men with low testosterone, 12 weeks of vitamin D didn't change testosterone compared with placebo.",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6842386/",
      },
      {
        title: "Oral magnesium supplementation for insomnia in older adults",
        publisher: "BMC Complementary Medicine and Therapies",
        type: "Systematic review",
        year: "2021",
        summary:
          "Across three small trials, magnesium helped older adults fall asleep about 17 minutes faster. The authors rated the evidence as low quality.",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8053283/",
      },
      {
        title: "Omega-3 fatty acids for the primary and secondary prevention of cardiovascular disease",
        publisher: "Cochrane",
        type: "Systematic review",
        year: "2020",
        summary:
          "Across 86 trials, omega-3 supplements had little or no effect on deaths or most heart problems. There was a small drop in coronary heart disease events.",
        url: "https://pubmed.ncbi.nlm.nih.gov/32114706/",
      },
    ],
    discussion: [
      {
        id: "d7",
        author: "renee.eats",
        role: "Dietitian",
        text: "The creatine part is fair. 'Boost your testosterone' is the stretch: vitamin D only matters if you're low, and a blood test tells you that.",
        votes: 37,
        postedAgo: "3d",
      },
      {
        id: "d8",
        author: "punk.vomit",
        text: "It's 2am, when does the magnesium kick in",
        votes: 64,
        postedAgo: "9h",
        replies: [
          {
            id: "d8r1",
            author: "renee.eats",
            role: "Dietitian",
            text: "Ha. In the trials the effect was small, about 17 minutes faster to fall asleep.",
            votes: 29,
            postedAgo: "8h",
          },
        ],
      },
    ],
    lastModerated: "3 days ago",
  },
  {
    id: "t5",
    reelId: "r5",
    productName: "Co-Biotics daily supplements",
    trust: {
      money: "disclosed",
      evidence: "mixed",
      community: { reviews: 3, positive: 2, friends: 0 },
    },
    moneyNote: "Ad posted by the brand itself",
    evidenceNote:
      "Probiotics improved some gut and immune measures in healthy adults, but changes were often temporary. We found no published studies on these products' energy or sleep claims.",
    friendNames: [],
    creator: {
      postsReviewed: 6,
      postsFlagged: 0,
      note: "Brand account: every post advertises its own products.",
    },
    care: {
      topic: "gut health",
      first: "A GP or dietitian can help if you have ongoing gut, energy or sleep problems, and check whether a supplement suits you.",
      professionals: ["GP", "Dietitian"],
    },
    reviews: [
      {
        id: "rv6",
        author: "sana.herbs",
        isFriend: false,
        bought: "yes",
        verdict: "unsure",
        text: "Nice routine, hard to say what it did. I sleep better on weekends anyway.",
        helpful: 4,
        postedAgo: "3w",
      },
      {
        id: "rv6b",
        author: "louis.hu.design",
        isFriend: false,
        bought: "no",
        verdict: "unsure",
        text: "Beautiful ad, but I'd want to see a study on the actual product first.",
        helpful: 3,
        postedAgo: "4w",
      },
    ],
    sources: [
      {
        title: "A review of probiotic supplementation in healthy adults: helpful or hype?",
        publisher: "European Journal of Clinical Nutrition",
        type: "Review",
        year: "2019",
        summary:
          "Looking at 45 studies in healthy adults, probiotics improved some immune and bowel measures. Changes to gut bacteria were often temporary.",
        url: "https://pubmed.ncbi.nlm.nih.gov/29581563/",
      },
      {
        title: "Questions and answers on dietary supplements",
        publisher: "U.S. Food and Drug Administration",
        type: "Regulator",
        summary:
          "Explains that supplements don't need approval before they're sold. The 'not evaluated by the FDA' line means the claim hasn't been reviewed.",
        url: "https://www.fda.gov/food/information-consumers-using-dietary-supplements/questions-and-answers-dietary-supplements",
      },
    ],
    discussion: [
      {
        id: "d9",
        author: "dr.hosnie.f",
        role: "Dietitian",
        text: "Fibre-rich food feeds the same gut bacteria. A supplement may suit some people, but it isn't a must.",
        votes: 30,
        postedAgo: "4w",
      },
      {
        id: "d10",
        author: "sana.herbs",
        text: "The gut-brain research is real, but 'sleep that restores' is a big leap from it.",
        votes: 12,
        postedAgo: "3w",
      },
    ],
    lastModerated: "1 week ago",
  },
];

export function getThread(id: string | null): Thread | undefined {
  if (!id) return undefined;
  return threads.find((t) => t.id === id);
}
