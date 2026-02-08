/**
 * Manual fixes for missing Arabic names
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COUNTRIES_DIR = path.join(__dirname, "..", "registry", "countries");

// Manual Arabic name mappings for common cities
const CITY_FIXES: Record<string, Record<string, string>> = {
  sa: {
    Khobar: "الخبر",
    "Al Khobar": "الخبر",
    Dhahran: "الظهران",
    Jubail: "الجبيل",
    Yanbu: "ينبع",
    "Al-Ahsa": "الأحساء",
    "Hafar Al-Batin": "حفر الباطن",
    Najran: "نجران",
    Jazan: "جازان",
    Jizan: "جازان",
    Madinah: "المدينة المنورة",
    Medina: "المدينة المنورة",
    Makkah: "مكة المكرمة",
    Mecca: "مكة المكرمة",
    Buraydah: "بريدة",
    Unaizah: "عنيزة",
    Hail: "حائل",
    "Ha'il": "حائل",
    Arar: "عرعر",
    Sakakah: "سكاكا",
    "Al Qatif": "القطيف",
    Qatif: "القطيف",
    Hofuf: "الهفوف",
  },
  ae: {
    Dubai: "دبي",
    "Abu Dhabi": "أبوظبي",
    Sharjah: "الشارقة",
    Ajman: "عجمان",
    "Ras Al Khaimah": "رأس الخيمة",
    Fujairah: "الفجيرة",
    "Umm Al Quwain": "أم القيوين",
    "Al Ain": "العين",
  },
  qa: {
    Doha: "الدوحة",
    "Al Wakrah": "الوكرة",
    "Al Khor": "الخور",
    "Al Rayyan": "الريان",
    "Umm Salal": "أم صلال",
    Lusail: "لوسيل",
    Mesaieed: "مسيعيد",
  },
  kw: {
    "Kuwait City": "مدينة الكويت",
    Hawalli: "حولي",
    Salmiya: "السالمية",
    Farwaniya: "الفروانية",
    Jahra: "الجهراء",
    Ahmadi: "الأحمدي",
    Fahaheel: "الفحيحيل",
  },
  bh: {
    Manama: "المنامة",
    Riffa: "الرفاع",
    Muharraq: "المحرق",
    "Hamad Town": "مدينة حمد",
    "Isa Town": "مدينة عيسى",
  },
  om: {
    Muscat: "مسقط",
    Salalah: "صلالة",
    Sohar: "صحار",
    Nizwa: "نزوى",
    Sur: "صور",
    Ibri: "عبري",
  },
};

async function fixCountry(code: string, fixes: Record<string, string>) {
  const filePath = path.join(COUNTRIES_DIR, `${code}.json`);

  if (!(await fs.pathExists(filePath))) {
    console.log(`  ⚠️  ${code.toUpperCase()} not found`);
    return 0;
  }

  const data = await fs.readJson(filePath);
  let fixed = 0;

  for (const region of data.regions) {
    for (const city of region.cities) {
      const englishName = city.name.en;

      // Check if we have a fix for this city
      for (const [pattern, arabic] of Object.entries(fixes)) {
        if (
          englishName.toLowerCase() === pattern.toLowerCase() ||
          englishName.toLowerCase().includes(pattern.toLowerCase())
        ) {
          if (!city.name.ar) {
            city.name.ar = arabic;
            fixed++;
          }
          break;
        }
      }
    }
  }

  await fs.writeJson(filePath, data, { spaces: 2 });
  return fixed;
}

async function main() {
  console.log("🔧 Applying manual Arabic fixes\n");

  for (const [code, fixes] of Object.entries(CITY_FIXES)) {
    const fixed = await fixCountry(code, fixes);
    console.log(`  ${code.toUpperCase()}: ${fixed} cities fixed`);
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);
