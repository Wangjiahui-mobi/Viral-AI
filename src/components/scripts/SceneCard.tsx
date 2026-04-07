"use client";

import { useState } from "react";
import type { DetailedScene } from "@/lib/types/script";

interface SceneCardProps {
  scene: DetailedScene;
  isLast: boolean;
}

export function SceneCard({ scene, isLast }: SceneCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-4 top-12 bottom-0 w-px bg-border" />
      )}

      <div
        onClick={() => setExpanded(!expanded)}
        className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-accent/30 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-mono flex-shrink-0">
            {scene.sceneNumber}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-sm">{scene.title}</h5>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{scene.duration}s</span>
                <span>{scene.cameraAngle}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Description (always visible) */}
        <p className="text-sm text-foreground/70 ml-11 line-clamp-2">
          {scene.visualDescription}
        </p>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-3 ml-11 space-y-2 animate-fade-in">
            {scene.dialogue && (
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">
                  Narration
                </p>
                <p className="text-sm text-foreground/80">{scene.dialogue}</p>
              </div>
            )}
            {scene.textOverlay && (
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">
                  Text Overlay
                </p>
                <p className="text-sm text-foreground/80">
                  {scene.textOverlay}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {scene.cameraMovement && (
                <span className="text-xs px-2 py-0.5 rounded bg-card-hover text-muted">
                  {scene.cameraMovement}
                </span>
              )}
              {scene.transition && (
                <span className="text-xs px-2 py-0.5 rounded bg-card-hover text-muted">
                  {scene.transition}
                </span>
              )}
              {scene.musicMood && (
                <span className="text-xs px-2 py-0.5 rounded bg-card-hover text-muted">
                  {scene.musicMood}
                </span>
              )}
              {scene.lightingStyle && (
                <span className="text-xs px-2 py-0.5 rounded bg-card-hover text-muted">
                  {scene.lightingStyle}
                </span>
              )}
              {scene.colorPalette && (
                <span className="text-xs px-2 py-0.5 rounded bg-card-hover text-muted">
                  {scene.colorPalette}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
