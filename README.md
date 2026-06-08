# calendaroflol

An auto-updating iCalendar subscription feed for selected LoL Esports leagues:

- First Stand
- LCK
- MSI
- Worlds

The project fetches schedule data from the LoL Esports schedule API, generates a static `.ics` file, and publishes it with GitHub Pages.

## Output

After a successful build, the generated files are written to `public/`:

- `public/calendaroflol.ics`
- `public/lol-esports.ics` compatibility alias
- `public/index.html`
- `public/last-updated.json`

Once GitHub Pages is enabled, the subscription URL will look like:

```text
https://<github-user>.github.io/<repo>/calendaroflol.ics
```

Many calendar apps also accept the `webcal://` version:

```text
webcal://<github-user>.github.io/<repo>/calendaroflol.ics
```

## Local Build

```bash
npm run build
```

The build uses the public LoL Esports web API key observed in community documentation by default. To override it:

```bash
LOLESPORTS_API_KEY=your_key npm run build
```

## GitHub Setup

1. Create a public GitHub repository and push this project.
2. In repository settings, open **Pages** and set the source to **GitHub Actions**.
3. The workflow in `.github/workflows/update-calendar.yml` will build and deploy the feed.
4. Run the workflow manually once from the **Actions** tab to publish the first version.

The scheduled workflow runs at 16:00, 17:00, 18:00, 19:00, 20:00, 21:00, and 22:00 in China/Taipei time.

GitHub scheduled workflows may be delayed at busy times, especially at the start of an hour. If reliability is more important than hitting the exact clock minute, change the cron minute from `0` to `5`.

## Configuration

These environment variables can be set locally or in GitHub Actions:

| Variable | Default | Description |
| --- | --- | --- |
| `LOLESPORTS_API_KEY` | community key | API key for `esports-api.lolesports.com` |
| `LOLESPORTS_LOCALE` | `zh-TW` | Locale used when fetching schedule names |
| `PUBLIC_BASE_URL` | empty | Optional published Pages URL used on the landing page |
| `CALENDAR_NAME` | `calendaroflol` | Calendar display name |
| `CALENDAR_FILENAME` | `calendaroflol.ics` | Primary generated calendar filename |
| `LEGACY_CALENDAR_FILENAME` | `lol-esports.ics` | Optional compatibility alias filename |
| `SOURCE_URL` | LoL Esports leagues URL | Source link included in event descriptions |
| `PAST_DAYS` | `7` | Include recently completed events for this many days |
| `FUTURE_DAYS` | `365` | Include future events for this many days |
| `MAX_PAGES_PER_LEAGUE` | `4` | Maximum schedule pages fetched per league |

## Notes

- The LoL Esports schedule API is not an official public product API. Riot may change access, schema, rate limits, or API keys.
- Calendar clients decide how often to refresh subscribed calendars. The feed advertises a one-hour refresh interval, but clients may refresh less often.
- GitHub Pages and GitHub Actions are free for this workflow when the repository is public and uses standard GitHub-hosted runners.
