import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_PATH || "./data/viral-ai.db";

let _db: BetterSQLite3Database<typeof schema> | null = null;

function getDatabase(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;

  const absolutePath = path.resolve(process.cwd(), DB_PATH);

  // Ensure data directory exists
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(absolutePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 10000");
  sqlite.pragma("foreign_keys = ON");

  // Initialize tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      amazon_url TEXT NOT NULL,
      asin TEXT NOT NULL,
      product_data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      title TEXT NOT NULL,
      hook TEXT NOT NULL,
      concept TEXT NOT NULL,
      target_audience TEXT,
      tone TEXT,
      scene_summaries TEXT NOT NULL,
      narration TEXT,
      cta TEXT NOT NULL,
      estimated_duration INTEGER,
      status TEXT NOT NULL DEFAULT 'generated',
      raw_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS screenplays (
      id TEXT PRIMARY KEY,
      script_id TEXT NOT NULL REFERENCES scripts(id),
      project_id TEXT NOT NULL REFERENCES projects(id),
      title TEXT NOT NULL,
      total_duration INTEGER,
      status TEXT NOT NULL DEFAULT 'created',
      raw_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      screenplay_id TEXT NOT NULL REFERENCES screenplays(id),
      scene_number INTEGER NOT NULL,
      title TEXT,
      visual_description TEXT NOT NULL,
      camera_angle TEXT,
      camera_movement TEXT,
      dialogue TEXT,
      text_overlay TEXT,
      transition TEXT,
      duration INTEGER NOT NULL,
      music_mood TEXT,
      sound_effects TEXT,
      color_palette TEXT,
      lighting_style TEXT
    );

    CREATE TABLE IF NOT EXISTS video_jobs (
      id TEXT PRIMARY KEY,
      scene_id TEXT NOT NULL REFERENCES scenes(id),
      screenplay_id TEXT NOT NULL REFERENCES screenplays(id),
      sora_job_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER,
      error_message TEXT,
      video_url TEXT,
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS prompt_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      template TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  _db = drizzle(sqlite, { schema });
  return _db;
}

// Proxy object that lazily initializes the database on first access
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    const database = getDatabase();
    const value = (database as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});
