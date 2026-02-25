import { getCities, getCountry, getCountryCodes, getLocalizedName, getRegions } from "./data/geo/index.js";

const langs = ["en", "ar"];
const langLabel = { en: "English", ar: "Arabic" };
const divider = "─".repeat(50);

for (const code of getCountryCodes()) {
  const country = getCountry(code);
  console.log(divider);
  console.log(`${country.flag}  ${langs.map((l) => `${langLabel[l]}: ${getLocalizedName(country, l)}`).join("  |  ")}`);
  console.log(divider);

  for (const region of getRegions(code)) {
    console.log(`\n  Region: ${langs.map((l) => getLocalizedName(region, l)).join(" / ")}`);

    const cities = getCities(code, region.code);
    for (const city of cities) {
      console.log(`    - ${langs.map((l) => getLocalizedName(city, l)).join(" / ")}`);
    }
  }
  console.log();
}
