// Shared data model for the Contentplane client portal.
// All records use ISO date strings ("2026-09-08") and plain JSON values so the
// same shape can be exported to JSON / Notion CSV without transformation.

export type Platform =
  | "Instagram"
  | "TikTok"
  | "LinkedIn"
  | "YouTube"
  | "Facebook"
  | "Pinterest";

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

export type FileCategory =
  | "Brand assets"
  | "Graphics"
  | "Videos"
  | "Reports"
  | "Documents"
  | "Final deliverables";

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

export interface ClientProfile {
  name: string;
  tagline: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  timezone: string;
  socials: Partial<Record<Platform, string>> & { other?: string };
  notes: string;
}

export interface ManagerProfile {
  name: string;
  agency: string;
  email: string;
  timezone: string;
}

export interface ContentItem {
  id: string;
  date: string; // ISO yyyy-mm-dd
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

export interface RequestItem {
  id: string;
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
  id: string;
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
  id: string;
  name: string;
  category: FileCategory;
  description: string;
  date: string;
  status: "Shared" | "In progress" | "Archived";
  relatedContent: string;
  relatedProject: string;
  size: string;
}

export interface MetricsRecord {
  id: string;
  month: string; // ISO yyyy-mm
  platform: Platform;
  followers: number;
  reach: number;
  engagement: number;
  clicks: number;
}

export interface StrategySection {
  key: string;
  title: string;
  items: string[];
}

export interface KpiItem {
  id: string;
  name: string;
  baseline: string;
  target: string;
  actual: string;
  unit: string;
  deadline: string;
}

export interface PortalSettings {
  theme: "light" | "dark";
  density: "comfortable" | "compact";
  notifyEmail: boolean;
  notifyApprovals: boolean;
  notifyReports: boolean;
}

export interface PortalState {
  version: number;
  client: ClientProfile;
  manager: ManagerProfile;
  content: ContentItem[];
  requests: RequestItem[];
  meetings: MeetingItem[];
  deliverables: DeliverableItem[];
  metrics: MetricsRecord[];
  onboarding: Record<OnboardingStep, string>;
  strategy: StrategySection[];
  kpis: KpiItem[];
  settings: PortalSettings;
  onboardedAt: string | null;
}

export type SectionId =
  | "dashboard"
  | "onboarding"
  | "strategy"
  | "calendar"
  | "approvals"
  | "files"
  | "performance"
  | "requests"
  | "meetings"
  | "settings";

export const SECTIONS = [
  "dashboard",
  "onboarding",
  "strategy",
  "calendar",
  "approvals",
  "files",
  "performance",
  "requests",
  "meetings",
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
