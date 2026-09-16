import { cn } from "@/lib/utils";
import {
  FILE_CHIP,
  MEETING_CHIP,
  PLATFORM_META,
  PRIORITY_CHIP,
  REQUEST_CHIP,
  STATUS_CHIP,
  type ChipStyle,
} from "@/data/constants";
import type {
  ContentStatus,
  MeetingStatus,
  Platform,
  Priority,
  RequestStatus,
} from "@/data/types";

type ChipKind =
  | ContentStatus
  | RequestStatus
  | MeetingStatus
  | Priority
  | "Shared"
  | "In progress"
  | "Archived";

function styleFor(kind: ChipKind): ChipStyle {
  if (kind in STATUS_CHIP) return STATUS_CHIP[kind as ContentStatus];
  if (kind in REQUEST_CHIP) return REQUEST_CHIP[kind as RequestStatus];
  if (kind in MEETING_CHIP) return MEETING_CHIP[kind as MeetingStatus];
  if (kind in PRIORITY_CHIP) return PRIORITY_CHIP[kind as Priority];
  return FILE_CHIP[kind as "Shared" | "In progress" | "Archived"];
}

export function StatusChip({
  status,
  className,
}: {
  status: ChipKind;
  className?: string;
}) {
  const s = styleFor(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        s.className,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {status}
    </span>
  );
}

export function PlatformChip({
  platform,
  className,
}: {
  platform: Platform;
  className?: string;
}) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tracking-wide",
        meta.className,
        className,
      )}
    >
      {meta.short}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: React.ReactNode;
}) {
  const positive = delta?.startsWith("+");
  return (
    <div className="card-lift card-lift-hover rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon ? <span className="text-primary/70">{icon}</span> : null}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="tabular text-2xl font-semibold tracking-tight">{value}</p>
        {delta ? (
          <span
            className={cn(
              "text-xs font-medium",
              positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
