import type {
  ContentStatus,
  FileCategory,
  MeetingStatus,
  Platform,
  Priority,
  RequestStatus,
} from "./types";

// Fonte única de estilos para cada chip de status/prioridade/plataforma do portal.
export interface ChipStyle {
  className: string;
  dot: string;
}

export const STATUS_CHIP: Record<ContentStatus, ChipStyle> = {
  Idea: { className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
  Drafting: { className: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-900", dot: "bg-sky-500" },
  "In Review": { className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900", dot: "bg-amber-500" },
  "Changes Requested": { className: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900", dot: "bg-rose-500" },
  Approved: { className: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900", dot: "bg-emerald-500" },
  Scheduled: { className: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-900", dot: "bg-indigo-500" },
  Published: { className: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-900", dot: "bg-teal-600" },
};

export const REQUEST_CHIP: Record<RequestStatus, ChipStyle> = {
  New: { className: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-900", dot: "bg-sky-500" },
  "In Progress": { className: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-900", dot: "bg-indigo-500" },
  Waiting: { className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900", dot: "bg-amber-500" },
  Completed: { className: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-900", dot: "bg-teal-600" },
  Closed: { className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
};

export const MEETING_CHIP: Record<MeetingStatus, ChipStyle> = {
  Scheduled: { className: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-900", dot: "bg-sky-500" },
  Completed: { className: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-900", dot: "bg-teal-600" },
  Cancelled: { className: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900", dot: "bg-rose-500" },
};

export const PRIORITY_CHIP: Record<Priority, ChipStyle> = {
  Low: { className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
  Medium: { className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900", dot: "bg-amber-500" },
  High: { className: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900", dot: "bg-rose-500" },
};

export const FILE_CHIP: Record<DeliverableItemStatus, ChipStyle> = {
  Shared: { className: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-900", dot: "bg-teal-600" },
  "In progress": { className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900", dot: "bg-amber-500" },
  Archived: { className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
};

type DeliverableItemStatus = "Shared" | "In progress" | "Archived";

export const TASK_CHIP: Record<string, ChipStyle> = {
  Backlog: { className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
  "In Progress": { className: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-900", dot: "bg-indigo-500" },
  Blocked: { className: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900", dot: "bg-rose-500" },
  Done: { className: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-900", dot: "bg-teal-600" },
};

export const FINANCE_CHIP: Record<string, ChipStyle> = {
  Paid: { className: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-900", dot: "bg-teal-600" },
  Pending: { className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900", dot: "bg-amber-500" },
  Overdue: { className: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900", dot: "bg-rose-500" },
};

export const CLIENT_CHIP: Record<string, ChipStyle> = {
  Active: { className: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-900", dot: "bg-teal-600" },
  Paused: { className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900", dot: "bg-amber-500" },
  Prospect: { className: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-900", dot: "bg-sky-500" },
  Archived: { className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
};

export const PLATFORM_META: Record<
  Platform,
  { short: string; className: string; chartColor: string }
> = {
  Instagram: { short: "IG", className: "bg-gradient-to-tr from-fuchsia-600 to-amber-500 text-white border-transparent", chartColor: "#C026D3" },
  TikTok: { short: "TT", className: "bg-neutral-900 text-white border-transparent dark:bg-neutral-100 dark:text-neutral-900", chartColor: "#0F172A" },
  LinkedIn: { short: "LI", className: "bg-sky-700 text-white border-transparent", chartColor: "#0369A1" },
  YouTube: { short: "YT", className: "bg-red-600 text-white border-transparent", chartColor: "#DC2626" },
  Facebook: { short: "FB", className: "bg-blue-600 text-white border-transparent", chartColor: "#2563EB" },
  Pinterest: { short: "PN", className: "bg-rose-700 text-white border-transparent", chartColor: "#BE123C" },
};

export const CONTENT_FORMATS = [
  "Reel",
  "Carousel",
  "Single post",
  "Story",
  "Short",
  "Video",
  "Pin",
  "Article",
  "Live",
] as const;

export const REQUEST_CATEGORIES = [
  "Content",
  "Design",
  "Strategy",
  "Report",
  "Access",
  "Budget",
  "Other",
] as const;

export const FILE_CATEGORIES: FileCategory[] = [
  "Brand assets",
  "Graphics",
  "Videos",
  "Reports",
  "Documents",
  "Final deliverables",
];

export const CURRENCY = "R$";

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatMoney(n: number): string {
  return `${CURRENCY}${n.toLocaleString("pt-BR")}`;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
