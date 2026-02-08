import prompts from "prompts";
import { errorMessage, getInstalledCountries, requireConfig } from "../utils/helpers.js";
import { fetchRegistry } from "../utils/registry.js";
import { banner, cancel, intro, p } from "../utils/ui.js";
import { add } from "./add.js";

export async function pick() {
  banner();
  const config = await requireConfig("Pick Countries");
  if (!config) {
    process.exitCode = 1;
    return;
  }

  intro("Pick Countries");

  const s = p.spinner();
  s.start("Loading countries");

  try {
    const registry = await fetchRegistry();
    if (!registry) {
      s.stop("Failed");
      p.log.error("Could not load registry — invalid data from remote");
      console.log();
      process.exitCode = 1;
      return;
    }

    const installed = await getInstalledCountries(config.outputDir);
    const installedSet = new Set(installed);

    s.stop("Countries loaded");

    const countries = Object.entries(registry.countries)
      .map(([code, info]) => ({
        code,
        ...info,
        installed: installedSet.has(code),
      }))
      .sort((a, b) => a.name.en.localeCompare(b.name.en));

    p.log.message("Type to search, Space to select, Enter to confirm");
    console.log();

    const { selected } = await prompts({
      type: "autocompleteMultiselect",
      name: "selected",
      message: "Select countries",
      choices: countries.map((c) => ({
        title: `${c.flag} ${c.code.toUpperCase()} - ${c.name.en}`,
        value: c.code,
        selected: c.installed,
        disabled: c.installed ? "(installed)" : false,
      })),
      instructions: false,
    });

    if (!selected || selected.length === 0) {
      console.log();
      cancel("No countries selected");
      return;
    }

    const toAdd = (selected as string[]).filter((code) => !installedSet.has(code));

    if (toAdd.length === 0) {
      console.log();
      cancel("All selected countries are already installed");
      return;
    }

    console.log();
    await add(toAdd, {});
  } catch (error) {
    s.stop("Failed");
    process.exitCode = 1;
    p.log.error(errorMessage(error));
    console.log();
  }
}
