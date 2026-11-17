/* =========================================================
   POST /api/track — uloží jednu návštěvu do databáze D1.
   Cloudflare Pages Function (obdoba track.php ze zadání).
   Ukládá: čas, URL, referrer, user agent a zemi.
   IP adresu záměrně neukládá (GDPR).
   ========================================================= */
const MAX_BODY = 2048;                       // větší data nepřijímáme
const BOTS = /bot|crawl|spider|slurp|preview|headless/i;

// Odstraní z adresy parametry a #kotvu, ať se v logu neobjeví nic citlivého.
const cleanUrl = (value) => {
  try {
    const u = new URL(String(value));
    return (u.origin + u.pathname).slice(0, 300);
  } catch {
    return '';
  }
};

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY) return new Response('Bad payload', { status: 400 });

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return new Response('Bad payload', { status: 400 });
  }

  const url = cleanUrl(data.url);
  const ua = String(data.ua || request.headers.get('user-agent') || '').slice(0, 200);
  if (!url) return new Response('Bad payload', { status: 400 });
  if (BOTS.test(ua)) return new Response(null, { status: 204 });   // roboty nepočítáme

  await env.DB
    .prepare('INSERT INTO visits (ts, url, ref, ua, country) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(new Date().toISOString(), url, cleanUrl(data.ref), ua, request.cf?.country || '')
    .run();

  return new Response(null, { status: 204 });                     // 204 = No Content
}
