import { getCities, getCountry, getCountryCodes, getLocalizedName, getRegions } from "./data/geo/index.js";

let lang = "en";

const ui = {
  title: document.getElementById("title"),
  langBtn: document.getElementById("langBtn"),
  countryLabel: document.getElementById("countryLabel"),
  country: document.getElementById("country"),
  regionLabel: document.getElementById("regionLabel"),
  region: document.getElementById("region"),
  cityLabel: document.getElementById("cityLabel"),
  city: document.getElementById("city"),
  info: document.getElementById("info"),
  infoName: document.getElementById("infoName"),
  infoRegion: document.getElementById("infoRegion"),
  infoCountry: document.getElementById("infoCountry"),
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
};

function setDir() {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
}

function renderLabels() {
  const l = labels[lang];
  ui.title.textContent = l.title;
  ui.langBtn.textContent = l.toggle;
  ui.countryLabel.textContent = l.country;
  ui.regionLabel.textContent = l.region;
  ui.cityLabel.textContent = l.city;
}

function buildOptions(selectEl, items, placeholder) {
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

function renderCountries() {
  const items = getCountryCodes().map((code) => ({
    value: code,
    label: getLocalizedName(getCountry(code), lang),
  }));
  buildOptions(ui.country, items, labels[lang].placeholder);
}

function renderRegions() {
  const code = ui.country.value;
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

function renderCities() {
  const countryCode = ui.country.value;
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

function updateInfo() {
  const countryCode = ui.country.value;
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

function renderAll() {
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
