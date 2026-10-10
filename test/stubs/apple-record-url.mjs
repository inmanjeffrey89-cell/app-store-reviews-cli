// One short page; echoes the requested feed URL into the review title so tests can see it.
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.includes('/lookup')) return Response.json({ results: [] });
  return Response.json({ feed: { entry: [{ 'im:name': { label: 'App' } }, { id: { label: 'r1' }, 'im:rating': { label: '5' }, title: { label: u }, content: { label: 'b' }, author: { name: { label: 'a' } }, 'im:version': { label: '1' }, updated: { label: 'x' } }] } });
};
