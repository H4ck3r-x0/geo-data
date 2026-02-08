# 🌍 geo-data

Copy only the countries you need. No bloat.

## The Problem

```bash
# Installing country data for your app?
npm install country-city-multilanguage  # 6MB of world data 😱
```

You only need Saudi Arabia and UAE, but you're shipping data for 250 countries.

## The Solution

```bash
npx geo-data add sa ae    # ~65KB instead of 6MB ✨
```

## Quick Start

```bash
# 1. Initialize in your project
npx geo-data init

# 2. Add countries you need
npx geo-data add sa ae qa

# 3. Use in your code
```

```tsx
import { getCities, getLocalizedName } from './src/data/geo';

const cities = getCities('SA');
// → [{ name: { en: "Riyadh", ar: "الرياض" }, ... }]

// With i18n
const cityName = getLocalizedName(city, 'ar'); // → "الرياض"
```

## Features

- 🎯 **Only what you need** — install 1 country, not 250
- 🌐 **Multilingual** — English, Arabic, French, Spanish, and 13 more languages
- 📦 **No runtime dependency** — data lives in your project
- 🔧 **Fully customizable** — it's just JSON, edit as needed
- ⚡ **TypeScript ready** — full type safety out of the box
- 🔄 **Offline support** — works offline after first download
- 🗑️ **Easy management** — add, update, or remove countries anytime

## Commands

```bash
# Initialize configuration
npx geo-data init

# Add countries
npx geo-data add sa qa ae
npx geo-data add sa --force        # Overwrite existing
npx geo-data add sa --dry-run      # Preview changes

# List countries
npx geo-data list                   # All available (218 countries)
npx geo-data list --installed       # Only installed

# Update installed countries
npx geo-data update                 # Re-download with current config
npx geo-data update --dry-run       # Preview what would update

# Remove countries
npx geo-data remove sa              # Remove with confirmation
npx geo-data rm sa --force          # Remove without confirmation

# Manage cache
npx geo-data cache                  # Show cache info
npx geo-data cache clear            # Clear offline cache
```

## Configuration

After `init`, you'll have a `geo-data.json`:

```json
{
  "$schema": "https://geo-data.dev/schema.json",
  "outputDir": "./src/data/geo",
  "languages": ["en", "ar"],
  "includeCoordinates": true,
  "typescript": true
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `outputDir` | Where to put the data files | `./src/data/geo` |
| `languages` | Languages to include | `["en"]` |
| `includeCoordinates` | Include lat/lng for cities | `true` |
| `typescript` | Generate TypeScript types | `true` |

### Available Languages

`en`, `ar`, `de`, `es`, `fr`, `hi`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `tr`, `uk`, `zh`

## Data Schema

Each country file contains:

```json
{
  "code": "SA",
  "name": { "en": "Saudi Arabia", "ar": "المملكة العربية السعودية" },
  "phone": "+966",
  "currency": "SAR",
  "timezone": "Asia/Riyadh",
  "flag": "🇸🇦",
  "regions": [
    {
      "code": "SA-01",
      "name": { "en": "Riyadh Region", "ar": "منطقة الرياض" },
      "cities": [
        {
          "name": { "en": "Riyadh", "ar": "الرياض" },
          "latitude": 24.7136,
          "longitude": 46.6753
        }
      ]
    }
  ]
}
```

## Generated Helpers

The CLI generates an `index.ts` with helpful functions:

```typescript
import {
  countries,
  getCountry,
  getRegions,
  getCities,
  getAllCities,
  getLocalizedName,
  getCountryCodes,
  isValidCountryCode
} from './src/data/geo';

// Get all cities in a country
const cities = getCities('SA');

// Get cities in a specific region
const riyadhCities = getCities('SA', 'SA-01');

// Get localized name
const name = getLocalizedName(city, 'ar'); // "الرياض"

// Type-safe country codes
type CountryCode = 'SA' | 'AE' | 'QA'; // Based on what you installed

// Validation
if (isValidCountryCode(userInput)) {
  const country = getCountry(userInput);
}
```

## Framework Examples

### React

```tsx
import { getCities, getLocalizedName } from '@/data/geo';
import { useTranslation } from 'react-i18next';

function CitySelect({ country }: { country: 'SA' | 'AE' }) {
  const { i18n } = useTranslation();
  const cities = getCities(country);

  return (
    <select>
      {cities.map(city => (
        <option key={city.name.en} value={city.name.en}>
          {getLocalizedName(city, i18n.language)}
        </option>
      ))}
    </select>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { getCities, getLocalizedName } from '@/data/geo';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ country: 'SA' | 'AE' }>();
const { locale } = useI18n();
const cities = computed(() => getCities(props.country));
</script>

<template>
  <select>
    <option v-for="city in cities" :key="city.name.en" :value="city.name.en">
      {{ getLocalizedName(city, locale) }}
    </option>
  </select>
</template>
```

## Data Sources

This package combines data from:
- [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database) — Base country/city data
- [GeoNames](https://www.geonames.org/) — Arabic translations for cities worldwide

## Contributing

Found incorrect data? PRs welcome! Each country is a separate JSON file in `registry/countries/`.

## License

MIT
