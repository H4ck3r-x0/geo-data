/**
 * Build Registry Script
 * Downloads dr5hn's database and transforms it to our format
 *
 * Usage: npx tsx scripts/build-registry.ts
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REGISTRY_DIR = path.join(ROOT, "registry");
const COUNTRIES_DIR = path.join(REGISTRY_DIR, "countries");

const SOURCE_URL =
  "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries%2Bstates%2Bcities.json";
const CACHE_FILE = path.join(ROOT, ".cache", "source-data.json");

// Languages we support (mapped from dr5hn's keys)
const LANG_MAP: Record<string, string> = {
  ar: "ar",
  de: "de",
  es: "es",
  fr: "fr",
  hi: "hi",
  it: "it",
  ja: "ja",
  ko: "ko",
  nl: "nl",
  pl: "pl",
  pt: "pt",
  "pt-BR": "pt-BR",
  ru: "ru",
  tr: "tr",
  uk: "uk",
  "zh-CN": "zh",
};

interface SourceCountry {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phonecode: string;
  currency: string;
  emoji: string;
  native: string;
  timezones: { zoneName: string }[];
  translations: Record<string, string>;
  states: SourceState[];
}

interface SourceState {
  id: number;
  name: string;
  iso3166_2: string;
  native: string;
  latitude: string;
  longitude: string;
  translations: Record<string, string>;
  cities: SourceCity[];
}

interface SourceCity {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  translations?: Record<string, string>;
}

interface OutputCountry {
  code: string;
  iso3: string;
  name: Record<string, string>;
  phone: string;
  currency: string;
  timezone: string;
  flag: string;
  regions: OutputRegion[];
}

interface OutputRegion {
  code: string;
  name: Record<string, string>;
  cities: OutputCity[];
}

interface OutputCity {
  name: Record<string, string>;
  latitude: number;
  longitude: number;
}

interface RegistryIndex {
  version: string;
  countries: Record<
    string,
    {
      name: { en: string; ar?: string };
      flag: string;
      languages: string[];
    }
  >;
}

async function downloadSource(): Promise<SourceCountry[]> {
  // Check cache first
  if (await fs.pathExists(CACHE_FILE)) {
    console.log("📦 Using cached source data...");
    return fs.readJson(CACHE_FILE);
  }

  console.log("⬇️  Downloading source data (46MB)...");
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  const data = await response.json();

  // Cache it
  await fs.ensureDir(path.dirname(CACHE_FILE));
  await fs.writeJson(CACHE_FILE, data);
  console.log("✓ Downloaded and cached");

  return data;
}

function buildName(englishName: string, translations: Record<string, string> = {}): Record<string, string> {
  const name: Record<string, string> = { en: englishName };

  for (const [sourceKey, ourKey] of Object.entries(LANG_MAP)) {
    if (translations[sourceKey]) {
      name[ourKey] = translations[sourceKey];
    }
  }

  return name;
}

function transformCountry(source: SourceCountry): OutputCountry {
  const regions: OutputRegion[] = (source.states || [])
    .filter((state) => state.cities && state.cities.length > 0)
    .map((state) => ({
      code: state.iso3166_2 || `${source.iso2}-${state.id}`,
      name: buildName(state.name, state.translations),
      cities: (state.cities || []).map((city) => ({
        name: buildName(city.name, city.translations),
        latitude: parseFloat(city.latitude) || 0,
        longitude: parseFloat(city.longitude) || 0,
      })),
    }));

  return {
    code: source.iso2,
    iso3: source.iso3,
    name: buildName(source.name, source.translations),
    phone: `+${source.phonecode.replace(/^0+/, "")}`,
    currency: source.currency,
    timezone: source.timezones?.[0]?.zoneName?.replace(/\\/g, "") || "UTC",
    flag: source.emoji,
    regions,
  };
}

function getAvailableLanguages(country: OutputCountry): string[] {
  const langs = new Set<string>(["en"]);

  // Check country name
  for (const lang of Object.keys(country.name)) {
    langs.add(lang);
  }

  // Check a sample of regions/cities
  for (const region of country.regions.slice(0, 3)) {
    for (const lang of Object.keys(region.name)) {
      langs.add(lang);
    }
    for (const city of region.cities.slice(0, 5)) {
      for (const lang of Object.keys(city.name)) {
        langs.add(lang);
      }
    }
  }

  return Array.from(langs).sort();
}

async function main() {
  console.log("🌍 Building geo-data registry\n");

  // Download source
  const sourceData = await downloadSource();
  console.log(`📊 Source has ${sourceData.length} countries\n`);

  // Prepare directories
  await fs.ensureDir(COUNTRIES_DIR);

  // Transform and write each country
  const index: RegistryIndex = {
    version: "0.0.1",
    countries: {},
  };

  let processed = 0;
  let skipped = 0;

  for (const source of sourceData) {
    try {
      const country = transformCountry(source);
      const code = country.code.toLowerCase();

      // Skip countries with no regions/cities
      if (country.regions.length === 0) {
        skipped++;
        continue;
      }

      // Write country file
      const outputPath = path.join(COUNTRIES_DIR, `${code}.json`);
      await fs.writeJson(outputPath, country, { spaces: 2 });

      // Add to index
      index.countries[code] = {
        name: {
          en: country.name.en,
          ar: country.name.ar,
        },
        flag: country.flag,
        languages: getAvailableLanguages(country),
      };

      processed++;

      // Progress indicator
      if (processed % 25 === 0) {
        console.log(`  ✓ Processed ${processed} countries...`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to process ${source.name}: ${error}`);
      skipped++;
    }
  }

  // Write index
  await fs.writeJson(path.join(REGISTRY_DIR, "index.json"), index, { spaces: 2 });

  console.log(`\n✅ Done!`);
  console.log(`   ${processed} countries processed`);
  console.log(`   ${skipped} countries skipped (no cities)`);
  console.log(`   Output: ${REGISTRY_DIR}/`);
}

main().catch(console.error);
