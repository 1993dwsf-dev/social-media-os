import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import {
  CalendarDays,
  CheckSquare,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Sparkles,
  Table2,
  TrendingUp,
  Users,
  Video,
  Settings as SettingsIcon,
  X,
} from "lucide-react";

import logo from "@/assets/logo.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { usePortalStore } from "@/data/store";
import type { SectionId } from "@/data/types";
import { cn } from "@/lib/utils";

import { DashboardSection } from "./sections/DashboardSection";
import { OnboardingSection } from "./sections/OnboardingSection";
import { StrategySection } from "./sections/StrategySection";
import { CalendarSection } from "./sections/CalendarSection";
import { ApprovalsSection } from "./sections/ApprovalsSection";
import { FilesSection } from "./sections/FilesSection";
import { PerformanceSection } from "./sections/PerformanceSection";
import { RequestsSection } from "./sections/RequestsSection";
import { MeetingsSection } from "./sections/MeetingsSection";
import { SettingsSection } from "./sections/SettingsSection";

const NAV: {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { id: "onboarding", label: "Onboarding", icon: ListChecks, group: "Overview" },
  { id: "strategy", label: "Strategy", icon: Sparkles, group: "Overview" },
  { id: "calendar", label: "Content Calendar", icon: CalendarDays, group: "Collaboration" },
  { id: "approvals", label: "Approvals", icon: CheckSquare, group: "Collaboration" },
  { id: "requests", label: "Requests", icon: FileText, group: "Collaboration" },
  { id: "meetings", label: "Meetings", icon: Video, group: "Collaboration" },
  { id: "files", label: "Files & Deliverables", icon: Users, group: "Collaboration" },
  { id: "performance", label: "Performance", icon: TrendingUp, group: "Insights" },
  { id: "settings", label: "Settings", icon: SettingsIcon, group: "Insights" },
];

const GROUPS = ["Overview", "Collaboration", "Insights"];

export default function Portal() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const store = usePortalStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = (NAV.find((n) => n.id === section)?.id ?? "dashboard") as SectionId;
  const state = store.state;

  const pendingApprovals = state.content.filter(
    (c) => c.status === "In Review" || c.status === "Changes Requested",
  ).length;

  const go = (id: SectionId) => {
    navigate(`/app/${id}`);
    setMobileOpen(false);
  };

  const badgeFor = (id: SectionId) =>
    id === "approvals" && pendingApprovals > 0 ? String(pendingApprovals) : undefined;

  const navList = (
    <nav className="flex flex-1 flex-col gap-6 px-3 py-4">
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {group}
          </p>
          <ul className="space-y-0.5">
            {NAV.filter((n) => n.group === group).map((n) => {
              const Icon = n.icon;
              const isActive = n.id === active;
              const badge = badgeFor(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => go(n.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 text-left">{n.label}</span>
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
        <p className="truncate text-[11px] text-muted-foreground">{state.client.name}</p>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (active) {
      case "dashboard":
        return <DashboardSection state={state} navigate={go} />;
      case "onboarding":
        return <OnboardingSection state={state} update={store.update} />;
      case "strategy":
        return <StrategySection state={state} update={store.update} />;
      case "calendar":
        return <CalendarSection state={state} update={store.update} />;
      case "approvals":
        return <ApprovalsSection state={state} update={store.update} />;
      case "files":
        return <FilesSection state={state} update={store.update} />;
      case "performance":
        return <PerformanceSection state={state} />;
      case "requests":
        return <RequestsSection state={state} update={store.update} />;
      case "meetings":
        return <MeetingsSection state={state} update={store.update} />;
      case "settings":
        return (
          <SettingsSection
            state={state}
            update={store.update}
            loadDemo={store.loadDemo}
            resetPortal={store.resetPortal}
            exportJSON={store.exportJSON}
            importJSONFile={store.importJSONFile}
          />
        );
      default:
        return <DashboardSection state={state} navigate={go} />;
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
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/workbook")}
          >
            <div>
              <Table2 className="size-4" />
              Manager Workbook
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
            {NAV.find((n) => n.id === active)?.label}
          </p>
          <div className="ml-auto flex items-center gap-2">
            {store.usingDemo ? (
              <Badge variant="outline" className="hidden sm:inline-flex">
                Demo data
              </Badge>
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
              <span className="hidden sm:inline">
                {user?.name ? "Sign out" : "Sign out"}
              </span>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
