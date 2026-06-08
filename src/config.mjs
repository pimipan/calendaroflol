export const DEFAULT_API_KEY = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z";

export const DEFAULT_SOURCE_URL =
  "https://lolesports.com/zh-TW/leagues/first_stand,lck,msi,worlds";

export const LEAGUES = [
  {
    name: "First Stand",
    slug: "first_stand",
    id: "113464388705111224"
  },
  {
    name: "LCK",
    slug: "lck",
    id: "98767991310872058"
  },
  {
    name: "MSI",
    slug: "msi",
    id: "98767991325878492"
  },
  {
    name: "Worlds",
    slug: "worlds",
    id: "98767975604431411"
  }
];

export function loadConfig(env = process.env) {
  return {
    apiKey: env.LOLESPORTS_API_KEY || DEFAULT_API_KEY,
    locale: env.LOLESPORTS_LOCALE || "zh-TW",
    calendarName: env.CALENDAR_NAME || "calendaroflol",
    productId: env.PRODUCT_ID || "-//calendaroflol//EN",
    calendarFilename: env.CALENDAR_FILENAME || "calendaroflol.ics",
    legacyCalendarFilename: env.LEGACY_CALENDAR_FILENAME || "lol-esports.ics",
    publicBaseUrl: normalizeBaseUrl(env.PUBLIC_BASE_URL || ""),
    sourceUrl: env.SOURCE_URL || DEFAULT_SOURCE_URL,
    pastDays: readNumber(env.PAST_DAYS, 7),
    futureDays: readNumber(env.FUTURE_DAYS, 365),
    maxPagesPerLeague: readNumber(env.MAX_PAGES_PER_LEAGUE, 4),
    outputDir: env.OUTPUT_DIR || "public"
  };
}

function readNumber(value, fallback) {
  if (value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}
