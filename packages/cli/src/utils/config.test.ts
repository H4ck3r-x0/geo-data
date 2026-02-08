import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateConfig } from "./config.js";

vi.mock("@clack/prompts", () => ({
  log: { error: vi.fn(), warn: vi.fn() },
}));

describe("validateConfig", () => {
  const validConfig = {
    outputDir: "./src/data/geo",
    languages: ["en", "ar"],
    includeCoordinates: true,
    typescript: true,
  };

  it("returns a valid config object", () => {
    const result = validateConfig(validConfig);
    expect(result).toEqual({
      outputDir: "./src/data/geo",
      languages: ["en", "ar"],
      includeCoordinates: true,
      typescript: true,
    });
  });

  it("preserves $schema if present", () => {
    const result = validateConfig({ ...validConfig, $schema: "https://geo-data.dev/schema.json" });
    expect(result.$schema).toBe("https://geo-data.dev/schema.json");
  });

  it("throws if config is null", () => {
    expect(() => validateConfig(null)).toThrow();
  });

  it("throws if config is not an object", () => {
    expect(() => validateConfig("string")).toThrow();
  });

  it("throws if outputDir is missing", () => {
    const { outputDir, ...rest } = validConfig;
    expect(() => validateConfig(rest)).toThrow();
  });

  it("throws if outputDir is empty string", () => {
    expect(() => validateConfig({ ...validConfig, outputDir: "" })).toThrow("outputDir must be a non-empty string");
  });

  it("throws if languages is not an array", () => {
    expect(() => validateConfig({ ...validConfig, languages: "en" })).toThrow();
  });

  it("throws if languages is an empty array", () => {
    expect(() => validateConfig({ ...validConfig, languages: [] })).toThrow("languages must be a non-empty array");
  });

  it("throws if a language is not a string", () => {
    expect(() => validateConfig({ ...validConfig, languages: [123] })).toThrow();
  });

  it("throws if includeCoordinates is not a boolean", () => {
    expect(() => validateConfig({ ...validConfig, includeCoordinates: "yes" })).toThrow();
  });

  it("throws if typescript is not a boolean", () => {
    expect(() => validateConfig({ ...validConfig, typescript: 1 })).toThrow();
  });
});

vi.mock("fs-extra", () => ({
  default: {
    pathExists: vi.fn(),
    readJson: vi.fn(),
  },
}));

describe("getConfigResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when config file does not exist", async () => {
    const fs = (await import("fs-extra")).default;
    vi.mocked(fs.pathExists).mockResolvedValue(false as never);

    const { getConfigResult } = await import("./config.js");
    const result = await getConfigResult();

    expect(result.status).toBe("not_found");
  });

  it("returns ok with config when file is valid", async () => {
    const fs = (await import("fs-extra")).default;
    vi.mocked(fs.pathExists).mockResolvedValue(true as never);
    vi.mocked(fs.readJson).mockResolvedValue({
      outputDir: "./src/data/geo",
      languages: ["en"],
      includeCoordinates: true,
      typescript: true,
    });

    const { getConfigResult } = await import("./config.js");
    const result = await getConfigResult();

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.config.outputDir).toBe("./src/data/geo");
    }
  });

  it("returns invalid when config file has bad data", async () => {
    const fs = (await import("fs-extra")).default;
    vi.mocked(fs.pathExists).mockResolvedValue(true as never);
    vi.mocked(fs.readJson).mockResolvedValue({
      outputDir: "",
      languages: [],
    });

    const { getConfigResult } = await import("./config.js");
    const result = await getConfigResult();

    expect(result.status).toBe("invalid");
  });
});
