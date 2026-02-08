# Contributing to geo-data

Thanks for your interest in contributing. This guide covers the basics for getting started.

## Prerequisites

- Node.js >= 18
- npm

## Getting Started

```bash
# Clone the repository
git clone https://github.com/H4ck3r-x0/geo-data.git
cd geo-data

# Install root dependencies
npm install

# Install CLI package dependencies
cd packages/cli
npm install

# Build the CLI
npm run build
```

## Project Structure

This is a monorepo with two main parts:

- **`packages/cli/`** -- The npm package (`geo-data`) that users install. Built with Commander.js and tsup.
- **`registry/`** -- Pre-built JSON files for 218 countries, served via jsDelivr CDN. Contains `index.json` and individual country files in `countries/`.
- **`scripts/`** -- Build scripts that transform source data into the registry format.

## Development Workflow

Use watch mode for rapid iteration on the CLI:

```bash
cd packages/cli
npm run dev
```

To test against the local registry instead of fetching from the CDN:

```bash
GEO_DATA_REGISTRY=../../registry node dist/index.js add sa
```

## Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting. Run the following before submitting a PR:

```bash
npm run check
```

## Testing

```bash
cd packages/cli
npm test
```

When adding new utilities, write tests alongside them in `src/utils/*.test.ts`.

## Submitting Changes

1. Fork the repository.
2. Create a feature branch from `main` (`git checkout -b my-feature`).
3. Make your changes.
4. Run `npm run check` and `npm test` to verify everything passes.
5. Commit your changes with a clear, descriptive message.
6. Open a pull request against `main`.

## Data Corrections

If you find incorrect country or city data, each country is a separate JSON file in `registry/countries/`. You can edit the relevant file directly and open a PR.
