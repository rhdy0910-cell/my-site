const SB = 'https://bzscqeatttfphmzxcfyo.supabase.co';
const KEY = 'sb_publishable_CLdRxUS4QKThTkBCY7XYgQ_HCtdk9kT';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function rest(path) {
  const r = await fetch(SB + '/rest/v1/' + path, { headers: { apikey: KEY } });
  if (!r.ok) throw new Error('supabase ' + r.status);
  return r.json();
}
function origin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  return 'https://' + host;
}
module.exports = { esc, rest, origin };
