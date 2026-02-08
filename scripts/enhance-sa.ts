/**
 * Enhance Saudi Arabia data with Arabic city names
 * Source: https://github.com/harbi/saudi-geo
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SA_FILE = path.join(ROOT, "registry", "countries", "sa.json");

const CITIES_URL = "https://raw.githubusercontent.com/harbi/saudi-geo/master/data/cities.json";
const REGIONS_URL = "https://raw.githubusercontent.com/harbi/saudi-geo/master/data/regions.json";

interface HarbiCity {
  name_ar: string;
  name_en: string;
  latitude: number;
  longitude: number;
  region_code: number;
}

interface HarbiRegion {
  name_ar: string;
  name_en: string;
  code: number;
}

async function main() {
  console.log("🇸🇦 Enhancing Saudi Arabia with Arabic names\n");

  // Load our SA data
  const saData = await fs.readJson(SA_FILE);

  // Fetch Arabic data
  console.log("⬇️  Fetching Arabic city names...");
  const [citiesRes, regionsRes] = await Promise.all([fetch(CITIES_URL), fetch(REGIONS_URL)]);

  const harbiCities: HarbiCity[] = await citiesRes.json();
  const harbiRegions: HarbiRegion[] = await regionsRes.json();

  console.log(`   Found ${harbiCities.length} cities, ${harbiRegions.length} regions\n`);

  // Create lookup maps
  const regionArabicMap = new Map<string, string>();
  for (const r of harbiRegions) {
    // Normalize English name for matching
    const normalized = r.name_en.toLowerCase().trim();
    regionArabicMap.set(normalized, r.name_ar);
  }

  const cityArabicMap = new Map<string, string>();
  for (const c of harbiCities) {
    // Normalize English name for matching
    const normalized = c.name_en.toLowerCase().trim();
    cityArabicMap.set(normalized, c.name_ar);
  }

  // Enhance regions
  let regionsEnhanced = 0;
  let citiesEnhanced = 0;

  for (const region of saData.regions) {
    // Try to match region
    const regionNameEn = region.name.en.toLowerCase().trim();

    // Try different matching strategies
    let arabicRegion = regionArabicMap.get(regionNameEn);
    if (!arabicRegion) {
      // Try partial match
      for (const [key, value] of regionArabicMap) {
        if (regionNameEn.includes(key) || key.includes(regionNameEn)) {
          arabicRegion = value;
          break;
        }
      }
    }

    if (arabicRegion) {
      region.name.ar = arabicRegion;
      regionsEnhanced++;
    }

    // Enhance cities
    for (const city of region.cities) {
      const cityNameEn = city.name.en.toLowerCase().trim();

      let arabicCity = cityArabicMap.get(cityNameEn);
      if (!arabicCity) {
        // Try partial match or without "al " prefix
        const withoutAl = cityNameEn.replace(/^al[- ]/, "");
        arabicCity = cityArabicMap.get(withoutAl);

        if (!arabicCity) {
          // Try finding similar
          for (const [key, value] of cityArabicMap) {
            const keyClean = key.replace(/^al[- ]/, "");
            if (cityNameEn.includes(keyClean) || keyClean.includes(withoutAl)) {
              arabicCity = value;
              break;
            }
          }
        }
      }

      if (arabicCity) {
        city.name.ar = arabicCity;
        citiesEnhanced++;
      }
    }
  }

  // Save enhanced data
  await fs.writeJson(SA_FILE, saData, { spaces: 2 });

  console.log("✅ Done!");
  console.log(`   Regions with Arabic: ${regionsEnhanced}/${saData.regions.length}`);
  console.log(
    `   Cities with Arabic: ${citiesEnhanced}/${saData.regions.reduce((sum: number, r: { cities: unknown[] }) => sum + r.cities.length, 0)}`,
  );
}

main().catch(console.error);
