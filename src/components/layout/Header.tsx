"use client";

import { usePipelineStore } from "@/store/pipeline-store";

export function Header() {
  const { reset, currentStage } = usePipelineStore();

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-sm">V</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Viral AI</h1>
        </button>

        {currentStage !== "idle" && (
          <button
            onClick={() => reset()}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            New Project
          </button>
        )}
      </div>
    </header>
  );
}
