const { esc, rest, origin } = require('./_lib');

module.exports = async (req, res) => {
  const base = origin(req);
  try {
    const [items, secs, cats, pages] = await Promise.all([
      rest('items?select=id,created_at&order=created_at.desc&limit=5000'),
      rest('sections?select=id'),
      rest('categories?select=id'),
      rest('pages?select=slug,updated_at'),
    ]);
    const u = (loc, last) => '<url><loc>' + esc(base + loc) + '</loc>' + (last ? '<lastmod>' + esc(String(last).slice(0, 10)) + '</lastmod>' : '') + '</url>';
    const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      u('/') + u('/forum') +
      pages.map((p) => u('/p/' + p.slug, p.updated_at)).join('') +
      secs.map((s) => u('/s/' + s.id)).join('') +
      cats.map((c) => u('/c/' + c.id)).join('') +
      items.map((i) => u('/i/' + i.id, i.created_at)).join('') +
      '</urlset>';
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).send('error');
  }
};
