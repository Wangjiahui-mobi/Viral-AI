// ==============================
// Stage 2: 创意脚本深度刻画 Prompt
// 这是默认占位模板，用户后续会提供自己的prompt来替换
// ==============================

export const DEFAULT_SCRIPT_REFINEMENT_PROMPT = `You are an expert video production director. Your task is to take a creative video script concept and transform it into a detailed, production-ready screenplay with precise visual descriptions suitable for AI video generation (Sora).

## Amazon Product Reference
{{amazonUrl}}

## Original Script
- **Title**: {{scriptTitle}}
- **Hook**: {{scriptHook}}
- **Concept**: {{scriptConcept}}
- **Tone**: {{scriptTone}}
- **Target Audience**: {{targetAudience}}
- **Narration Direction**: {{scriptNarration}}
- **Call to Action**: {{scriptCta}}
- **Estimated Duration**: {{estimatedDuration}} seconds

## Scene Summaries from Original Script:
{{scriptScenes}}

## Your Task
Transform each scene summary into a DETAILED production scene. For each scene, provide:

1. **sceneNumber**: Sequential scene number
2. **title**: Short scene title
3. **visualDescription**: DETAILED visual description for AI video generation. This is the MOST important field. Write it as a clear, specific prompt that describes:
   - What is shown on screen (subject, background, objects)
   - Camera perspective and framing
   - Lighting conditions
   - Colors and atmosphere
   - Motion and action happening
   - Style reference (cinematic, product photography, lifestyle, etc.)
4. **cameraAngle**: e.g., "close-up", "medium shot", "wide shot", "bird's eye", "low angle"
5. **cameraMovement**: e.g., "slow zoom in", "pan left to right", "tracking shot", "static"
6. **dialogue**: Voiceover/narration text for this specific scene
7. **textOverlay**: Any on-screen text (price, feature callouts, CTA)
8. **transition**: How this scene transitions to the next (cut, fade, dissolve, swipe)
9. **duration**: Duration in seconds
10. **musicMood**: Music mood/style for this scene
11. **soundEffects**: Any sound effects
12. **colorPalette**: Dominant colors
13. **lightingStyle**: Lighting description

## Output Format
Return a JSON object with the following structure:
{
  "title": "Screenplay Title",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene Title",
      "visualDescription": "Detailed visual description for Sora...",
      "cameraAngle": "close-up",
      "cameraMovement": "slow zoom in",
      "dialogue": "Voiceover text...",
      "textOverlay": "On-screen text",
      "transition": "cut",
      "duration": 5,
      "musicMood": "upbeat electronic",
      "soundEffects": "whoosh",
      "colorPalette": "warm golden tones",
      "lightingStyle": "soft natural daylight"
    }
  ]
}

## Important Guidelines
- The visualDescription field must be EXTREMELY detailed and specific - it will be used directly as prompts for AI video generation
- Keep each scene's duration realistic (3-10 seconds each)
- Ensure smooth narrative flow between scenes
- The total duration should match approximately {{estimatedDuration}} seconds
- Make visual descriptions cinematic and engaging
- Include product details naturally in the visuals

Generate the detailed screenplay now:`;
