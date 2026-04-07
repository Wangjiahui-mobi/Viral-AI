import type { CreativeScript, RefinedScreenplay } from "./script";
import type { VideoJob } from "./video";

// ==============================
// API Request Types
// ==============================

export interface GenerateScriptsRequest {
  amazonUrl: string;
  customPrompt?: string;
}

export interface RefineScriptRequest {
  scriptId: string;
  projectId: string;
  customPrompt?: string;
}

export interface GenerateVideosRequest {
  screenplayId: string;
}

// ==============================
// API Response Types
// ==============================

export interface GenerateScriptsResponse {
  projectId: string;
  scripts: CreativeScript[];
}

export interface RefineScriptResponse {
  scriptId: string;
  screenplay: RefinedScreenplay;
}

export interface GenerateVideosResponse {
  screenplayId: string;
  jobs: { sceneId: string; videoJobId: string; status: string }[];
}

export interface VideoStatusQueryResponse {
  screenplayId: string;
  allCompleted: boolean;
  jobs: VideoJob[];
}

export interface ApiError {
  error: string;
  code?: string;
  retryable?: boolean;
  details?: unknown;
}
