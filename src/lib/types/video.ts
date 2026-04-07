export interface VideoJob {
  id: string;
  sceneId: string;
  screenplayId: string;
  soraJobId: string | null;
  status: VideoJobStatus;
  progress: number;
  errorMessage?: string;
  videoUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

export type VideoJobStatus =
  | "pending"
  | "queued"
  | "in_progress"
  | "completed"
  | "failed";

export interface VideoGenerationRequest {
  screenplayId: string;
}

export interface VideoStatusResponse {
  screenplayId: string;
  allCompleted: boolean;
  jobs: VideoJob[];
}
