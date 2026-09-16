import { useMemo } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Users,
  Boxes,
} from "lucide-react";

import { KpiCard, PlatformChip, StatusChip } from "@/components/portal/Shared";
import { ProgressBar, Sparkline } from "@/components/portal/Charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatDate, todayISO } from "@/data/constants";
import type { PortalState, SectionId } from "@/data/types";
import { exportNotionPackage } from "@/data/notion-export";

export function DashboardSection({
  state,
  navigate,
}: {
  state: PortalState;
  navigate: (id: SectionId) => void;
}) {
  const today = todayISO();

  const stats = useMemo(() => {
    const upcoming = state.content
      .filter((c) => c.date >= today && c.status !== "Published")
      .sort((a, b) => a.date.localeCompare(b.date));
    const pendingApprovals = state.content.filter(
      (c) => c.status === "In Review" || c.status === "Changes Requested",
    );
    const openRequests = state.requests.filter(
      (r) => r.status !== "Completed" && r.status !== "Closed",
    );
    const upcomingMeetings = state.meetings
      .filter((m) => m.status === "Scheduled" && m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    const recentDeliverables = [...state.deliverables]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);

    const last6 = state.metrics.reduce<Map<string, { reach: number; engagement: number }>>(
      (acc, m) => {
        const cur = acc.get(m.month) ?? { reach: 0, engagement: 0 };
        acc.set(m.month, {
          reach: cur.reach + m.reach,
          engagement: cur.engagement + m.engagement,
        });
        return acc;
      },
      new Map(),
    );
    const trend = [...last6.entries()].sort(([a], [b]) => a.localeCompare(b));
    const reachTrend = trend.map(([, v]) => v.reach);
    const lastMonth = trend[trend.length - 1]?.[0];
    const prevMonth = trend[trend.length - 2]?.[0];
    const totalFollowers = state.metrics
      .filter((m) => m.month === lastMonth)
      .reduce((s, m) => s + m.followers, 0);
    const prevFollowers = state.metrics
      .filter((m) => m.month === prevMonth)
      .reduce((s, m) => s + m.followers, 0);
    const followerDelta =
      prevFollowers > 0
        ? Math.round(((totalFollowers - prevFollowers) / prevFollowers) * 1000) / 10
        : 0;

    return {
      upcoming,
      pendingApprovals,
      openRequests,
      upcomingMeetings,
      recentDeliverables,
      reachTrend,
      totalFollowers,
      followerDelta,
      totalReach: trend.length > 0 ? trend[trend.length - 1][1].reach : 0,
      totalEngagement: trend.length > 0 ? trend[trend.length - 1][1].engagement : 0,
    };
  }, [state, today]);

  const monthName = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{monthName} · Client workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back — here's {state.client.name.split(" ")[0]}'s month at a glance
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportNotionPackage(state)}
          title="Download markdown pages + CSV databases for Notion"
        >
          <Boxes className="mr-1.5 size-3.5" /> Notion package
        </Button>
      </header>

      {/* Notifications */}
      {stats.pendingApprovals.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          <FileCheck2 className="size-4 shrink-0 text-amber-600" />
          <span className="text-amber-900 dark:text-amber-100">
            <strong>{stats.pendingApprovals.length} pieces of content</strong> are waiting for
            your review.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-7"
            onClick={() => navigate("approvals")}
          >
            Review now
          </Button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Followers"
          value={formatNumber(stats.totalFollowers)}
          delta={stats.followerDelta >= 0 ? `+${stats.followerDelta}%` : `${stats.followerDelta}%`}
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="Reach (last month)"
          value={formatNumber(stats.totalReach)}
          icon={<Eye className="size-4" />}
        />
        <KpiCard
          label="Pending approvals"
          value={String(stats.pendingApprovals.length)}
          icon={<FileCheck2 className="size-4" />}
        />
        <KpiCard
          label="Open requests"
          value={String(stats.openRequests.length)}
          icon={<Clock className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming content */}
        <section className="card-lift rounded-xl border border-border/70 bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <h2 className="text-sm font-semibold">Upcoming content</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("calendar")}>
              View calendar
            </Button>
          </div>
          <div className="divide-y divide-border/60">
            {stats.upcoming.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-12 shrink-0 text-center">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    {new Date(`${c.date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}
                  </p>
                  <p className="tabular text-lg font-semibold leading-none">
                    {c.date.slice(8, 10)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.format} · {c.pillar}
                  </p>
                </div>
                <PlatformChip platform={c.platform} />
                <StatusChip status={c.status} className="hidden sm:inline-flex" />
              </div>
            ))}
            {stats.upcoming.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No upcoming content scheduled.
              </p>
            )}
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-6">
          {/* Performance snapshot */}
          <section className="card-lift rounded-xl border border-border/70 bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Performance snapshot</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("performance")}>
                Details
              </Button>
            </div>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Reach · last 6 months
            </p>
            <Sparkline values={stats.reachTrend.length >= 2 ? stats.reachTrend : [0, 0]} height={56} />
            <div className="mt-3 space-y-2.5">
              {state.kpis.slice(0, 3).map((k) => {
                const pct = Math.min(
                  100,
                  Math.round((parseNum(k.actual) / Math.max(parseNum(k.target), 1)) * 100),
                );
                return (
                  <div key={k.id}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="truncate text-muted-foreground">{k.name}</span>
                      <span className="tabular font-medium">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} className="mt-1" />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Meetings */}
          <section className="card-lift rounded-xl border border-border/70 bg-card">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <h2 className="text-sm font-semibold">Upcoming meetings</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("meetings")}>
                All
              </Button>
            </div>
            <div className="divide-y divide-border/60">
              {stats.upcomingMeetings.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <CalendarClock className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(m.date)} · {m.time}
                    </p>
                  </div>
                </div>
              ))}
              {stats.upcomingMeetings.length === 0 && (
                <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                  Nothing scheduled.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Requests */}
        <section className="card-lift rounded-xl border border-border/70 bg-card">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <h2 className="text-sm font-semibold">Open requests</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("requests")}>
              All requests
            </Button>
          </div>
          <div className="divide-y divide-border/60">
            {stats.openRequests.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDate(r.dueDate)} · {r.assignedTo}
                  </p>
                </div>
                <StatusChip status={r.priority} />
              </div>
            ))}
            {stats.openRequests.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                No open requests.
              </p>
            )}
          </div>
        </section>

        {/* Recent deliverables */}
        <section className="card-lift rounded-xl border border-border/70 bg-card">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <h2 className="text-sm font-semibold">Recent deliverables</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("files")}>
              Files
            </Button>
          </div>
          <div className="divide-y divide-border/60">
            {stats.recentDeliverables.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(d.date)} · {d.size}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {d.category}
                </Badge>
              </div>
            ))}
            {stats.recentDeliverables.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                No deliverables yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function parseNum(s: string): number {
  return Number(s.replace(/[^0-9.]/g, "")) || 0;
}
