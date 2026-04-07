import type { AnalyzedScript } from "./script";
import type { VideoJob } from "./video";

// ==============================
// API Request Types
// ==============================

export interface AnalyzeVideoRequest {
  videoUrl: string;
  customPrompt?: string;
}

export interface GenerateVideosRequest {
  scriptId: string;
  scenes: {
    sceneNumber: number;
    visualDescription: string;
    duration: number;
  }[];
}

// ==============================
// API Response Types
// ==============================

export interface AnalyzeVideoResponse {
  script: AnalyzedScript;
}

export interface GenerateVideosResponse {
  scriptId: string;
  jobs: { sceneNumber: number; videoJobId: string; status: string }[];
}

export interface VideoStatusQueryResponse {
  scriptId: string;
  allCompleted: boolean;
  jobs: VideoJob[];
}

export interface ApiError {
  error: string;
  code?: string;
  retryable?: boolean;
  details?: unknown;
}
