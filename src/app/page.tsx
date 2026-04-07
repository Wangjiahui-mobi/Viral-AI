"use client";

import { Header } from "@/components/layout/Header";
import { PipelineProgress } from "@/components/layout/PipelineProgress";
import { UrlInput } from "@/components/product/UrlInput";
import { ScriptResult } from "@/components/scripts/ScriptResult";
import { VideoGenerationPanel } from "@/components/video/VideoGenerationPanel";
import { usePipelineStore } from "@/store/pipeline-store";

export default function Home() {
  const { currentStage, error } = usePipelineStore();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <PipelineProgress />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Step 1: URL Input */}
        {currentStage === "idle" && <UrlInput />}

        {/* Loading: Analyzing video */}
        {currentStage === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
            <p className="text-muted">Analyzing video with Gemini 2.5 Pro...</p>
            <p className="text-muted/50 text-sm mt-1">Breaking down viral formula & generating clone script</p>
          </div>
        )}

        {/* Step 2: Script ready */}
        {(currentStage === "script_ready" ||
          currentStage === "generating_video" ||
          currentStage === "video_completed") && <ScriptResult />}

        {/* Step 3: Video generation */}
        {(currentStage === "generating_video" ||
          currentStage === "video_completed") && <VideoGenerationPanel />}

        {/* Global error */}
        {error && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-center animate-fade-in">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}
      </main>

      <footer className="border-t border-border/30 py-4 text-center">
        <p className="text-xs text-muted">
          Viral AI &middot; Powered by Gemini 2.5 Pro & SeeDance
        </p>
      </footer>
    </div>
  );
}
