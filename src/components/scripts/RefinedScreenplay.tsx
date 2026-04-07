"use client";

import { usePipelineStore } from "@/store/pipeline-store";
import { useVideoGeneration } from "@/lib/hooks/useVideoGeneration";
import { SceneCard } from "./SceneCard";

export function RefinedScreenplay() {
  const { screenplay, currentStage } = usePipelineStore();
  const { startGeneration, isLoading } = useVideoGeneration();

  if (!screenplay) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Detailed Screenplay</h3>
          <p className="text-sm text-muted mt-1">
            {screenplay.title} &middot; {screenplay.scenes.length} scenes
            &middot; {screenplay.totalDuration}s total
          </p>
        </div>
      </div>

      {/* Scenes Timeline */}
      <div className="space-y-3 mb-6">
        {screenplay.scenes.map((scene, i) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            isLast={i === screenplay.scenes.length - 1}
          />
        ))}
      </div>

      {/* Generate Video Button */}
      {currentStage === "refined" && (
        <button
          onClick={() => startGeneration()}
          disabled={isLoading}
          className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting Video Generation...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Generate Videos with Sora
            </>
          )}
        </button>
      )}
    </div>
  );
}
