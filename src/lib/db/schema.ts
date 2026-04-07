import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ──────────────────────────────────────────────
// Projects table
// ──────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  amazonUrl: text("amazon_url").notNull(),
  asin: text("asin").notNull(),
  productData: text("product_data").notNull(), // JSON string
  status: text("status").notNull().default("created"),
  // created | scripts_generated | refining | refined | generating_video | completed | failed
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ──────────────────────────────────────────────
// Scripts table (Stage 1 output)
// ──────────────────────────────────────────────
export const scripts = sqliteTable("scripts", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  hook: text("hook").notNull(),
  concept: text("concept").notNull(),
  targetAudience: text("target_audience"),
  tone: text("tone"),
  sceneSummaries: text("scene_summaries").notNull(), // JSON array
  narration: text("narration"),
  cta: text("cta").notNull(),
  estimatedDuration: integer("estimated_duration"),
  status: text("status").notNull().default("generated"),
  rawJson: text("raw_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ──────────────────────────────────────────────
// Screenplays table (Stage 2 output)
// ──────────────────────────────────────────────
export const screenplays = sqliteTable("screenplays", {
  id: text("id").primaryKey(),
  scriptId: text("script_id")
    .notNull()
    .references(() => scripts.id),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  totalDuration: integer("total_duration"),
  status: text("status").notNull().default("created"),
  rawJson: text("raw_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ──────────────────────────────────────────────
// Scenes table (Stage 2 child)
// ──────────────────────────────────────────────
export const scenes = sqliteTable("scenes", {
  id: text("id").primaryKey(),
  screenplayId: text("screenplay_id")
    .notNull()
    .references(() => screenplays.id),
  sceneNumber: integer("scene_number").notNull(),
  title: text("title"),
  visualDescription: text("visual_description").notNull(),
  cameraAngle: text("camera_angle"),
  cameraMovement: text("camera_movement"),
  dialogue: text("dialogue"),
  textOverlay: text("text_overlay"),
  transition: text("transition"),
  duration: integer("duration").notNull(),
  musicMood: text("music_mood"),
  soundEffects: text("sound_effects"),
  colorPalette: text("color_palette"),
  lightingStyle: text("lighting_style"),
});

// ──────────────────────────────────────────────
// Video Jobs table (Stage 3 tracking)
// ──────────────────────────────────────────────
export const videoJobs = sqliteTable("video_jobs", {
  id: text("id").primaryKey(),
  sceneId: text("scene_id")
    .notNull()
    .references(() => scenes.id),
  screenplayId: text("screenplay_id")
    .notNull()
    .references(() => screenplays.id),
  soraJobId: text("sora_job_id"),
  status: text("status").notNull().default("pending"),
  progress: integer("progress"),
  errorMessage: text("error_message"),
  videoUrl: text("video_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// ──────────────────────────────────────────────
// Prompt Templates table
// ──────────────────────────────────────────────
export const promptTemplates = sqliteTable("prompt_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  template: text("template").notNull(),
  version: integer("version").notNull().default(1),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
