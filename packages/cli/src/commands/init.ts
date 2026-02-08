import fs from "fs-extra";
import path from "path";
import { CONFIG_FILE, getConfig } from "../utils/config.js";
import { errorMessage } from "../utils/helpers.js";
import { banner, cancel, intro, outro, p } from "../utils/ui.js";
import { add } from "./add.js";

async function detectDefaults() {
  const cwd = process.cwd();
  const hasTsconfig = await fs.pathExists(path.resolve(cwd, "tsconfig.json"));
  const hasSrc = await fs.pathExists(path.resolve(cwd, "src"));

  return {
    outputDir: hasSrc ? "./src/data/geo" : "./data/geo",
    typescript: hasTsconfig,
    languages: ["en"] as string[],
    includeCoordinates: false,
    hints: {
      outputDir: hasSrc ? "(src/ detected)" : "",
      typescript: hasTsconfig ? "(tsconfig.json found)" : "",
    },
  };
}

export async function init() {
  banner();
  intro("Initialize");

  const existingConfig = await getConfig();
  if (existingConfig) {
    const overwrite = await p.confirm({
      message: `${CONFIG_FILE} already exists. Overwrite?`,
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      cancel();
      return;
    }
  }

  const defaults = await detectDefaults();

  p.note(
    [
      `Output:      ${defaults.outputDir}  ${defaults.hints.outputDir}`,
      `TypeScript:  ${defaults.typescript ? "yes" : "no"}  ${defaults.hints.typescript}`,
      `Languages:   ${defaults.languages.join(", ")}`,
      `Coordinates: no`,
    ].join("\n"),
    "Detected settings",
  );

  const confirm = await p.confirm({
    message: "Look good?",
    initialValue: true,
  });

  if (p.isCancel(confirm)) {
    cancel();
    return;
  }

  let { outputDir, languages, includeCoordinates, typescript } = defaults;

  if (!confirm) {
    const customOutputDir = await p.text({
      message: "Where should geo data be stored?",
      placeholder: defaults.outputDir,
      defaultValue: defaults.outputDir,
    });

    if (p.isCancel(customOutputDir)) {
      cancel();
      return;
    }
    outputDir = customOutputDir;

    const customLanguages = await p.multiselect({
      message: "Which languages do you need?",
      options: [
        { value: "en", label: "English", hint: "recommended" },
        { value: "ar", label: "Arabic (\u0627\u0644\u0639\u0631\u0628\u064A\u0629)" },
        { value: "fr", label: "French (Fran\u00E7ais)" },
        { value: "es", label: "Spanish (Espa\u00F1ol)" },
        { value: "de", label: "German (Deutsch)" },
        { value: "zh", label: "Chinese (\u4E2D\u6587)" },
        { value: "ja", label: "Japanese (\u65E5\u672C\u8A9E)" },
        { value: "pt", label: "Portuguese (Portugu\u00EAs)" },
        { value: "ru", label: "Russian (\u0420\u0443\u0441\u0441\u043A\u0438\u0439)" },
        { value: "hi", label: "Hindi (\u0939\u093F\u0928\u094D\u0926\u0940)" },
        { value: "it", label: "Italian (Italiano)" },
        { value: "ko", label: "Korean (\uD55C\uAD6D\uC5B4)" },
        { value: "nl", label: "Dutch (Nederlands)" },
        { value: "pl", label: "Polish (Polski)" },
        { value: "pt-BR", label: "Brazilian Portuguese (Portugu\u00EAs do Brasil)" },
        { value: "tr", label: "Turkish (T\u00FCrk\u00E7e)" },
        { value: "uk", label: "Ukrainian (\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430)" },
      ],
      initialValues: ["en"],
      required: true,
    });

    if (p.isCancel(customLanguages)) {
      cancel();
      return;
    }
    languages = customLanguages as string[];

    const customCoordinates = await p.confirm({
      message: "Include coordinates (latitude/longitude)?",
      initialValue: false,
    });

    if (p.isCancel(customCoordinates)) {
      cancel();
      return;
    }
    includeCoordinates = customCoordinates;

    const customTypescript = await p.confirm({
      message: "Generate TypeScript types?",
      initialValue: defaults.typescript,
    });

    if (p.isCancel(customTypescript)) {
      cancel();
      return;
    }
    typescript = customTypescript;
  }

  const config = {
    $schema: "https://raw.githubusercontent.com/H4ck3r-x0/geo-data/main/schema.json",
    outputDir,
    languages,
    includeCoordinates,
    typescript,
  };

  const s = p.spinner();
  s.start("Creating configuration");

  try {
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
    await fs.ensureDir(outputDir);
  } catch (error) {
    s.stop("Failed");
    p.log.error(errorMessage(error));
    console.log();
    process.exitCode = 1;
    return;
  }

  s.stop("Configuration created");

  const firstCountry = await p.text({
    message: "Add your first country? (code or name, Enter to skip)",
    placeholder: "e.g. sa, us, fr",
    defaultValue: "",
  });

  if (!p.isCancel(firstCountry) && firstCountry.trim()) {
    console.log();
    await add([firstCountry.trim()], {});
    return;
  }

  p.note("npx geo-data add sa ae    Add countries\nnpx geo-data pick         Interactive picker", "Next steps");
  outro("Ready to go!");
}
