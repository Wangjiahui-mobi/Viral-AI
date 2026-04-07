// ==============================
// Stage 1: 创意脚本生成 输出
// ==============================

export interface SceneSummary {
  sceneNumber: number;
  briefDescription: string;
  duration: number; // seconds
}

export interface CreativeScript {
  id: string;
  title: string;
  hook: string;
  concept: string;
  targetAudience: string;
  tone: string;
  scenes: SceneSummary[];
  narration: string;
  cta: string;
  estimatedDuration: number; // seconds
  status: ScriptStatus;
}

export type ScriptStatus =
  | "generated"
  | "editing"
  | "refined"
  | "video_generating"
  | "completed";

// ==============================
// Stage 2: 创意脚本深度刻画 输出
// ==============================

export interface DetailedScene {
  id: string;
  sceneNumber: number;
  title: string;
  visualDescription: string; // Sora prompt
  cameraAngle: string;
  cameraMovement?: string;
  dialogue: string;
  textOverlay?: string;
  transition: string;
  duration: number; // seconds
  musicMood?: string;
  soundEffects?: string;
  colorPalette?: string;
  lightingStyle?: string;
}

export interface RefinedScreenplay {
  id: string;
  scriptId: string;
  title: string;
  scenes: DetailedScene[];
  totalDuration: number;
  status: ScreenplayStatus;
}

export type ScreenplayStatus =
  | "created"
  | "video_generating"
  | "completed"
  | "failed";
