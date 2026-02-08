import fs from "fs-extra";
import { intro, p } from "../utils/ui.js";
import { type GeoDataConfig, getConfigResult } from "./config.js";

export type CommandOptions = { force?: boolean; dryRun?: boolean };

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Loads config and shows an error if not initialized.
 * Returns null on failure (after displaying error UI).
 */
export async function requireConfig(commandName: string): Promise<GeoDataConfig | null> {
  const result = await getConfigResult();

  if (result.status === "ok") return result.config;

  intro(commandName);
  if (result.status === "not_found") {
    p.log.error("No geo-data.json found. Run 'npx geo-data init' first.");
  } else {
    p.log.error(`Invalid geo-data.json: ${result.error}`);
  }
  console.log();
  return null;
}

/**
 * Reads installed country codes from the output directory.
 * Returns sorted array of lowercase country codes.
 */
export async function getInstalledCountries(outputDir: string): Promise<string[]> {
  const files = await fs.readdir(outputDir).catch(() => [] as string[]);
  return files.filter((f) => f.endsWith(".json") && f !== "index.json").map((f) => f.replace(".json", ""));
}

/**
 * Formats a country for display, e.g. "🇸🇦 SA - Saudi Arabia"
 */
export function formatCountryDisplay(code: string, info?: { name: { en: string }; flag: string }): string {
  if (info) {
    return `${info.flag} ${code.toUpperCase()} - ${info.name.en}`;
  }
  return code.toUpperCase();
}
