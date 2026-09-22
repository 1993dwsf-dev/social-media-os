// Contentplane Manager Workbook — 28-sheet operating system for social media
// managers. Sheets are defined as data so the web viewer can render them,
// compute formulas, validate dropdowns, and export CSV.

import type { Platform } from "./types";
import { PILLARS, PLATFORMS } from "./types";

export interface SheetColumn {
  name: string;
  width: number;
  type?: "text" | "number" | "date" | "select" | "currency" | "percent";
  options?: string[];
}

export interface SheetDef {
  id: string;
  name: string;
  group: string;
  description: string;
  columns: SheetColumn[];
  rows: (string | number)[][];
  freeze: number;
}

export const STATUS_OPTIONS = [
  "Idea",
  "Drafting",
  "In Review",
  "Changes Requested",
  "Approved",
  "Scheduled",
  "Published",
];

export const TASK_STATUS_OPTIONS = ["Backlog", "In Progress", "Blocked", "Done"];
export const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
export const CONTENT_TYPES = ["Reel", "Carousel", "Post", "Story", "Short", "Video", "Pin", "Article", "Live"];
export const APPROVAL_OPTIONS = ["Not needed", "Pending", "Approved", "Changes requested"];
export const PUB_OPTIONS = ["Draft", "Scheduled", "Published", "On hold"];

export const GROUPS = ["Setup & Brand", "Planning", "Production", "Growth", "Business"] as const;

export const SHEET_GROUPS: Record<string, string> = {
  "Setup & Brand": "#136A87",
  Planning: "#0369A1",
  Production: "#047857",
  Growth: "#B45309",
  Business: "#6D28D9",
};

// ---- helpers -------------------------------------------------------------

function iso(offsetDays: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function monthISO(monthOffset: number, day: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + monthOffset, Math.min(day, 28));
  return d.toISOString().slice(0, 10);
}

function weekday(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function demoCaption(topic: string): string {
  return `Sample caption for: ${topic}`;
}

function demoCTA(pillar: string): string {
  const ctas: Record<string, string> = {
    Education: "Save this guide",
    "Behind the scenes": "Follow the series",
    Product: "Shop the drop",
    Community: "Comment your take",
    Promotion: "Tap the link in bio",
  };
  return ctas[pillar] || "Learn more";
}

function mediaFor(type: string): string {
  if (type === "Reel" || type === "Short" || type === "Video" || type === "Live")
    return "Video";
  if (type === "Carousel") return "Carousel images";
  if (type === "Story") return "Story frames";
  if (type === "Pin") return "Pin graphic";
  return "Single graphic";
}

function calendarColumns(): SheetColumn[] {
  return [
    { name: "Date", width: 92, type: "date" },
    { name: "Day", width: 52 },
    { name: "Client", width: 150 },
    { name: "Platform", width: 100, type: "select", options: PLATFORMS },
    { name: "Content type", width: 104, type: "select", options: CONTENT_TYPES },
    { name: "Content pillar", width: 130, type: "select", options: PILLARS },
    { name: "Topic / hook", width: 220 },
    { name: "Caption / status", width: 260 },
    { name: "CTA", width: 130 },
    { name: "Media type", width: 110 },
    { name: "Owner", width: 110 },
    { name: "Approval status", width: 130, type: "select", options: APPROVAL_OPTIONS },
    { name: "Publication status", width: 130, type: "select", options: PUB_OPTIONS },
    { name: "Notes", width: 200 },
  ];
}

function monthSheet(idx: number, name: string, monthOffset: number): SheetDef {
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const month = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
  const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const demoTopics: [number, Platform, string, string, string][] = [
    [3, "Instagram", "Reel", "Education", "Brew school #1 — pour-over in 60s"],
    [7, "TikTok", "Short", "Behind the scenes", "Roastery walkthrough: cherry to cup"],
    [12, "Instagram", "Carousel", "Education", "5 brewing mistakes (and fixes)"],
    [15, "LinkedIn", "Article", "Community", "Why we publish our green-coffee costs"],
    [19, "Instagram", "Post", "Product", "Single-origin drop teaser"],
    [24, "YouTube", "Video", "Education", "Cupping session with our head roaster"],
  ];
  const rows: (string | number)[][] = [];
  for (let day = 1; day <= days; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const demo = demoTopics.find(([dd]) => dd === day);
    if (demo) {
      const [, platform, type, pillar, topic] = demo;
      rows.push([
        dateStr,
        weekday(dateStr),
        "Northwind Coffee Roasters",
        platform,
        type,
        pillar,
        topic,
        demoCaption(topic),
        demoCTA(pillar),
        mediaFor(type),
        "Maya Okafor",
        day < 10 ? "Approved" : "Pending",
        day < 10 ? "Scheduled" : "Draft",
        "",
      ]);
    } else {
      rows.push([dateStr, weekday(dateStr), "", "", "", "", "", "", "", "", "", "", "", ""]);
    }
  }
  return {
    id: `month-${idx}`,
    name,
    group: "Planning",
    description: `${name} content calendar — schedule posts, assign owners, track approvals. Dropdowns standardize statuses.`,
    columns: calendarColumns(),
    rows,
    freeze: 1,
  };
}

const SETUP_ROWS: (string | number)[][] = [
  ["Manager name", "Alex Moreno"],
  ["Business / agency", "Marrow Social"],
  ["Contact email", "alex@marrowsocial.example"],
  ["Time zone", "America/Los_Angeles (PT)"],
  ["Team / collaborators", "Priya Raman · Jonas Feld"],
  ["Services offered", "Strategy, content production, publishing, reporting"],
  ["Currency", "USD ($)"],
  ["Default approval turnaround", "3 working days"],
  ["Active clients", "=COUNTIF(Clients!J2:J1000,\"Active\")"],
  ["Total clients", "=COUNTA(Clients!A2:A1000)"],
  ["Monthly recurring revenue", "=SUMIF(Clients!J2:J1000,\"Active\",Clients!H2:H1000)"],
  ["Notes", "One row per client lives in the Clients sheet. Duplicate the Brand and Goals sheets per client when you need a private reference for each account."],
];

// Client roster — the manager's book of business. Status and fee columns feed
// the Dashboard and Setup formulas (J = Status, H = Monthly fee).
const CLIENTS_ROWS: (string | number)[][] = [
  ["Northwind Coffee Roasters", "Maya Okafor", "maya@northwindcoffee.example", "+1 (503) 555-0142", "northwindcoffee.example", "Specialty coffee roastery", "Retainer — 12 posts/month", 4800, iso(-240), "Active", "@northwindcoffee", "@northwindroasts", "", "Prefers edits in batches. Never posts pricing."],
  ["Hale & Harbor Interiors", "Dana Whitfield", "dana@haleharbor.example", "+1 (617) 555-0198", "haleharbor.example", "Residential interior design", "Retainer — 8 posts/month", 3200, iso(-120), "Active", "@haleandharbor", "", "hale-harbor", "Approvals come from Dana only; photographer must be tagged."],
  ["Bloomly Skincare", "Renata Silva", "renata@bloomly.example", "+1 (512) 555-0177", "bloomly.example", "DTC skincare", "Retainer — 16 posts/month + ads", 6500, iso(-75), "Active", "@bloomlyskin", "@bloomly", "", "Claims must match the approved copy deck; legal adds 2 days."],
  ["Vela Fitness Studio", "Tom Beck", "tom@velafitness.example", "+1 (305) 555-0110", "velafitness.example", "Boutique fitness studio", "Proposal — 8 posts/month", 2200, iso(0), "Prospect", "@velafitness", "", "", "Waiting on the signed proposal; 30-day relaunch sprint first."],
];

const BRAND_ROWS: (string | number)[][] = [
  ["Brand name", "Northwind Coffee Roasters — duplicate this sheet per client"],
  ["Tagline", "Know your farmer, know your roast, know your ratio."],
  ["Mission", "Make specialty coffee approachable without dumbing it down."],
  ["Vision", "A coffee culture where every bag shows its math — cost, origin, score."],
  ["Values", "Transparency, craft, patience, community"],
  ["Brand personality", "Warm, plain-spoken, quietly witty expert"],
  ["Tone of voice", "Friendly expert — teach, don't lecture"],
  ["Target audience", "Home brewers 25–40; wholesale café owners"],
  ["Audience pain points", "Jargon-heavy guides; distrust of pricing; gear overwhelm"],
  ["Audience desires", "Repeatable recipes, honest sourcing, calm confidence"],
  ["Differentiators", "Published green-coffee costs; roast dates on every bag"],
  ["Content pillars", PILLARS.join(" · ")],
  ["Key messages", "Great coffee is a repeatable recipe, not a mystery."],
  ["Words to use", "brew, origin, craft, honest, calm"],
  ["Words to avoid", "ninja, hack, guru, hack your morning"],
  ["Visual direction", "Morning light, warm wood, steam; unhurried pacing"],
  ["Brand colors", "Pine #1E4D3B · Cream #F4EFE6 · Terracotta #C96F4A"],
  ["Typography", "Fraunces (display) · Inter (UI/body)"],
  ["CTA preferences", "Save this guide · Shop the drop · Join the waitlist"],
];

const GOALS_ROWS: (string | number)[][] = [
  ["Business", "Grow DTC subscription revenue", "30% of revenue", "45% of revenue", "34%", 0.113, "On track", "Ava Torres", iso(90), "Q4 push planned"],
  ["Social", "Instagram engagement rate", "3.1%", "4.5%", "4.2%", 0.736, "On track", "Maya Okafor", iso(45), "Reels mix improving"],
  ["Social", "TikTok followers", "18,000", "30,000", "24,800", 0.567, "On track", "Maya Okafor", iso(75), "Series cadence weekly"],
  ["Social", "Waitlist signups / month", "90", "250", "184", 0.594, "Attention", "Jonas Feld", iso(60), "Need stronger pin-to-waitlist path"],
  ["Quarterly", "YouTube watch time (hrs/mo)", "310", "600", "452", 0.493, "On track", "Jonas Feld", iso(90), "2 long-form videos/mo"],
  ["Monthly", "Publishing consistency", "16", "20", "17", 0.125, "Attention", "Priya Raman", iso(30), "2 slots missed in week 2"],
];

function makeGoalsSheet(): SheetDef {
  return {
    id: "goals",
    name: "Goals",
    group: "Setup & Brand",
    description: "Goal & KPI framework — progress % is computed from baseline → actual → target, and status colors reflect progress.",
    columns: [
      { name: "Scope", width: 90, type: "select", options: ["Business", "Social", "Quarterly", "Monthly"] },
      { name: "KPI name", width: 220 },
      { name: "Baseline", width: 90 },
      { name: "Target", width: 90 },
      { name: "Actual", width: 90 },
      { name: "Progress", width: 90, type: "percent" },
      { name: "Status", width: 100, type: "select", options: ["On track", "Attention", "At risk"] },
      { name: "Owner", width: 120 },
      { name: "Deadline", width: 100, type: "date" },
      { name: "Notes", width: 220 },
    ],
    rows: GOALS_ROWS,
    freeze: 1,
  };
}

function makeDashboardSheet(): SheetDef {
  const monthName = new Date().toLocaleString("en-US", { month: "long" });
  const rows: (string | number)[][] = [
    ["Business snapshot (from Clients)", "", "", ""],
    ["Total clients", "=COUNTA(Clients!A2:A1000)", "Active clients", "=COUNTIF(Clients!J2:J1000,\"Active\")"],
    ["Monthly recurring revenue", "=SUMIF(Clients!J2:J1000,\"Active\",Clients!H2:H1000)", "Prospects", "=COUNTIF(Clients!J2:J1000,\"Prospect\")"],
    ["", "", "", ""],
    ["Content pipeline (from Content Plan)", "", "", ""],
    ["Planned posts", "=COUNTA('Content Plan'!C2:C1000)", "Published", "=COUNTIF('Content Plan'!Q2:Q1000,\"Published\")"],
    ["Awaiting approval", "=COUNTIF('Content Plan'!P2:P1000,\"Pending\")", "Scheduled", "=COUNTIF('Content Plan'!Q2:Q1000,\"Scheduled\")"],
    ["Tasks due this week", "=COUNTIFS(Tasks!K2:K1000,\"<=\"&TEXT(TODAY()+7,\"YYYY-MM-DD\"),Tasks!I2:I1000,\"<>Done\")", "Tasks done", "=COUNTIF(Tasks!I2:I1000,\"Done\")"],
    ["", "", "", ""],
    ["Money (from Finance)", "", "", ""],
    ["Revenue this month", "=SUMIF(Finance!A2:A1000,\">=\"&TEXT(EOMONTH(TODAY(),-1)+1,\"YYYY-MM-DD\"),Finance!C2:C1000)", "Expenses this month", "=SUMIF(Finance!A2:A1000,\">=\"&TEXT(EOMONTH(TODAY(),-1)+1,\"YYYY-MM-DD\"),Finance!D2:D1000)"],
    ["Unpaid / pending income", "=SUMIF(Finance!H2:H1000,\"<>Paid\",Finance!C2:C1000)", "Overdue payments", "=COUNTIF(Finance!H2:H1000,\"Overdue\")"],
  ];
  return {
    id: "dashboard",
    name: "Dashboard",
    group: "Setup & Brand",
    description: "Management dashboard for ${monthName} — every metric computes live from the Clients, Content Plan, Tasks and Finance sheets.",
    columns: [
      { name: "Metric", width: 260 },
      { name: "Value", width: 240 },
      { name: "Metric 2", width: 180 },
      { name: "Value 2", width: 240 },
    ],
    rows,
    freeze: 0,
  };
}

function makeYearSheet(): SheetDef {
  const rows: (string | number)[][] = [];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const demo: Record<number, [string, string, string, string, string, string, string]> = {
    8: ["Brew School", "Teach one technique weekly", "Sep 1 — Labor Day mocktail menu", "Education", "Fall menu launch", "Labor Day (Sep 7)", "Highest sustained reach in tests"],
    9: ["Origin Drop: Guatemala", "Launch Guatemala Huixpac", "Oct 12 — drop day", "Product", "Limited 200-bag release", "Cupping events (Oct)", "Coordinate with email list"],
    10: ["Gift Guides", "Holiday gifting made calm", "Nov 20 — campaign start", "Promotion", "Gift cards + bundles", "Black Friday (Nov 27)", "Start teaser Nov 10"],
    11: ["Year in Review", "Community storytelling", "Dec 26 — recap reel", "Community", "Customer features", "New Year (Dec 31)", "Repurpose top 2026 posts"],
  };
  months.forEach((name, i) => {
    const d = demo[i];
    rows.push(d ? [name, ...d] : [name, "", "", "", "", "", "", ""]);
  });
  return {
    id: "year",
    name: "Year",
    group: "Planning",
    description: "12-month planning overview — campaign themes, objectives, key dates, and launches at a glance.",
    columns: [
      { name: "Month", width: 110 },
      { name: "Campaign / theme", width: 170 },
      { name: "Main objective", width: 230 },
      { name: "Key dates", width: 210 },
      { name: "Content focus", width: 120, type: "select", options: PILLARS },
      { name: "Important launches", width: 200 },
      { name: "Major events", width: 180 },
      { name: "Notes", width: 220 },
    ],
    rows,
    freeze: 1,
  };
}

function makeWeeklySheet(): SheetDef {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const plan: Record<string, [string, string, string, string][]> = {
    Monday: [
      ["Schedule approved posts for Tue–Wed", "Batch 1", "Maya", "Done"],
      ["Shoot prep — props & set", "Roastery series", "Priya", "In Progress"],
    ],
    Tuesday: [
      ["Publish Reel: pour-over 60s", "Instagram", "Maya", "Done"],
      ["Edit roastery walkthrough", "TikTok", "Priya", "In Progress"],
    ],
    Wednesday: [
      ["Carousel draft: brewing mistakes", "Instagram", "Maya", "In Progress"],
      ["Community replies (30 min)", "All platforms", "Jonas", "Backlog"],
    ],
    Thursday: [
      ["Send approvals for next week", "Client", "Ava", "In Progress"],
      ["Film cupping session", "YouTube", "Jonas", "Blocked"],
    ],
    Friday: [
      ["Weekly metrics pull", "Reporting", "Jonas", "Backlog"],
      ["Plan next week's calendar", "Planning", "Maya", "Backlog"],
    ],
    Saturday: [["Engagement hour (morning)", "All platforms", "Priya", "Backlog"]],
    Sunday: [["Rest / no publishing", "—", "Team", "Backlog"]],
  };
  const rows: (string | number)[][] = [];
  days.forEach((day, di) => {
    (plan[day] || []).forEach((it, i) => {
      rows.push([i === 0 ? day : "", "Northwind Coffee Roasters", it[0], it[1], it[2], it[3], "", iso(di + 1)]);
    });
  });
  return {
    id: "weekly",
    name: "Weekly",
    group: "Production",
    description: "Week-at-a-glance operational plan — content and tasks per weekday with deadlines and owners.",
    columns: [
      { name: "Day", width: 100 },
      { name: "Client", width: 160 },
      { name: "Content / task", width: 240 },
      { name: "Platform / project", width: 150 },
      { name: "Responsible", width: 110 },
      { name: "Status", width: 110, type: "select", options: TASK_STATUS_OPTIONS },
      { name: "Notes", width: 180 },
      { name: "Deadline", width: 100, type: "date" },
    ],
    rows,
    freeze: 1,
  };
}

function makeBrainDumpSheet(): SheetDef {
  const rows: (string | number)[][] = [
    ["I-01", "Roaster Q&A reel series", "Education", "Reel", "Instagram", "High", "Team standup", "What does 'washed process' actually mean?", "Follow for part 2", "Ready to plan", iso(-4), "3 parts planned"],
    ["I-02", "Customer story: café partner in Bend", "Community", "Carousel", "Instagram", "Medium", "Client email", "How Brewed Awake scaled with our beans", "Read their story", "Ready to plan", iso(-9), "Need photo consent"],
    ["I-03", "Cold brew ratio calculator", "Education", "Post", "Pinterest", "High", "Search trends", "Save the ratio card", "Save this pin", "In production", iso(-2), "Pin graphic in Figma"],
    ["I-04", "Roastery cat cameo series", "Community", "Short", "TikTok", "Low", "Team standup", "Our QC manager has whiskers", "Follow for more Miso", "Idea", iso(-1), "Miso is the roastery cat"],
    ["I-05", "Behind the label: naming origins", "Behind the scenes", "Video", "YouTube", "Medium", "Client email", "Why we name coffees after rivers", "Watch the series", "Ready to plan", iso(-6), ""],
    ["I-06", "Steam texture pack for stories", "Behind the scenes", "Story", "Instagram", "Low", "Team standup", "Free texture pack in bio", "Download", "Shelved", iso(-15), "Low priority"],
  ];
  return {
    id: "brain-dump",
    name: "Brain Dump",
    group: "Production",
    description: "Idea capture — park every idea here with a priority, then move winners into the Content Plan sheet.",
    columns: [
      { name: "ID", width: 70 },
      { name: "Idea", width: 240 },
      { name: "Category", width: 140, type: "select", options: PILLARS },
      { name: "Format", width: 110, type: "select", options: CONTENT_TYPES },
      { name: "Platform", width: 100, type: "select", options: PLATFORMS },
      { name: "Priority", width: 90, type: "select", options: PRIORITY_OPTIONS },
      { name: "Source", width: 120 },
      { name: "Potential hook", width: 240 },
      { name: "CTA", width: 140 },
      { name: "Status", width: 120, type: "select", options: ["Idea", "In production", "Ready to plan", "Shelved"] },
      { name: "Date added", width: 100, type: "date" },
      { name: "Notes", width: 180 },
    ],
    rows,
    freeze: 1,
  };
}

function makeContentPlanSheet(): SheetDef {
  const rows: (string | number)[][] = [
    ["CP-001", iso(2), "Northwind Coffee Roasters", "Instagram", "Reel", "Education", "Cold brew vs iced latte", "Awareness", "Same beans, two very different drinks.", "Which team are you? ☕", "Save this guide", "Vertical video 20s, kitchen b-roll + overlays", "Video edit", "Maya Okafor", "In Review", "Pending", "Draft", "", "First render v2 due"],
    ["CP-002", iso(4), "Northwind Coffee Roasters", "TikTok", "Short", "Behind the scenes", "Roastery tour: cherry to cup", "Awareness", "Ever wondered what happens between cherry and cup?", "Full walkthrough in captions", "Follow the series", "45s gimbal walkthrough", "Raw edit", "Maya Okafor", "Approved", "Approved", "Scheduled", "", "Batch scheduled"],
    ["CP-003", iso(6), "Northwind Coffee Roasters", "Instagram", "Story", "Promotion", "Fall menu teaser", "Interest", "Countdown + poll frames", "Pumpkin spice: yes or no?", "Vote in poll", "3 story frames + poll", "Design", "Priya Raman", "In Review", "Pending", "Draft", "", "Waiting on product photos"],
    ["CP-004", iso(9), "Northwind Coffee Roasters", "Instagram", "Post", "Product", "Guatemala Huixpac reveal", "Interest", "Cacao, red apple, brown sugar.", "Landing next week — 200 bags only", "Join waitlist", "Studio shot 1080×1350", "Retouch", "Maya Okafor", "Approved", "Approved", "Scheduled", "", "Hold until landing page live"],
    ["CP-005", iso(12), "Northwind Coffee Roasters", "YouTube", "Video", "Education", "Cupping session with head roaster", "Interest", "Sit in on a live cupping.", "What we taste for, how we score", "Subscribe", "16:9 8-min edit + captions", "Color + audio", "Jonas Feld", "Drafting", "—", "Draft", "", "Rough cut in edit"],
    ["CP-006", iso(-6), "Northwind Coffee Roasters", "LinkedIn", "Article", "Community", "Why we publish green-coffee costs", "Consideration", "Transparency report: what your bag costs.", "Show the math, earn the trust", "Read + share", "Article + hero graphic", "Copy edit", "Jonas Feld", "Published", "—", "Published", "linkedin.com/…/costs", "Strong pickup in comments"],
    ["CP-007", iso(-6), "Northwind Coffee Roasters", "Instagram", "Carousel", "Education", "5 brewing mistakes", "Awareness", "Save this for Sunday morning.", "Five mistakes, ten-second fixes", "Save this guide", "6-slide carousel 1080×1350", "Design", "Maya Okafor", "Published", "—", "Published", "instagram.com/…/p/xyz", "Top saver rate this month"],
    ["CP-008", iso(18), "Northwind Coffee Roasters", "Pinterest", "Pin", "Education", "Cold brew ratios cheat sheet", "Awareness", "Brew stronger, dilute later.", "Save the ratio card", "Save this pin", "1000×1500 infographic", "Design", "Priya Raman", "Approved", "Approved", "Scheduled", "", "Batch of 5 pins"],
    ["CP-009", iso(21), "Northwind Coffee Roasters", "Instagram", "Carousel", "Behind the scenes", "Meet the team: roastery edition", "Interest", "The people behind your coffee.", "Series kickoff", "Follow the series", "5-slide portraits", "Photography", "Priya Raman", "Idea", "—", "Draft", "", "Need photographer availability"],
    ["CP-010", iso(-9), "Northwind Coffee Roasters", "Instagram", "Reel", "Product", "How we choose origins", "Awareness", "Three questions before buying a harvest.", "Relationships over brokers", "Save this guide", "Vertical video 35s", "Edit", "Maya Okafor", "Published", "—", "Published", "instagram.com/…/p/abc", "Best CTR to waitlist"],
  ];
  return {
    id: "content-plan",
    name: "Content Plan",
    group: "Production",
    description: "The operational core — one row per content piece from idea to publication. Dashboard and analytics reference this sheet.",
    columns: [
      { name: "Content ID", width: 90 },
      { name: "Date", width: 92, type: "date" },
      { name: "Client", width: 150 },
      { name: "Platform", width: 100, type: "select", options: PLATFORMS },
      { name: "Content format", width: 110, type: "select", options: CONTENT_TYPES },
      { name: "Pillar", width: 140, type: "select", options: PILLARS },
      { name: "Topic", width: 220 },
      { name: "Objective", width: 120, type: "select", options: ["Awareness", "Interest", "Consideration", "Conversion"] },
      { name: "Hook", width: 230 },
      { name: "Caption", width: 280 },
      { name: "CTA", width: 140 },
      { name: "Creative direction", width: 260 },
      { name: "Asset required", width: 120 },
      { name: "Owner", width: 120 },
      { name: "Draft status", width: 110, type: "select", options: STATUS_OPTIONS },
      { name: "Approval status", width: 120, type: "select", options: APPROVAL_OPTIONS.concat(["In Review", "—"]) },
      { name: "Publication status", width: 130, type: "select", options: PUB_OPTIONS },
      { name: "URL", width: 170 },
      { name: "Performance notes", width: 220 },
    ],
    rows,
    freeze: 1,
  };
}

function makeTasksSheet(): SheetDef {
  const rows: (string | number)[][] = [
    ["T-01", "Finalize fall menu campaign brief", "Northwind Coffee Roasters", "Fall menu", "Content", "Maya Okafor", "High", "In Progress", iso(-2), iso(3), "", "—", "Awaiting client photo approval"],
    ["T-02", "Edit roastery walkthrough short", "Northwind Coffee Roasters", "Roastery series", "Production", "Priya Raman", "High", "In Progress", iso(-4), iso(2), "", "T-05", "Gimbal footage day 2 pending"],
    ["T-03", "Design Guatemala launch carousel", "Northwind Coffee Roasters", "Origin drop", "Design", "Priya Raman", "High", "Blocked", iso(-6), iso(5), "", "T-04", "Needs final label art"],
    ["T-04", "Deliver label art v3", "Northwind Coffee Roasters", "Origin drop", "Design", "Client team", "Medium", "In Progress", iso(-3), iso(4), "", "—", "With client designer"],
    ["T-05", "Book second shoot day", "Northwind Coffee Roasters", "Roastery series", "Logistics", "Maya Okafor", "Medium", "Done", iso(-8), iso(-3), iso(-4), "—", ""],
    ["T-06", "Monthly report", "Hale & Harbor Interiors", "Reporting", "Reporting", "Jonas Feld", "Medium", "Backlog", iso(1), iso(6), "", "—", "Template ready in Reports"],
    ["T-07", "Schedule Pinterest batch (5 pins)", "Northwind Coffee Roasters", "Evergreen pins", "Publishing", "Priya Raman", "Low", "Done", iso(-5), iso(-1), iso(-1), "—", ""],
    ["T-08", "Refresh link-in-bio page", "Bloomly Skincare", "Website sync", "Content", "Jonas Feld", "Low", "Backlog", iso(2), iso(9), "", "—", "Copy with client"],
  ];
  return {
    id: "tasks",
    name: "Tasks",
    group: "Production",
    description: "Task & project management — one Client column per row, with dependencies, priorities and due dates.",
    columns: [
      { name: "Task ID", width: 80 },
      { name: "Task", width: 240 },
      { name: "Client", width: 160 },
      { name: "Project", width: 130 },
      { name: "Category", width: 110 },
      { name: "Assigned to", width: 120 },
      { name: "Priority", width: 90, type: "select", options: PRIORITY_OPTIONS },
      { name: "Status", width: 110, type: "select", options: TASK_STATUS_OPTIONS },
      { name: "Start date", width: 92, type: "date" },
      { name: "Due date", width: 92, type: "date" },
      { name: "Completed", width: 92, type: "date" },
      { name: "Depends on", width: 100 },
      { name: "Notes", width: 220 },
    ],
    rows,
    freeze: 1,
  };
}

function makeThirtyDaySheet(): SheetDef {
  const objectives: [string, string][] = [
    ["Audit your profile", "Bio, links, highlights"],
    ["Define content pillars", "Pick 3–5"],
    ["Batch ideas", "Brain Dump sheet"],
    ["Shoot batch #1", "10 assets in 2 hours"],
    ["Draft captions in bulk", "Hooks first"],
    ["Schedule week 1", "Batch scheduling"],
    ["Engagement hour", "Reply to every comment"],
    ["Analyze top post", "Double down"],
    ["Collab outreach", "3 DMs"],
    ["Review + adjust", "Weekly review ritual"],
  ];
  const rows: (string | number)[][] = [];
  for (let day = 1; day <= 30; rows.push([day, objectives[(day - 1) % 10][0], objectives[(day - 1) % 10][1], "Not started", PLATFORMS[(day - 1) % PLATFORMS.length], "", ""]), day++);
  return {
    id: "thirty-day",
    name: "30 Day",
    group: "Growth",
    description: "30-day account relaunch planner — one objective and action per day, with platform focus and status tracking.",
    columns: [
      { name: "Day", width: 60, type: "number" },
      { name: "Objective", width: 180 },
      { name: "Action", width: 220 },
      { name: "Status", width: 110, type: "select", options: ["Not started", "In progress", "Done"] },
      { name: "Platform focus", width: 110, type: "select", options: PLATFORMS },
      { name: "Content task", width: 200 },
      { name: "Notes", width: 200 },
    ],
    rows,
    freeze: 1,
  };
}

function makeFeedPreviewSheet(): SheetDef {
  const rows: (string | number)[][] = [
    [1, iso(2), "Northwind Coffee Roasters", "Cold brew vs iced latte", "Reel", "Reel cover: side-by-side pours", "Education"],
    [2, iso(4), "Northwind Coffee Roasters", "Roastery tour teaser", "Reel", "Wide roastery shot + logo sting", "Behind the scenes"],
    [3, iso(7), "Northwind Coffee Roasters", "5 brewing mistakes", "Carousel", "Cover: numbered mistakes 1–5", "Education"],
    [4, iso(9), "Northwind Coffee Roasters", "Guatemala reveal", "Post", "Studio shot on cream backdrop", "Product"],
    [5, iso(12), "Hale & Harbor Interiors", "Warm minimalism explained", "Carousel", "Neutral palette flat lay", "Education"],
    [6, iso(15), "Northwind Coffee Roasters", "Brew ratio card", "Post", "Infographic card, pine green", "Education"],
    [7, iso(18), "Bloomly Skincare", "3-step winter routine", "Reel", "Bathroom shelf close-ups, soft light", "Education"],
    [8, iso(21), "Northwind Coffee Roasters", "Fall menu hero", "Post", "Terracotta flat lay", "Promotion"],
    [9, iso(24), "Bloomly Skincare", "Ingredient spotlight: squalane", "Carousel", "Macro texture shots on marble", "Education"],
  ];
  return {
    id: "feed-preview",
    name: "Feed Preview",
    group: "Planning",
    description: "Visual feed planning per client — arrange upcoming posts in publication order to check rhythm and color balance before anything goes live.",
    columns: [
      { name: "Post #", width: 70, type: "number" },
      { name: "Date", width: 92, type: "date" },
      { name: "Client", width: 160 },
      { name: "Content", width: 200 },
      { name: "Content type", width: 100, type: "select", options: CONTENT_TYPES },
      { name: "Visual concept", width: 240 },
      { name: "Pillar", width: 140, type: "select", options: PILLARS },
    ],
    rows,
    freeze: 1,
  };
}

function makeHashtagsSheet(): SheetDef {
  const rows: (string | number)[][] = [
    ["#specialtycoffee", "Industry", "Education", "Broad", "High", "Instagram", "coffee, barista", "Any educational post", "Active", "Also used on TikTok"],
    ["#homebrewing", "Community", "Education", "Niche", "Medium", "Instagram", "home cafe, v60", "Carousel guides", "Active", "Best saver rate; also used on TikTok"],
    ["#coffeeroaster", "Industry", "Product", "Niche", "Medium", "Instagram", "roastery, origins", "Product reveals", "Active", "Repurpose on LinkedIn origin posts"],
    ["#pourover", "Technique", "Education", "Niche", "Medium", "Instagram", "v60, chemex", "Brew guides", "Active", "Pin the guide graphic on Pinterest"],
    ["#coldbrew", "Product", "Education", "Broad", "High", "TikTok", "iced coffee", "Seasonal features", "Active", "Also used on Instagram; rotate with #icedcoffee"],
    ["#portlandcoffee", "Local", "Community", "Local", "Low", "Instagram", "pdx, local roaster", "Local community posts", "Active", "Strong local reach"],
    ["#coffeegifts", "Seasonal", "Promotion", "Broad", "High", "Pinterest", "gift guide", "Gift guide campaign", "Planned", "Nov 20 onward; also used in Instagram stories"],
    ["#behindthescenes", "Style", "Behind the scenes", "Broad", "Medium", "TikTok", "roastery life", "BTS content", "Active", "Repurpose clips to Instagram Reels"],
  ];
  return {
    id: "hashtags",
    name: "Hashtags",
    group: "Growth",
    description: "Hashtag research database — group tags into sets, track reach type and competition, and note where each performs best.",
    columns: [
      { name: "Hashtag", width: 140 },
      { name: "Category", width: 110 },
      { name: "Content pillar", width: 150, type: "select", options: PILLARS },
      { name: "Reach / type", width: 100, type: "select", options: ["Broad", "Niche", "Local", "Branded"] },
      { name: "Competition", width: 110, type: "select", options: ["Low", "Medium", "High"] },
      { name: "Platform", width: 150, type: "select", options: PLATFORMS },
      { name: "Related keywords", width: 180 },
      { name: "Best usage", width: 180 },
      { name: "Status", width: 90, type: "select", options: ["Active", "Testing", "Planned", "Retired"] },
      { name: "Notes", width: 200 },
    ],
    rows,
    freeze: 1,
  };
}

function makeCollabsSheet(): SheetDef {
  const rows: (string | number)[][] = [
    ["Brewed Awake Café", "Local café, Bend OR", "Instagram", "hello@brewedawake.example", "Content swap", iso(-14), "Active", "1 carousel + 3 stories", iso(8), "$0 — mutual", "—", "Second collab this year"],
    ["Kitchen&Co", "Kitchenware brand", "TikTok", "partnerships@kitchenco.example", "Gifting + feature", iso(-9), "Proposal sent", "1 Short featuring their kettle", iso(15), "$450", "Pending", "Contract out for signature"],
    ["Maya Chen", "Home-barista creator, 88K", "YouTube", "maya.chen@creator.example", "Paid feature", iso(-21), "Negotiating", "Cameo in cupping video", iso(22), "$900", "Deposit received", "Asks for 60-day usage rights"],
    ["Brew Bar Supply", "Gear retailer", "Instagram", "sales@brewbarsupply.example", "Affiliate", iso(-30), "Active", "Link-in-bio placement", "—", "12% commission", "$118 last month", "Track monthly payout"],
    ["Riverbend Market", "Grocery chain", "LinkedIn", "buyer@riverbend.example", "Wholesale partnership", iso(-2), "Reached out", "Launch announcement post", iso(30), "$0 — partnership", "—", "Buyer meeting booked"],
  ];
  return {
    id: "collabs",
    name: "Collabs",
    group: "Growth",
    description: "Collaboration tracker — outreach, deliverables, payment terms, and results for every partner and creator.",
    columns: [
      { name: "Collaborator", width: 150 },
      { name: "Company / profile", width: 190 },
      { name: "Platform", width: 100, type: "select", options: PLATFORMS },
      { name: "Contact", width: 190 },
      { name: "Collaboration type", width: 150 },
      { name: "Proposal date", width: 100, type: "date" },
      { name: "Status", width: 130, type: "select", options: ["Reached out", "Proposal sent", "Negotiating", "Active", "Complete", "Declined"] },
      { name: "Deliverables", width: 220 },
      { name: "Publication date", width: 110, type: "date" },
      { name: "Payment", width: 110 },
      { name: "Results", width: 140 },
      { name: "Notes", width: 200 },
    ],
    rows,
    freeze: 1,
  };
}

function makeFinanceSheet(): SheetDef {
  const rows: (string | number)[][] = [
    [iso(-28), "Northwind Coffee Roasters", 4800, "", "Retainer", "Monthly management fee — October", "Paid", iso(-25), iso(-24)],
    [iso(-14), "Northwind Coffee Roasters", "", 850, "Production", "Shoot day catering + props", "Paid", "", iso(-12)],
    [iso(-7), "Kitchen&Co collab", 450, "", "Collab revenue", "Sponsored Short — deposit", "Paid", iso(-7), iso(-5)],
    [iso(3), "Northwind Coffee Roasters", 4800, "", "Retainer", "Monthly fee — November", "Pending", iso(10), ""],
    [iso(6), "Fieldnote Studio", "", 320, "Software", "Scheduling + editing tools", "Pending", iso(13), ""],
    [iso(10), "Maya Chen collab", 900, "", "Collab revenue", "Paid feature — balance due", "Pending", iso(17), ""],
    [iso(-40), "Northwind Coffee Roasters", 4800, "", "Retainer", "Monthly fee — September", "Paid", iso(-35), iso(-33)],
    [iso(-38), "Freelance videographer", "", 1200, "Contractor", "Roastery series — edit day 1", "Paid", iso(-33), iso(-31)],
  ];
  return {
    id: "finance",
    name: "Finance",
    group: "Business",
    description: "Lightweight finance ledger — revenue, expenses, payment status, and net result. Summary row computes automatically.",
    columns: [
      { name: "Date", width: 92, type: "date" },
      { name: "Client / payee", width: 190 },
      { name: "Revenue", width: 100, type: "currency" },
      { name: "Expense", width: 100, type: "currency" },
      { name: "Category", width: 140, type: "select", options: ["Retainer", "Collab revenue", "Production", "Software", "Contractor", "Other"] },
      { name: "Description", width: 260 },
      { name: "Payment status", width: 120, type: "select", options: ["Paid", "Pending", "Overdue"] },
      { name: "Due date", width: 92, type: "date" },
      { name: "Payment date", width: 92, type: "date" },
    ],
    rows,
    freeze: 1,
  };
}

// Client Reports replaces the old per-platform analytics tabs: without social
// API connections there are no follower/reach numbers to track, so the manager
// reports on what they actually control — delivery, approvals and money.
function makeClientReportsSheet(): SheetDef {
  const rows: (string | number)[][] = [];
  const clientPlan: [string, number, number, number, number, number, string][] = [
    ["Northwind Coffee Roasters", 12, 12, 11, 1, 4800, "Fall menu launch landed; December plan starts Nov 20"],
    ["Hale & Harbor Interiors", 8, 8, 8, 0, 3200, "Spring calendar 60% booked from content leads"],
    ["Bloomly Skincare", 16, 16, 14, 2, 6500, "Legal queue cleared; barrier cream launch on track"],
    ["Vela Fitness Studio", 0, 0, 0, 0, 0, "Proposal stage — reporting starts after signature"],
  ];
  for (let m = 1; m >= -1; m--) {
    clientPlan.forEach(([client, planned, delivered, onTime, flagged, fee, notes], ci) => {
      const j = 0.9 + ((ci * 7 + m + 20) % 5) * 0.02;
      rows.push([
        monthISO(m, 15),
        client,
        ci === 3 && m !== -1 ? 0 : Math.round(planned * j),
        ci === 3 && m !== -1 ? 0 : Math.round(delivered * j),
        ci === 3 && m !== -1 ? 0 : Math.round(onTime * j),
        ci === 3 && m !== -1 ? 0 : flagged,
        ci === 3 && m !== -1 ? "—" : Math.round(fee * j),
        ci === 3 && m !== -1 ? "Awaiting signed proposal" : ci === 0 && m === -1 ? notes : "",
      ]);
    });
  }
  return {
    id: "client-reports",
    name: "Client Reports",
    group: "Growth",
    description: "Monthly service summary per client — planned vs delivered, on-time rate, flagged pieces and fees. No social metrics: reports cover what the manager controls.",
    columns: [
      { name: "Month", width: 92, type: "date" },
      { name: "Client", width: 170 },
      { name: "Planned posts", width: 100, type: "number" },
      { name: "Delivered", width: 90, type: "number" },
      { name: "On time", width: 80, type: "number" },
      { name: "Flagged / revisions", width: 110, type: "number" },
      { name: "Billed", width: 100, type: "currency" },
      { name: "Summary notes", width: 280 },
    ],
    rows,
    freeze: 1,
  };
}

function makeServiceLogSheet(): SheetDef {
  const rows: (string | number)[][] = [
    [iso(-1), "Northwind Coffee Roasters", "Published", "Reel", "Cold brew vs iced latte", "Instagram", "Posted on schedule; morning slot"],
    [iso(-3), "Northwind Coffee Roasters", "Scheduled", "Carousel", "5 brewing mistakes", "Instagram", "Batch scheduled with pinned ratios"],
    [iso(-4), "Bloomly Skincare", "Changes requested", "Reel", "Barrier cream teaser", "Instagram", "Softer hook — re-editing today"],
    [iso(-6), "Hale & Harbor Interiors", "Published", "Carousel", "Rug sizing cheat sheet", "Pinterest", "Top saver rate of the month"],
    [iso(-7), "Northwind Coffee Roasters", "Published", "Article", "Why we publish green-coffee costs", "LinkedIn", "Strong pickup from wholesale accounts"],
    [iso(-8), "Bloomly Skincare", "Scheduled", "Short", "Founder answers DMs #2", "TikTok", "Second in series; hooks landing"],
  ];
  return {
    id: "service-log",
    name: "Service Log",
    group: "Growth",
    description: "Delivery log of what went out per client — a simple record of published/scheduled work without social platform metrics.",
    columns: [
      { name: "Date", width: 92, type: "date" },
      { name: "Client", width: 170 },
      { name: "Status", width: 130, type: "select", options: STATUS_OPTIONS.concat(["Changes requested"]) },
      { name: "Format", width: 100, type: "select", options: CONTENT_TYPES },
      { name: "Topic", width: 230 },
      { name: "Platform", width: 100, type: "select", options: PLATFORMS },
      { name: "Notes", width: 260 },
    ],
    rows,
    freeze: 1,
  };
}

// ---- final assembly ------------------------------------------------------

export function buildWorkbookSheets(): SheetDef[] {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sheets: SheetDef[] = [];

  sheets.push({
    id: "setup",
    name: "Setup",
    group: "Setup & Brand",
    description: "Central configuration — client details, package, and service period. Reference these values from other sheets instead of retyping them.",
    columns: [
      { name: "Field", width: 220 },
      { name: "Value", width: 460 },
    ],
    rows: SETUP_ROWS,
    freeze: 1,
  });

  sheets.push({
    id: "clients",
    name: "Clients",
    group: "Setup & Brand",
    description: "Client roster — one row per client with contact, package, fee, status and social handles. Setup formulas and the Dashboard read from here.",
    columns: [
      { name: "Client", width: 180 },
      { name: "Contact", width: 130 },
      { name: "Email", width: 180 },
      { name: "Phone", width: 130 },
      { name: "Website", width: 150 },
      { name: "Industry", width: 150 },
      { name: "Package", width: 170 },
      { name: "Monthly fee", width: 100, type: "currency" },
      { name: "Start date", width: 92, type: "date" },
      { name: "Status", width: 100, type: "select", options: ["Active", "Paused", "Prospect", "Archived"] },
      { name: "Instagram", width: 120 },
      { name: "TikTok", width: 120 },
      { name: "LinkedIn", width: 120 },
      { name: "Notes", width: 260 },
    ],
    rows: CLIENTS_ROWS,
    freeze: 1,
  });

  sheets.push({
    id: "brand",
    name: "Brand",
    group: "Setup & Brand",
    description: "Brand strategy reference — voice, audience, pillars, and visual direction for daily content decisions.",
    columns: [
      { name: "Field", width: 200 },
      { name: "Value", width: 500 },
    ],
    rows: BRAND_ROWS,
    freeze: 1,
  });

  sheets.push(makeGoalsSheet());
  sheets.push(makeDashboardSheet());
  sheets.push(makeYearSheet());

  monthNames.forEach((name, i) => {
    sheets.push(monthSheet(i + 6, name, i - 8));
  });

  sheets.push(makeWeeklySheet());
  sheets.push(makeBrainDumpSheet());
  sheets.push(makeContentPlanSheet());
  sheets.push(makeTasksSheet());
  sheets.push(makeThirtyDaySheet());
  sheets.push(makeFeedPreviewSheet());
  sheets.push(makeHashtagsSheet());
  sheets.push(makeCollabsSheet());
  sheets.push(makeFinanceSheet());
  sheets.push(makeClientReportsSheet());
  sheets.push(makeServiceLogSheet());

  return sheets;
}

export function toCSV(sheet: SheetDef): string {
  const esc = (v: string | number) => {
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [
    sheet.columns.map((c) => esc(c.name)).join(","),
    ...sheet.rows.map((r) => r.map((v) => esc(v)).join(",")),
  ].join("\n");
}

export function downloadCSV(sheet: SheetDef) {
  const blob = new Blob([toCSV(sheet)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sheet.name.replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAllSheetsCSV(sheets: SheetDef[]) {
  sheets.forEach((sheet, i) => {
    setTimeout(() => downloadCSV(sheet), i * 250);
  });
}
