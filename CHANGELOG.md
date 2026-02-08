# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-01-01

### Added

- CLI commands: `init`, `add`, `remove`, `update`, `list`, `pick`, and `cache`.
- Multi-language support for 17 languages: en, ar, de, es, fr, hi, it, ja, ko, nl, pl, pt, pt-BR, ru, tr, uk, zh.
- CDN-based registry serving data for 218 countries via jsDelivr.
- TypeScript and JavaScript code generation with typed helper functions (`getCountry`, `getCities`, `getLocalizedName`, `getRegions`, `getAllCities`, `getCountryCodes`, `isValidCountryCode`).
- Interactive country picker with fuzzy search via the `pick` command.
- Offline cache fallback for working without network access after first download.
- Typo correction with string-similarity suggestions when adding countries.
- Configurable output directory, language selection, coordinate inclusion, and TypeScript/JavaScript toggle via `geo-data.json`.
- `--dry-run` flag for `add` and `update` commands to preview changes.
- `--force` flag for `add` and `remove` commands to skip confirmations and overwrite existing data.
