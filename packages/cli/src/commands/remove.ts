import fs from "fs-extra";
import path from "path";
import { generateIndex } from "../utils/codegen.js";
import { type CommandOptions, errorMessage, formatCountryDisplay, requireConfig } from "../utils/helpers.js";
import { fetchRegistry } from "../utils/registry.js";
import { cancel, intro, outro, p } from "../utils/ui.js";

export async function remove(countryCodes: string[], options: CommandOptions = {}) {
  const config = await requireConfig("Remove Countries");
  if (!config) {
    process.exitCode = 1;
    return;
  }

  intro("Remove Countries");

  const codes = countryCodes.map((c) => c.toLowerCase());

  try {
    const toRemove: string[] = [];
    const notFound: string[] = [];

    for (const code of codes) {
      const filePath = path.join(config.outputDir, `${code}.json`);
      if (await fs.pathExists(filePath)) {
        toRemove.push(code);
      } else {
        notFound.push(code);
      }
    }

    if (notFound.length > 0) {
      for (const code of notFound) {
        p.log.warn(`Not installed: ${code.toUpperCase()}`);
      }
    }

    if (toRemove.length === 0) {
      process.exitCode = 1;
      cancel("Nothing to remove");
      return;
    }

    const registry = await fetchRegistry();
    if (!registry) {
      p.log.error("Could not load registry — invalid data from remote");
      console.log();
      process.exitCode = 1;
      return;
    }

    const list = toRemove.map((code) => formatCountryDisplay(code, registry.countries[code])).join("\n");

    if (options.dryRun) {
      p.note(list, "Would remove (dry run)");
      console.log();
      return;
    }

    p.note(list, "Will remove");

    if (!options.force) {
      const confirm = await p.confirm({
        message: `Remove ${toRemove.length} ${toRemove.length === 1 ? "country" : "countries"}?`,
        initialValue: false,
      });

      if (p.isCancel(confirm) || !confirm) {
        cancel();
        return;
      }
    }

    const s = p.spinner();

    for (const code of toRemove) {
      const info = registry.countries[code];
      const label = `${info?.flag || "🏳️"} ${info?.name.en || code}`;

      s.start(label);
      const filePath = path.join(config.outputDir, `${code}.json`);
      await fs.remove(filePath);
      s.stop(label);
    }

    const ext = config.typescript ? "ts" : "js";
    s.start(`Regenerating index.${ext}`);
    await generateIndex(config);
    s.stop(`Regenerated index.${ext}`);

    outro(`Removed ${toRemove.length} ${toRemove.length === 1 ? "country" : "countries"}`);
  } catch (error) {
    process.exitCode = 1;
    p.log.error(errorMessage(error));
    console.log();
  }
}
