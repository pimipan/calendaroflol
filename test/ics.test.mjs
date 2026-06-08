import test from "node:test";
import assert from "node:assert/strict";
import { buildCalendar, escapeText, foldLine, formatUtcDate } from "../src/ics.mjs";

test("formats UTC dates for iCalendar", () => {
  assert.equal(formatUtcDate(new Date("2026-06-12T08:00:00.000Z")), "20260612T080000Z");
});

test("escapes iCalendar text fields", () => {
  assert.equal(escapeText("A, B; C\\D\nE"), "A\\, B\\; C\\\\D\\nE");
});

test("folds long lines with continuation whitespace", () => {
  const folded = foldLine(`SUMMARY:${"A".repeat(100)}`);
  assert.match(folded, /\r\n /);
});

test("builds a calendar with stable LoL Esports event fields", () => {
  const calendar = buildCalendar({
    calendarName: "calendaroflol",
    productId: "-//test//EN",
    sourceUrl: "https://lolesports.com/zh-TW/leagues/first_stand,lck,msi,worlds",
    generatedAt: new Date("2026-06-08T08:00:00Z"),
    now: new Date("2026-06-08T08:00:00Z"),
    pastDays: 7,
    futureDays: 30,
    events: [
      {
        startTime: "2026-06-12T08:00:00Z",
        state: "unstarted",
        blockName: "淘汰賽",
        league: {
          name: "LCK",
          slug: "lck"
        },
        match: {
          id: "115548128963037575",
          teams: [
            { code: "HLE", name: "Hanwha Life Esports" },
            { code: "T1", name: "T1" }
          ],
          strategy: {
            type: "bestOf",
            count: 5
          }
        }
      }
    ]
  });

  assert.match(calendar, /BEGIN:VCALENDAR/);
  assert.match(calendar, /BEGIN:VEVENT/);
  assert.match(calendar, /UID:lolesports-115548128963037575@calendaroflol/);
  assert.match(calendar, /SUMMARY:\[LCK\] HLE vs T1 \(BO5\)/);
  assert.match(calendar, /DTSTART:20260612T080000Z/);
  assert.match(calendar, /DTEND:20260612T130000Z/);
});
