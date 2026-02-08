import * as p from "@clack/prompts";
import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";

// Brand gradient (purple -> blue -> cyan)
const brandGradient = gradient(["#a855f7", "#6366f1", "#06b6d4"]);

export function banner() {
  console.log();
  console.log(brandGradient(figlet.textSync("geodata", { font: "Big" })));
  console.log();
}

export function intro(message?: string) {
  console.log();
  p.intro(chalk.bgHex("#6366f1").white(` ${message || "geo-data"} `));
}

export function outro(message: string) {
  p.outro(chalk.hex("#a855f7")(message));
}

export function cancel(message = "Operation cancelled.") {
  p.cancel(message);
}

export { p };
