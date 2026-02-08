import * as p from "@clack/prompts";
import fs from "fs-extra";
import path from "path";
import { errorMessage } from "./helpers.js";
import { ConfigSchema, VALID_LANGUAGES } from "./schemas.js";

export const CONFIG_FILE = "geo-data.json";

export interface GeoDataConfig {
  $schema?: string;
  outputDir: string;
  languages: string[];
  includeCoordinates: boolean;
  typescript: boolean;
}

export function validateConfig(config: unknown): GeoDataConfig {
  const result = ConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid config");
  }

  // Warn for unknown languages (non-fatal)
  for (const lang of result.data.languages) {
    if (!(VALID_LANGUAGES as readonly string[]).includes(lang)) {
      p.log.warn(`Unknown language code "${lang}"`);
    }
  }

  return result.data;
}

export type ConfigResult =
  | { status: "ok"; config: GeoDataConfig }
  | { status: "not_found" }
  | { status: "invalid"; error: string };

export async function getConfigResult(): Promise<ConfigResult> {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE);

  if (!(await fs.pathExists(configPath))) {
    return { status: "not_found" };
  }

  try {
    const raw = await fs.readJson(configPath);
    const config = validateConfig(raw);
    return { status: "ok", config };
  } catch (error) {
    return { status: "invalid", error: errorMessage(error) };
  }
}

export async function getConfig(): Promise<GeoDataConfig | null> {
  const result = await getConfigResult();
  if (result.status === "ok") return result.config;
  if (result.status === "invalid") {
    p.log.error(`Error reading ${CONFIG_FILE}: ${result.error}`);
  }
  return null;
}
