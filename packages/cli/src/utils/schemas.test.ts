import { describe, expect, it } from "vitest";
import { CitySchema, ConfigSchema, CountryDataSchema, RegionSchema, RegistryIndexSchema } from "./schemas.js";

describe("CitySchema", () => {
  it("parses a valid city with coordinates", () => {
    const city = { name: { en: "Riyadh", ar: "الرياض" }, latitude: 24.7136, longitude: 46.6753 };
    const result = CitySchema.safeParse(city);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name.en).toBe("Riyadh");
      expect(result.data.latitude).toBe(24.7136);
    }
  });

  it("parses a valid city without coordinates", () => {
    const city = { name: { en: "Riyadh" } };
    const result = CitySchema.safeParse(city);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.latitude).toBeUndefined();
      expect(result.data.longitude).toBeUndefined();
    }
  });

  it("rejects a city with missing name", () => {
    const city = { latitude: 24.7136 };
    const result = CitySchema.safeParse(city);
    expect(result.success).toBe(false);
  });

  it("rejects a city with invalid name type", () => {
    const city = { name: "Riyadh" };
    const result = CitySchema.safeParse(city);
    expect(result.success).toBe(false);
  });
});

describe("RegionSchema", () => {
  it("parses a valid region", () => {
    const region = {
      code: "01",
      name: { en: "Riyadh Region" },
      cities: [{ name: { en: "Riyadh" } }],
    };
    const result = RegionSchema.safeParse(region);
    expect(result.success).toBe(true);
  });

  it("rejects a region with missing code", () => {
    const region = {
      name: { en: "Riyadh Region" },
      cities: [],
    };
    const result = RegionSchema.safeParse(region);
    expect(result.success).toBe(false);
  });

  it("rejects a region with missing cities array", () => {
    const region = {
      code: "01",
      name: { en: "Riyadh Region" },
    };
    const result = RegionSchema.safeParse(region);
    expect(result.success).toBe(false);
  });
});

describe("CountryDataSchema", () => {
  const validCountry = {
    code: "sa",
    iso3: "SAU",
    name: { en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
    phone: "+966",
    currency: "SAR",
    timezone: "Asia/Riyadh",
    flag: "\ud83c\uddf8\ud83c\udde6",
    regions: [
      {
        code: "01",
        name: { en: "Riyadh Region" },
        cities: [{ name: { en: "Riyadh" }, latitude: 24.7136, longitude: 46.6753 }],
      },
    ],
  };

  it("parses valid country data", () => {
    const result = CountryDataSchema.safeParse(validCountry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("sa");
      expect(result.data.regions).toHaveLength(1);
    }
  });

  it("parses country data without optional iso3", () => {
    const { iso3, ...withoutIso3 } = validCountry;
    const result = CountryDataSchema.safeParse(withoutIso3);
    expect(result.success).toBe(true);
  });

  it("rejects country data with missing required fields", () => {
    const { phone, ...incomplete } = validCountry;
    const result = CountryDataSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("rejects country data with invalid regions", () => {
    const result = CountryDataSchema.safeParse({ ...validCountry, regions: "not-an-array" });
    expect(result.success).toBe(false);
  });
});

describe("RegistryIndexSchema", () => {
  const validIndex = {
    version: "1.0.0",
    countries: {
      sa: {
        name: { en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
        flag: "\ud83c\uddf8\ud83c\udde6",
        languages: ["en", "ar"],
      },
      us: {
        name: { en: "United States" },
        flag: "\ud83c\uddfa\ud83c\uddf8",
        languages: ["en"],
      },
    },
  };

  it("parses valid registry index", () => {
    const result = RegistryIndexSchema.safeParse(validIndex);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe("1.0.0");
      expect(Object.keys(result.data.countries)).toHaveLength(2);
    }
  });

  it("accepts country without optional arabic name", () => {
    const result = RegistryIndexSchema.safeParse(validIndex);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countries.us.name.ar).toBeUndefined();
    }
  });

  it("rejects index with missing version", () => {
    const { version, ...noVersion } = validIndex;
    const result = RegistryIndexSchema.safeParse(noVersion);
    expect(result.success).toBe(false);
  });

  it("rejects index with missing countries", () => {
    const result = RegistryIndexSchema.safeParse({ version: "1.0.0" });
    expect(result.success).toBe(false);
  });

  it("rejects index with invalid country entry", () => {
    const result = RegistryIndexSchema.safeParse({
      version: "1.0.0",
      countries: {
        sa: { name: "Saudi Arabia" }, // should be an object with { en: string }
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("ConfigSchema", () => {
  const validConfig = {
    outputDir: "./src/data/geo",
    languages: ["en", "ar"],
    includeCoordinates: true,
    typescript: true,
  };

  it("parses valid config", () => {
    const result = ConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("accepts config with $schema", () => {
    const result = ConfigSchema.safeParse({ ...validConfig, $schema: "https://example.com/schema.json" });
    expect(result.success).toBe(true);
  });

  it("rejects empty outputDir", () => {
    const result = ConfigSchema.safeParse({ ...validConfig, outputDir: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty languages array", () => {
    const result = ConfigSchema.safeParse({ ...validConfig, languages: [] });
    expect(result.success).toBe(false);
  });

  it("rejects missing includeCoordinates", () => {
    const { includeCoordinates, ...rest } = validConfig;
    const result = ConfigSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing typescript", () => {
    const { typescript, ...rest } = validConfig;
    const result = ConfigSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
