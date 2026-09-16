import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/portal/Charts";
import type { OnboardingStep, PortalState } from "@/data/types";
import { ONBOARDING_STEPS } from "@/data/types";

const STEP_HINTS: Record<OnboardingStep, string> = {
  Company: "Legal name, what the business does, locations.",
  Contact: "Primary and secondary contacts, preferred channel.",
  Brand: "Brand assets, palette, existing guidelines.",
  "Social accounts": "Handles and access status for each platform.",
  Audience: "Who you're trying to reach and what they care about.",
  Objectives: "What success looks like in the next 90 days.",
  Competitors: "Who you're compared against, what they do well.",
  "Content preferences": "Formats you love, formats to avoid.",
  "Approval preferences": "Review cadence, turnaround expectations.",
  "Important dates": "Launches, events, seasonal moments.",
  "Brand assets": "Where logos, photos, and templates live.",
  Notes: "Anything else the team should know.",
};

interface Props {
  state: PortalState;
  update: (fn: (prev: PortalState) => PortalState) => void;
}

export function OnboardingSection({ state, update }: Props) {
  const [openStep, setOpenStep] = useState<OnboardingStep | null>(() => {
    const firstEmpty = ONBOARDING_STEPS.find((s) => !(state.onboarding[s] ?? "").trim());
    return firstEmpty ?? null;
  });

  const filled = ONBOARDING_STEPS.filter((s) => (state.onboarding[s] ?? "").trim().length > 0);
  const progress = Math.round((filled.length / ONBOARDING_STEPS.length) * 100);

  const setStep = (step: OnboardingStep, value: string) => {
    update((prev) => ({
      ...prev,
      onboarding: { ...prev.onboarding, [step]: value },
    }));
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer these once — the team uses them across strategy, calendar, and reporting.
        </p>
      </header>

      <section className="card-lift rounded-xl border border-border/70 bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Onboarding progress</h2>
          <span className="tabular text-sm font-semibold">{progress}%</span>
        </div>
        <ProgressBar value={progress} className="mt-3" />
        <p className="mt-2 text-xs text-muted-foreground">
          {filled.length} of {ONBOARDING_STEPS.length} steps complete
          {progress === 100
            ? " — you're all set!"
            : " — complete every step for the best results."}
        </p>
      </section>

      <div className="space-y-2">
        {ONBOARDING_STEPS.map((step, i) => {
          const value = state.onboarding[step] ?? "";
          const done = value.trim().length > 0;
          const open = openStep === step;
          return (
            <div
              key={step}
              className="card-lift overflow-hidden rounded-xl border border-border/70 bg-card"
            >
              <button
                type="button"
                onClick={() => setOpenStep(open ? null : step)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span
                  className={
                    done
                      ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : "flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground"
                  }
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{step}</span>
                  <span className="block text-xs text-muted-foreground">{STEP_HINTS[step]}</span>
                </span>
                <ChevronDown
                  className={
                    open
                      ? "size-4 shrink-0 text-muted-foreground transition-transform rotate-180"
                      : "size-4 shrink-0 text-muted-foreground transition-transform"
                  }
                />
              </button>
              {open && (
                <div className="border-t border-border/70 px-4 py-4">
                  <Label htmlFor={`step-${i}`} className="sr-only">
                    {step}
                  </Label>
                  <Textarea
                    id={`step-${i}`}
                    value={value}
                    onChange={(e) => setStep(step, e.target.value)}
                    rows={3}
                    placeholder={`Describe your ${step.toLowerCase()}…`}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenStep(null)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
