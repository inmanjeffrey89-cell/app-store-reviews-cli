import { reviewsUrl, parseReviews } from './appstore.js';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

export class AppStoreError extends Error {
  constructor(errorType, message, { retryable = false } = {}) { super(message); this.errorType = errorType; this.retryable = retryable; }
}
export async function fetchReviews(country, appId, page, { sortBy = 'mostRecent', fetchImpl = fetch } = {}) {
  const url = reviewsUrl(country, appId, page, sortBy);
  let res, body;
  try {
    res = await fetchImpl(url, { headers: { 'user-agent': UA } });
    body = await res.text();
  } catch (e) { throw new AppStoreError('NETWORK', `reviews request failed: ${e.message}`, { retryable: true }); }
  if (res.status === 429 || res.status === 403) throw new AppStoreError('BLOCKED', `HTTP ${res.status}`, { retryable: true });
  if (res.status === 400) throw new AppStoreError('INVALID_REQUEST', `Apple rejected the request (HTTP 400; is "${country}" a real App Store country?)`);
  if (res.status === 404) throw new AppStoreError('NOT_FOUND', `App ${appId} not found in ${country}`);
  if (!res.ok) throw new AppStoreError('NETWORK', `HTTP ${res.status}`, { retryable: res.status >= 500 || res.status === 408 });
  const reviews = parseReviews(body);
  if (reviews === null) throw new AppStoreError('BAD_RESPONSE', 'Apple answered with something other than a review feed', { retryable: true });
  return reviews;
}
export async function fetchAppName(country, appId, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(`https://itunes.apple.com/${country}/lookup?id=${appId}`, { headers: { 'user-agent': UA } });
  if (!res.ok) return null;
  const d = await res.json();
  return d.results?.[0]?.trackName ?? null;
}
