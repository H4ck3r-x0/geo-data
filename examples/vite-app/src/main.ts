import {
  type CountryCode,
  getCities,
  getCountry,
  getCountryCodes,
  getLocalizedName,
  getRegions,
} from "./data/geo/index.js";

let lang: "en" | "ar" = "en";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const ui = {
  title: $<HTMLHeadingElement>("title"),
  langBtn: $<HTMLButtonElement>("langBtn"),
  countryLabel: $<HTMLLabelElement>("countryLabel"),
  country: $<HTMLSelectElement>("country"),
  regionLabel: $<HTMLLabelElement>("regionLabel"),
  region: $<HTMLSelectElement>("region"),
  cityLabel: $<HTMLLabelElement>("cityLabel"),
  city: $<HTMLSelectElement>("city"),
  info: $<HTMLDivElement>("info"),
  infoName: $<HTMLHeadingElement>("infoName"),
  infoRegion: $<HTMLParagraphElement>("infoRegion"),
  infoCountry: $<HTMLParagraphElement>("infoCountry"),
};

const labels = {
  en: {
    title: "Geo Data Explorer",
    country: "Country",
    region: "Region",
    city: "City",
    toggle: "العربية",
    placeholder: "—",
  },
  ar: {
    title: "مستكشف البيانات الجغرافية",
    country: "الدولة",
    region: "المنطقة",
    city: "المدينة",
    toggle: "English",
    placeholder: "—",
  },
} as const;

function setDir(): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

function renderLabels(): void {
  const l = labels[lang];
  ui.title.textContent = l.title;
  ui.langBtn.textContent = l.toggle;
  ui.countryLabel.textContent = l.country;
  ui.regionLabel.textContent = l.region;
  ui.cityLabel.textContent = l.city;
}

function buildOptions(
  selectEl: HTMLSelectElement,
  items: { value: string; label: string }[],
  placeholder: string,
): void {
  const selected = selectEl.value;
  selectEl.innerHTML = "";
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = placeholder;
  selectEl.appendChild(opt);
  for (const item of items) {
    const o = document.createElement("option");
    o.value = item.value;
    o.textContent = item.label;
    selectEl.appendChild(o);
  }
  if ([...selectEl.options].some((o) => o.value === selected)) {
    selectEl.value = selected;
  }
}

function renderCountries(): void {
  const items = getCountryCodes().map((code: CountryCode) => ({
    value: code,
    label: getLocalizedName(getCountry(code), lang),
  }));
  buildOptions(ui.country, items, labels[lang].placeholder);
}

function renderRegions(): void {
  const code = ui.country.value as CountryCode;
  if (!code) {
    buildOptions(ui.region, [], labels[lang].placeholder);
    renderCities();
    return;
  }
  const items = getRegions(code).map((r) => ({
    value: r.code,
    label: getLocalizedName(r, lang),
  }));
  buildOptions(ui.region, items, labels[lang].placeholder);
  renderCities();
}

function renderCities(): void {
  const countryCode = ui.country.value as CountryCode;
  const regionCode = ui.region.value;
  if (!countryCode || !regionCode) {
    buildOptions(ui.city, [], labels[lang].placeholder);
    ui.info.style.display = "none";
    return;
  }
  const cities = getCities(countryCode, regionCode);
  const items = cities.map((c, i) => ({
    value: String(i),
    label: getLocalizedName(c, lang),
  }));
  buildOptions(ui.city, items, labels[lang].placeholder);
  updateInfo();
}

function updateInfo(): void {
  const countryCode = ui.country.value as CountryCode;
  const regionCode = ui.region.value;
  const cityIdx = ui.city.value;
  if (!countryCode || !regionCode || cityIdx === "") {
    ui.info.style.display = "none";
    return;
  }
  const country = getCountry(countryCode);
  const region = getRegions(countryCode).find((r) => r.code === regionCode);
  const city = getCities(countryCode, regionCode)[Number(cityIdx)];
  if (!city || !region) {
    ui.info.style.display = "none";
    return;
  }

  ui.infoName.textContent = getLocalizedName(city, lang);
  ui.infoRegion.textContent = `${labels[lang].region}: ${getLocalizedName(region, lang)}`;
  ui.infoCountry.textContent = `${labels[lang].country}: ${getLocalizedName(country, lang)} ${country.flag}`;
  ui.info.style.display = "block";
}

function renderAll(): void {
  setDir();
  renderLabels();
  renderCountries();
  renderRegions();
}

ui.langBtn.addEventListener("click", () => {
  lang = lang === "en" ? "ar" : "en";
  renderAll();
});
ui.country.addEventListener("change", renderRegions);
ui.region.addEventListener("change", renderCities);
ui.city.addEventListener("change", updateInfo);

renderAll();
