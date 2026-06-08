import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig, LEAGUES } from "../src/config.mjs";
import { buildCalendar } from "../src/ics.mjs";
import { fetchLeagueSchedule } from "../src/lolesports.mjs";

const config = loadConfig();
const generatedAt = new Date();
const stopBefore = new Date(generatedAt.getTime() - config.pastDays * 24 * 60 * 60 * 1000);

await mkdir(config.outputDir, { recursive: true });

const allEvents = [];

for (const league of LEAGUES) {
  console.log(`Fetching ${league.name} (${league.id})`);
  const events = await fetchLeagueSchedule({
    apiKey: config.apiKey,
    locale: config.locale,
    league,
    maxPages: config.maxPagesPerLeague,
    stopBefore
  });

  console.log(`Fetched ${events.length} events for ${league.name}`);
  allEvents.push(...events);
}

const ics = buildCalendar({
  events: allEvents,
  calendarName: config.calendarName,
  productId: config.productId,
  sourceUrl: config.sourceUrl,
  generatedAt,
  now: generatedAt,
  pastDays: config.pastDays,
  futureDays: config.futureDays
});

const calendarPath = path.join(config.outputDir, config.calendarFilename);
await writeFile(calendarPath, ics, "utf8");

if (config.legacyCalendarFilename && config.legacyCalendarFilename !== config.calendarFilename) {
  await writeFile(path.join(config.outputDir, config.legacyCalendarFilename), ics, "utf8");
}

const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
const publicCalendarUrl = config.publicBaseUrl
  ? `${config.publicBaseUrl}/${config.calendarFilename}`
  : config.calendarFilename;

await writeFile(
  path.join(config.outputDir, "last-updated.json"),
  `${JSON.stringify({
    generatedAt: generatedAt.toISOString(),
    eventCount,
    calendarFilename: config.calendarFilename,
    leagues: LEAGUES.map((league) => league.slug)
  }, null, 2)}\n`,
  "utf8"
);

await writeFile(path.join(config.outputDir, ".nojekyll"), "", "utf8");
await writeFile(
  path.join(config.outputDir, "index.html"),
  buildIndexHtml({
    calendarName: config.calendarName,
    calendarUrl: publicCalendarUrl,
    generatedAt,
    eventCount
  }),
  "utf8"
);

console.log(`Wrote ${calendarPath} with ${eventCount} events`);

function buildIndexHtml({ calendarName, calendarUrl, generatedAt, eventCount }) {
  const escapedCalendarName = escapeHtml(calendarName);
  const escapedCalendarUrl = escapeHtml(calendarUrl);
  const webcalUrl = calendarUrl.startsWith("https://")
    ? `webcal://${calendarUrl.slice("https://".length)}`
    : calendarUrl;

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedCalendarName}</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f6f7f9;
      color: #172033;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 32px 16px;
    }

    main {
      width: min(720px, 100%);
      background: Canvas;
      color: CanvasText;
      border: 1px solid color-mix(in srgb, CanvasText 14%, transparent);
      border-radius: 8px;
      padding: clamp(24px, 5vw, 44px);
      box-shadow: 0 18px 50px color-mix(in srgb, #172033 10%, transparent);
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(28px, 5vw, 44px);
      line-height: 1.05;
      letter-spacing: 0;
    }

    p {
      margin: 0 0 18px;
      line-height: 1.65;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 28px;
    }

    a {
      color: #0b5cad;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0 16px;
      border-radius: 6px;
      background: #0b5cad;
      color: white;
      text-decoration: none;
      font-weight: 650;
    }

    .button.secondary {
      background: transparent;
      color: #0b5cad;
      border: 1px solid currentColor;
    }

    code {
      overflow-wrap: anywhere;
    }
  </style>
</head>
<body>
  <main>
    <h1>${escapedCalendarName}</h1>
    <p>訂閱 LoL Esports 的 First Stand、LCK、MSI、Worlds 賽程。</p>
    <p>目前 feed 包含 ${eventCount} 個事件。最後更新：${escapeHtml(generatedAt.toISOString())}</p>
    <p><code>${escapedCalendarUrl}</code></p>
    <div class="actions">
      <a class="button" href="${escapedCalendarUrl}">下載 .ics</a>
      <a class="button secondary" href="${escapeHtml(webcalUrl)}">用日曆訂閱</a>
    </div>
  </main>
</body>
</html>
`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
