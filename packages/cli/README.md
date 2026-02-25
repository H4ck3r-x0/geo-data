# geo-data

[![npm version](https://img.shields.io/npm/v/geo-data-cli)](https://www.npmjs.com/package/geo-data-cli)
[![CI](https://github.com/H4ck3r-x0/geo-data/actions/workflows/ci.yml/badge.svg)](https://github.com/H4ck3r-x0/geo-data/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

**Copy only the countries you need. No bloat.**

A CLI that downloads country, region, and city data into your project as plain JSON files with a generated typed index. Pick from 218 countries in 17 languages — ship only what you use.

## Features

- **218 countries** with regions & cities
- **17 languages** — English, Arabic, French, Spanish, German, Chinese, Japanese, and more
- **TypeScript support** — generated types and typed helper functions
- **Coordinates** — opt-in latitude/longitude for every city
- **Smart caching** — offline fallback with stale-while-revalidate
- **Interactive picker** — fuzzy-search multi-select to browse countries
- **Zero runtime deps** — output is just JSON files + a thin index module

## Quick Start

```bash
# Initialize config
npx geo-data-cli init

# Add countries by code
npx geo-data-cli add sa us fr
```

Then import the generated index:

```ts
import { getCountry, getRegions, getCities, getLocalizedName } from "./data";

const sa = getCountry("SA");
console.log(sa.name.en); // "Saudi Arabia"
console.log(sa.flag);    // "🇸🇦"

const regions = getRegions("SA");
const cities = getCities("SA", regions[0].code);

// Get localized name
console.log(getLocalizedName(sa, "ar")); // "المملكة العربية السعودية"
```

## Commands

| Command | Description |
|---|---|
| `init` | Interactive setup — creates `geo-data.json` config |
| `add [countries...]` | Add countries by code (e.g. `add sa us fr`) |
| `remove <countries...>` / `rm` | Remove countries from your project |
| `update` | Re-download all installed countries |
| `list` / `ls` | List available countries |
| `pick` / `select` | Interactive multi-select picker |
| `cache [action]` | Show cache info or clear it (`info` / `clear`) |

### Options

| Option | Commands | Description |
|---|---|---|
| `-f, --force` | `add`, `remove` | Skip confirmation prompts |
| `-n, --dry-run` | `add`, `remove`, `update` | Preview changes without writing |
| `-i, --installed` | `list` | Show only installed countries |

## Configuration

Running `geo-data init` creates a `geo-data.json` in your project root:

```json
{
  "$schema": "https://raw.githubusercontent.com/H4ck3r-x0/geo-data/main/packages/cli/schema.json",
  "outputDir": "./data",
  "languages": ["en", "ar"],
  "includeCoordinates": false,
  "typescript": true
}
```

| Field | Type | Description |
|---|---|---|
| `outputDir` | `string` | Where to write country JSON files |
| `languages` | `string[]` | Which language names to include |
| `includeCoordinates` | `boolean` | Include latitude/longitude for cities |
| `typescript` | `boolean` | Generate `.ts` index with types |

## Generated API

The generated index exports these helpers:

```ts
// Lookup
getCountry(code)            // Full country object
getRegions(code)            // Array of regions
getCities(code, regionCode?) // Cities — optionally filtered by region
getAllCities(code)           // All cities in a country

// Utilities
getLocalizedName(item, lang) // Get name in a specific language (falls back to English)
getCountryCodes()            // Array of installed country codes
isValidCountryCode(code)     // Type guard
```

### TypeScript Types

When `typescript: true`, the index also exports:

```ts
type CountryCode  // Union of installed country codes ("SA" | "US" | ...)
type Country      // Full country object
type Region       // Region with cities array
type City         // City with name and optional coordinates
type LocalizedName // Object with multilingual name field
```

## Supported Languages

| Code | Language | Code | Language | Code | Language |
|---|---|---|---|---|---|
| `en` | English | `ja` | Japanese | `pl` | Polish |
| `ar` | Arabic | `ko` | Korean | `pt` | Portuguese |
| `de` | German | `nl` | Dutch | `pt-BR` | Portuguese (Brazil) |
| `es` | Spanish | `hi` | Hindi | `ru` | Russian |
| `fr` | French | `it` | Italian | `tr` | Turkish |
| `zh` | Chinese | `uk` | Ukrainian | | |

## Examples

See the [`examples/`](./examples) folder for working demos:

- **[`node-esm`](./examples/node-esm)** — Node.js with ES modules
- **[`vanilla-html`](./examples/vanilla-html)** — Plain HTML + JS
- **[`vite-app`](./examples/vite-app)** — Vite + TypeScript

## License

[MIT](./LICENSE)
