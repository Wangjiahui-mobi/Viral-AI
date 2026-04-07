"use client";

import { create } from "zustand";
import type { CreativeScript, RefinedScreenplay } from "@/lib/types/script";
import type { VideoJob } from "@/lib/types/video";

export type PipelineStage =
  | "idle"
  | "generating_scripts"
  | "scripts_generated"
  | "refining"
  | "refined"
  | "generating_video"
  | "video_completed";

interface PipelineState {
  currentStage: PipelineStage;

  // Data
  projectId: string | null;
  amazonUrl: string | null;
  scripts: CreativeScript[];
  selectedScriptId: string | null;
  screenplay: RefinedScreenplay | null;
  videoJobs: VideoJob[];

  // Loading / error
  isLoading: boolean;
  error: string | null;

  // Actions
  setStage: (stage: PipelineStage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setScriptsResult: (projectId: string, amazonUrl: string, scripts: CreativeScript[]) => void;
  selectScript: (scriptId: string) => void;
  setScreenplay: (screenplay: RefinedScreenplay) => void;
  setVideoJobs: (jobs: VideoJob[]) => void;
  updateVideoJob: (jobId: string, updates: Partial<VideoJob>) => void;

  reset: () => void;
}

const initialState = {
  currentStage: "idle" as PipelineStage,
  projectId: null as string | null,
  amazonUrl: null as string | null,
  scripts: [] as CreativeScript[],
  selectedScriptId: null as string | null,
  screenplay: null as RefinedScreenplay | null,
  videoJobs: [] as VideoJob[],
  isLoading: false,
  error: null as string | null,
};

export const usePipelineStore = create<PipelineState>((set) => ({
  ...initialState,

  setStage: (stage) => set({ currentStage: stage }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setScriptsResult: (projectId, amazonUrl, scripts) =>
    set({
      projectId,
      amazonUrl,
      scripts,
      currentStage: "scripts_generated",
      error: null,
    }),

  selectScript: (scriptId) => set({ selectedScriptId: scriptId }),

  setScreenplay: (screenplay) =>
    set({
      screenplay,
      currentStage: "refined",
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
