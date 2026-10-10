#!/usr/bin/env node
// app-store-reviews — fetch Apple App Store reviews for an app from the command line. No API key.
import { run, CliError } from './src/cli.js';
import { parseAppId, parseCountry } from './src/appstore.js';
import { fetchReviews, fetchAppName } from './src/appstore-fetch.js';

const MAX_PAGES = 10; // Apple's feed serves at most 10 pages of 50, newest first

const usage = `Usage: app-store-reviews <app-url-or-id> [country] [maxReviews] [--json]

  app-url-or-id  e.g. 389801252 or an apps.apple.com/us/app/.../id389801252 link
  country        two-letter App Store country (default: the link's storefront, else us)
  maxReviews     stop after this many, newest first (default: 100; Apple caps the feed near 500)
  --json         print one JSON envelope instead of a bare JSON array

Exit: 0 ok · 1 bad input · 2 Apple request failed · 3 no reviews in this country (or no such app)`;

run({
  tool: 'app-store-reviews',
  usage,
  positionals: 3,
  async main(args) {
    const [ref, countryArg, maxArg = '100'] = args.positional;
    if (!ref) throw new CliError('USAGE', 'missing <app-url-or-id>');
    const appId = parseAppId(ref);
    if (!appId) throw new CliError('INVALID_INPUT', `not an App Store app id or URL: ${ref}`);
    const country = (countryArg ?? parseCountry(ref) ?? 'us').toLowerCase();
    if (!/^[a-z]{2}$/.test(country)) throw new CliError('INVALID_INPUT', `country must be a two-letter code, got "${countryArg}"`);
    const max = Number(maxArg);
    if (!Number.isInteger(max) || max < 1) throw new CliError('INVALID_INPUT', `maxReviews must be a positive integer, got "${maxArg}"`);

    const results = [];
    const seen = new Set();
    let error = null;
    for (let page = 1; page <= MAX_PAGES && results.length < max; page++) {
      let reviews;
      try {
        reviews = await fetchReviews(country, appId, page);
      } catch (e) {
        error = results.length
          ? new CliError(e.errorType || 'INTERNAL', `stopped after ${results.length} reviews: ${e.message}`, { retryable: !!e.retryable })
          : e;
        break;
      }
      if (!reviews.length) break;
      for (const r of reviews) {
        if (seen.has(r.reviewId) || results.length >= max) continue;
        seen.add(r.reviewId);
        results.push(r);
      }
      if (reviews.length < 50) break;
    }
    const appName = results.length ? await fetchAppName(country, appId).catch(() => null) : null;
    return {
      input: { appId, country, maxReviews: max },
      results,
      error,
      meta: appName ? { appName } : undefined,
      emptyMessage: `no reviews for app ${appId} in "${country}" (none yet, no such app, or Apple's feed came back empty; try again later)`,
      human: () => JSON.stringify(results, null, 2) + '\n',
    };
  },
});
