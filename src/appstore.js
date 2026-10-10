// Apple App Store customer reviews via the open iTunes RSS JSON feed.
export function parseAppId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^\d+$/.test(s)) return s;
  // The id is its own segment (id389801252, /id389801252) or ?id=; a slug like "covid19-tracker" is not one.
  const m = s.match(/(?:^|\/)id(\d+)(?=$|[/?#])/) || s.match(/[?&]id=(\d+)(?=$|[&#])/);
  return m ? m[1] : null;
}

// The storefront in an App Store link (apps.apple.com/gb/app/...), or null.
export function parseCountry(input) {
  const m = String(input ?? '').match(/(?:apps|itunes)\.apple\.com\/([a-z]{2})\//i);
  return m ? m[1].toLowerCase() : null;
}

export function reviewsUrl(country, appId, page, sortBy = 'mostRecent') {
  const sort = sortBy === 'mostHelpful' ? 'mostHelpful' : 'mostRecent';
  return `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=${sort}/page=${page}/json`;
}

// Returns the reviews, [] when the feed has none, or null when the body isn't a feed at all.
export function parseReviews(body) {
  let d;
  try { d = JSON.parse(body); } catch { return null; }
  if (!d || typeof d !== 'object' || !d.feed) return null;
  let entries = d.feed.entry;
  if (!entries) return [];
  if (!Array.isArray(entries)) entries = [entries];
  const out = [];
  for (const e of entries) {
    if (!e['im:rating']) continue; // the first entry is app metadata
    out.push({
      reviewId: e.id?.label ?? null,
      rating: Number(e['im:rating'].label),
      title: e.title?.label ?? '',
      body: e.content?.label ?? '',
      author: e.author?.name?.label ?? null,
      version: e['im:version']?.label ?? null,
      updated: e.updated?.label ?? null,
    });
  }
  return out;
}
