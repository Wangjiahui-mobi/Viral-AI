import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError, ErrorCode } from "../utils/errors";
import type { AnalyzedScript } from "../types/script";
import { nanoid } from "nanoid";
import { execSync } from "child_process";
import { existsSync, mkdirSync, unlinkSync, statSync } from "fs";
import { join } from "path";

const TMP_DIR = join(process.cwd(), ".tmp-videos");

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "GEMINI_API_KEY is not configured",
      ErrorCode.GEMINI_API_ERROR,
      500
    );
  }
  return apiKey;
};

// ==============================
// Download video from TikTok/YouTube using yt-dlp
// ==============================
function downloadVideo(videoUrl: string): string {
  if (!existsSync(TMP_DIR)) {
    mkdirSync(TMP_DIR, { recursive: true });
  }

  const filename = `video_${nanoid(8)}.mp4`;
  const outputPath = join(TMP_DIR, filename);

  try {
    execSync(
      `yt-dlp -f "mp4[height<=1080]/best[height<=1080]" --no-playlist --max-filesize 100M -o "${outputPath}" "${videoUrl}"`,
      {
        timeout: 120_000, // 2 minutes max
        stdio: "pipe",
      }
    );
  } catch (error) {
    // Clean up partial file
    if (existsSync(outputPath)) {
      try { unlinkSync(outputPath); } catch {}
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new AppError(
      `Failed to download video: ${message}`,
      ErrorCode.GEMINI_API_ERROR,
      500,
      true
    );
  }

  if (!existsSync(outputPath)) {
    throw new AppError(
      "Video download produced no output file",
      ErrorCode.GEMINI_API_ERROR,
      500,
      true
    );
  }

  return outputPath;
}

// ==============================
// Upload video to Gemini File API and wait for processing
// ==============================
async function uploadToGemini(filePath: string): Promise<string> {
  const apiKey = getApiKey();
  const fileManager = new GoogleAIFileManager(apiKey);

  const fileSize = statSync(filePath).size;
  console.log(`Uploading video to Gemini (${(fileSize / 1024 / 1024).toFixed(1)} MB)...`);

  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType: "video/mp4",
    displayName: `analysis_${nanoid(6)}.mp4`,
  });

  let file = uploadResult.file;
  console.log(`Upload complete. File name: ${file.name}, state: ${file.state}`);

  // Poll until the file is ACTIVE (processed)
  while (file.state === "PROCESSING") {
    console.log("Waiting for Gemini to process video...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const updated = await fileManager.getFile(file.name);
    file = updated;
  }

  if (file.state === "FAILED") {
    throw new AppError(
      "Gemini failed to process the uploaded video",
      ErrorCode.GEMINI_API_ERROR,
      500,
      true
    );
  }

  return file.uri;
}

// ==============================
// Analyze a TikTok/YouTube video and generate a clone script
// ==============================
export async function analyzeVideoAndGenerateScript(
  videoUrl: string,
  customPrompt?: string
): Promise<AnalyzedScript> {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  // Step 1: Download video
  console.log(`Downloading video from: ${videoUrl}`);
  const videoPath = downloadVideo(videoUrl);

  let fileUri: string;
  try {
    // Step 2: Upload to Gemini File API
    fileUri = await uploadToGemini(videoPath);
  } finally {
    // Clean up downloaded file
    try { unlinkSync(videoPath); } catch {}
  }

  // Step 3: Analyze with Gemini
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro-preview-06-05",
  });

  const prompt = customPrompt || buildDefaultAnalysisPrompt();

  try {
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: "video/mp4",
          fileUri,
        },
      },
      { text: prompt },
    ]);
    const responseText = result.response.text();

    if (!responseText || responseText.trim().length === 0) {
      throw new AppError(
        "Gemini returned empty response for video analysis",
        ErrorCode.GEMINI_INVALID_RESPONSE,
        500,
        true
      );
    }

    return {
      id: nanoid(),
      rawScript: responseText,
      videoUrl,
      createdAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    const message =
      error instanceof Error ? error.message : "Unknown Gemini error";
    throw new AppError(
      `Gemini video analysis failed: ${message}`,
      ErrorCode.GEMINI_API_ERROR,
      500,
      true
    );
  }
}

function buildDefaultAnalysisPrompt(): string {
  return `This is a currently viral video on TikTok. Please help me understand it.

Please analyze the video and answer: What is the theme of this video? Why did it go viral? If characters appear, what are their emotions? What is the explosive moment? Which part best captures the essence of this video?

Goal:
Generate a frame-by-frame identical recreation script for seconds 0–18 of the reference video, guided by the viral analysis above. Retain the viral essence as the core content of the script. The visual content, background spatial structure, light reflections, character poses, spacing, camera angles, lens movement trajectory, and focal length zoom must all match exactly, including shot transitions. The final result should look as if re-shot with the same phone.

If there is dialogue, the Dialogue section must only output text in the same language as the original video — no extra text in other languages. If celebrities / influencers / political figures appear on screen, the script, dialogue, and output must NOT mention their names.

Strict rule: Keep dialogue in its original language; everything else must be in English. Do NOT show the analysis process — only output the final video script in the structure below.
Note: Absolutely NO table-format output allowed — only output following the structure below.

1) If characters appear on screen
Replicate the character's actions, poses, expressions, lighting, position, and perspective proportions from the original video.
Each character must strictly match: facial features, skin tone, body type, gender, hairstyle, clothing style, color, accessories, body orientation, spatial angle to camera, and distance relationship.
If holding a branded product, describe it only as "a product" — e.g., a bottle of Coca-Cola should be described as "a bottle of liquid."
Character A:
Gender: {gender}
Facial features: {e.g.: slightly wide-set eyes, slightly upturned nose bridge, defined jawline, lip shape}
Skin tone detail: {e.g.: warm light brown}
Body type: {slim / average / athletic}
Hairstyle & hair color: {length, hair flow direction}
Clothing: {color, fabric, crease direction, material sheen, style}
Accessories: {e.g.: necklace, earring swing trajectory, reflection point positions}
Emotion: Consistent with original video
(Note: Detailed emotionally-driven actions, expressions, and gaze will be described in section (8) "Action & Shot Breakdown" below)
Character B:
(Describe in same format)

2) If no characters appear on screen
Replicate a scene with the exact same perspective, depth of field, lighting angle, and spatial layout as the original video.
Spatial structure: {e.g.: "Camera viewpoint height approximately 1.45m, 5° downward angle, vanishing point 3% right of center"}
Lighting environment: {e.g.: "Sunlight entering from upper right at 45°, color temperature 5600K, soft shadow edges"}
Object layout: {e.g.: "Blue book on left side of desk, glass cup at 1/3 position on right side of desk"}
Scene dynamics: {e.g.: "Curtain gently swaying inward 2cm"}

3) Environment & Lighting Details
Background, lighting, and reflections must be frame-by-frame consistent, including:
Spatial depth: Distance between background and subject, blur layers, object clarity falloff.
Light sources: Direction, intensity, color temperature, and shadow edge hardness for key light, fill light, and reflections.
Reflections & diffuse reflections: Brightness and position of light reflections on ground, metal, glass, and skin must match the reference frame.
Material details: Fabric crease direction, wall texture, desk surface reflection patterns.
Dynamic light changes: If the original video's lighting changes as the camera moves, replicate the brightness changes in sync.
No AI filters, blur, artifacts, or unrealistic effects allowed.

4) Camera & Angle
Lens angle, distance, focal length, rotation, zoom speed, and perspective changes must exactly match the original video.
Lens height & orientation: {e.g.: "Camera position 1.45m from ground, 5° downward angle, body slightly right-tilted 10°"}
Focal length & depth of field: {Simulate phone lens equivalent 26mm, f/1.8 aperture, matching depth of field blur}
Composition & focus: {Subject's head maintains original proportion to frame top edge, focus always on main subject's eyes}
Handheld stability: {Preserve authentic phone micro-shake (approximately 1–2px amplitude), but frame center of gravity should match original video}
Lens movement trajectory: {e.g.: "Lens pushes in 3% over 2 seconds, depth of field transitions from 0.3m to 0.2m"}
Zoom logic: {e.g.: "Lens zoom-in speed 0.8x/sec, background blur changes synchronously with distance"}

5) Overall Visual Style
Present authentic handheld phone video quality, including slight noise, natural light shake, and realistic exposure contrast.
No cinematic filters, artificial softening, or excessive color grading.
Color tone, contrast, brightness, exposure, and saturation all match the original video.
Authentic physical feedback: {Skin maintains natural highlights, fabric maintains crease direction, metal reflections consistent with perspective}
All visual characteristics (sharpness, exposure, color temperature) change synchronously with camera movement.

6) No Text or Graphics
No watermarks, logos, subtitles, UI layers, or graphic overlays allowed.
Output must be a clean frame.

7) Dialogue & Timing (if applicable)
If dialogue or audio-visual synchronized scenes appear in the first 5 seconds, annotate dialogue and action timeline synchronously.
Character A (00:02–00:04): "{dialogue content}"
Character B (00:05–00:07): "{dialogue content}"

[KEY INSTRUCTION: Integrate Explosive Moments & Emotion]
Before writing section (8) Action & Shot Breakdown below, you must first complete in your mind the analysis of the video's explosive moments, essence, and emotional dynamics (answering the questions I posed at the very beginning).
When writing the shot breakdown, you must inject these analyses (explosive moments, intent, emotional shifts) into every action description — not merely physical descriptions.
(Wrong example — physical description only):
00:06–00:08 Action: A raises finger pointing at camera. Expression: eyes widen.
(Correct example — integrated emotional intent):
00:06–00:08 Action: [Video essence] A's expression shifts from [playful] to [exaggerated 'caught you'], decisively raising finger with humorous 'attack' intensity pointing directly at camera. Expression: [Emotional shift] Eyes exaggeratedly widen, achieving [Explosive moment: breaking the fourth wall].

8) Action & Shot Breakdown (0–25 seconds)
[KEY CONSTRAINT: Description Priority] If an action is both a 'character action' (e.g.: turning head, running) and simultaneously causes 'camera movement' (e.g.: frame blur, shake), prioritize using everyday language to describe the character's physical action (e.g. 'character quickly turns head'), rather than describing the technical camera effect this action produces (e.g. 'whip pan').
Each time segment should exactly correspond to the original video's timeline, lens movement trajectory, and character action rhythm.
Each segment must describe: camera angle, focal length changes, body movement path, light interaction, and action/expression/emotional shifts [integrated with explosive moment analysis].
Use the following segment as a standard description format; replace actual content based on the original video.
00:00–00:02
Shot: {chest height, medium shot, 3/4 angle, slight handheld shake}
Camera movement: {stable push-in 1%, focal length constant, perspective unchanged}
Lighting: {natural light from upper right, brightness gradually increasing}
Action: {Character A enters frame from right, with [Emotion A, e.g.: calm/suspenseful] expression, body slightly leaning forward...}
Expression: {calm and focused}
Emotion: {steady, confident}
00:02–00:04
Shot: {slow push-in 3%, focus locked on eyes}
Camera angle: {adjusting from slight downward to level, lens slightly tilts up approximately 2 degrees}
Action: {[Explosive moment setup] A raises hand holding phone, [execution intent, e.g.: preparing to reveal], wrist rotates 15 degrees...}
Expression: {concentrated observation, eyebrow slightly raised}
Emotion: {anticipation, focused attention}
00:04–00:05
Shot: {fixed, focal length unchanged, exposure constant}
Background: {B enters from left rear, background light slightly flashes}
Action: {B turns head toward A, [emotional shift: achieving first explosive moment/reaction], corner of mouth smiles...}
Emotion: {relaxed, interactive feel}
Shot: {fixed, depth of field unchanged}
Action: {Both [maintain post-explosive-moment posture], slight breathing movement}
Lighting: {ambient light dims slightly 0.2 stops, maintaining original rhythm}
Emotion: {calm, natural ending}

9) Output Quality & Constraints
Aspect ratio: 1080x1920 (9:16 vertical).
Style: Authentic handheld shooting style, no cinematic filters or artificial rendering.
Prohibited: Changing camera angle, environment, lighting, or characters (facial features, hairstyle, body type). Text, watermarks, AI filters, blur artifacts.

STRICT EXECUTION!! All output content must be in English.`;
}
