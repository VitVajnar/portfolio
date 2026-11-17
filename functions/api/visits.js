/* =========================================================
   GET /api/visits?key=TAJNY_KLIC&limit=50
   Vypíše poslední návštěvy jako CSV (oddělovač ;).
   Chráněno klíčem z proměnné STATS_KEY, logy nejsou veřejné.
   ========================================================= */
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export async function onRequestGet({ request, env }) {
  const params = new URL(request.url).searchParams;
  if (!env.STATS_KEY || params.get('key') !== env.STATS_KEY) {
    return new Response('Not found', { status: 404 });            // bez klíče se tváříme, že neexistuje
  }

  const limit = Math.min(Math.max(parseInt(params.get('limit'), 10) || 50, 1), 1000);
  const { results } = await env.DB
    .prepare('SELECT ts, url, ref, ua, country FROM visits ORDER BY id DESC LIMIT ?1')
    .bind(limit)
    .all();
  const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM visits').first('n');

  const header = 'ts;url;ref;ua;country';
  const rows = results.map((r) => [r.ts, r.url, r.ref, r.ua, r.country].map(csvCell).join(';'));

  return new Response([header, ...rows].join('\n') + '\n', {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'x-total-visits': String(total),
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}
