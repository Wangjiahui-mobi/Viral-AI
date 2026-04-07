"use client";

import { create } from "zustand";
import type { AnalyzedScript } from "@/lib/types/script";
import type { VideoJob } from "@/lib/types/video";

export type PipelineStage =
  | "idle"
  | "analyzing"
  | "script_ready"
  | "generating_video"
  | "video_completed";

interface PipelineState {
  currentStage: PipelineStage;

  // Data
  videoUrl: string | null;
  script: AnalyzedScript | null;
  videoJobs: VideoJob[];

  // Loading / error
  isLoading: boolean;
  error: string | null;

  // Actions
  setStage: (stage: PipelineStage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setAnalysisResult: (videoUrl: string, script: AnalyzedScript) => void;
  setVideoJobs: (jobs: VideoJob[]) => void;
  updateVideoJob: (jobId: string, updates: Partial<VideoJob>) => void;

  reset: () => void;
}

const initialState = {
  currentStage: "idle" as PipelineStage,
  videoUrl: null as string | null,
  script: null as AnalyzedScript | null,
  videoJobs: [] as VideoJob[],
  isLoading: false,
  error: null as string | null,
};

export const usePipelineStore = create<PipelineState>((set) => ({
  ...initialState,

  setStage: (stage) => set({ currentStage: stage }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setAnalysisResult: (videoUrl, script) =>
    set({
      videoUrl,
      script,
      currentStage: "script_ready",
      error: null,
    }),

  setVideoJobs: (jobs) => set({ videoJobs: jobs }),

  updateVideoJob: (jobId, updates) =>
    set((state) => ({
      videoJobs: state.videoJobs.map((j) =>
        j.id === jobId ? { ...j, ...updates } : j
      ),
    })),

  reset: () => set(initialState),
}));
