import * as p from "@clack/prompts";
import fs from "fs-extra";
import os from "os";
import path from "path";
import type { GeoDataConfig } from "./config.js";
import { type City, type CountryData, CountryDataSchema, type RegistryIndex, RegistryIndexSchema } from "./schemas.js";

export type { City, CountryData, Region, RegistryIndex } from "./schemas.js";

// For production: jsDelivr CDN
// For development: set GEO_DATA_REGISTRY env var to local path
const REGISTRY_BASE = process.env.GEO_DATA_REGISTRY || "https://cdn.jsdelivr.net/gh/H4ck3r-x0/geo-data@main/registry";

// Cache directory for offline support
const CACHE_DIR = path.join(os.homedir(), ".cache", "geo-data");

function isRemoteRegistry(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

async function readCache<T>(cacheKey: string, maxAgeMs: number): Promise<T | null> {
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (await fs.pathExists(cachePath)) {
    const stat = await fs.stat(cachePath);
    if (Date.now() - stat.mtimeMs < maxAgeMs) {
      return fs.readJson(cachePath);
    }
  }
  return null;
}

async function writeCache(cacheKey: string, data: unknown): Promise<void> {
  await fs.ensureDir(CACHE_DIR);
  await fs.writeJson(path.join(CACHE_DIR, `${cacheKey}.json`), data);
}

async function readStaleCache<T>(cacheKey: string): Promise<T | null> {
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (await fs.pathExists(cachePath)) {
    return fs.readJson(cachePath);
  }
  return null;
}

async function fetchJson<T>(urlOrPath: string): Promise<T> {
  // Local file path
  if (path.isAbsolute(urlOrPath) || urlOrPath.startsWith(".")) {
    return fs.readJson(urlOrPath);
  }

  // Remote URL
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(urlOrPath, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${urlOrPath}: ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRegistry(): Promise<RegistryIndex | null> {
  const url = isRemoteRegistry(REGISTRY_BASE) ? `${REGISTRY_BASE}/index.json` : path.join(REGISTRY_BASE, "index.json");

  let data: unknown;

  if (isRemoteRegistry(REGISTRY_BASE)) {
    // Try fresh cache first
    const cached = await readCache<unknown>("registry-index", 60 * 60 * 1000);
    if (cached) {
      data = cached;
    } else {
      // Fetch from network
      try {
        data = await fetchJson(url);
      } catch (error) {
        // Network failed — try stale cache
        const stale = await readStaleCache<unknown>("registry-index");
        if (stale) {
          p.log.warn("Network unavailable, using cached data");
          data = stale;
        } else {
          throw error;
        }
      }
    }
  } else {
    data = await fetchJson(url);
  }

  const result = RegistryIndexSchema.safeParse(data);
  if (!result.success) {
    p.log.warn(`Registry index failed validation: ${result.error.issues[0]?.message}`);
    return null;
  }

  // Cache AFTER validation succeeds
  if (isRemoteRegistry(REGISTRY_BASE)) {
    await writeCache("registry-index", result.data);
  }

  return result.data;
}

export async function fetchCountry(code: string, config: GeoDataConfig): Promise<CountryData | null> {
  const url = isRemoteRegistry(REGISTRY_BASE)
    ? `${REGISTRY_BASE}/countries/${code}.json`
    : path.join(REGISTRY_BASE, "countries", `${code}.json`);

  let raw: unknown;

  if (isRemoteRegistry(REGISTRY_BASE)) {
    const cached = await readCache<unknown>(`country-${code}`, 24 * 60 * 60 * 1000);
    if (cached) {
      raw = cached;
    } else {
      try {
        raw = await fetchJson(url);
      } catch (error) {
        const stale = await readStaleCache<unknown>(`country-${code}`);
        if (stale) {
          p.log.warn("Network unavailable, using cached data");
          raw = stale;
        } else {
          throw error;
        }
      }
    }
  } else {
    raw = await fetchJson(url);
  }

  const result = CountryDataSchema.safeParse(raw);
  if (!result.success) {
    p.log.warn(`Country data for "${code}" failed validation: ${result.error.issues[0]?.message}`);
    return null;
  }

  // Cache AFTER validation succeeds
  if (isRemoteRegistry(REGISTRY_BASE)) {
    await writeCache(`country-${code}`, result.data);
  }

  return filterCountryData(result.data, config);
}

export function filterCountryData(data: CountryData, config: GeoDataConfig): CountryData {
  const filterName = (name: Record<string, string>) => {
    const filtered: Record<string, string> = {};
    for (const lang of config.languages) {
      if (name[lang]) {
        filtered[lang] = name[lang];
      }
    }
    // Always include English as fallback
    if (!filtered.en && name.en) {
      filtered.en = name.en;
    }
    return filtered;
  };

  return {
    ...data,
    name: filterName(data.name),
    regions: data.regions.map((region) => ({
      ...region,
      name: filterName(region.name),
      cities: region.cities.map((city) => {
        const filteredCity: City = {
          name: filterName(city.name),
        };
        if (config.includeCoordinates && city.latitude !== undefined && city.longitude !== undefined) {
          filteredCity.latitude = city.latitude;
          filteredCity.longitude = city.longitude;
        }
        return filteredCity;
      }),
    })),
  };
}

export async function clearCache(): Promise<void> {
  await fs.remove(CACHE_DIR);
}

export async function getCacheInfo(): Promise<{ size: number; files: number } | null> {
  if (!(await fs.pathExists(CACHE_DIR))) {
    return null;
  }

  const files = await fs.readdir(CACHE_DIR);
  let size = 0;

  for (const file of files) {
    const stat = await fs.stat(path.join(CACHE_DIR, file));
    size += stat.size;
  }

  return { size, files: files.length };
}
