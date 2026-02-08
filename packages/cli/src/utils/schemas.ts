import { z } from "zod";

// --- City ---
export const CitySchema = z.object({
  name: z.record(z.string(), z.string()),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
export type City = z.infer<typeof CitySchema>;

// --- Region ---
export const RegionSchema = z.object({
  code: z.string(),
  name: z.record(z.string(), z.string()),
  cities: z.array(CitySchema),
});
export type Region = z.infer<typeof RegionSchema>;

// --- CountryData ---
export const CountryDataSchema = z.object({
  code: z.string(),
  iso3: z.string().optional(),
  name: z.record(z.string(), z.string()),
  phone: z.string(),
  currency: z.string(),
  timezone: z.string(),
  flag: z.string(),
  regions: z.array(RegionSchema),
});
export type CountryData = z.infer<typeof CountryDataSchema>;

// --- RegistryIndex ---
export const RegistryIndexSchema = z.object({
  version: z.string(),
  countries: z.record(
    z.string(),
    z.object({
      name: z.object({ en: z.string(), ar: z.string().optional() }),
      flag: z.string(),
      languages: z.array(z.string()),
    }),
  ),
});
export type RegistryIndex = z.infer<typeof RegistryIndexSchema>;

// --- Valid Languages ---
export const VALID_LANGUAGES = [
  "en",
  "ar",
  "de",
  "es",
  "fr",
  "hi",
  "it",
  "ja",
  "ko",
  "nl",
  "pl",
  "pt",
  "pt-BR",
  "ru",
  "tr",
  "uk",
  "zh",
] as const;

// --- Config ---
export const ConfigSchema = z.object({
  $schema: z.string().optional(),
  outputDir: z.string().min(1, "outputDir must be a non-empty string"),
  languages: z.array(z.string()).min(1, "languages must be a non-empty array"),
  includeCoordinates: z.boolean(),
  typescript: z.boolean(),
});
