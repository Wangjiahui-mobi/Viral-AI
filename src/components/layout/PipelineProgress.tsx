"use client";

import { usePipelineStore, type PipelineStage } from "@/store/pipeline-store";

const STEPS = [
  { key: "analyze", label: "Analyze", icon: "1" },
  { key: "script", label: "Script", icon: "2" },
  { key: "video", label: "Video", icon: "3" },
] as const;

function getStepState(
  stepKey: string,
  currentStage: PipelineStage
): "completed" | "active" | "upcoming" {
  const stageMap: Record<string, number> = {
    idle: 0,
    analyzing: 0,
    script_ready: 1,
    generating_video: 2,
    video_completed: 3,
  };

  const stepMap: Record<string, number> = {
    analyze: 1,
    script: 2,
    video: 3,
  };

  const currentLevel = stageMap[currentStage] ?? 0;
  const stepLevel = stepMap[stepKey] ?? 0;

  if (currentLevel >= stepLevel) return "completed";
  if (currentLevel === stepLevel - 1) return "active";
  return "upcoming";
}

export function PipelineProgress() {
  const { currentStage } = usePipelineStore();

  if (currentStage === "idle") return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const state = getStepState(step.key, currentStage);
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${state === "completed" ? "bg-accent text-white" : ""}
                    ${state === "active" ? "bg-accent/20 text-accent border border-accent animate-pulse-glow" : ""}
                    ${state === "upcoming" ? "bg-border text-muted" : ""}
                  `}
                >
                  {state === "completed" ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={`text-sm hidden sm:block ${
                    state === "upcoming" ? "text-muted" : "text-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-4 transition-colors ${
                    getStepState(STEPS[i + 1].key, currentStage) !== "upcoming"
                      ? "bg-accent"
                      : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
