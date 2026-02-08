import fs from "fs-extra";
import path from "path";
import { generateIndex } from "../utils/codegen.js";
import {
  type CommandOptions,
  errorMessage,
  formatCountryDisplay,
  getInstalledCountries,
  requireConfig,
} from "../utils/helpers.js";
import { fetchCountry, fetchRegistry } from "../utils/registry.js";
import { intro, outro, p } from "../utils/ui.js";

export async function update(options: CommandOptions = {}) {
  const config = await requireConfig("Update Countries");
  if (!config) {
    process.exitCode = 1;
    return;
  }

  intro("Update Countries");

  const s = p.spinner();
  s.start("Checking installed countries");

  try {
    const installed = await getInstalledCountries(config.outputDir);

    if (installed.length === 0) {
      s.stop("No countries found");
      p.log.warn("No countries installed");
      p.log.message("Run: npx geo-data add sa ae");
      console.log();
      process.exitCode = 1;
      return;
    }

    const registry = await fetchRegistry();
    if (!registry) {
      s.stop("Failed");
      p.log.error("Could not load registry — invalid data from remote");
      console.log();
      process.exitCode = 1;
      return;
    }
    s.stop(`Found ${installed.length} countries`);

    if (options.dryRun) {
      const list = installed
        .sort()
        .map((code) => formatCountryDisplay(code, registry.countries[code]))
        .join("\n");

      p.note(list, "Would update (dry run)");
      console.log();
      return;
    }

    let updated = 0;
    for (const code of installed.sort()) {
      const info = registry.countries[code];
      if (!info) continue;

      s.start(`${info.flag} ${info.name.en}`);

      try {
        const countryData = await fetchCountry(code, config);
        if (!countryData) {
          s.stop(`${info.flag} ${info.name.en} - failed: invalid data`);
          continue;
        }
        const outputPath = path.join(config.outputDir, `${code}.json`);
        await fs.writeJson(outputPath, countryData, { spaces: 2 });

        const size = (JSON.stringify(countryData).length / 1024).toFixed(1);
        s.stop(`${info.flag} ${info.name.en} (${size} KB)`);
        updated++;
      } catch (error) {
        s.stop(`${info.flag} ${info.name.en} - failed: ${errorMessage(error)}`);
      }
    }

    const ext = config.typescript ? "ts" : "js";
    s.start(`Regenerating index.${ext}`);
    await generateIndex(config);
    s.stop(`Regenerated index.${ext}`);

    outro(`Updated ${updated} ${updated === 1 ? "country" : "countries"}`);
  } catch (error) {
    s.stop("Failed");
    process.exitCode = 1;
    p.log.error(errorMessage(error));
    console.log();
  }
}
