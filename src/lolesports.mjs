const BASE_URL = "https://esports-api.lolesports.com/persisted/gw";

export async function fetchLeagueSchedule({
  fetchImpl = fetch,
  apiKey,
  locale,
  league,
  maxPages = 4,
  stopBefore
}) {
  const seenTokens = new Set();
  const pages = [];
  let nextToken;

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const page = await fetchSchedulePage({
      fetchImpl,
      apiKey,
      locale,
      leagueId: league.id,
      pageToken: nextToken
    });

    pages.push(page);

    const events = page.data?.schedule?.events || [];
    if (stopBefore && events.length > 0 && events.every((event) => {
      const startTime = Date.parse(event.startTime);
      return Number.isFinite(startTime) && startTime < stopBefore.getTime();
    })) {
      break;
    }

    nextToken = page.data?.schedule?.pages?.older;
    if (!nextToken || seenTokens.has(nextToken)) {
      break;
    }

    seenTokens.add(nextToken);
  }

  return pages.flatMap((page) => page.data?.schedule?.events || []);
}

async function fetchSchedulePage({
  fetchImpl,
  apiKey,
  locale,
  leagueId,
  pageToken
}) {
  const url = new URL(`${BASE_URL}/getSchedule`);
  url.searchParams.set("hl", locale);
  url.searchParams.set("leagueId", leagueId);

  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  const response = await fetchImpl(url, {
    headers: {
      "x-api-key": apiKey
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `LoL Esports API returned ${response.status} for league ${leagueId}: ${body.slice(0, 300)}`
    );
  }

  return response.json();
}
