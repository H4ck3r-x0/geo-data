# geo-data

Install only the countries you need. Get typed helpers for free.

Most geography packages ship megabytes of data for 250 countries when your app needs three. geo-data flips that — you pick the countries, it fetches only those, and generates a typed API in your project. No runtime dependency, no bloat.

```bash
npx geo-data init
npx geo-data add sa ae
```

That's it. You now have `sa.json`, `ae.json`, and a generated `index.ts` in your project:

```ts
import { getCities, getLocalizedName } from '@/data/geo';

const cities = getCities('SA');
// [{ name: { en: "Riyadh", ar: "الرياض" }, latitude: 24.7136, ... }]

getLocalizedName(cities[0], 'ar'); // "الرياض"
```

Type-safe country codes, autocomplete, 17 languages. All from local files you can inspect and edit.

## Don't know the country code?

```bash
npx geo-data pick
```

Fuzzy search across 218 countries. Type "sau" and it finds Saudi Arabia. Space to select, Enter to install.

Or just guess — if you type `npx geo-data add saa`, it'll suggest `sa (Saudi Arabia)`.

## Commands

```bash
npx geo-data init                   # Set up config
npx geo-data add sa ae qa           # Install countries
npx geo-data add sa --dry-run       # Preview without writing
npx geo-data pick                   # Interactive fuzzy search
npx geo-data list                   # All 218 countries
npx geo-data list --installed       # What you have
npx geo-data update                 # Re-fetch installed countries
npx geo-data remove sa              # Remove a country
npx geo-data cache clear            # Clear offline cache
```

Commands that prompt support `--force` (skip confirmation). All mutating commands support `--dry-run` (preview only).

## Configuration

`geo-data init` creates a `geo-data.json` in your project root:

```json
{
  "$schema": "https://raw.githubusercontent.com/H4ck3r-x0/geo-data/main/schema.json",
  "outputDir": "./src/data/geo",
  "languages": ["en", "ar"],
  "includeCoordinates": true,
  "typescript": true
}
```

**`outputDir`** — where country files and the generated index go. Default: `./src/data/geo`

**`languages`** — which translations to include. English is always kept as a fallback. Available: `en` `ar` `de` `es` `fr` `hi` `it` `ja` `ko` `nl` `pl` `pt` `pt-BR` `ru` `tr` `uk` `zh`

**`includeCoordinates`** — whether cities include `latitude`/`longitude`. Default: `false`

**`typescript`** — generates `index.ts` with full types. Set to `false` for plain `index.js`. Default: `true`

## What gets generated

When you add countries, the CLI writes their JSON files to your output directory and generates an `index.ts` (or `.js`) with typed helpers:

- `getCountry('SA')` — full country object
- `getCities('SA')` — all cities, or `getCities('SA', 'SA-01')` for a specific region
- `getLocalizedName(item, 'ar')` — get a translated name with English fallback
- `isValidCountryCode(input)` — type guard for user input

Country codes are a union type based on what you've installed, so your editor catches typos.

## What a country file looks like

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

It's plain JSON. You own it, you can commit it, and you can hand-edit it if you need to. Running `update` re-downloads fresh data from the registry, so keep that in mind if you've made local changes.

## Example: city selector with i18n

```tsx
import { getCities, getLocalizedName } from '@/data/geo';

function CitySelect({ country, lang }: { country: 'SA' | 'AE', lang: string }) {
  const cities = getCities(country);

  return (
    <select>
      {cities.map(city => (
        <option key={city.name.en} value={city.name.en}>
          {getLocalizedName(city, lang)}
        </option>
      ))}
    </select>
  );
}
```

## Good to know

**Offline support** — Country data is cached in `~/.cache/geo-data/` after the first download. If you lose connectivity, the CLI falls back to cached data. Run `npx geo-data cache` to see what's cached.

**Node.js 18+** required.

**Data sources** — Country, region, and city data comes from [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database). Arabic city translations are sourced from [GeoNames](https://www.geonames.org/).

## Contributing

Each country is a standalone JSON file in `registry/countries/`. If you spot incorrect data — a wrong city name, missing translation, bad coordinates — open a PR fixing that file.

## License

MIT
