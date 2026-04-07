"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePipelineStore } from "@/store/pipeline-store";
import type { VideoJob } from "@/lib/types/video";

export function useVideoGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);

  const { script, setVideoJobs, setStage } = usePipelineStore();

  const getInterval = () => {
    if (pollCountRef.current < 5) return 10000;
    if (pollCountRef.current < 15) return 20000;
    return 30000;
  };

  const pollStatus = useCallback(
    async (scriptId: string) => {
      try {
        const response = await fetch(
          `/api/videos/status?scriptId=${scriptId}`
        );

        if (!response.ok) {
          throw new Error("Failed to check video status");
        }

        const data = (await response.json()) as {
          allCompleted: boolean;
          jobs: VideoJob[];
        };
        setVideoJobs(data.jobs);

        if (data.allCompleted) {
          setIsPolling(false);
          setStage("video_completed");
          if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
          }
          return;
        }

        pollCountRef.current += 1;
        pollingRef.current = setTimeout(
          () => pollStatus(scriptId),
          getInterval()
        );
      } catch {
        pollCountRef.current += 1;
        pollingRef.current = setTimeout(
          () => pollStatus(scriptId),
          getInterval()
        );
      }
    },
    [setVideoJobs, setStage]
  );

  const startGeneration = async () => {
    if (!script) {
      setError("No script available");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStage("generating_video");

    try {
      const response = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: script.id,
          rawScript: script.rawScript,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start video generation");
      }

      const data = (await response.json()) as { jobs: VideoJob[] };
      setVideoJobs(data.jobs);

      // Start polling
      pollCountRef.current = 0;
      setIsPolling(true);
      pollingRef.current = setTimeout(
        () => pollStatus(script.id),
        5000
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStage("script_ready");
    } finally {
      setIsLoading(false);
    }
  };

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  return { startGeneration, stopPolling, isLoading, isPolling, error };
}
