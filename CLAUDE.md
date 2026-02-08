# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

geo-data is a CLI tool that lets developers install only the country/city data they need, rather than bundling entire geography databases. It fetches data from a remote registry (jsDelivr CDN) and generates TypeScript/JavaScript helpers in the user's project.

## Repository Structure

This is a monorepo with two main parts:

- **`packages/cli/`** - The npm package (`geo-data`) users install. Built with Commander.js + tsup, outputs to `dist/`.
- **`registry/`** - Pre-built JSON files for 218 countries, served via jsDelivr CDN. Contains `index.json` (country listing) and individual country files in `countries/`.
- **`scripts/`** - Build scripts that transform source data into our registry format.

## Build Commands

```bash
# Build the CLI package (from repo root)
npm run build:cli
# Or directly:
cd packages/cli && npm run build

# Watch mode for CLI development
cd packages/cli && npm run dev

# Build the registry from source data (downloads 46MB, cached in .cache/)
npm run build:registry
```

## Linting, Formatting, and Testing

```bash
# Lint (from repo root)
npm run lint
# or: cd packages/cli && npm run lint

# Format
npm run format

# Check (lint + format)
npm run check

# Run tests
npm test
# or: cd packages/cli && npm test

# Watch mode
cd packages/cli && npm run test:watch

# Coverage
cd packages/cli && npm run test:coverage
```

## CLI Architecture

Entry point: `packages/cli/src/index.ts` — registers all Commander.js commands.

**Commands** (`src/commands/`): `init`, `add`, `list`, `update`, `remove`, `cache`, `pick`

**Utilities** (`src/utils/`):
- `config.ts` - Reads/validates `geo-data.json` from user's project (CWD). Config shape: `GeoDataConfig` with `outputDir`, `languages`, `includeCoordinates`, `typescript`.
- `registry.ts` - Fetches from CDN with file-based caching (`~/.cache/geo-data/`). Contains `fetchRegistry()` for the index and `fetchCountry()` for individual countries. Filters data by language/coordinate preferences via `filterCountryData()`. Supports offline fallback to stale cache.
- `codegen.ts` - `generateIndex()` reads installed country JSON files from `outputDir` and generates an `index.ts` (or `.js`) with imports, a `countries` const, and typed helper functions (`getCountry`, `getCities`, `getLocalizedName`, etc.).
- `ui.ts` - Wraps `@clack/prompts` and `figlet`/`gradient-string` for branded CLI output.

**Key pattern**: Every mutating command (`add`, `remove`, `update`) calls `generateIndex()` after modifying country files to keep the generated index in sync.

**Interactive features**: `pick` command uses `prompts` (autocompleteMultiselect) for fuzzy country search. `add` with no arguments delegates to `pick`. `add` uses `string-similarity` to suggest corrections for typos.

## Data Flow

1. User runs `npx geo-data add sa`
2. CLI reads `geo-data.json` for config (outputDir, languages, includeCoordinates)
3. Fetches country JSON from `https://cdn.jsdelivr.net/gh/H4ck3r-x0/geo-data@main/registry/countries/sa.json`
4. Filters data based on user's language preferences (English always included as fallback)
5. Writes filtered JSON to user's outputDir (e.g., `./src/data/geo/sa.json`)
6. Regenerates `index.ts` with imports and helper functions

## Registry Development

Set `GEO_DATA_REGISTRY` env var to local path for testing against local registry:
```bash
GEO_DATA_REGISTRY=/path/to/geo-data/registry npx geo-data add sa
```

When the env var is set to a local path (starts with `/` or `.`), the CLI reads files directly instead of fetching from CDN and skips caching.

## Build Scripts

All run via `npx tsx scripts/<name>.ts`:
- `build-registry.ts` - Downloads dr5hn's countries-states-cities database, transforms to our format, writes individual country JSON + `index.json`. Caches the 46MB source download in `.cache/source-data.json`.
- `add-arabic-global.ts` - Enriches all countries with Arabic city names from GeoNames data (coordinate-based matching).
- `enhance-sa.ts` - Adds Arabic names to Saudi Arabia specifically from harbi/saudi-geo.
- `manual-fixes.ts` - Applies hardcoded Arabic name corrections for Gulf countries (SA, AE, QA, KW, BH, OM).

## Tech Stack

- **CLI**: Commander.js, @clack/prompts, chalk, figlet, gradient-string, string-similarity, prompts
- **Build**: tsup (ESM output), TypeScript (ES2022, strict, bundler module resolution)
- **Data**: fs-extra throughout for file operations
- **Module system**: ESM (`.js` extensions in imports)

## Supported Languages

`en`, `ar`, `de`, `es`, `fr`, `hi`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `tr`, `uk`, `zh`
