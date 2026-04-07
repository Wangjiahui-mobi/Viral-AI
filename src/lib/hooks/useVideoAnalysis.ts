"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipeline-store";
import type { AnalyzedScript } from "@/lib/types/script";

export function useVideoAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAnalysisResult, setStage } = usePipelineStore();

  const analyzeVideo = async (videoUrl: string) => {
    setIsLoading(true);
    setError(null);
    setStage("analyzing");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze video");
      }

      const data = (await response.json()) as { script: AnalyzedScript };
      setAnalysisResult(videoUrl, data.script);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStage("idle");
    } finally {
      setIsLoading(false);
    }
  };

  return { analyzeVideo, isLoading, error };
}
