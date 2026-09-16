import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  LayoutDashboard,
  Sparkles,
  Table2,
} from "lucide-react";
import { Link } from "react-router";

import logo from "@/assets/logo.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

const FEATURES = [
  {
    icon: Table2,
    title: "28-sheet Manager Workbook",
    body: "Setup, Brand, Goals, Dashboard, a full year of monthly calendars, Content Plan, Tasks, Hashtags, Collabs, Finance, and analytics — every sheet structured with dropdowns, formulas, and status formats.",
  },
  {
    icon: LayoutDashboard,
    title: "Client Portal",
    body: "Dashboard, Strategy, Calendar, Approvals, Files, Performance, Requests, and Meetings. Clients see progress and approve work — without ever seeing your internal complexity.",
  },
  {
    icon: FileCheck2,
    title: "Approval workflow",
    body: "Draft → In Review → Approved → Scheduled → Published, with client comments captured per piece so feedback never gets lost in DMs.",
  },
  {
    icon: BarChart3,
    title: "Analytics that mean something",
    body: "Reach, engagement, and follower trends by platform, plus per-content performance — built to show clients what's actually working.",
  },
  {
    icon: CalendarDays,
    title: "Plan months ahead",
    body: "Annual themes, monthly calendars, weekly execution, and a Brain Dump for ideas — from spark to published post in one system.",
  },
  {
    icon: Sparkles,
    title: "Notion-ready",
    body: "Export the portal as a Notion-compatible package: markdown pages plus CSV databases that mirror the same information architecture.",
  },
];

const WORKFLOW = [
  { step: "01", title: "Onboard", body: "Brand, audience, objectives, and preferences captured once." },
  { step: "02", title: "Plan", body: "Annual themes roll into monthly calendars and weekly execution." },
  { step: "03", title: "Produce", body: "Content Plan, Tasks, and approvals keep production moving." },
  { step: "04", title: "Report", body: "Analytics and KPI progress roll up into client-ready performance views." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <img src={logo} alt="" className="size-8 rounded-lg" />
          <span className="text-base font-semibold tracking-tight">Contentplane</span>
          <nav className="ml-auto hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#system" className="transition-colors hover:text-foreground">The system</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#workflow" className="transition-colors hover:text-foreground">Workflow</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">
                Open the portal <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-paper pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge variant="outline" className="mb-6 gap-1.5 rounded-full bg-card px-3 py-1">
              <span className="size-1.5 rounded-full bg-primary" />
              For freelancers, agencies & content teams
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              The operating system for
              <span className="text-primary"> social media managers</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A 28-sheet manager workbook, a polished client portal, and a Notion-ready package —
              one information architecture connecting planning, production, approvals, analytics,
              and client management.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11 px-6">
                <Link to="/auth">
                  Explore the demo workspace <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-6">
                <Link to="/workbook">
                  <Table2 className="mr-2 size-4" /> Browse the 28-sheet workbook
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Loads with a fully populated fictional client — Northwind Coffee Roasters.
            </p>
          </motion.div>

          {/* Mock stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="card-lift mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/60 sm:grid-cols-4"
          >
            {[
              ["28", "worksheets"],
              ["10", "portal sections"],
              ["6", "platforms tracked"],
              ["100%", "client-ready"],
            ].map(([v, l]) => (
              <div key={l} className="bg-card px-6 py-5">
                <p className="tabular text-2xl font-semibold tracking-tight">{v}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* System */}
      <section id="system" className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              One system, three surfaces
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything shares one information architecture
            </h2>
            <p className="mt-4 text-muted-foreground">
              The workbook, the portal, and the Notion export are three views of the same model —
              change the plan in one place and every surface follows.
            </p>
          </motion.div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Manager Workbook",
                sub: "The engine room",
                body: "Where managers live: annual planning, monthly calendars, content production, tasks, hashtags, collabs, finance, and deep analytics.",
                points: ["Dashboard with live formulas", "12 monthly calendars", "Platform + content analytics"],
              },
              {
                title: "Client Portal",
                sub: "The client window",
                body: "What clients see: strategy, calendar, approvals, deliverables, performance, requests, and meetings — clean, minimal, actionable.",
                points: ["Approval queue with comments", "KPI snapshots", "Request center"],
              },
              {
                title: "Notion Package",
                sub: "The portable copy",
                body: "Markdown pages and CSV databases that import into Notion and mirror the portal, so clients can live where they already work.",
                points: ["9 structured pages", "7 databases with relations", "README setup guide"],
              },
            ].map((c) => (
              <motion.div
                key={c.title}
                {...fadeUp}
                className="card-lift card-lift-hover rounded-xl border border-border/70 bg-card p-6"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-primary">{c.sub}</p>
                <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                <ul className="mt-4 space-y-1.5">
                  {c.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-primary" /> {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div {...fadeUp} className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for the way managers actually work
          </h2>
          <p className="mt-4 text-muted-foreground">
            Not a generic dashboard — a workflow that runs from the first client call to the monthly
            performance report.
          </p>
        </motion.div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                {...fadeUp}
                className="card-lift card-lift-hover rounded-xl border border-border/70 bg-card p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              From spark to report in four steps
            </h2>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((w) => (
              <motion.div key={w.step} {...fadeUp} className="relative">
                <p className="tabular text-4xl font-semibold text-primary/25">{w.step}</p>
                <h3 className="mt-2 text-base font-semibold">{w.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{w.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          {...fadeUp}
          className="card-lift relative overflow-hidden rounded-2xl border border-border/70 bg-card px-6 py-14 text-center sm:px-12"
        >
          <div className="grid-paper pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Open the workspace
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Sign in and the demo client loads instantly — calendar, approvals, analytics, and the
              full 28-sheet workbook. Export a JSON backup or a Notion package any time.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="h-11 px-6">
                <Link to="/auth">
                  Open the demo workspace <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 text-xs text-muted-foreground sm:px-6">
          <img src={logo} alt="" className="size-5 rounded" />
          <span className="font-medium text-foreground">Contentplane</span>
          <span>· Social Media Manager OS</span>
          <span className="ml-auto">Original product — no affiliation with any existing tool.</span>
        </div>
      </footer>
    </div>
  );
}
