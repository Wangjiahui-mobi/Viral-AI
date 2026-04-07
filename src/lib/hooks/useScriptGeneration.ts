"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipeline-store";
import type { RefineScriptResponse } from "@/lib/types/api";
import type { CreativeScript } from "@/lib/types/script";

export function useScriptGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { projectId, setScriptsResult, setScreenplay, setStage } =
    usePipelineStore();

  // Stage 1: Generate scripts directly from Amazon URL
  const generateScripts = async (amazonUrl: string) => {
    setIsLoading(true);
    setError(null);
    setStage("generating_scripts");

    try {
      const response = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amazonUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate scripts");
      }

      const data = (await response.json()) as {
        projectId: string;
        scripts: CreativeScript[];
      };
      setScriptsResult(data.projectId, amazonUrl, data.scripts);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStage("idle");
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 2: Deep refine a specific script
  const refineScript = async (scriptId: string) => {
    if (!projectId) {
      setError("No project available");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStage("refining");

    try {
      const response = await fetch("/api/scripts/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId, projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to refine script");
      }

      const data: RefineScriptResponse = await response.json();
      setScreenplay(data.screenplay);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStage("scripts_generated");
    } finally {
      setIsLoading(false);
    }
  };

  return { generateScripts, refineScript, isLoading, error };
}
