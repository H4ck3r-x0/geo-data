import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GeoDataConfig } from "./config.js";
import { filterCountryData } from "./registry.js";
import type { CountryData } from "./schemas.js";

vi.mock("fs-extra", () => ({
  default: {
    remove: vi.fn(),
    pathExists: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    readJson: vi.fn(),
    ensureDir: vi.fn(),
    writeJson: vi.fn(),
  },
}));

// Also mock @clack/prompts to suppress log output
vi.mock("@clack/prompts", () => ({
  log: { warn: vi.fn() },
}));

function makeConfig(overrides: Partial<GeoDataConfig> = {}): GeoDataConfig {
  return {
    outputDir: "./src/data/geo",
    languages: ["en"],
    includeCoordinates: true,
    typescript: true,
    ...overrides,
  };
}

function makeSampleCountry(): CountryData {
  return {
    code: "sa",
    iso3: "SAU",
    name: { en: "Saudi Arabia", ar: "المملكة العربية السعودية", fr: "Arabie saoudite" },
    phone: "+966",
    currency: "SAR",
    timezone: "Asia/Riyadh",
    flag: "\ud83c\uddf8\ud83c\udde6",
    regions: [
      {
        code: "01",
        name: { en: "Riyadh Region", ar: "منطقة الرياض", fr: "Région de Riyad" },
        cities: [
          {
            name: { en: "Riyadh", ar: "الرياض", fr: "Riyad" },
            latitude: 24.7136,
            longitude: 46.6753,
          },
          {
            name: { en: "Diriyah", ar: "الدرعية" },
            latitude: 24.7343,
            longitude: 46.5725,
          },
        ],
      },
    ],
  };
}

describe("filterCountryData", () => {
  it("filters to only requested languages plus English fallback", () => {
    const config = makeConfig({ languages: ["ar"] });
    const result = filterCountryData(makeSampleCountry(), config);

    expect(result.name).toEqual({ en: "Saudi Arabia", ar: "المملكة العربية السعودية" });
    expect(result.regions[0].name).toEqual({ en: "Riyadh Region", ar: "منطقة الرياض" });
    expect(result.regions[0].cities[0].name).toEqual({ en: "Riyadh", ar: "الرياض" });
    // French should be removed
    expect(result.regions[0].cities[0].name).not.toHaveProperty("fr");
  });

  it("includes English even when not in languages array", () => {
    const config = makeConfig({ languages: ["fr"] });
    const result = filterCountryData(makeSampleCountry(), config);

    // English should be included as fallback
    expect(result.name.en).toBe("Saudi Arabia");
    expect(result.name).toHaveProperty("fr");
    // Arabic should not be included
    expect(result.name).not.toHaveProperty("ar");
  });

  it("removes coordinates when includeCoordinates is false", () => {
    const config = makeConfig({ includeCoordinates: false });
    const result = filterCountryData(makeSampleCountry(), config);

    for (const region of result.regions) {
      for (const city of region.cities) {
        expect(city.latitude).toBeUndefined();
        expect(city.longitude).toBeUndefined();
      }
    }
  });

  it("preserves coordinates when includeCoordinates is true", () => {
    const config = makeConfig({ includeCoordinates: true });
    const result = filterCountryData(makeSampleCountry(), config);

    expect(result.regions[0].cities[0].latitude).toBe(24.7136);
    expect(result.regions[0].cities[0].longitude).toBe(46.6753);
  });

  it("handles missing language names gracefully", () => {
    const config = makeConfig({ languages: ["ja"] }); // Japanese not in test data
    const result = filterCountryData(makeSampleCountry(), config);

    // Should still have English as fallback
    expect(result.name.en).toBe("Saudi Arabia");
    // Japanese not available, so only English
    expect(Object.keys(result.name)).toEqual(["en"]);
  });

  it("preserves non-name fields in country data", () => {
    const config = makeConfig();
    const result = filterCountryData(makeSampleCountry(), config);

    expect(result.code).toBe("sa");
    expect(result.iso3).toBe("SAU");
    expect(result.phone).toBe("+966");
    expect(result.currency).toBe("SAR");
    expect(result.timezone).toBe("Asia/Riyadh");
    expect(result.flag).toBe("\ud83c\uddf8\ud83c\udde6");
  });

  it("preserves region codes and structure", () => {
    const config = makeConfig();
    const result = filterCountryData(makeSampleCountry(), config);

    expect(result.regions).toHaveLength(1);
    expect(result.regions[0].code).toBe("01");
    expect(result.regions[0].cities).toHaveLength(2);
  });

  it("handles multiple requested languages", () => {
    const config = makeConfig({ languages: ["en", "ar", "fr"] });
    const result = filterCountryData(makeSampleCountry(), config);

    expect(result.name).toEqual({
      en: "Saudi Arabia",
      ar: "المملكة العربية السعودية",
      fr: "Arabie saoudite",
    });
  });

  it("preserves coordinates when latitude is 0", () => {
    const config = makeConfig({ includeCoordinates: true });
    const result = filterCountryData(makeCountryWithZeroCoords(), config);

    expect(result.regions[0].cities[1].latitude).toBe(0);
    expect(result.regions[0].cities[1].longitude).toBe(46.6753);
  });

  it("preserves coordinates when both latitude and longitude are 0", () => {
    const config = makeConfig({ includeCoordinates: true });
    const result = filterCountryData(makeCountryWithZeroCoords(), config);

    expect(result.regions[0].cities[0].latitude).toBe(0);
    expect(result.regions[0].cities[0].longitude).toBe(0);
  });
});

function makeCountryWithZeroCoords(): CountryData {
  return {
    code: "test",
    name: { en: "Test Country" },
    phone: "+0",
    currency: "TST",
    timezone: "UTC",
    flag: "\ud83c\udff3\ufe0f",
    regions: [
      {
        code: "01",
        name: { en: "Test Region" },
        cities: [
          {
            name: { en: "Zero City" },
            latitude: 0,
            longitude: 0,
          },
          {
            name: { en: "Equator City" },
            latitude: 0,
            longitude: 46.6753,
          },
        ],
      },
    ],
  };
}

describe("clearCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls fs.remove on the cache directory", async () => {
    const fs = (await import("fs-extra")).default;
    vi.mocked(fs.remove).mockResolvedValue();

    const { clearCache } = await import("./registry.js");
    await clearCache();

    expect(fs.remove).toHaveBeenCalledOnce();
    expect(fs.remove).toHaveBeenCalledWith(expect.stringContaining(".cache/geo-data"));
  });
});

describe("getCacheInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when cache directory does not exist", async () => {
    const fs = (await import("fs-extra")).default;
    vi.mocked(fs.pathExists).mockResolvedValue(false as never);

    const { getCacheInfo } = await import("./registry.js");
    const result = await getCacheInfo();

    expect(result).toBeNull();
  });

  it("returns size and file count when cache exists", async () => {
    const fs = (await import("fs-extra")).default;
    vi.mocked(fs.pathExists).mockResolvedValue(true as never);
    vi.mocked(fs.readdir).mockResolvedValue(["registry-index.json", "country-sa.json"] as never);
    vi.mocked(fs.stat).mockResolvedValue({ size: 1024 } as never);

    const { getCacheInfo } = await import("./registry.js");
    const result = await getCacheInfo();

    expect(result).toEqual({ size: 2048, files: 2 });
  });
});
