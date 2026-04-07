"use client";

import { Header } from "@/components/layout/Header";
import { PipelineProgress } from "@/components/layout/PipelineProgress";
import { UrlInput } from "@/components/product/UrlInput";
import { ScriptCardList } from "@/components/scripts/ScriptCardList";
import { RefinedScreenplay } from "@/components/scripts/RefinedScreenplay";
import { VideoGenerationPanel } from "@/components/video/VideoGenerationPanel";
import { usePipelineStore } from "@/store/pipeline-store";

export default function Home() {
  const { currentStage, error } = usePipelineStore();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <PipelineProgress />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Stage 0: URL Input */}
        {currentStage === "idle" && <UrlInput />}

        {/* Loading state for script generation */}
        {currentStage === "generating_scripts" && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
            <p className="text-muted">Generating creative scripts with Gemini...</p>
            <p className="text-muted/50 text-sm mt-1">Analyzing product & creating scripts</p>
          </div>
        )}

        {/* Stage 1: Scripts generated */}
        {(currentStage === "scripts_generated" ||
          currentStage === "refining" ||
          currentStage === "refined" ||
          currentStage === "generating_video" ||
          currentStage === "video_completed") && <ScriptCardList />}

        {/* Loading state for refinement */}
        {currentStage === "refining" && (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
            <p className="text-muted">Deep refining screenplay with Gemini...</p>
            <p className="text-muted/50 text-sm mt-1">Creating detailed scene descriptions</p>
          </div>
        )}

        {/* Stage 2: Refined screenplay */}
        {(currentStage === "refined" ||
          currentStage === "generating_video" ||
          currentStage === "video_completed") && <RefinedScreenplay />}

        {/* Stage 3: Video generation */}
        {(currentStage === "generating_video" ||
          currentStage === "video_completed") && <VideoGenerationPanel />}

        {/* Global error display */}
        {error && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-center animate-fade-in">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-4 text-center">
        <p className="text-xs text-muted">
          Viral AI &middot; Powered by Gemini 2.5 Pro & Sora 2
        </p>
      </footer>
    </div>
  );
}
