import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError, ErrorCode } from "../utils/errors";
import type { CreativeScript, RefinedScreenplay } from "../types/script";
import {
  interpolatePrompt,
  DEFAULT_SCRIPT_EXPANSION_PROMPT,
} from "../prompts/script-expansion";
import { DEFAULT_SCRIPT_REFINEMENT_PROMPT } from "../prompts/script-refinement";
import { nanoid } from "nanoid";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "GEMINI_API_KEY is not configured",
      ErrorCode.GEMINI_API_ERROR,
      500
    );
  }
  return new GoogleGenerativeAI(apiKey);
};

// ==============================
// Stage 1: 创意脚本生成
// 直接将 Amazon URL 传给 Gemini，让 Gemini 自行分析产品
// ==============================
export async function generateCreativeScripts(
  amazonUrl: string,
  customPrompt?: string
): Promise<CreativeScript[]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro-preview-06-05",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const template = customPrompt || DEFAULT_SCRIPT_EXPANSION_PROMPT;
  const prompt = interpolatePrompt(template, {
    amazonUrl,
    scriptCount: "3",
  });

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new AppError(
        "Gemini returned invalid JSON for script generation",
        ErrorCode.GEMINI_INVALID_RESPONSE,
        500,
        true
      );
    }

    // The response should be an array of scripts or an object with a scripts array
    const scriptsArray = Array.isArray(parsed)
      ? parsed
      : (parsed as { scripts?: unknown[] }).scripts;

    if (!Array.isArray(scriptsArray)) {
      throw new AppError(
        "Gemini response does not contain a scripts array",
        ErrorCode.GEMINI_INVALID_RESPONSE,
        500,
        true
      );
    }

    return scriptsArray.map((raw: Record<string, unknown>) => ({
      id: nanoid(),
      title: String(raw.title || "Untitled Script"),
      hook: String(raw.hook || ""),
      concept: String(raw.concept || ""),
      targetAudience: String(raw.targetAudience || raw.target_audience || ""),
      tone: String(raw.tone || ""),
      scenes: Array.isArray(raw.scenes)
        ? raw.scenes.map((s: Record<string, unknown>, i: number) => ({
            sceneNumber: Number(s.sceneNumber || s.scene_number || i + 1),
            briefDescription: String(
              s.briefDescription || s.brief_description || s.description || ""
            ),
            duration: Number(s.duration || 5),
          }))
        : [],
      narration: String(raw.narration || ""),
      cta: String(raw.cta || raw.call_to_action || ""),
      estimatedDuration: Number(
        raw.estimatedDuration || raw.estimated_duration || 30
      ),
      status: "generated" as const,
    }));
  } catch (error) {
    if (error instanceof AppError) throw error;
    const message =
      error instanceof Error ? error.message : "Unknown Gemini error";
    throw new AppError(
      `Gemini script generation failed: ${message}`,
      ErrorCode.GEMINI_API_ERROR,
      500,
      true
    );
  }
}

// ==============================
// Stage 2: 创意脚本深度刻画
// ==============================
export async function refineScript(
  script: CreativeScript,
  amazonUrl: string,
  customPrompt?: string
): Promise<RefinedScreenplay> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro-preview-06-05",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const template = customPrompt || DEFAULT_SCRIPT_REFINEMENT_PROMPT;
  const prompt = interpolatePrompt(template, {
    scriptTitle: script.title,
    scriptHook: script.hook,
    scriptConcept: script.concept,
    scriptTone: script.tone,
    scriptNarration: script.narration,
    scriptCta: script.cta,
    scriptScenes: JSON.stringify(script.scenes, null, 2),
    targetAudience: script.targetAudience,
    estimatedDuration: String(script.estimatedDuration),
    amazonUrl,
  });

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new AppError(
        "Gemini returned invalid JSON for script refinement",
        ErrorCode.GEMINI_INVALID_RESPONSE,
        500,
        true
      );
    }

    const screenplayData =
      (parsed.screenplay as Record<string, unknown>) || parsed;
    const scenesRaw = Array.isArray(screenplayData.scenes)
      ? screenplayData.scenes
      : [];

    const scenes = scenesRaw.map(
      (s: Record<string, unknown>, i: number) => ({
        id: nanoid(),
        sceneNumber: Number(s.sceneNumber || s.scene_number || i + 1),
        title: String(s.title || `Scene ${i + 1}`),
        visualDescription: String(
          s.visualDescription || s.visual_description || ""
        ),
        cameraAngle: String(s.cameraAngle || s.camera_angle || "medium shot"),
        cameraMovement: s.cameraMovement
          ? String(s.cameraMovement)
          : s.camera_movement
            ? String(s.camera_movement)
            : undefined,
        dialogue: String(s.dialogue || s.narration || ""),
        textOverlay: s.textOverlay
          ? String(s.textOverlay)
          : s.text_overlay
            ? String(s.text_overlay)
            : undefined,
        transition: String(s.transition || "cut"),
        duration: Number(s.duration || 5),
        musicMood: s.musicMood
          ? String(s.musicMood)
          : s.music_mood
            ? String(s.music_mood)
            : undefined,
        soundEffects: s.soundEffects
          ? String(s.soundEffects)
          : s.sound_effects
            ? String(s.sound_effects)
            : undefined,
        colorPalette: s.colorPalette
          ? String(s.colorPalette)
          : s.color_palette
            ? String(s.color_palette)
            : undefined,
        lightingStyle: s.lightingStyle
          ? String(s.lightingStyle)
          : s.lighting_style
            ? String(s.lighting_style)
            : undefined,
      })
    );

    const totalDuration = scenes.reduce(
      (sum: number, s: { duration: number }) => sum + s.duration,
      0
    );

    return {
      id: nanoid(),
      scriptId: script.id,
      title: String(screenplayData.title || script.title),
      scenes,
      totalDuration,
      status: "created" as const,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    const message =
      error instanceof Error ? error.message : "Unknown Gemini error";
    throw new AppError(
      `Gemini script refinement failed: ${message}`,
      ErrorCode.GEMINI_API_ERROR,
      500,
      true
    );
  }
}
