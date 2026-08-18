# LinkedIn feed exporter

This is a local, user-invoked Playwright utility for exporting the LinkedIn feed that is rendered in a signed-in browser session. It is designed for traceable collection rather than stealth automation. The default mode stays on the feed page, expands visible post text, scrolls a bounded number of times, deduplicates records, and writes structured JSON and NDJSON files. The optional `--details` mode opens a bounded number of visible post pages and attempts to read the names exposed by the comments and reactions dialogs.

> The output is a record of what LinkedIn rendered to the signed-in user during the run. It is not a promise of universal or historical completeness.

## Safety and access boundary

The exporter does not read usernames or passwords, does not solve CAPTCHAs, does not call undocumented private endpoints, does not bypass access controls or result limits, and does not perform actions such as liking, commenting, messaging, following, or applying to jobs. Headed mode is the default so that the user can see the browser activity. Run it only for data you are authorized to collect and retain.

LinkedIn’s official documentation currently presents approved APIs for products such as sign-in, sharing, and company/community management, but not a general member home-feed read API. LinkedIn also states that unauthorized crawlers, bots, browser extensions, and scraping tools may violate its User Agreement. See `linkedin-collection-findings.md` for the source links and the resulting engineering decision.

## Run it

From the repository root, install the project dependencies and run:

```sh
pnpm install
pnpm export -- --max-posts 100 --max-scrolls 30
```

The browser opens with a persistent local profile at `.local/linkedin-profile` by default. On the first run, sign in manually in that browser, open the feed you want to collect, and press Enter in the terminal. On later runs, the same browser profile reuses the saved LinkedIn session cookie, so you normally will not need to sign in again. The profile directory is ignored by Git and is never uploaded or included in the JSON output. If LinkedIn expires the session or you want to remove it, run `pnpm export -- --reset-session` and sign in again.

For bounded detail enrichment:

```sh
pnpm export -- --max-posts 50 --details --max-detail-posts 10 --max-engagement-entities 200
```

Useful options include `--url` for a specific LinkedIn feed URL, `--output` for a different output directory, `--profile-dir` to choose where the persistent session is stored, `--reset-session` to clear it, `--max-idle-scrolls` to stop when no new records appear, `--max-url-resolutions` to cap visible URL-resolution attempts, `--no-url-resolution` to disable menu resolution, `--debug-url-menus` to save sanitized opened-menu evidence to `url-menu-debug.json`, and `--headless` for environments where a visible browser is unavailable. Headed mode is recommended for normal use.

## Output files

The exporter writes a manifest and separate datasets under `data/linkedin-feed/latest` by default. The directory is ignored by Git because it may contain personal or third-party data.

| File | Contents |
| --- | --- |
| `manifest.json` | Schema version, collection window, options, counts, and coverage gaps. |
| `posts.json` | One normalized object per unique visible post. |
| `posts.ndjson` | The same posts as newline-delimited JSON for streaming ingestion. |
| `jobs.json` | Job cards detected in feed posts, linked back to their source post. |
| `authors.json` | Unique visible authors and the number of captured posts associated with each. |
| `engagement.json` | Per-post reaction/comment counts plus any visible social context and enriched entities. |

Each post includes `postUrl`, `crossCheckUrl`, and `postUrlStatus`. A URL is marked `verified` only when the DOM exposed a real post-shaped LinkedIn URL such as `/feed/update/urn:li:share:...` or a post URL containing a stable activity/share identifier. Company-page URLs, `/null`, profile URLs, and ad landing pages are never presented as post URLs. Cards for which LinkedIn does not expose a post URL remain in the export with `postUrlStatus: "unresolved"`, so the tool does not invent a link. When the card exposes a LinkedIn activity/share URN in its DOM attributes, the exporter constructs the corresponding `/feed/update/urn:li:...` cross-check URL. If the normal card DOM does not expose a URL or URN, the headed collector makes a bounded, visible interaction with the card’s More actions menu and uses LinkedIn’s Copy link to post action, reading only the resulting clipboard URL. This does not post, react, message, or modify the feed. Each record also includes text, author, social context, relative timestamp, visible engagement counts, media hints, job data where applicable, raw card text for auditability, and a `source` object describing the extraction mode and timestamp. Missing values remain `null` instead of being guessed. Existing JSON files containing fake `/null` or company-page URLs cannot be repaired with certainty after the fact; re-run the collector to obtain verified links from the live DOM.

## Accuracy model

The collector reports coverage instead of silently implying completeness. The manifest records the number of scrolls, visible cards, snapshots, unique posts, URL-resolution attempts, menu controls found, Copy link actions found, URL-resolution successes, verified post URLs, unresolved post URLs, promoted cards, detail attempts, detail successes, and any gaps. With `--debug-url-menus`, the separate `url-menu-debug.json` file contains only bounded visible menu text, roles, labels, hrefs, and menu HTML; it does not contain cookies, browser profile data, or credentials. LinkedIn currently labels the relevant card control as `Open control menu for post by …`; the collector recognizes that label in addition to generic More/Options labels. Records without a stable URL or identifier are retained only when they have meaningful text, and the manifest calls them out. The pasted-output regression cases are covered by tests for fake `/null` URLs, company-page URLs, promoted cards, degree suffixes, timestamps, and visible engagement labels.

In feed-only mode, comments and reaction identities are populated only when LinkedIn already exposes them in the feed card. In `--details` mode, the tool tries to open the rendered post page and read visible dialog entities, but LinkedIn may paginate, hide, personalize, or restrict those entities. The tool records dialog capture counts and whether the configured cap was reached. Counts such as reactions and comments are preserved as displayed and are not inflated through estimation.

## Tests

Run the deterministic parser tests with:

```sh
pnpm test
```

The tests cover count parsing, stable post identifiers, engagement extraction, job linking, and deduplication. Browser collection itself requires an authenticated LinkedIn session and is intentionally not run in CI by default.
