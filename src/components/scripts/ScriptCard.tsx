"use client";

import type { CreativeScript } from "@/lib/types/script";

interface ScriptCardProps {
  script: CreativeScript;
  isSelected: boolean;
  onSelect: () => void;
  onRefine: () => void;
  isRefining: boolean;
}

export function ScriptCard({
  script,
  isSelected,
  onSelect,
  onRefine,
  isRefining,
}: ScriptCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        bg-card border rounded-2xl p-5 cursor-pointer transition-all hover:border-accent/50
        ${isSelected ? "border-accent ring-1 ring-accent/30" : "border-border"}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-foreground leading-tight pr-2">
          {script.title}
        </h4>
        <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent whitespace-nowrap">
          {script.estimatedDuration}s
        </span>
      </div>

      {/* Hook */}
      <div className="mb-3">
        <p className="text-xs text-muted uppercase tracking-wider mb-1">
          Hook
        </p>
        <p className="text-sm text-foreground/80">{script.hook}</p>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded bg-card-hover text-muted">
          {script.tone}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-card-hover text-muted">
          {script.targetAudience}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-card-hover text-muted">
          {script.scenes.length} scenes
        </span>
      </div>

      {/* Scenes preview */}
      <div className="space-y-1.5 mb-4">
        {script.scenes.map((scene) => (
          <div
            key={scene.sceneNumber}
            className="flex items-start gap-2 text-xs"
          >
            <span className="text-accent font-mono w-4 flex-shrink-0">
              {scene.sceneNumber}.
            </span>
            <span className="text-muted line-clamp-1">
              {scene.briefDescription}
            </span>
            <span className="text-muted/50 ml-auto flex-shrink-0">
              {scene.duration}s
            </span>
          </div>
        ))}
      </div>

      {/* CTA preview */}
      <div className="mb-4">
        <p className="text-xs text-muted uppercase tracking-wider mb-1">CTA</p>
        <p className="text-sm text-foreground/60">{script.cta}</p>
      </div>

      {/* Refine button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRefine();
        }}
        disabled={isRefining || script.status === "refined"}
        className="w-full py-2 text-sm font-medium rounded-lg transition-colors bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRefining ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Deep Refining...
          </span>
        ) : script.status === "refined" ? (
          "Refined"
        ) : (
          "Deep Refine Script"
        )}
      </button>
    </div>
  );
}
