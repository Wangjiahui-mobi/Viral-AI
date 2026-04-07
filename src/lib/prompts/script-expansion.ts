// ==============================
// Stage 1: 创意脚本生成 Prompt
// 这是默认占位模板，用户后续会提供自己的prompt来替换
// ==============================

export const DEFAULT_SCRIPT_EXPANSION_PROMPT = `You are a world-class creative director specializing in viral short-form video ads for e-commerce products. Your task is to analyze the following Amazon product page and generate {{scriptCount}} unique, compelling video scripts.

## Amazon Product Link
{{amazonUrl}}

Please analyze this Amazon product page thoroughly - look at the product title, images, description, features, price, reviews, and any other relevant information available from the URL.

## Requirements
Generate {{scriptCount}} DIFFERENT creative video scripts for short-form social media platforms (TikTok, Instagram Reels, YouTube Shorts). Each script should take a UNIQUE angle/approach.

Each script MUST include:
1. **title**: A catchy title for the script concept
2. **hook**: The opening hook (first 3 seconds) - must be attention-grabbing
3. **concept**: The overall video concept/creative angle
4. **targetAudience**: Who this video is targeting
5. **tone**: The mood/tone (e.g., humorous, professional, emotional, ASMR, dramatic)
6. **scenes**: Array of 3-6 scenes, each with:
   - sceneNumber: Sequential number
   - briefDescription: 1-2 sentence description of what happens
   - duration: Duration in seconds
7. **narration**: Overall narration style and direction
8. **cta**: Call to action at the end
9. **estimatedDuration**: Total video duration in seconds (15-60 seconds)

## Output Format
Return a JSON array of script objects:
[
  {
    "title": "Script Title",
    "hook": "Opening hook text",
    "concept": "Creative angle description",
    "targetAudience": "Target audience",
    "tone": "Video tone",
    "scenes": [
      { "sceneNumber": 1, "briefDescription": "Scene description", "duration": 5 }
    ],
    "narration": "Narration direction",
    "cta": "Call to action",
    "estimatedDuration": 30
  }
]

## Creative Direction
- Make each script DISTINCTLY different in approach
- Think about what would make someone stop scrolling
- Consider pain points, desires, and emotional triggers
- Use proven viral video formulas (before/after, challenge, unboxing, POV, etc.)
- Keep scripts punchy and fast-paced for social media

Generate {{scriptCount}} scripts now:`;

// ==============================
// Prompt Interpolation Utility
// ==============================
export function interpolatePrompt(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => variables[key] ?? `{{${key}}}`
  );
}
