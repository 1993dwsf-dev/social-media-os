import { useMemo, useState } from "react";

import { PlatformChip, KpiCard, EmptyState } from "@/components/portal/Shared";
import { BarChart, DonutChart, Sparkline, ProgressBar } from "@/components/portal/Charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber, PLATFORM_META } from "@/data/constants";
import type { PortalState } from "@/data/types";
import { PLATFORMS } from "@/data/types";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(iso: string): string {
  const m = Number(iso.slice(5, 7)) - 1;
  return MONTH_NAMES[m] ?? iso;
}

export function PerformanceSection({ state }: { state: PortalState }) {
  const [platformFilter, setPlatformFilter] = useState("all");

  const data = useMemo(() => {
    const months = [...new Set(state.metrics.map((m) => m.month))].sort();
    const byMonth = months.map((month) => {
      const rows = state.metrics
        .filter((m) => m.month === month)
        .filter((m) => platformFilter === "all" || m.platform === platformFilter);
      return {
        month,
        label: monthLabel(month),
        reach: rows.reduce((s, m) => s + m.reach, 0),
        engagement: rows.reduce((s, m) => s + m.engagement, 0),
        followers: rows.reduce((s, m) => s + m.followers, 0),
        clicks: rows.reduce((s, m) => s + m.clicks, 0),
      };
    });

    const latest = byMonth[byMonth.length - 1] ?? { reach: 0, engagement: 0, followers: 0, clicks: 0, label: "", month: "" };
    const prev = byMonth[byMonth.length - 2];
    const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 1000) / 10 : 0);

    const platformRows = PLATFORMS.map((p) => {
      const rows = state.metrics.filter((m) => m.platform === p);
      const latestRow = rows[rows.length - 1];
      return {
        platform: p,
        followers: latestRow?.followers ?? 0,
        reach: latestRow?.reach ?? 0,
        engagement: latestRow?.engagement ?? 0,
        er: latestRow && latestRow.reach > 0 ? Math.round((latestRow.engagement / latestRow.reach) * 1000) / 10 : 0,
      };
    }).filter((r) => r.followers > 0 || r.reach > 0);

    return {
      byMonth,
      latest,
      reachDelta: prev ? pct(latest.reach, prev.reach) : 0,
      engagementDelta: prev ? pct(latest.engagement, prev.engagement) : 0,
      followersDelta: prev ? pct(latest.followers, prev.followers) : 0,
      platformRows,
    };
  }, [state.metrics, platformFilter]);

  const topContent = useMemo(() => {
    // Derive top content signals from content items that are published,
    // falling back to manager-side notes when metrics aren't wired in.
    const published = state.content
      .filter((c) => c.status === "Published")
      .slice(0, 6);
    return published;
  }, [state.content]);

  const followerSplit = data.platformRows.map((r) => ({
    label: r.platform,
    value: r.followers,
    color: PLATFORM_META[r.platform].chartColor,
  }));

  const engagementSeries = data.byMonth.map((m) => m.engagement);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The numbers that matter — engagement, growth, and what's working.
          </p>
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {state.metrics.length === 0 ? (
        <EmptyState
          title="No performance data yet"
          hint="Load the demo data from Settings to explore the analytics views."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label={`Reach · ${data.latest.label}`}
              value={formatNumber(data.latest.reach)}
              delta={data.reachDelta >= 0 ? `+${data.reachDelta}%` : `${data.reachDelta}%`}
            />
            <KpiCard
              label="Engagement"
              value={formatNumber(data.latest.engagement)}
              delta={
                data.engagementDelta >= 0 ? `+${data.engagementDelta}%` : `${data.engagementDelta}%`
              }
            />
            <KpiCard
              label="Followers"
              value={formatNumber(data.latest.followers)}
              delta={
                data.followersDelta >= 0 ? `+${data.followersDelta}%` : `${data.followersDelta}%`
              }
            />
            <KpiCard label="Link clicks" value={formatNumber(data.latest.clicks)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <section className="card-lift rounded-xl border border-border/70 bg-card p-5 lg:col-span-3">
              <h2 className="text-sm font-semibold">Reach by month</h2>
              <p className="text-xs text-muted-foreground">
                {platformFilter === "all" ? "All platforms" : platformFilter} · last{" "}
                {data.byMonth.length} months
              </p>
              <div className="mt-4">
                <BarChart
                  data={data.byMonth.map((m) => ({
                    label: m.label,
                    value: m.reach,
                    color: "oklch(0.556 0.096 212.3)",
                  }))}
                  formatValue={(v) => `${formatNumber(v)} reach`}
                />
              </div>
            </section>

            <section className="card-lift rounded-xl border border-border/70 bg-card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold">Audience by platform</h2>
              <p className="text-xs text-muted-foreground">Share of total followers</p>
              <div className="mt-4">
                <DonutChart
                  segments={followerSplit}
                  centerValue={formatNumber(data.latest.followers)}
                  centerLabel="followers"
                />
              </div>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <section className="card-lift rounded-xl border border-border/70 bg-card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold">Engagement trend</h2>
              <p className="text-xs text-muted-foreground">Interactions per month</p>
              <div className="mt-2">
                <Sparkline values={engagementSeries.length >= 2 ? engagementSeries : [0, 0]} height={72} />
              </div>
            </section>

            <section className="card-lift overflow-hidden rounded-xl border border-border/70 bg-card lg:col-span-3">
              <div className="border-b border-border/70 px-5 py-4">
                <h2 className="text-sm font-semibold">Platform comparison</h2>
                <p className="text-xs text-muted-foreground">Latest month snapshot</p>
              </div>
              <div className="divide-y divide-border/60">
                {data.platformRows.map((r) => (
                  <div key={r.platform} className="flex items-center gap-3 px-5 py-3">
                    <PlatformChip platform={r.platform} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-medium">{r.platform}</span>
                        <span className="tabular text-muted-foreground">
                          {formatNumber(r.followers)} followers · ER {r.er}%
                        </span>
                      </div>
                      <ProgressBar
                        value={Math.min(100, (r.engagement / Math.max(...data.platformRows.map((x) => x.engagement), 1)) * 100)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="card-lift rounded-xl border border-border/70 bg-card">
            <div className="border-b border-border/70 px-5 py-4">
              <h2 className="text-sm font-semibold">Recent highlights</h2>
              <p className="text-xs text-muted-foreground">
                Published pieces your audience responded to
              </p>
            </div>
            <div className="divide-y divide-border/60">
              {topContent.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <PlatformChip platform={c.platform} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.topic}</p>
                    <p className="text-xs text-muted-foreground">{c.format}</p>
                  </div>
                  {c.clientComments ? (
                    <p className="hidden max-w-[220px] truncate text-xs text-muted-foreground sm:block">
                      “{c.clientComments}”
                    </p>
                  ) : null}
                </div>
              ))}
              {topContent.length === 0 && (
                <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                  No published content yet.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
