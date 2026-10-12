const fs = require('fs');
const path = require('path');
const { esc, rest, origin } = require('./_lib');

let tpl = null;
function template() {
  if (!tpl) tpl = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  return tpl;
}

module.exports = async (req, res) => {
  const u = new URL(req.url || '/', 'http://x');
  let id = u.searchParams.get('id');
  if (!id) {
    const m = u.pathname.match(/\/i\/([0-9a-f-]{36})/i);
    id = m && m[1];
  }
  let html = template();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return res.status(200).send(html);

  try {
    const [items, cfg] = await Promise.all([
      rest('items?id=eq.' + id + '&select=title,body,image_url,created_at&limit=1'),
      rest('site_settings?id=eq.1&select=name&limit=1'),
    ]);
    const it = items[0];
    if (!it) return res.status(404).send(html);
    const site = (cfg[0] && cfg[0].name) || 'المكتبة';
    const url = origin(req) + '/i/' + id;
    const title = esc(it.title) + ' | ' + esc(site);
    const desc = esc(it.body.replace(/\s+/g, ' ').slice(0, 160));
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: it.title,
      datePublished: it.created_at,
      inLanguage: 'ar',
      mainEntityOfPage: url,
    };
    if (it.image_url) ld.image = it.image_url;
    const head =
      '<link rel="canonical" href="' + esc(url) + '">' +
      '<meta property="og:url" content="' + esc(url) + '">' +
      '<meta property="og:description" content="' + desc + '">' +
      (it.image_url ? '<meta property="og:image" content="' + esc(it.image_url) + '"><meta name="twitter:card" content="summary_large_image">' : '') +
      '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>';
    const body = '<article><h2>' + esc(it.title) + '</h2>' +
      it.body.split('\n').map((p) => '<p>' + esc(p) + '</p>').join('') + '</article>';
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, () => '<title>' + title + '</title>')
      .replace(/(<meta name="description" content=")[^"]*(")/, (m, a, b) => a + desc + b)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, (m, a, b) => a + title + b)
      .replace('</head>', () => head + '</head>')
      .replace('<main id="ws" aria-live="polite"></main>', () => '<main id="ws" aria-live="polite">' + body + '</main>');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (e) {
    return res.status(200).send(html);
  }
};
