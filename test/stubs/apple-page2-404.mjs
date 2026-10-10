// Page 1: a full page of 50 reviews. Page 2: HTTP 404.
const entry = (i) => ({ id: { label: 'r' + i }, 'im:rating': { label: '4' }, title: { label: 't' }, content: { label: 'b' }, author: { name: { label: 'a' } }, 'im:version': { label: '1' }, updated: { label: '2026-10-01T00:00:00-07:00' } });
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.includes('/lookup')) return Response.json({ results: [] });
  if (u.includes('/page=1/')) return Response.json({ feed: { entry: [{ 'im:name': { label: 'App' } }, ...Array.from({ length: 50 }, (_, i) => entry(i))] } });
  return new Response('', { status: 404 });
};
