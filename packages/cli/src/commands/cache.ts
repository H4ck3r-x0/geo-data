import { errorMessage } from "../utils/helpers.js";
import { clearCache, getCacheInfo } from "../utils/registry.js";
import { intro, outro, p } from "../utils/ui.js";

export async function cache(action = "info") {
  if (action !== "info" && action !== "clear") {
    intro("Cache");
    p.log.error(`Unknown action: "${action}". Use "info" or "clear".`);
    console.log();
    process.exitCode = 1;
    return;
  }

  intro("Cache");

  if (action === "clear") {
    const s = p.spinner();
    s.start("Clearing cache");

    try {
      await clearCache();
      s.stop("Cache cleared");
      outro("Done");
    } catch (error) {
      s.stop("Failed to clear cache");
      process.exitCode = 1;
      p.log.error(errorMessage(error));
      console.log();
    }
    return;
  }

  const info = await getCacheInfo();

  if (!info) {
    p.log.info("No cached data");
    console.log();
    return;
  }

  const sizeKB = (info.size / 1024).toFixed(1);
  const sizeMB = (info.size / 1024 / 1024).toFixed(2);
  const sizeDisplay = info.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

  p.note(`Files: ${info.files}\nSize: ${sizeDisplay}\nLocation: ~/.cache/geo-data/`, "Cache info");

  p.log.message("Run: npx geo-data cache clear");
  console.log();
}
