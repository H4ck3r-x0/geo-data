/**
 * Add Arabic names to all cities globally using GeoNames data
 *
 * 1. Downloads GeoNames alternateNames (Arabic only)
 * 2. Downloads GeoNames cities data (for coordinates)
 * 3. Matches our cities by coordinates
 * 4. Updates registry with Arabic names
 */

import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import * as readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CACHE_DIR = path.join(ROOT, ".cache");
const COUNTRIES_DIR = path.join(ROOT, "registry", "countries");

// GeoNames files
const CITIES_URL = "https://download.geonames.org/export/dump/cities15000.zip"; // Cities with pop > 15000
const ALT_NAMES_URL = "https://download.geonames.org/export/dump/alternateNamesV2.zip";

interface GeoCity {
  geonameId: string;
  name: string;
  lat: number;
  lng: number;
  countryCode: string;
}

// Round coordinates for matching (approximately 1km precision)
function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

async function downloadAndExtract(url: string, filename: string): Promise<string> {
  const zipPath = path.join(CACHE_DIR, `${filename}.zip`);
  const txtPath = path.join(CACHE_DIR, `${filename}.txt`);

  if (await fs.pathExists(txtPath)) {
    console.log(`  📦 Using cached ${filename}`);
    return txtPath;
  }

  console.log(`  ⬇️  Downloading ${filename}...`);
  await fs.ensureDir(CACHE_DIR);

  execSync(`curl -L -o "${zipPath}" "${url}"`, { stdio: "inherit" });
  execSync(`unzip -o "${zipPath}" -d "${CACHE_DIR}"`, { stdio: "inherit" });

  return txtPath;
}

async function loadGeoCities(): Promise<Map<string, GeoCity>> {
  console.log("\n📍 Loading GeoNames cities...");

  const citiesFile = await downloadAndExtract(CITIES_URL, "cities15000");
  const cities = new Map<string, GeoCity>();

  const fileStream = fs.createReadStream(citiesFile);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    const parts = line.split("\t");
    if (parts.length < 9) continue;

    const city: GeoCity = {
      geonameId: parts[0],
      name: parts[1],
      lat: parseFloat(parts[4]),
      lng: parseFloat(parts[5]),
      countryCode: parts[8],
    };

    // Index by geonameId
    cities.set(city.geonameId, city);
  }

  console.log(`  ✓ Loaded ${cities.size} cities`);
  return cities;
}

async function loadArabicNames(): Promise<Map<string, string>> {
  console.log("\n🔤 Loading Arabic names...");

  const altNamesFile = await downloadAndExtract(ALT_NAMES_URL, "alternateNamesV2");
  const arabicNames = new Map<string, string>();

  const fileStream = fs.createReadStream(altNamesFile);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  for await (const line of rl) {
    const parts = line.split("\t");
    if (parts.length < 4) continue;

    const langCode = parts[2];
    if (langCode !== "ar") continue;

    const geonameId = parts[1];
    const name = parts[3];

    // Keep first Arabic name found (usually the preferred one)
    if (!arabicNames.has(geonameId)) {
      arabicNames.set(geonameId, name);
      count++;
    }
  }

  console.log(`  ✓ Loaded ${count} Arabic names`);
  return arabicNames;
}

function buildCoordIndex(geoCities: Map<string, GeoCity>, arabicNames: Map<string, string>): Map<string, string> {
  console.log("\n🗺️  Building coordinate index...");

  const coordIndex = new Map<string, string>();

  for (const [geonameId, city] of geoCities) {
    const arabic = arabicNames.get(geonameId);
    if (!arabic) continue;

    const key = coordKey(city.lat, city.lng);

    // If multiple cities at same coords, keep the one with Arabic
    if (!coordIndex.has(key)) {
      coordIndex.set(key, arabic);
    }
  }

  console.log(`  ✓ Indexed ${coordIndex.size} locations`);
  return coordIndex;
}

async function updateCountries(coordIndex: Map<string, string>) {
  console.log("\n🌍 Updating countries...\n");

  const countryFiles = await fs.readdir(COUNTRIES_DIR);
  let totalUpdated = 0;
  let totalCities = 0;

  for (const file of countryFiles) {
    if (!file.endsWith(".json")) continue;

    const filePath = path.join(COUNTRIES_DIR, file);
    const data = await fs.readJson(filePath);
    let updated = 0;
    let cities = 0;

    for (const region of data.regions || []) {
      for (const city of region.cities || []) {
        cities++;

        // Skip if already has Arabic
        if (city.name.ar) continue;

        const key = coordKey(city.latitude, city.longitude);
        const arabic = coordIndex.get(key);

        if (arabic) {
          city.name.ar = arabic;
          updated++;
        }
      }
    }

    if (updated > 0) {
      await fs.writeJson(filePath, data, { spaces: 2 });
    }

    totalUpdated += updated;
    totalCities += cities;

    if (updated > 0) {
      console.log(`  ${data.flag} ${data.code}: ${updated}/${cities} cities updated`);
    }
  }

  console.log(`\n✅ Done! Updated ${totalUpdated}/${totalCities} cities with Arabic names`);
}

async function main() {
  console.log("🌍 Adding Arabic names to all cities globally\n");
  console.log("This will download ~200MB of GeoNames data.\n");

  try {
    const geoCities = await loadGeoCities();
    const arabicNames = await loadArabicNames();
    const coordIndex = buildCoordIndex(geoCities, arabicNames);
    await updateCountries(coordIndex);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
