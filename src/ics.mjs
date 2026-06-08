import { createHash } from "node:crypto";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function buildCalendar({
  events,
  calendarName,
  productId,
  sourceUrl,
  generatedAt = new Date(),
  now = generatedAt,
  pastDays = 7,
  futureDays = 365
}) {
  const filtered = filterEvents(events, { now, pastDays, futureDays });
  const normalized = filtered
    .map((event) => normalizeEvent(event, { sourceUrl }))
    .sort((left, right) => left.start - right.start || left.summary.localeCompare(right.summary));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${productId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H"
  ];

  for (const event of normalized) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${formatUtcDate(generatedAt)}`,
      `DTSTART:${formatUtcDate(event.start)}`,
      `DTEND:${formatUtcDate(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      `LOCATION:${escapeText("LoL Esports")}`,
      `STATUS:${event.status}`,
      `URL:${event.url}`,
      `LAST-MODIFIED:${formatUtcDate(generatedAt)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export function filterEvents(events, { now = new Date(), pastDays = 7, futureDays = 365 } = {}) {
  const from = now.getTime() - pastDays * DAY;
  const to = now.getTime() + futureDays * DAY;
  const byUid = new Map();

  for (const event of events) {
    const start = Date.parse(event.startTime);
    if (!Number.isFinite(start) || start < from || start > to) {
      continue;
    }

    const uid = event.match?.id || event.id || fallbackUid(event);
    byUid.set(uid, event);
  }

  return [...byUid.values()];
}

export function normalizeEvent(event, { sourceUrl }) {
  const start = new Date(event.startTime);
  const teams = (event.match?.teams || [])
    .map((team) => team.code || team.name || "TBD")
    .filter(Boolean);
  const teamLabel = teams.length > 0 ? teams.join(" vs ") : "TBD vs TBD";
  const strategy = event.match?.strategy || {};
  const format = strategy.type === "bestOf" && strategy.count
    ? `BO${strategy.count}`
    : strategy.type || "Match";
  const leagueName = event.league?.name || event.league?.slug || "LoL Esports";
  const blockName = event.blockName || "";
  const matchId = event.match?.id || event.id || fallbackUid(event);
  const summary = `[${leagueName}] ${teamLabel}${format ? ` (${format})` : ""}`;

  return {
    uid: `lolesports-${matchId}@calendaroflol`,
    start,
    end: new Date(start.getTime() + estimateDuration(strategy.count)),
    summary,
    description: [
      `League: ${leagueName}`,
      blockName ? `Stage: ${blockName}` : "",
      `Teams: ${teamLabel}`,
      `Format: ${format}`,
      event.state ? `State: ${event.state}` : "",
      `Source: ${sourceUrl}`
    ].filter(Boolean).join("\n"),
    status: event.state === "unstarted" || event.state === "inProgress" ? "CONFIRMED" : "TENTATIVE",
    url: sourceUrl
  };
}

export function formatUtcDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function escapeText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function foldLine(line) {
  const chunks = [];
  let current = "";
  let currentBytes = 0;
  const limit = 75;

  for (const char of line) {
    const bytes = Buffer.byteLength(char);
    if (currentBytes + bytes > limit) {
      chunks.push(current);
      current = char;
      currentBytes = bytes;
    } else {
      current += char;
      currentBytes += bytes;
    }
  }

  chunks.push(current);
  return chunks.map((chunk, index) => index === 0 ? chunk : ` ${chunk}`).join("\r\n");
}

function estimateDuration(bestOfCount) {
  if (bestOfCount >= 5) {
    return 5 * HOUR;
  }

  if (bestOfCount >= 3) {
    return 3 * HOUR;
  }

  return 90 * 60 * 1000;
}

function fallbackUid(event) {
  return createHash("sha1")
    .update(JSON.stringify({
      startTime: event.startTime,
      blockName: event.blockName,
      league: event.league?.slug,
      teams: event.match?.teams?.map((team) => team.code || team.name)
    }))
    .digest("hex");
}
