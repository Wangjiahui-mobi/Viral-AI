// ==============================
// Video Analysis Result (from Gemini)
// ==============================

export interface AnalyzedScript {
  id: string;
  rawScript: string; // Full structured script text from Gemini
  videoUrl: string;
  createdAt: number;
}
