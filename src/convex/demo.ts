// Fictional demo workspace for Contentplane.
//
// Three clients of a fictional independent social media manager, with content,
// tasks, requests, meetings, deliverables and finances spread around "today" so
// the calendar, dashboard and money views are populated immediately.

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = (ctx: any) => ctx.db as any;

const OWNED_TABLES = [
  "clients",
  "content",
  "tasks",
  "requests",
  "meetings",
  "deliverables",
  "finance",
] as const;

function iso(offsetDays: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function monthDay(monthOffset: number, day: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + monthOffset, Math.min(day, 28));
  return d.toISOString().slice(0, 10);
}

function statusForOffset(offset: number): string {
  if (offset <= -3) return "Published";
  if (offset <= 1) return "Scheduled";
  if (offset <= 6) return "In Review";
  if (offset <= 12) return "Drafting";
  return "Idea";
}

interface ClientSeed {
  slug: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  packageName: string;
  monthlyFee: number;
  startDate: string;
  status: string;
  socials: Record<string, string>;
  notes: string;
  audience: string;
  objectives: string;
  pillars: string[];
  topics: string[];
  platforms: string[];
  formats: string[];
  owner: string;
}

const CLIENTS: ClientSeed[] = [
  {
    slug: "northwind",
    name: "Northwind Coffee Roasters",
    contactName: "Maya Okafor",
    email: "maya@northwindcoffee.example",
    phone: "+1 (503) 555-0142",
    website: "northwindcoffee.example",
    industry: "Specialty coffee roastery",
    packageName: "Retainer — 12 posts/month",
    monthlyFee: 4800,
    startDate: iso(-240),
    status: "Active",
    socials: {
      instagram: "@northwindcoffee",
      tiktok: "@northwindroasts",
      pinterest: "northwindcoffee",
    },
    notes:
      "Prefers edits in batches. Never posts pricing. Photos must use the natural light set shot in week 12.",
    audience: "Home brewers 25–40 who already own a pour-over setup.",
    objectives: "Grow local wholesale interest and lift web orders 15% this quarter.",
    pillars: ["Education", "Behind the scenes", "Product", "Community"],
    topics: [
      "Cold brew vs iced latte",
      "How we choose a new origin",
      "Barista reacts to viral hacks",
      "Guatemala single-origin drop",
      "5 brewing mistakes to avoid",
      "Roastery walkthrough: green room",
      "Fall menu preview",
      "Subscription unboxing",
      "What 'specialty' actually means",
      "Meet the roaster: Dani",
    ],
    platforms: ["Instagram", "TikTok", "Pinterest", "YouTube"],
    formats: ["Reel", "Carousel", "Single post", "Story", "Pin"],
    owner: "Priya Raman",
  },
  {
    slug: "hale-harbor",
    name: "Hale & Harbor Interiors",
    contactName: "Dana Whitfield",
    email: "dana@haleharbor.example",
    phone: "+1 (617) 555-0198",
    website: "haleharbor.example",
    industry: "Residential interior design studio",
    packageName: "Retainer — 8 posts/month",
    monthlyFee: 3200,
    startDate: iso(-120),
    status: "Active",
    socials: { instagram: "@haleandharbor", pinterest: "haleandharbor", linkedin: "hale-harbor" },
    notes: "Always tag the photographer. Approvals come from Dana only — the studio manager is CC'd.",
    audience: "Homeowners renovating a first house, plus local real-estate agents.",
    objectives: "Fill the spring project calendar and grow Pinterest saves.",
    pillars: ["Education", "Product", "Community", "Promotion"],
    topics: [
      "Small living room, big storage",
      "Warm minimalism explained",
      "Before and after: Beacon Hill",
      "5 lighting rules we always follow",
      "Rug sizing cheat sheet",
      "Behind the site visit",
      "Client reveal day",
      "How to brief a designer",
    ],
    platforms: ["Instagram", "Pinterest", "LinkedIn"],
    formats: ["Carousel", "Single post", "Pin", "Reel"],
    owner: "Jonas Feld",
  },
  {
    slug: "bloomly",
    name: "Bloomly Skincare",
    contactName: "Renata Silva",
    email: "renata@bloomly.example",
    phone: "+1 (512) 555-0177",
    website: "bloomly.example",
    industry: "Direct-to-consumer skincare",
    packageName: "Retainer — 16 posts/month + ads",
    monthlyFee: 6500,
    startDate: iso(-75),
    status: "Active",
    socials: { instagram: "@bloomlyskin", tiktok: "@bloomly", youtube: "@bloomlyskin" },
    notes: "Claims must match the approved copy deck. Legal review adds two working days for product posts.",
    audience: "Sensitive-skin shoppers aged 18–34 who buy online.",
    objectives: "Launch the barrier cream and keep CPM under control in Q4.",
    pillars: ["Education", "Product", "Behind the scenes", "Promotion"],
    topics: [
      "Barrier cream launch teaser",
      "Niacinamide without the sting",
      "Founder answers DMs",
      "Packing orders with the team",
      "Ingredient spotlight: squalane",
      "3-step routine for winter",
      "Customer results roundup",
      "Behind the lab visit",
    ],
    platforms: ["Instagram", "TikTok", "YouTube"],
    formats: ["Reel", "Short", "Carousel", "Story", "Video"],
    owner: "Alex Moreno",
  },
  {
    slug: "vela",
    name: "Vela Fitness Studio",
    contactName: "Tom Beck",
    email: "tom@velafitness.example",
    phone: "+1 (305) 555-0110",
    website: "velafitness.example",
    industry: "Boutique fitness studio",
    packageName: "Proposal — 8 posts/month",
    monthlyFee: 2200,
    startDate: iso(0),
    status: "Prospect",
    socials: { instagram: "@velafitness" },
    notes: "Waiting on the signed proposal. They want to start with a 30-day relaunch sprint.",
    audience: "New members within a 5 km radius of the studio.",
    objectives: "Relaunch the account and fill morning classes.",
    pillars: ["Education", "Community", "Promotion"],
    topics: [
      "30-day relaunch plan",
      "Meet the coaches",
      "Member of the month",
      "Class timetable walkthrough",
    ],
    platforms: ["Instagram", "TikTok"],
    formats: ["Reel", "Carousel", "Story"],
    owner: "Alex Moreno",
  },
];

const TASK_SEEDS: [string, string, string, string, string, number, number][] = [
  ["Finalize monthly content brief", "Monthly planning", "Strategy", "High", "In Progress", -2, 3],
  ["Shoot batch: 10 assets", "Production", "Production", "High", "Backlog", 1, 6],
  ["Schedule next week's posts", "Publishing", "Publishing", "Medium", "Backlog", 0, 2],
  ["Monthly performance report", "Reporting", "Reporting", "Medium", "Backlog", 2, 6],
  ["Collect pending client assets", "Client admin", "Admin", "Medium", "Blocked", -3, 1],
  ["Refresh link-in-bio page", "Website sync", "Content", "Low", "Done", -8, -4],
];

const REQUEST_SEEDS: [string, string, string, string, string, number][] = [
  ["Add a second Reel this week", "Content", "High", "In Progress", "Priya Raman", 2],
  ["New product photography needed", "Design", "Medium", "Waiting", "Jonas Feld", 5],
  ["Pull engagement numbers for the board pack", "Report", "Medium", "New", "Alex Moreno", 4],
  ["Update the shared drive folder", "Access", "Low", "Completed", "Alex Moreno", -3],
  ["Budget increase for boosted posts", "Budget", "High", "New", "Alex Moreno", 7],
];

const FINANCE_SEEDS: [string, string, number, number, string, string][] = [
  ["Monthly retainer", "Retainer", 4800, 0, "Income", "Northwind Coffee Roasters"],
  ["Monthly retainer", "Retainer", 3200, -1, "Income", "Hale & Harbor Interiors"],
  ["Ads management fee", "Project fee", 1200, -1, "Income", "Bloomly Skincare"],
  ["Sponsored Short — deposit", "Collab", 450, -2, "Income", "Northwind Coffee Roasters"],
  ["Boosted post budget", "Ads", 600, -1, "Expense", "Bloomly Skincare"],
  ["Editing suite subscription", "Software", 89, -1, "Expense", ""],
  ["Freelance videographer", "Contractor", 1200, -2, "Expense", "Northwind Coffee Roasters"],
  ["Ring light + backdrop", "Equipment", 340, -3, "Expense", ""],
  ["Scheduling tool (annual)", "Software", 288, -1, "Expense", ""],
];

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error("Not authenticated");
    const store = db(ctx);

    for (const table of OWNED_TABLES) {
      const rows = (await store
        .query(table)
        .withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId))
        .collect()) as any[];
      for (const row of rows) await ctx.db.delete(row._id);
    }

    const clientIds: Record<string, Id<"clients">> = {};

    for (const c of CLIENTS) {
      const id = await store.insert("clients", {
        ownerId,
        name: c.name,
        contactName: c.contactName,
        email: c.email,
        phone: c.phone,
        website: c.website,
        industry: c.industry,
        packageName: c.packageName,
        monthlyFee: c.monthlyFee,
        startDate: c.startDate,
        status: c.status,
        socials: c.socials,
        notes: c.notes,
        onboarding: {
          company: `${c.industry}. Contact: ${c.contactName}.`,
          contact: `${c.email} · ${c.phone}`,
          brand: `Voice: warm, expert, never salesy. Pillars: ${c.pillars.join(", ")}.`,
          socialAccounts: Object.entries(c.socials)
            .map(([k, val]) => `${k}: ${val}`)
            .join(" · "),
          audience: c.audience,
          objectives: c.objectives,
          competitors: "Tracked in the strategy notes.",
          contentPreferences: `Prefers ${c.formats.slice(0, 2).join(" and ")}.`,
          approvalPreferences: "Approvals by email, 2 working days ahead of scheduling.",
          importantDates: "Launch windows and product drops recorded in the content calendar.",
          brandAssets: "Shared drive: brand, fonts, photography.",
          notes: c.notes,
        },
        strategy: [
          {
            key: "business",
            title: "Business objective",
            items: [c.objectives],
          },
          {
            key: "social",
            title: "Social media objectives",
            items: [
              "Publish consistently on the agreed cadence",
              "Reply to every comment within 24 hours",
              "Turn top-performing posts into repeatable formats",
            ],
          },
          { key: "audience", title: "Target audience", items: [c.audience] },
          { key: "pillars", title: "Content pillars", items: c.pillars },
          {
            key: "voice",
            title: "Brand voice",
            items: ["Confident but friendly", "Short sentences", "No jargon"],
          },
          {
            key: "kpis",
            title: "KPIs",
            items: ["Posts published per month", "Approval turnaround (days)", "Saves per post"],
          },
        ],
        kpis: [
          {
            name: "Posts published / month",
            baseline: "6",
            target: "12",
            actual: "9",
            unit: "posts",
            deadline: monthDay(1, 28),
          },
          {
            name: "Approval turnaround",
            baseline: "5",
            target: "2",
            actual: "3",
            unit: "days",
            deadline: monthDay(1, 28),
          },
        ],
        createdAt: Date.now(),
      });
      clientIds[c.slug] = id;

      // Content across the current month: past items published, future planned.
      const offsets = [-19, -16, -13, -10, -7, -5, -2, 0, 2, 4, 7, 11, 15, 19];
      for (let i = 0; i < offsets.length; i++) {
        const offset = offsets[i];
        const topic = c.topics[i % c.topics.length];
        const status = statusForOffset(offset);
        const platform = c.platforms[i % c.platforms.length];
        const format = c.formats[i % c.formats.length];
        await store.insert("content", {
          ownerId,
          clientId: id,
          date: iso(offset),
          platform,
          format,
          topic,
          caption:
            status === "Published"
              ? `${topic} — posted and performing as expected.`
              : `Draft caption for "${topic}".`,
          assetNote: format === "Reel" || format === "Video" || format === "Short" ? "Video edit + captions" : "Static graphic",
          status,
          managerNotes:
            status === "Changes Requested"
              ? "Client asked for a softer opening line."
              : status === "In Review"
                ? "With client for approval."
                : "",
          clientComments: status === "Published" ? "" : status === "In Review" ? "Looks good overall — one tweak on the hook." : "",
          pillar: c.pillars[i % c.pillars.length],
          owner: c.owner,
        });
      }

      // Tasks, staggered so the dashboard always has overdue / due-soon work.
      const taskOffsets = [0, 1, 3, 4, 6, 7];
      for (let i = 0; i < TASK_SEEDS.length; i++) {
        const [title, project, category, priority, status, startOffset, dueOffset] = TASK_SEEDS[i];
        const shift = taskOffsets[(i + c.slug.length) % taskOffsets.length];
        await store.insert("tasks", {
          ownerId,
          clientId: id,
          title,
          project,
          category,
          priority,
          status,
          startDate: iso(startOffset + shift - 4),
          dueDate: iso(dueOffset + shift - 4),
          completedAt: status === "Done" ? iso(-2) : "",
          dependsOn: "",
          notes: c.status === "Prospect" ? "Only start once the proposal is signed." : "",
        });
      }

      // A couple of client requests each.
      for (let i = 0; i < 2; i++) {
        const [title, category, priority, status, assignedTo, dueOffset] = REQUEST_SEEDS[(i + c.slug.length) % REQUEST_SEEDS.length];
        await store.insert("requests", {
          ownerId,
          clientId: id,
          title,
          category,
          priority,
          dateSubmitted: iso(-4 + i),
          status,
          assignedTo,
          dueDate: iso(dueOffset),
          comments: status === "Waiting" ? "Needs input from the client." : "",
        });
      }

      // One upcoming call and one past call with notes.
      await store.insert("meetings", {
        ownerId,
        clientId: id,
        title: "Monthly planning call",
        date: iso(3 + c.slug.length),
        time: "10:00",
        agenda: "Review last month's content, confirm the next campaign, collect assets.",
        participants: `${c.contactName}, Alex Moreno`,
        status: "Scheduled",
        notes: "",
        actionItems: "",
      });
      await store.insert("meetings", {
        ownerId,
        clientId: id,
        title: "Content review",
        date: iso(-9),
        time: "15:30",
        agenda: "Walk through the calendar and approvals backlog.",
        participants: `${c.contactName}, Alex Moreno`,
        status: "Completed",
        notes: "Client wants more behind-the-scenes footage and fewer product posts.",
        actionItems: "Draft 2 BTS concepts before the next batch shoot.",
      });

      // Deliverables.
      const files: [string, string, string][] = [
        ["Brand guidelines v2.pdf", "Brand assets", "Shared"],
        ["Monthly content plan.pdf", "Documents", "Shared"],
        ["Batch 12 graphics.zip", "Graphics", "In progress"],
      ];
      for (let i = 0; i < files.length; i++) {
        const [name, category, status] = files[i];
        await store.insert("deliverables", {
          ownerId,
          clientId: id,
          name,
          category,
          description: `${name.replace(/\.[a-z]+$/, "")} for ${c.name}.`,
          date: iso(-12 + i * 3),
          status,
          relatedContent: "",
          relatedProject: "Monthly retainer",
        });
      }

      // Monthly retainer for the last three months; newest is still pending.
      for (let m = 2; m >= 0; m--) {
        if (c.status !== "Active") continue;
        await store.insert("finance", {
          ownerId,
          clientId: id,
          date: monthDay(-m, 5),
          type: "Income",
          amount: c.monthlyFee,
          category: "Retainer",
          description: `Retainer — ${c.name}`,
          status: m === 0 ? "Pending" : "Paid",
          dueDate: monthDay(-m, 12),
          paidDate: m === 0 ? "" : monthDay(-m, 10),
        });
      }
    }

    // One-off income and running expenses, independent of any single client.
    for (const [description, category, amount, monthOffset, type, clientName] of FINANCE_SEEDS) {
      const slug = CLIENTS.find((c) => c.name === clientName)?.slug;
      await store.insert("finance", {
        ownerId,
        clientId: slug ? clientIds[slug] : undefined,
        date: monthDay(monthOffset, 18),
        type,
        amount,
        category,
        description,
        status: monthOffset <= -2 ? "Paid" : "Pending",
        dueDate: monthDay(monthOffset, 22),
        paidDate: monthOffset <= -2 ? monthDay(monthOffset, 20) : "",
      });
    }

    const existingWorkspace = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .unique();
    const workspace = {
      ownerId,
      managerName: "Alex Moreno",
      agency: "Marrow Social",
      email: "alex@marrowsocial.example",
      currency: "$",
      weekStart: "Monday",
      approvalTurnaroundDays: 3,
      notifyEmail: true,
      notifyApprovals: true,
      notifyFinance: true,
      density: "comfortable",
    };
    if (existingWorkspace) await ctx.db.replace(existingWorkspace._id, workspace);
    else await store.insert("workspaces", workspace);

    return { clients: CLIENTS.length };
  },
});
