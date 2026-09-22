// Shared data model for the Contentplane manager workspace.
//
// This is a single-seat product: the social media manager signs in and manages
// several clients. Every record belongs to a client and is stored per account
// in Convex, so the shape here mirrors the Convex documents (id mapped from
// _id, dates kept as ISO strings for easy export).

export type Id = string;

export type Platform =
  | "Instagram"
  | "TikTok"
  | "LinkedIn"
  | "YouTube"
  | "Facebook"
  | "Pinterest";

export type ClientStatus = "Active" | "Paused" | "Prospect" | "Archived";

export type ContentStatus =
  | "Idea"
  | "Drafting"
  | "In Review"
  | "Changes Requested"
  | "Approved"
  | "Scheduled"
  | "Published";

export type RequestStatus =
  | "New"
  | "In Progress"
  | "Waiting"
  | "Completed"
  | "Closed";

export type Priority = "Low" | "Medium" | "High";

export type MeetingStatus = "Scheduled" | "Completed" | "Cancelled";

export type FileStatus = "Shared" | "In progress" | "Archived";

export type FileCategory =
  | "Brand assets"
  | "Graphics"
  | "Videos"
  | "Reports"
  | "Documents"
  | "Final deliverables";

export type TaskStatus = "Backlog" | "In Progress" | "Blocked" | "Done";

export type FinanceType = "Income" | "Expense";

export type FinanceStatus = "Paid" | "Pending" | "Overdue";

export type OnboardingStep =
  | "Company"
  | "Contact"
  | "Brand"
  | "Social accounts"
  | "Audience"
  | "Objectives"
  | "Competitors"
  | "Content preferences"
  | "Approval preferences"
  | "Important dates"
  | "Brand assets"
  | "Notes";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "Company",
  "Contact",
  "Brand",
  "Social accounts",
  "Audience",
  "Objectives",
  "Competitors",
  "Content preferences",
  "Approval preferences",
  "Important dates",
  "Brand assets",
  "Notes",
];

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  youtube?: string;
  facebook?: string;
  pinterest?: string;
  other?: string;
}

export interface StrategySection {
  key: string;
  title: string;
  items: string[];
}

export interface KpiItem {
  name: string;
  baseline: string;
  target: string;
  actual: string;
  unit: string;
  deadline: string;
}

export interface ClientRecord {
  id: Id;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  packageName: string;
  monthlyFee: number;
  startDate: string;
  status: ClientStatus;
  socials: SocialLinks;
  notes: string;
  onboarding: Partial<Record<OnboardingStep, string>>;
  strategy: StrategySection[];
  kpis: KpiItem[];
  createdAt: number;
}

export interface ContentItem {
  id: Id;
  clientId: Id;
  date: string;
  platform: Platform;
  format: string;
  topic: string;
  caption: string;
  assetNote: string;
  status: ContentStatus;
  managerNotes: string;
  clientComments: string;
  pillar: string;
  owner: string;
}

export interface TaskItem {
  id: Id;
  clientId: Id;
  title: string;
  project: string;
  category: string;
  priority: Priority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  completedAt: string;
  dependsOn: string;
  notes: string;
}

export interface RequestItem {
  id: Id;
  clientId: Id;
  title: string;
  category: string;
  priority: Priority;
  dateSubmitted: string;
  status: RequestStatus;
  assignedTo: string;
  dueDate: string;
  comments: string;
}

export interface MeetingItem {
  id: Id;
  clientId: Id;
  title: string;
  date: string;
  time: string;
  agenda: string;
  participants: string;
  status: MeetingStatus;
  notes: string;
  actionItems: string;
}

export interface DeliverableItem {
  id: Id;
  clientId: Id;
  name: string;
  category: FileCategory;
  description: string;
  date: string;
  status: FileStatus;
  relatedContent: string;
  relatedProject: string;
}

export interface FinanceEntry {
  id: Id;
  /** Empty string when the entry is not tied to a specific client. */
  clientId: Id | "";
  date: string;
  type: FinanceType;
  amount: number;
  category: string;
  description: string;
  status: FinanceStatus;
  dueDate: string;
  paidDate: string;
  /** "invoice" for entries generated from a client's recurring monthly fee. */
  kind?: "invoice";
}

export interface WorkspaceProfile {
  managerName: string;
  agency: string;
  email: string;
  currency: string;
  weekStart: "Monday" | "Sunday";
  approvalTurnaroundDays: number;
  notifyEmail: boolean;
  notifyApprovals: boolean;
  notifyFinance: boolean;
  density: "comfortable" | "compact";
}

export type SectionId =
  | "dashboard"
  | "clients"
  | "calendar"
  | "tasks"
  | "approvals"
  | "finance"
  | "requests"
  | "meetings"
  | "files"
  | "strategy"
  | "onboarding"
  | "settings";

export const SECTIONS = [
  "dashboard",
  "clients",
  "calendar",
  "tasks",
  "approvals",
  "finance",
  "requests",
  "meetings",
  "files",
  "strategy",
  "onboarding",
  "settings",
] as const satisfies readonly SectionId[];

export const WORKFLOW_STATUSES: ContentStatus[] = [
  "Idea",
  "Drafting",
  "In Review",
  "Changes Requested",
  "Approved",
  "Scheduled",
  "Published",
];

export const REQUEST_STATUSES: RequestStatus[] = [
  "New",
  "In Progress",
  "Waiting",
  "Completed",
  "Closed",
];

export const TASK_STATUSES: TaskStatus[] = ["Backlog", "In Progress", "Blocked", "Done"];

export const CLIENT_STATUSES: ClientStatus[] = ["Active", "Paused", "Prospect", "Archived"];

export const FINANCE_CATEGORIES = [
  "Retainer",
  "Project fee",
  "Collab",
  "Production",
  "Software",
  "Equipment",
  "Contractor",
  "Ads",
  "Other",
];

export const TASK_CATEGORIES = [
  "Content",
  "Design",
  "Production",
  "Publishing",
  "Strategy",
  "Reporting",
  "Admin",
];

export const PLATFORMS: Platform[] = [
  "Instagram",
  "TikTok",
  "LinkedIn",
  "YouTube",
  "Facebook",
  "Pinterest",
];

export const PILLARS = [
  "Education",
  "Behind the scenes",
  "Product",
  "Community",
  "Promotion",
];
