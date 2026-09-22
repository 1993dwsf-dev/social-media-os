import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import {
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  FileText,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings as SettingsIcon,
  Sparkles,
  Table2,
  Video,
  Wallet,
  X,
} from "lucide-react";

import logo from "@/assets/logo.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { todayISO } from "@/data/constants";
import type { SectionId } from "@/data/types";
import { SECTIONS } from "@/data/types";
import { useWorkspace } from "@/data/workspace";
import { useClientFocus } from "./useClientFocus";
import { cn } from "@/lib/utils";

import { DashboardSection } from "./sections/DashboardSection";
import { ClientsSection } from "./sections/ClientsSection";
import { StrategySection } from "./sections/StrategySection";
import { OnboardingSection } from "./sections/OnboardingSection";
import { CalendarSection } from "./sections/CalendarSection";
import { TasksSection } from "./sections/TasksSection";
import { ApprovalsSection } from "./sections/ApprovalsSection";
import { RequestsSection } from "./sections/RequestsSection";
import { FinanceSection } from "./sections/FinanceSection";
import { MeetingsSection } from "./sections/MeetingsSection";
import { FilesSection } from "./sections/FilesSection";
import { SettingsSection } from "./sections/SettingsSection";

const NAV: {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { id: "clients", label: "Clients", icon: Building2, group: "Overview" },
  { id: "strategy", label: "Strategy", icon: Sparkles, group: "Overview" },
  { id: "onboarding", label: "Onboarding", icon: ListChecks, group: "Overview" },
  { id: "calendar", label: "Content calendar", icon: CalendarDays, group: "Production" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, group: "Production" },
  { id: "approvals", label: "Approvals", icon: ClipboardCheck, group: "Production" },
  { id: "requests", label: "Requests", icon: FileText, group: "Production" },
  { id: "finance", label: "Finance", icon: Wallet, group: "Business" },
  { id: "meetings", label: "Meetings", icon: Video, group: "Business" },
  { id: "files", label: "Files & deliverables", icon: FolderOpen, group: "Business" },
  { id: "settings", label: "Settings", icon: SettingsIcon, group: "Business" },
];

const GROUPS = ["Overview", "Production", "Business"];

export default function Portal() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const ws = useWorkspace();
  const focus = useClientFocus(ws.clients, ws.ready);
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = (SECTIONS.find((id) => id === section) ?? "dashboard") as SectionId;

  const pendingApprovals = ws.content.filter(
    (item) => item.status === "In Review" || item.status === "Changes Requested",
  ).length;
  const overdueTasks = ws.tasks.filter(
    (task) => task.status !== "Done" && task.dueDate && task.dueDate < todayISO(),
  ).length;
  const unpaid = ws.finance.filter((entry) => entry.status === "Overdue").length;

  const go = (id: SectionId) => {
    navigate(`/app/${id}`);
    setMobileOpen(false);
  };

  const badgeFor = (id: SectionId) => {
    if (id === "approvals" && pendingApprovals > 0) return String(pendingApprovals);
    if (id === "tasks" && overdueTasks > 0) return String(overdueTasks);
    if (id === "finance" && unpaid > 0) return String(unpaid);
    return undefined;
  };

  const navList = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {group}
          </p>
          <ul className="space-y-0.5">
            {NAV.filter((item) => item.group === group).map((item) => {
              const Icon = item.icon;
              const isActive = item.id === active;
              const badge = badgeFor(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => go(item.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge ? (
                      <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                        {badge}
                      </Badge>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 border-b border-border/70 px-5 py-4">
      <img src={logo} alt="" className="size-8 rounded-lg" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-tight">Contentplane</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {ws.profile.agency || ws.profile.managerName || "Manager workspace"}
        </p>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (active) {
      case "dashboard":
        return <DashboardSection ws={ws} navigate={go} />;
      case "clients":
        return <ClientsSection ws={ws} navigate={go} focus={focus} />;
      case "strategy":
        return <StrategySection ws={ws} focus={focus} />;
      case "onboarding":
        return <OnboardingSection ws={ws} focus={focus} />;
      case "calendar":
        return <CalendarSection ws={ws} focus={focus} />;
      case "tasks":
        return <TasksSection ws={ws} focus={focus} />;
      case "approvals":
        return <ApprovalsSection ws={ws} focus={focus} />;
      case "requests":
        return <RequestsSection ws={ws} focus={focus} />;
      case "finance":
        return <FinanceSection ws={ws} focus={focus} />;
      case "meetings":
        return <MeetingsSection ws={ws} focus={focus} />;
      case "files":
        return <FilesSection ws={ws} focus={focus} />;
      case "settings":
        return <SettingsSection ws={ws} />;
      default:
        return <DashboardSection ws={ws} navigate={go} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border/70 bg-card lg:flex">
        {brand}
        {navList}
        <div className="border-t border-border/70 p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/workbook")}
          >
            <div className="flex items-center gap-2">
              <Table2 className="size-4" />
              Manager workbook
            </div>
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-3.5 z-40 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {brand}
          {navList}
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/70 bg-background/80 pl-16 pr-4 backdrop-blur lg:pl-6">
          <div className="flex items-center gap-2 lg:hidden">
            <img src={logo} alt="" className="size-6 rounded-md" />
          </div>
          <p className="hidden text-sm font-medium sm:block">
            {NAV.find((item) => item.id === active)?.label}
          </p>
          <div className="ml-auto flex items-center gap-2">
            {ws.ready && ws.clients.length > 0 ? (
              <select
                value={focus.clientId}
                onChange={(e) => focus.setFocus(e.target.value)}
                className="h-8 w-auto max-w-44 min-w-36 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Focused client"
              >
                <option value="">All clients ({ws.clients.length})</option>
                {ws.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">{user?.name || "Sign out"}</span>
              <X className="size-3.5 sm:hidden" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {ws.ready ? (
            renderSection()
          ) : (
            <div className="flex min-h-64 items-center justify-center">
              <p className="animate-pulse text-sm text-muted-foreground">Loading your workspace…</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export function RedirectToDashboard() {
  return <Navigate to="/app/dashboard" replace />;
}
