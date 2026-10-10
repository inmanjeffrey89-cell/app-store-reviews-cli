# app-store-reviews

Fetch **Apple App Store reviews** for any iOS app from the command line: rating, title, text, version, author, date, as JSON. No App Store Connect account, no API key.

```bash
npx app-store-reviews-cli 389801252 us 200
npx app-store-reviews-cli "https://apps.apple.com/gb/app/whatsapp-messenger/id310633997" gb 50 --json
```

Args: `<app-url-or-id>` `[country]` (default: the link's storefront, else `us`) `[maxReviews]` (default 100, newest first) `[--json]`.

## How it works

Reads Apple's public customer-reviews feed for the given country, newest first, deduplicating across pages. Apple serves at most 10 pages of 50 per app per country, so about 500 most-recent reviews is the ceiling. If the feed comes back empty you get exit `3`; it occasionally does that for a short while, so a retry later is worth it. MIT.

## Output contract

Identical across every tool in this family, so they chain cleanly from shell scripts and AI agents:

- **stdout** is data only: the plain format above, or one JSON envelope with `--json`
- **stderr** is diagnostics only: errors, warnings, summaries
- **exit codes**

| code | meaning |
|---|---|
| `0` | complete |
| `1` | usage error or invalid input |
| `2` | the upstream source failed. If some results arrived first they're still on stdout, and the envelope says `"complete": false` |
| `3` | the source answered, but had no data for this input |

With `--json`, success is one line on stdout:

```json
{"tool":"app-store-reviews","version":"1.0.0","input":{...},"complete":true,"count":42,"results":[...]}
```

and a failure is one line on stderr:

```json
{"tool":"app-store-reviews","version":"1.0.0","exitCode":2,"error":{"type":"BLOCKED","message":"HTTP 429","retryable":true}}
```

Branch on the exit code; log `error.type`: `USAGE`, `INVALID_INPUT` and `INVALID_REQUEST` (the source rejected the input) exit `1`; `NETWORK`, `BLOCKED` and `BAD_RESPONSE` (a captcha or consent page instead of data) exit `2` with `retryable` set; `NOT_FOUND` and `NO_DATA` exit `3`.

`--json --help` prints `{"tool","version","usage"}`. `--` ends option parsing, for inputs that start with a dash. Extra arguments are an error rather than silently dropped, so quote inputs that contain spaces.

## Android too, or this on a schedule?

- **Android**: [play-reviews-cli](https://github.com/inmanjeffrey89-cell/play-reviews-cli), same contract
- **Many apps, scheduled, structured**: the hosted [App Store Reviews Scraper](https://apify.com/beacondata/app-store-reviews-scraper), pay per review, apps with no reviews free
- **A weekly email digest of both stores' reviews**: [ready-made n8n workflow](https://inmanjeffrey89-cell.github.io/data-tools/n8n-workflows)

## The family

Five no-key data CLIs, one output contract:
[yt-transcript-cli](https://github.com/inmanjeffrey89-cell/yt-transcript-cli) ·
[keyword-ideas-cli](https://github.com/inmanjeffrey89-cell/keyword-ideas-cli) ·
[gtrends-cli](https://github.com/inmanjeffrey89-cell/gtrends-cli) ·
[play-reviews-cli](https://github.com/inmanjeffrey89-cell/play-reviews-cli) ·
[app-store-reviews-cli](https://github.com/inmanjeffrey89-cell/app-store-reviews-cli)

## Changelog

**1.0.0**: first release, built on the family's shared output contract from day one.

## License

MIT
