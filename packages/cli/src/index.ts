#!/usr/bin/env node
import { createRequire } from "node:module";
import chalk from "chalk";
import { Command } from "commander";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

import { add } from "./commands/add.js";
import { cache } from "./commands/cache.js";
import { init } from "./commands/init.js";
import { list } from "./commands/list.js";
import { pick } from "./commands/pick.js";
import { remove } from "./commands/remove.js";
import { update } from "./commands/update.js";

const program = new Command();

program.configureOutput({
  outputError: (str, write) => write(chalk.red(str)),
});

program.name("geo-data").description("Copy only the countries you need. No bloat.").version(version);

program.command("init").description("Initialize geo-data in your project").action(init);

program
  .command("add")
  .description("Add countries to your project")
  .argument("[countries...]", "Country codes (e.g., sa ae fr)")
  .option("-f, --force", "Overwrite existing without asking")
  .option("-n, --dry-run", "Preview changes without writing")
  .action((countries, options) => {
    if (!countries || countries.length === 0) {
      pick();
    } else {
      add(countries, options);
    }
  });

program
  .command("list")
  .alias("ls")
  .description("List available countries")
  .option("-i, --installed", "Show only installed countries")
  .action((options) => list(options));

program
  .command("update")
  .description("Re-download installed countries")
  .option("-f, --force", "Update without confirmation")
  .option("-n, --dry-run", "Preview what would be updated")
  .action((options) => update(options));

program
  .command("remove")
  .alias("rm")
  .description("Remove countries from your project")
  .argument("<countries...>", "Country codes to remove")
  .option("-f, --force", "Remove without confirmation")
  .option("-n, --dry-run", "Preview what would be removed")
  .action((countries, options) => remove(countries, options));

program
  .command("cache")
  .description("Manage offline cache")
  .argument("[action]", "info (default) or clear", "info")
  .action((action) => cache(action));

program
  .command("pick")
  .alias("select")
  .description("Interactive country picker")
  .action(() => pick());

program.showHelpAfterError(chalk.dim("(use --help for available commands)"));
program.showSuggestionAfterError(true);

program.addHelpText(
  "after",
  `
${chalk.bold("Examples:")}
  ${chalk.dim("$")} geo-data init
  ${chalk.dim("$")} geo-data pick
  ${chalk.dim("$")} geo-data add sa ae
  ${chalk.dim("$")} geo-data list -i
`,
);

program.parseAsync().catch((error: unknown) => {
  console.error(chalk.red(error instanceof Error ? error.message : "An unexpected error occurred"));
  process.exitCode = 1;
});
