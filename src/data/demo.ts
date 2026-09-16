// Fictional demo dataset for Contentplane.
// Client: Northwind Coffee Roasters — a fictional specialty coffee roaster.

import type { PortalState, Platform } from "./types";
import { PLATFORMS } from "./types";;

// Dates are generated relative to "today" so the demo always looks alive.
function d(offsetDays: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays - 1);
  return date.toISOString().slice(0, 10);
}

function monthKey(offsetMonths: number): string {
  const date = new Date();
  date.setDate(1);
  date.setHours(12, 0, 0, 0);
  date.setMonth(date.getMonth() + offsetMonths, 1);
  return date.toISOString().slice(0, 7);
}

export const DEMO_CONTENT = [
  {
    id: "C-101",
    date: d(2),
    platform: "Instagram",
    format: "Reel",
    topic: "Cold brew vs iced latte",
    caption:
      "Same beans, two very different drinks. Which team are you? ☕ Swipe for the 20-second breakdown.",
    assetNote: "Vertical video, 20s, kitchen b-roll + text overlays",
    status: "In Review",
    managerNotes: "Render v2 needs the new logo sting.",
    clientComments: "Love this one. Can the overlay font match our label type?",
    pillar: "Education",
    owner: "Maya Okafor",
  },
  {
    id: "C-102",
    date: d(4),
    platform: "TikTok",
    format: "Short",
    topic: "Roastery tour: from cherry to cup",
    caption:
      "Ever wondered what happens between the cherry and your cup? Full roastery walkthrough.",
    assetNote: "Vertical video, 45s, gimballed walkthrough",
    status: "Approved",
    managerNotes: "Scheduled via TikTok scheduler after approval.",
    clientComments: "",
    pillar: "Behind the scenes",
    owner: "Maya Okafor",
  },
  {
    id: "C-103",
    date: d(-1),
    platform: "Instagram",
    format: "Carousel",
    topic: "5 brewing mistakes (and fixes)",
    caption:
      "Save this for Sunday morning. Five mistakes almost everyone makes with pour-over — and the 10-second fix for each.",
    assetNote: "6-slide carousel, 1080×1350",
    status: "Published",
    managerNotes: "",
    clientComments: "Great engagement on this style last month.",
    pillar: "Education",
    owner: "Maya Okafor",
  },
  {
    id: "C-104",
    date: d(-3),
    platform: "LinkedIn",
    format: "Article",
    topic: "Why we publish our green-coffee costs",
    caption:
      "Transparency report: what your bag actually costs to make, and why we think every roaster should show the math.",
    assetNote: "Article + 1 hero graphic",
    status: "Published",
    managerNotes: "",
    clientComments: "",
    pillar: "Community",
    owner: "Jonas Feld",
  },
  {
    id: "C-105",
    date: d(6),
    platform: "Instagram",
    format: "Story",
    topic: "Fall menu teaser",
    caption: "Countdown sticker + poll: pumpkin spice yes or no?",
    assetNote: "3 frames, poll sticker",
    status: "Drafting",
    managerNotes: "Waiting on product photos from the client.",
    clientComments: "",
    pillar: "Promotion",
    owner: "Priya Raman",
  },
  {
    id: "C-106",
    date: d(9),
    platform: "YouTube",
    format: "Video",
    topic: "Cupping session with our head roaster",
    caption:
      "Sit in on a live cupping. What we taste for, how we score, and why we dump a whole batch sometimes.",
    assetNote: "16:9, 8 min, captions required",
    status: "Drafting",
    managerNotes: "Rough cut in edit; audio pass booked Friday.",
    clientComments: "",
    pillar: "Education",
    owner: "Jonas Feld",
  },
  {
    id: "C-107",
    date: d(11),
    platform: "Instagram",
    format: "Single post",
    topic: "New single origin: Guatemala Huixpac",
    caption:
      "Landing next week: Guatemala Huixpac — cacao, red apple, brown sugar. 200 bags only.",
    assetNote: "Studio shot, 1080×1350",
    status: "In Review",
    managerNotes: "Price reveal timing to be confirmed with launch plan.",
    clientComments: "Please hold until the landing page is live.",
    pillar: "Product",
    owner: "Maya Okafor",
  },
  {
    id: "C-108",
    date: d(-6),
    platform: "TikTok",
    format: "Short",
    topic: "Barista reacts to viral coffee hacks",
    caption: "Salt in espresso? We tried them so you don't have to.",
    assetNote: "Vertical video, 30s",
    status: "Published",
    managerNotes: "",
    clientComments: "",
    pillar: "Community",
    owner: "Priya Raman",
  },
  {
    id: "C-109",
    date: d(14),
    platform: "Pinterest",
    format: "Pin",
    topic: "Cold brew ratios cheat sheet",
    caption: "Save the ratio card: brew stronger, dilute later.",
    assetNote: "1000×1500 infographic pin",
    status: "Approved",
    managerNotes: "Batch scheduled with 4 other pins.",
    clientComments: "",
    pillar: "Education",
    owner: "Priya Raman",
  },
  {
    id: "C-110",
    date: d(18),
    platform: "Facebook",
    format: "Single post",
    topic: "October cupping event invite",
    caption:
      "Free public cupping, first Saturday of the month. RSVP in comments.",
    assetNote: "Event graphic + link",
    status: "Idea",
    managerNotes: "Confirm date with events team.",
    clientComments: "",
    pillar: "Community",
    owner: "Jonas Feld",
  },
  {
    id: "C-111",
    date: d(-9),
    platform: "Instagram",
    format: "Reel",
    topic: "How we choose origins",
    caption: "Three questions we ask before buying a whole harvest.",
    assetNote: "Vertical video, 35s",
    status: "Published",
    managerNotes: "",
    clientComments: "",
    pillar: "Product",
    owner: "Maya Okafor",
  },
  {
    id: "C-112",
    date: d(21),
    platform: "Instagram",
    format: "Carousel",
    topic: "Meet the team: roastery edition",
    caption: "New series introducing the people behind your coffee.",
    assetNote: "5-slide carousel, portraits",
    status: "Idea",
    managerNotes: "Need photographer availability.",
    clientComments: "",
    pillar: "Behind the scenes",
    owner: "Priya Raman",
  },
] as const;

export const DEMO_REQUESTS = [
  {
    id: "R-201",
    title: "Add holiday gift guide to November calendar",
    category: "Content",
    priority: "High",
    dateSubmitted: d(-12),
    status: "New",
    assignedTo: "Maya Okafor",
    dueDate: d(5),
    comments: "We want 8 gift-focused posts between Nov 20 and Dec 15.",
  },
  {
    id: "R-202",
    title: "Refresh LinkedIn banner with new label design",
    category: "Design",
    priority: "Medium",
    dateSubmitted: d(-7),
    status: "In Progress",
    assignedTo: "Priya Raman",
    dueDate: d(8),
    comments: "Files are in Brand assets. Keep the wordmark centered.",
  },
  {
    id: "R-203",
    title: "Pull TikTok report for Q3 board deck",
    category: "Report",
    priority: "Medium",
    dateSubmitted: d(-4),
    status: "Waiting",
    assignedTo: "Jonas Feld",
    dueDate: d(12),
    comments: "Waiting on the final follower export before I can close this.",
  },
  {
    id: "R-204",
    title: "Organize access to the new Pinterest business account",
    category: "Access",
    priority: "Low",
    dateSubmitted: d(-20),
    status: "Completed",
    assignedTo: "Priya Raman",
    dueDate: d(-8),
    comments: "Invite accepted; two-factor handed to ops.",
  },
  {
    id: "R-205",
    title: "Quote additional budget for video production",
    category: "Budget",
    priority: "High",
    dateSubmitted: d(-2),
    status: "New",
    assignedTo: "Maya Okafor",
    dueDate: d(6),
    comments: "Two extra shoot days for the series starting in October.",
  },
] as const;

export const DEMO_MEETINGS = [
  {
    id: "M-301",
    title: "October content planning",
    date: d(3),
    time: "10:00",
    agenda:
      "Review October pillars, lock the Guatemala launch sequence, approve reel concepts.",
    participants: "Ava Torres, Maya Okafor",
    status: "Scheduled",
    notes: "",
    actionItems: "",
  },
  {
    id: "M-302",
    title: "Monthly performance review",
    date: d(-8),
    time: "14:00",
    agenda: "Walk through August metrics and agree Q4 KPI targets.",
    participants: "Ava Torres, Maya Okafor, Jonas Feld",
    status: "Completed",
    notes:
      "Agreed to shift two carousel slots to reels. Q4 target: +8% engagement rate.",
    actionItems: "Maya: revise Q4 pillar mix by Friday. Jonas: refresh KPI sheet.",
  },
  {
    id: "M-303",
    title: "Holiday campaign kickoff",
    date: d(17),
    time: "11:30",
    agenda: "Gift guide brief, budget check, photography schedule.",
    participants: "Ava Torres, Maya Okafor, Priya Raman",
    status: "Scheduled",
    notes: "",
    actionItems: "",
  },
] as const;

export const DEMO_DELIVERABLES = [
  {
    id: "D-401",
    name: "Brand kit — Northwind v3.pdf",
    category: "Brand assets",
    description: "Logos, color tokens, type specimen, usage rules.",
    date: d(-30),
    status: "Shared",
    relatedContent: "All content",
    relatedProject: "Brand refresh",
    size: "8.4 MB",
  },
  {
    id: "D-402",
    name: "September grid — posts 1–12.zip",
    category: "Final deliverables",
    description: "Exported final artwork for the September grid.",
    date: d(-5),
    status: "Shared",
    relatedContent: "C-101 · C-103 · C-107",
    relatedProject: "September calendar",
    size: "46 MB",
  },
  {
    id: "D-403",
    name: "Q3 platform report.pdf",
    category: "Reports",
    description: "Platform-by-platform performance with commentary.",
    date: d(-10),
    status: "Shared",
    relatedContent: "—",
    relatedProject: "Q3 reporting",
    size: "2.1 MB",
  },
  {
    id: "D-404",
    name: "Roastery b-roll — day 2.mp4",
    category: "Videos",
    description: "Raw footage for the roastery tour short.",
    date: d(-3),
    status: "In progress",
    relatedContent: "C-102",
    relatedProject: "Roastery series",
    size: "1.2 GB",
  },
  {
    id: "D-405",
    name: "2025 archive — final exports.zip",
    category: "Documents",
    description: "Cold-storage archive of last year's final exports.",
    date: d(-90),
    status: "Archived",
    relatedContent: "—",
    relatedProject: "2025 archive",
    size: "3.8 GB",
  },
] as const;

export const DEMO_METRICS: Array<{
  month: string;
  platform: string;
  followers: number;
  reach: number;
  engagement: number;
  clicks: number;
}> = [];

// Six months of metrics per platform with a gentle upward trend and noise.
const BASE: Record<string, { followers: number; reach: number; engagement: number; clicks: number }> = {
  Instagram: { followers: 18400, reach: 96000, engagement: 7400, clicks: 3100 },
  TikTok: { followers: 24800, reach: 168000, engagement: 12100, clicks: 4300 },
  LinkedIn: { followers: 6200, reach: 41000, engagement: 2100, clicks: 1500 },
  YouTube: { followers: 4100, reach: 28000, engagement: 1800, clicks: 900 },
  Facebook: { followers: 5200, reach: 21000, engagement: 1100, clicks: 700 },
  Pinterest: { followers: 2300, reach: 19000, engagement: 900, clicks: 1200 },
};

// Deterministic pseudo-random so numbers stay stable between reloads.
function jitter(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

for (let m = 5; m >= 0; m--) {
  const mk = monthKey(-m);
  PLATFORMS.forEach((platform, pi) => {
    const b = BASE[platform];
    const growth = (5 - m) * 0.035;
    const noise = 0.9 + jitter(m * 10 + pi) * 0.2;
    DEMO_METRICS.push({
      month: mk,
      platform,
      followers: Math.round(b.followers * (1 + growth * 1.6) * noise),
      reach: Math.round(b.reach * (1 + growth) * noise),
      engagement: Math.round(b.engagement * (1 + growth * 1.1) * noise),
      clicks: Math.round(b.clicks * (1 + growth * 0.9) * noise),
    });
  });
}

export const DEMO_STRATEGY: PortalState["strategy"] = [
  {
    key: "business-objective",
    title: "Business objective",
    items: [
      "Grow direct-to-subscriber coffee sales to 45% of revenue by end of Q4.",
      "Open a second retail counter and keep weekend sell-through above 80%.",
    ],
  },
  {
    key: "social-objectives",
    title: "Social media objectives",
    items: [
      "Build an education-first brand voice that makes specialty coffee approachable.",
      "Convert 3% of engaged Instagram followers to the subscription waitlist each month.",
      "Grow TikTok to 30K followers with roastery storytelling.",
    ],
  },
  {
    key: "audience",
    title: "Target audience",
    items: [
      "Home brewers, 25–40, who care about origin and craft but find jargon-heavy content intimidating.",
      "Café owners and wholesale buyers who need a reliable, transparent roasting partner.",
    ],
  },
  {
    key: "pillars",
    title: "Content pillars",
    items: [
      "Education — brewing guides, ratio cards, terminology decoded",
      "Behind the scenes — roastery life, sourcing trips, team stories",
      "Product — origin drops, subscription highlights, seasonal menus",
      "Community — customer features, events, causes we support",
      "Promotion — launches, offers, gift guides",
    ],
  },
  {
    key: "brand-voice",
    title: "Brand voice",
    items: [
      "Warm, plain-spoken, quietly witty. Expert without being precious.",
      "Words we use: brew, origin, craft, honest. Words we avoid: ninja, hack, guru.",
    ],
  },
  {
    key: "positioning",
    title: "Positioning",
    items: [
      "The roaster that shows its math: transparent costs, honest scores, no gatekeeping.",
    ],
  },
  {
    key: "key-messages",
    title: "Key messages",
    items: [
      "Great coffee is a repeatable recipe, not a mystery.",
      "Know your farmer, know your roast, know your ratio.",
    ],
  },
  {
    key: "campaign-themes",
    title: "Campaign themes (next 90 days)",
    items: [
      "September: 'Brew School' — one technique per week",
      "October: Guatemala Huixpac launch + cupping events",
      "November: holiday gift guides + subscription push",
    ],
  },
  {
    key: "kpis",
    title: "KPIs we track",
    items: [
      "Engagement rate per post (target ≥ 4.5%)",
      "Follower growth per platform (target +8% MoM)",
      "Waitlist signups from social (target 250/mo)",
    ],
  },
];

export const DEMO_KPIS = [
  {
    id: "K-01",
    name: "Instagram engagement rate",
    baseline: "3.1%",
    target: "4.5%",
    actual: "4.2%",
    unit: "%",
    deadline: d(45),
  },
  {
    id: "K-02",
    name: "TikTok followers",
    baseline: "18,000",
    target: "30,000",
    actual: "24,800",
    unit: "followers",
    deadline: d(75),
  },
  {
    id: "K-03",
    name: "Waitlist signups / month",
    baseline: "90",
    target: "250",
    actual: "184",
    unit: "signups",
    deadline: d(60),
  },
  {
    id: "K-04",
    name: "YouTube watch time (hrs/mo)",
    baseline: "310",
    target: "600",
    actual: "452",
    unit: "hours",
    deadline: d(90),
  },
] as const;

export const DEMO_ONBOARDING: Record<string, string> = {
  Company:
    "Northwind Coffee Roasters LLC — specialty coffee roaster with a retail counter and subscription program. Founded 2019 in Portland, OR.",
  Contact:
    "Primary: Ava Torres, Founder & Brand Director — ava@northwindroasters.example · +1 (503) 555-0114. Secondary: Luis Chen, Retail Ops.",
  Brand:
    "See Strategy page for full voice and pillars. Logos, palette (pine, cream, terracotta) and type live in the brand kit PDF.",
  "Social accounts":
    "Instagram @northwindroasters · TikTok @northwindcoffee · LinkedIn company page · YouTube channel · Pinterest board — all handled by the agency.",
  Audience:
    "Home brewers 25–40 and wholesale café owners. See Strategy page for detail.",
  Objectives:
    "DTC subscription growth first, TikTok audience second, email list growth third.",
  Competitors:
    "Local roasters with strong retail presence; national DTC brands with big ad budgets.",
  "Content preferences":
    "Education-first. Reels and carousels over static posts. No dance trends. Batch shoots monthly.",
  "Approval preferences":
    "Approval requested 5 business days before publish date. One revision round included. Silence for 48h after a nudge counts as approval.",
  "Important dates":
    "Fall menu launch: Oct 1. Guatemala Huixpac drop: Oct 12. Holiday campaign: Nov 20–Dec 15. Founder's day: Mar 3.",
  "Brand assets":
    "Brand kit v3 PDF and raw logo files shared in Files & Deliverables.",
  Notes:
    "Ava prefers async updates by email; call only for urgent approvals.",
};

export function buildDemoState(): PortalState {
  return {
    version: 1,
    client: {
      name: "Northwind Coffee Roasters",
      tagline: "Know your farmer, know your roast, know your ratio.",
      industry: "Specialty coffee — DTC + wholesale",
      website: "northwindroasters.example",
      email: "ava@northwindroasters.example",
      phone: "+1 (503) 555-0114",
      timezone: "America/Los_Angeles (PT)",
      socials: {
        Instagram: "@northwindroasters",
        TikTok: "@northwindcoffee",
        LinkedIn: "Northwind Coffee Roasters",
        YouTube: "Northwind Roastery TV",
        Pinterest: "northwindcoffee",
      },
      notes:
        "Async-first communication. Approvals by email unless urgent. Monthly report due the 3rd business day.",
    },
    manager: {
      name: "Maya Okafor",
      agency: "Fieldnote Studio — social media management",
      email: "maya@fieldnotestudio.example",
      timezone: "America/Los_Angeles (PT)",
    },
    content: DEMO_CONTENT.map((c) => ({ ...c })),
    requests: DEMO_REQUESTS.map((r) => ({ ...r })),
    meetings: DEMO_MEETINGS.map((m) => ({ ...m })),
    deliverables: DEMO_DELIVERABLES.map((x) => ({ ...x })),
    metrics: DEMO_METRICS.map((x, i) => ({ ...x, id: `M-${i}`, platform: x.platform as Platform })),
    onboarding: { ...DEMO_ONBOARDING } as PortalState["onboarding"],
    strategy: DEMO_STRATEGY.map((s) => ({ ...s, items: [...s.items] })),
    kpis: DEMO_KPIS.map((k) => ({ ...k })),
    settings: {
      theme: "light",
      density: "comfortable",
      notifyEmail: true,
      notifyApprovals: true,
      notifyReports: true,
    },
    onboardedAt: d(-30),
  };
}
