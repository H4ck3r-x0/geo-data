import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatCountryDisplay, getInstalledCountries } from "./helpers.js";

vi.mock("fs-extra", () => ({
  default: {
    readdir: vi.fn(),
  },
}));

vi.mock("./config.js", () => ({
  getConfig: vi.fn(),
  getConfigResult: vi.fn(),
}));

vi.mock("../utils/ui.js", () => ({
  intro: vi.fn(),
  p: {
    log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  },
}));

describe("formatCountryDisplay", () => {
  it("formats with country info", () => {
    const result = formatCountryDisplay("sa", {
      name: { en: "Saudi Arabia" },
      flag: "\ud83c\uddf8\ud83c\udde6",
    });
    expect(result).toBe("\ud83c\uddf8\ud83c\udde6 SA - Saudi Arabia");
  });

  it("returns uppercase code when no info provided", () => {
    const result = formatCountryDisplay("sa");
    expect(result).toBe("SA");
  });

  it("returns uppercase code when info is undefined", () => {
    const result = formatCountryDisplay("us", undefined);
    expect(result).toBe("US");
  });
});

describe("getInstalledCountries", () => {
  it("returns country codes from json files", async () => {
    const fs = await import("fs-extra");
    vi.mocked(fs.default.readdir).mockResolvedValue(["sa.json", "us.json", "index.json"] as unknown as Promise<
      string[]
    >);

    const result = await getInstalledCountries("/some/dir");
    expect(result).toEqual(["sa", "us"]);
  });

  it("excludes index.json", async () => {
    const fs = await import("fs-extra");
    vi.mocked(fs.default.readdir).mockResolvedValue(["index.json"] as unknown as Promise<string[]>);

    const result = await getInstalledCountries("/some/dir");
    expect(result).toEqual([]);
  });

  it("excludes non-json files", async () => {
    const fs = await import("fs-extra");
    vi.mocked(fs.default.readdir).mockResolvedValue(["sa.json", "index.ts", "readme.md"] as unknown as Promise<
      string[]
    >);

    const result = await getInstalledCountries("/some/dir");
    expect(result).toEqual(["sa"]);
  });

  it("returns empty array when readdir fails", async () => {
    const fs = await import("fs-extra");
    vi.mocked(fs.default.readdir).mockRejectedValue(new Error("ENOENT"));

    const result = await getInstalledCountries("/nonexistent/dir");
    expect(result).toEqual([]);
  });
});

describe("requireConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns config when found and valid", async () => {
    const { getConfigResult } = await import("./config.js");
    vi.mocked(getConfigResult).mockResolvedValue({
      status: "ok",
      config: {
        outputDir: "./src/data/geo",
        languages: ["en"],
        includeCoordinates: true,
        typescript: true,
      },
    });

    const { requireConfig } = await import("./helpers.js");
    const result = await requireConfig("Test");

    expect(result).not.toBeNull();
    expect(result?.outputDir).toBe("./src/data/geo");
  });

  it("returns null and shows not found message", async () => {
    const { getConfigResult } = await import("./config.js");
    const ui = await import("../utils/ui.js");
    vi.mocked(getConfigResult).mockResolvedValue({ status: "not_found" });

    const { requireConfig } = await import("./helpers.js");
    const result = await requireConfig("Test");

    expect(result).toBeNull();
    expect(ui.p.log.error).toHaveBeenCalledWith(expect.stringContaining("No geo-data.json found"));
  });

  it("returns null and shows invalid message", async () => {
    const { getConfigResult } = await import("./config.js");
    const ui = await import("../utils/ui.js");
    vi.mocked(getConfigResult).mockResolvedValue({ status: "invalid", error: "bad config" });

    const { requireConfig } = await import("./helpers.js");
    const result = await requireConfig("Test");

    expect(result).toBeNull();
    expect(ui.p.log.error).toHaveBeenCalledWith(expect.stringContaining("Invalid geo-data.json"));
  });
});
