# Vajny — osobní portfolio

**Živý web:** _doplň po nasazení, např. `https://vajny.pages.dev`_
**Autor:** Vajny (Vít Vajnar), obor Informační technologie, 4. ročník, Praha
**Předměty:** WWW (webové projekty), DIM (grafická a video tvorba)

## Popis projektu

Osobní portfolio, které představuje moji práci z webového vývoje a z video a grafické tvorby.
Je to statický web napsaný ručně v HTML, CSS a čistém JavaScriptu, bez frameworků a bez šablon.
Design je tmavý a minimalistický (námořnická modř, jedno písmo Inter Tight, jemné skleněné efekty).
Inspiroval jsem se aplikacemi od Applu.

Úvodní sekce obsahuje krátké představení a čtyři „dlaždice“ jako ikony aplikací: web, video, e-mail a Instagram.
Projekty jsou v nekonečných posuvných pásech („reelech“), které jdou táhnout myší i prstem.
Po kliknutí na kartu se otevře detail s popisem, mojí rolí, technologiemi, odkazem a 1–3 náhledy.
Sekce Tools ukazuje nástroje, které používám (Premiere Pro, After Effects, Figma, HTML, CSS, JS), formou malých živých ukázek.

Web je responzivní (mobil, tablet, PC) a ovládá se i klávesnicí.
Respektuje nastavení `prefers-reduced-motion`.
Návštěvnost se měří vlastní funkcí na Cloudflare (viz níže) a navíc přes Cloudflare Web Analytics.

## Struktura souborů

```
portfolio/
├─ index.html              hlavní stránka (všechny sekce)
├─ css/style.css           jediný styl
├─ js/main.js              jediný skript (animace, reely, dialog, měření návštěv)
├─ img/                    náhledy projektů
├─ functions/api/
│  ├─ track.js             POST /api/track: uloží návštěvu do databáze
│  └─ visits.js            GET /api/visits: výpis návštěv jako CSV (chráněno klíčem)
├─ db/schema.sql           tabulka pro databázi Cloudflare D1
├─ _headers                hlavičky pro Cloudflare Pages
└─ README.md
```

## Použité technologie a knihovny

- **HTML5:** sémantické značky `header`, `nav`, `main`, `section`, `article`, `footer`, `dialog`.
- **CSS3:** Grid, Flexbox, proměnné, `clamp()`, `backdrop-filter`, `:has()`, animace přes `@keyframes`.
- **JavaScript (vanilla, bez knihoven):** `IntersectionObserver`, `requestAnimationFrame`, Pointer Events, `navigator.sendBeacon`.
- **Písmo:** [Inter Tight](https://fonts.google.com/specimen/Inter+Tight) z Google Fonts (licence SIL Open Font License).
- **Hosting:** Cloudflare Pages.
- **Back-end pro měření:** Cloudflare Pages Functions (JavaScript) a databáze Cloudflare D1 (SQLite).
- **Statistiky navíc:** Cloudflare Web Analytics (bez cookies).

Žádné externí JS knihovny ani frameworky se nepoužívají.

## Nasazení (Cloudflare Pages + GitHub)

1. **Repozitář na GitHubu:** založ veřejný repozitář (např. `portfolio`) a nahraj do něj obsah této složky (`index.html` musí být v kořeni).
2. **Projekt v Cloudflare Pages:** v Cloudflare dashboardu otevři **Workers & Pages → Create → Pages → Connect to Git** a vyber repozitář.
   - Framework preset: **None**
   - Build command: _(prázdné)_
   - Build output directory: `/`
3. **Databáze:** vytvoř ji v **Storage & Databases → D1 → Create** a pojmenuj `portfolio-visits`.
   - V záložce **Console** spusť obsah souboru `db/schema.sql`.
4. **Propojení databáze:** v projektu Pages otevři **Settings → Bindings → Add → D1 database**.
   - Variable name: `DB`
   - Database: `portfolio-visits`
5. **Klíč pro výpis návštěv:** v **Settings → Variables and Secrets** přidej typ **Secret** s názvem `STATS_KEY` a dlouhou náhodnou hodnotou (klíč nikam nezveřejňuj).
6. **Nasazení:** v záložce **Deployments** zvol **Retry deployment**, aby se propojení projevilo.
7. **Web Analytics:** v projektu Pages otevři **Metrics → Web Analytics → Enable**. Skript se do stránek vloží sám.

Web pak běží na adrese `https://<název-projektu>.pages.dev` s HTTPS.
Každý `git push` do větve `main` web automaticky znovu nasadí.

> Poznámka: nahrání složky přetažením (Direct Upload) Pages Functions nepodporuje, proto je potřeba GitHub.

## Měření návštěvnosti

**Řešení:** obdoba varianty A ze zadání (JS + server, logování do tabulky), jen místo PHP běží na Cloudflare funkce v JavaScriptu.
1. Po načtení stránky skript v `js/main.js` pošle přes `navigator.sendBeacon` na adresu `/api/track` tyto údaje: čas, URL stránky, referrer a user agent.
2. Funkce `functions/api/track.js` je zkontroluje a uloží jako jeden řádek do tabulky `visits` v databázi D1.
3. Z URL odstraňuje parametry a kotvy a ukládá jen zemi (např. `CZ`), kterou dodá Cloudflare. **IP adresu neukládá.**
4. Roboty nepočítá. Nic se neposílá z `localhost` ani návštěvníkům se zapnutým Do Not Track / Global Privacy Control.

**Proč tato data:** chci vědět, kolik lidí web vidí, odkud přišli (např. z Instagramu) a z jakých zařízení, abych mohl web ladit hlavně pro mobil.
Nepoužívám žádné cookies ani osobní údaje, takže web nepotřebuje lištu se souhlasem.

**Výpis logu:** `https://<adresa-webu>/api/visits?key=<STATS_KEY>&limit=5`
Vrátí CSV s oddělovačem `;`. Bez správného klíče vrátí 404, takže logy nejsou veřejné.

Ukázka výpisu (prvních 5 řádků):

```
ts;url;ref;ua;country
doplň po nasazení: zkopíruj sem 5 řádků z /api/visits?limit=5
```

## Obrázky: původ a licence

| Soubor | Co zobrazuje | Původ / licence |
|---|---|---|
| `img/muzeum-1.jpg` až `muzeum-4.jpg` | screenshoty mého webu Muzeum Věků Praha | vlastní (screenshoty vlastního projektu). _Fotky použité uvnitř webu muzea: doplň zdroj._ |
| `img/web-*.svg` | zástupné náhledy webových projektů | vlastní (vytvořené pro tento web), budou nahrazeny |
| `img/design-*.svg`, `img/video-*.svg` | zástupné náhledy videí | vlastní (vytvořené pro tento web), budou nahrazeny |
| ikony v sekcích Hero a Tools | inline SVG | vlastní kresba. Loga Adobe, Figma, HTML5, CSS a JS jsou ochranné známky svých vlastníků a jsou použita jen jako odkaz na nástroj. |

## Známé limity a TODO

- [ ] **Víc stránek:** zadání chce minimálně 3 stránky (`index.html`, `www.html`, `dim.html`, `extra.html`), web je zatím jednostránkový.
- [ ] **Sekce DIM:** doplnit grafickou tvorbu (plakáty, loga, retuše) s popisem, formátem, nástrojem, rokem a náhledy.
- [ ] **Projekty:** nahradit ukázkové projekty (Café Kompas, Study Planner, School Open Day a videa) skutečnými a opravit odkazy `example.com`.
- [ ] **Muzeum Věků Praha:** doplnit odkaz na živou verzi.
- [ ] **Kontakty:** přidat odkaz na GitHub nebo LinkedIn.
- [ ] **Favicon:** přidat.
- [ ] **Jazyk:** web je v angličtině (`lang="en"`). Zvážit českou verzi.
- [ ] **Google Fonts:** písmo se načítá z Googlu. Pro lepší GDPR je možné ho hostovat přímo na webu.
- [ ] **Ukázka logu:** po nasazení doplnit ukázku logu návštěv do tohoto README.
- **Bez JavaScriptu:** web funguje i bez JS, jen bez animací a detailu projektů.
