import chalk from "chalk";
import { getConfig } from "../utils/config.js";
import { errorMessage, getInstalledCountries } from "../utils/helpers.js";
import { fetchRegistry } from "../utils/registry.js";
import { intro, outro, p } from "../utils/ui.js";

interface ListOptions {
  installed?: boolean;
}

export async function list(options: ListOptions = {}) {
  const config = await getConfig();

  intro(options.installed ? "Installed Countries" : "Available Countries");

  const s = p.spinner();
  s.start("Fetching countries");

  try {
    const registry = await fetchRegistry();
    if (!registry) {
      s.stop("Failed");
      p.log.error("Could not load registry — invalid data from remote");
      console.log();
      process.exitCode = 1;
      return;
    }

    let installedSet = new Set<string>();
    if (config) {
      const installed = await getInstalledCountries(config.outputDir);
      installedSet = new Set(installed);
    }

    s.stop("Countries loaded");

    let countries = Object.entries(registry.countries).sort((a, b) => a[1].name.en.localeCompare(b[1].name.en));

    if (options.installed) {
      if (installedSet.size === 0) {
        p.log.warn("No countries installed yet");
        p.log.message("Run: npx geo-data add sa ae qa");
        console.log();
        return;
      }

      countries = countries.filter(([code]) => installedSet.has(code));
    }

    console.log();

    let currentLetter = "";

    for (const [code, info] of countries) {
      const firstLetter = info.name.en[0].toUpperCase();

      if (firstLetter !== currentLetter && !options.installed) {
        if (currentLetter !== "") console.log();
        currentLetter = firstLetter;
      }

      const installed = installedSet.has(code);
      const marker = installed ? chalk.green("●") : chalk.dim("○");
      const codeStyled = installed ? chalk.green.bold(code.toUpperCase()) : chalk.white(code.toUpperCase());

      console.log(`  ${marker} ${info.flag} ${codeStyled.padEnd(installed ? 14 : 6)} ${chalk.dim(info.name.en)}`);
    }

    console.log();

    if (options.installed) {
      outro(`${installedSet.size} countries installed`);
    } else {
      if (installedSet.size > 0) {
        p.log.info(`${installedSet.size} installed ${chalk.green("●")}`);
      }
      outro(`${countries.length} countries available`);
    }
  } catch (error) {
    s.stop("Failed to fetch countries");
    process.exitCode = 1;
    p.log.error(errorMessage(error));
    console.log();
  }
}
