import fs from "fs-extra";
import path from "path";
import { findBestMatch } from "string-similarity";
import { generateIndex } from "../utils/codegen.js";
import { type CommandOptions, errorMessage, formatCountryDisplay, requireConfig } from "../utils/helpers.js";
import { fetchCountry, fetchRegistry } from "../utils/registry.js";
import { cancel, intro, outro, p } from "../utils/ui.js";

export async function add(countryCodes: string[], options: CommandOptions = {}) {
  const config = await requireConfig("Add Countries");
  if (!config) {
    process.exitCode = 1;
    return;
  }

  intro("Add Countries");

  const codes = countryCodes.map((c) => c.toLowerCase());
  const s = p.spinner();
  s.start("Fetching registry");

  try {
    const registry = await fetchRegistry();
    if (!registry) {
      s.stop("Failed");
      p.log.error("Could not load registry — invalid data from remote");
      console.log();
      process.exitCode = 1;
      return;
    }

    const invalid = codes.filter((c) => !registry.countries[c]);
    if (invalid.length > 0) {
      s.stop("Registry loaded");

      const allCodes = Object.keys(registry.countries);

      for (const code of invalid) {
        p.log.error(`Unknown country code: ${code.toUpperCase()}`);

        const match = findBestMatch(code.toLowerCase(), allCodes);
        if (match.bestMatch.rating > 0.3) {
          const suggested = match.bestMatch.target;
          const info = registry.countries[suggested];
          p.log.info(`Did you mean ${info.flag} ${suggested.toUpperCase()} (${info.name.en})?`);
        }
      }

      p.log.message("Run: npx geo-data list");
      console.log();
      process.exitCode = 1;
      return;
    }

    const existing: string[] = [];
    for (const code of codes) {
      const outputPath = path.join(config.outputDir, `${code}.json`);
      if (await fs.pathExists(outputPath)) {
        existing.push(code);
      }
    }

    s.stop("Registry loaded");

    if (existing.length > 0 && !options.force && !options.dryRun) {
      const existingList = existing.map((code) => formatCountryDisplay(code, registry.countries[code])).join("\n");

      p.note(existingList, "Already installed");

      const overwrite = await p.confirm({
        message: "Overwrite existing countries?",
        initialValue: false,
      });

      if (p.isCancel(overwrite) || !overwrite) {
        const newCodes = codes.filter((c) => !existing.includes(c));
        if (newCodes.length === 0) {
          cancel("Nothing to add");
          return;
        }
        codes.length = 0;
        codes.push(...newCodes);
      }
    }

    if (options.dryRun) {
      const list = codes.map((code) => formatCountryDisplay(code, registry.countries[code])).join("\n");

      p.note(list, "Would add (dry run)");
      p.log.info(`Target: ${config.outputDir}/`);
      console.log();
      return;
    }

    const added: string[] = [];
    const failed: string[] = [];

    for (const code of codes) {
      const info = registry.countries[code];
      s.start(`${info.flag} ${info.name.en}`);

      try {
        const countryData = await fetchCountry(code, config);
        if (!countryData) {
          s.stop(`${info.flag} ${info.name.en} - failed: invalid data`);
          failed.push(code);
          continue;
        }
        const outputPath = path.join(config.outputDir, `${code}.json`);

        await fs.ensureDir(config.outputDir);
        await fs.writeJson(outputPath, countryData, { spaces: 2 });

        const size = (JSON.stringify(countryData).length / 1024).toFixed(1);
        s.stop(`${info.flag} ${info.name.en} (${size} KB)`);
        added.push(code);
      } catch (error) {
        s.stop(`${info.flag} ${info.name.en} - failed: ${errorMessage(error)}`);
        failed.push(code);
      }
    }

    if (added.length > 0) {
      const ext = config.typescript ? "ts" : "js";
      s.start(`Generating index.${ext}`);
      await generateIndex(config);
      s.stop(`Generated index.${ext}`);
    }

    if (failed.length > 0) {
      process.exitCode = 1;
      p.log.warn(`Failed: ${failed.map((c) => c.toUpperCase()).join(", ")}`);
    }

    if (added.length > 0) {
      p.note(`import { getCities } from '${config.outputDir}';`, "Usage");
      outro(`Added ${added.length} ${added.length === 1 ? "country" : "countries"}`);
    }
  } catch (error) {
    s.stop("Failed");
    process.exitCode = 1;
    p.log.error(errorMessage(error));
    console.log();
  }
}
