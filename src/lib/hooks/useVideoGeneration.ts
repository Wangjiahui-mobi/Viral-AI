"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePipelineStore } from "@/store/pipeline-store";
import type { VideoStatusQueryResponse } from "@/lib/types/api";

export function useVideoGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);

  const { screenplay, setVideoJobs, setStage } = usePipelineStore();

  const getInterval = () => {
    // Exponential backoff: 10s → 20s → 30s
    if (pollCountRef.current < 5) return 10000;
    if (pollCountRef.current < 15) return 20000;
    return 30000;
  };

  const pollStatus = useCallback(
    async (screenplayId: string) => {
      try {
        const response = await fetch(
          `/api/videos/status?screenplayId=${screenplayId}`
        );

        if (!response.ok) {
          throw new Error("Failed to check video status");
        }

        const data: VideoStatusQueryResponse = await response.json();
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

        // Continue polling
        pollCountRef.current += 1;
        pollingRef.current = setTimeout(
          () => pollStatus(screenplayId),
          getInterval()
        );
      } catch {
        // Don't stop polling on transient errors
        pollCountRef.current += 1;
        pollingRef.current = setTimeout(
          () => pollStatus(screenplayId),
          getInterval()
        );
      }
    },
    [setVideoJobs, setStage]
  );

  const startGeneration = async () => {
    if (!screenplay) {
      setError("No screenplay available");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStage("generating_video");

    try {
      const response = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenplayId: screenplay.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start video generation");
      }

      // Start polling
      pollCountRef.current = 0;
      setIsPolling(true);
      pollingRef.current = setTimeout(
        () => pollStatus(screenplay.id),
        5000 // First poll after 5s
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStage("refined");
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  return { startGeneration, stopPolling, isLoading, isPolling, error };
}
