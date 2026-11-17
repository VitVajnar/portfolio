/* =========================================================
   Portfolio — interactions
   Vanilla JS, no dependencies. Loaded with `defer`.
   Everything is progressive: the page is fully usable without
   JS, and motion is reduced for prefers-reduced-motion users.
   ---------------------------------------------------------
   1. Opening intro + hero pop-in
   2. Mobile menu
   3. Nav: active section + sliding pill
   4. About statement (words light up)
   6. Scroll loop (all scroll-linked effects)
   7. Infinite reels — web + video (auto-move, drag, momentum)
   8. Project detail dialog
   9. Copy email + toast
   11. Footer year
   12. Visit tracking (Cloudflare Pages Function)
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = () => motionQuery.matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp01 = (n) => Math.min(Math.max(n, 0), 1);
  const session = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  /* ---------------------------------------------------------
     1. Opening intro → hero elements pop in
        Shown once per browser session; skipped for reduced
        motion; a click skips it.
     --------------------------------------------------------- */
  const intro = $('.intro');
  const startHero = () => { void root.offsetWidth; root.classList.add('is-ready'); };

  const finishIntro = () => {
    if (!intro || intro.classList.contains('is-leaving')) return;
    intro.classList.add('is-leaving');
    setTimeout(startHero, 380);                          // hero starts while the curtain lifts
    setTimeout(() => intro.classList.add('is-gone'), 1000);
    session.set('intro-seen', '1');
  };

  if (!intro || reduceMotion() || session.get('intro-seen')) {
    intro?.classList.add('is-gone');
    startHero();
  } else {
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))])
      .then(() => setTimeout(finishIntro, 850));          // let "Hello." breathe for a moment
    intro.addEventListener('click', finishIntro);
  }

  /* ---------------------------------------------------------
     2. Mobile menu
     --------------------------------------------------------- */
  const menuBtn = $('.menu-btn');
  const mobileNav = $('#mobile-nav');

  const setMenu = (open) => {
    if (!menuBtn || !mobileNav) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileNav.classList.toggle('is-open', open);
    mobileNav.inert = !open;
  };

  menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', mobileNav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav?.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (mobileNav?.classList.contains('is-open') && !e.target.closest('.site-header')) setMenu(false);
  });

  /* ---------------------------------------------------------
     3. Nav: active section + sliding pill
     --------------------------------------------------------- */
  const navLinks = $$('.nav__link');
  const allLinks = [...navLinks, ...$$('.mobile-nav__link')];
  const pill = $('.nav__pill');
  const sections = navLinks.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  let activeLink = null;

  const movePill = (link) => {
    if (!pill || !link || !link.offsetWidth) return;
    pill.style.setProperty('--x', `${link.offsetLeft}px`);
    pill.style.setProperty('--w', `${link.offsetWidth}px`);
    pill.style.setProperty('--o', 1);
  };

  const setActive = (id) => {
    allLinks.forEach((link) => {
      const on = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
      if (on && link.classList.contains('nav__link')) activeLink = link;
    });
    movePill(activeLink);
  };

  navLinks.forEach((link) => {
    link.addEventListener('pointerenter', () => movePill(link));
    link.addEventListener('focus', () => movePill(link));
  });
  $('.nav')?.addEventListener('pointerleave', () => movePill(activeLink));
  document.fonts?.ready.then(() => movePill(activeLink));

  /* ---------------------------------------------------------
     4. About statement — wrap words so they can light up
     --------------------------------------------------------- */
  const about = $('.about');
  const statement = $('[data-words]');
  let words = [];
  if (statement) {
    const text = statement.textContent.trim().replace(/\s+/g, ' ');
    statement.setAttribute('aria-label', text);   // screen readers get one sentence
    statement.textContent = '';
    text.split(' ').forEach((word, i, arr) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = word;
      statement.append(span, i < arr.length - 1 ? ' ' : '');
    });
    words = $$('.w', statement);
  }

  /* ---------------------------------------------------------
     6. Scroll loop — one rAF-throttled handler
     --------------------------------------------------------- */
  const header = $('.site-header');
  const toTop = $('.to-top');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    header?.classList.toggle('is-scrolled', y > 24);
    toTop?.classList.toggle('is-visible', y > vh * 0.75);
    toTop?.style.setProperty('--progress', (max > 0 ? clamp01(y / max) : 0).toFixed(4));

    // About: words light up across the pinned stretch
    if (words.length && !reduceMotion()) {
      const r = about.getBoundingClientRect();
      const p = clamp01((vh * 0.35 - r.top) / (r.height - vh * 0.9));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    }

    // Active nav link
    let activeId = sections[0]?.id;
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= vh * 0.45) activeId = s.id; });
    if (y >= max - 2) activeId = sections[sections.length - 1]?.id || activeId;
    if (activeLink?.getAttribute('href') !== `#${activeId}`) setActive(activeId);

    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  };
  window.addEventListener('scroll', requestTick, { passive: true });

  // Smooth return to top for every #home link
  $$('a[href="#home"]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
    $('.brand')?.focus({ preventScroll: true });
    history.replaceState(null, '', '#home');
  }));

  /* ---------------------------------------------------------
     7. Infinite reels (web design + video editing)
        - Each reel drifts right → left forever at a calm speed
        - Hover / keyboard focus eases it to a stop
        - Drag with mouse or finger; release keeps momentum,
          then it eases back into its endless drift
        - Cards are cloned (hidden from assistive tech) so the
          loop is seamless
     --------------------------------------------------------- */
  const reels = $$('.reel').map((reel, n) => {
    const track = $('.reel__track', reel);
    const cards = $$('.work-card', track);
    // Second reel drifts a little slower so the two never feel synced
    const AUTO_SPEED = n === 0 ? -42 : -34;   // px per second (negative = leftwards)

    const st = {
      reel, track, cards,
      setWidth: 0, x: 0, speed: AUTO_SPEED, inertia: 0,
      hovering: false, focused: false, visible: false, lastT: 0,
      dragging: false, pointerId: null, startX: 0, startOffset: 0,
      moved: false, samples: [], suppressClick: false,
    };

    const wrap = (v) => (st.setWidth ? ((v % st.setWidth) + st.setWidth) % st.setWidth - st.setWidth : v);
    const paint = () => track.style.setProperty('--x', `${st.x.toFixed(2)}px`);

    st.build = () => {
      $$('.is-clone', track).forEach((c) => c.remove());
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const first = cards[0];
      const last = cards[cards.length - 1];
      st.setWidth = last.offsetLeft + last.offsetWidth + gap - first.offsetLeft;
      const copies = Math.ceil((innerWidth * 1.5) / st.setWidth) + 1;
      for (let c = 0; c < copies; c++) {
        cards.forEach((card, i) => {
          const clone = card.cloneNode(true);
          clone.classList.add('is-clone');
          clone.dataset.index = String(i);
          clone.setAttribute('aria-hidden', 'true');
          clone.querySelectorAll('button, a').forEach((el) => el.setAttribute('tabindex', '-1'));
          clone.querySelector('.work-card__details')?.remove();
          track.append(clone);
        });
      }
      cards.forEach((card, i) => { card.dataset.index = String(i); });
    };

    // Drift loop — runs only while this reel is on screen
    const loop = (t) => {
      const dt = Math.min((t - (st.lastT || t)) / 1000, 1 / 20);
      st.lastT = t;
      if (!st.dragging) {
        if (Math.abs(st.inertia) > 4) {
          st.x += st.inertia * dt;
          st.inertia *= Math.exp(-dt * 3.2);           // exponential decay of the fling
          st.speed = st.inertia;                         // hand velocity back smoothly
        } else {
          st.inertia = 0;
          const target = (st.hovering || st.focused || reduceMotion()) ? 0 : AUTO_SPEED;
          st.speed += (target - st.speed) * Math.min(1, dt * 2.5);
          st.x += st.speed * dt;
        }
        st.x = wrap(st.x);
        paint();
      }
      if (st.visible) requestAnimationFrame(loop);
      else st.lastT = 0;
    };

    // Pointer drag with momentum
    reel.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      st.pointerId = e.pointerId;
      st.startX = e.clientX;
      st.startOffset = st.x;
      st.moved = false;
      st.samples = [{ x: e.clientX, t: e.timeStamp }];
      st.inertia = 0;
    });
    reel.addEventListener('pointermove', (e) => {
      if (e.pointerId !== st.pointerId) return;
      const dx = e.clientX - st.startX;
      if (!st.moved && Math.abs(dx) > 6) {
        // Capture only now, so plain clicks still reach the card
        st.moved = true;
        st.dragging = true;
        reel.setPointerCapture(e.pointerId);
        reel.classList.add('is-dragging');
      }
      if (!st.dragging) return;
      st.x = wrap(st.startOffset + dx);
      paint();
      st.samples.push({ x: e.clientX, t: e.timeStamp });
      if (st.samples.length > 6) st.samples.shift();
    });
    const endDrag = (e) => {
      if (e.pointerId !== st.pointerId) return;
      st.pointerId = null;
      if (!st.dragging) return;
      st.dragging = false;
      reel.classList.remove('is-dragging');
      st.suppressClick = true;
      setTimeout(() => { st.suppressClick = false; }, 0);
      // Release velocity from the last ~100ms of movement
      const lastS = st.samples[st.samples.length - 1];
      const firstS = st.samples.find((s) => lastS.t - s.t <= 100) || st.samples[0];
      const dt = (lastS.t - firstS.t) / 1000;
      const stale = e.timeStamp - lastS.t > 100;
      const v = !stale && dt > 0 ? (lastS.x - firstS.x) / dt : 0;
      st.inertia = Math.max(Math.min(v, 3000), -3000);
    };
    reel.addEventListener('pointerup', endDrag);
    reel.addEventListener('pointercancel', endDrag);
    reel.addEventListener('click', (e) => {
      if (st.suppressClick) { e.preventDefault(); e.stopPropagation(); }   // a drag is not a click
    }, true);

    reel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') st.hovering = true; });
    reel.addEventListener('pointerleave', () => { st.hovering = false; });

    // Keyboard: pause while focused and keep the focused card in view
    reel.addEventListener('focusin', (e) => {
      st.focused = true;
      const card = e.target.closest('.work-card');
      if (!card) return;
      const rr = reel.getBoundingClientRect();
      const r = card.getBoundingClientRect();
      if (r.left < rr.left + 24) st.x = wrap(st.x + (rr.left + 24 - r.left));
      else if (r.right > rr.right - 24) st.x = wrap(st.x - (r.right - rr.right + 24));
      paint();
    });
    reel.addEventListener('focusout', (e) => {
      if (!reel.contains(e.relatedTarget)) st.focused = false;
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        const was = st.visible;
        st.visible = entry.isIntersecting;
        if (st.visible && !was) requestAnimationFrame(loop);
      }).observe(reel);
    }

    return st;
  });

  const buildReels = () => reels.forEach((r) => r.cards.length && r.build());

  /* ---------------------------------------------------------
     8. Project detail dialog (shared by both reels)
     --------------------------------------------------------- */
  const pd = $('.project-dialog');
  const pdBody = $('.pd-body');

  const closeDialog = (dialog) => {
    if (!dialog.open) return;
    if (reduceMotion()) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    setTimeout(() => { dialog.classList.remove('is-closing'); dialog.close(); }, 280);
  };

  if (pd && typeof pd.showModal === 'function') {
    reels.forEach(({ track, cards }) => {
      track.addEventListener('click', (e) => {
        const btn = e.target.closest('.work-card__open');
        if (!btn) return;
        const card = cards[Number(btn.closest('.work-card').dataset.index)];
        const details = card?.querySelector('.work-card__details');
        if (!details) return;

        pdBody.innerHTML = details.innerHTML;
        pdBody.querySelector('h3')?.setAttribute('id', 'pd-title');
        pd.showModal();
        pd.querySelector('.project-dialog__panel').scrollTop = 0;
        document.body.classList.add('is-locked');
      });
    });

    $('.pd-close', pd).addEventListener('click', () => closeDialog(pd));
    pd.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(pd); });
    pd.addEventListener('click', (e) => { if (e.target === pd) closeDialog(pd); });   // backdrop click
    pd.addEventListener('close', () => document.body.classList.remove('is-locked'));
  }

  /* ---------------------------------------------------------
     9. Copy email + toast
     --------------------------------------------------------- */
  const toast = $('.toast');
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  };
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        showToast('Email copied to clipboard');
      } catch {
        showToast(btn.dataset.copy);
      }
    });
  });

  /* ---------------------------------------------------------
     Tools — bento grid
     Demos run only while the grid is on screen (and never with reduced
     motion). The JavaScript card's button really counts clicks.
     --------------------------------------------------------- */
  const bento = $('.bento');
  if (bento) {
    const svgs = $$('svg.graph', bento);
    const timeline = $('.tl', bento);
    const setRunning = (on) => {
      bento.classList.toggle('is-visible', on && !reduceMotion());
      svgs.forEach((s) => (on && !reduceMotion() ? s.unpauseAnimations() : s.pauseAnimations()));
    };
    // The playhead travels the real width of the tracks
    const sizeTimeline = () => {
      const track = $('.tl__track', timeline);
      if (track) timeline.style.setProperty('--tl-w', `${track.offsetWidth - 2}px`);
    };
    sizeTimeline();
    window.addEventListener('resize', sizeTimeline);

    setRunning(false);
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) bento.classList.toggle('is-in', true);
      setRunning(entry.isIntersecting);
    }, { threshold: 0.15 }).observe(bento);

    const btn = $('[data-clicker]', bento);
    const out = $('[data-count]', bento);
    let count = 0;
    btn?.addEventListener('click', () => {
      count += 1;
      out.textContent = String(count);
      out.classList.toggle('is-bump', false);
      void out.offsetWidth;                             // replay the bump
      out.classList.toggle('is-bump', true);
      btn.textContent = count >= 10 ? 'You like this' : count >= 5 ? 'Keep going' : 'Click me';
    });
  }

  /* ---------------------------------------------------------
     Setup, resize & preference changes
     --------------------------------------------------------- */
  const layout = () => { buildReels(); movePill(activeLink); onScroll(); };
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 150); });
  motionQuery.addEventListener('change', () => {
    if (reduceMotion()) words.forEach((w) => w.classList.add('is-lit'));
    layout();
  });
  window.addEventListener('load', layout);            // images change widths once loaded

  layout();
  if (reduceMotion()) words.forEach((w) => w.classList.add('is-lit'));

  /* ---------------------------------------------------------
     11. Footer year
     --------------------------------------------------------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------
     12. Visit tracking
         After load, send time, page, referrer and browser to
         /api/track (functions/api/track.js). sendBeacon is light
         and does not slow the page. Skipped locally and when the
         visitor asks not to be tracked (Do Not Track / GPC).
     --------------------------------------------------------- */
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const optedOut = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  if (!isLocal && !optedOut && 'sendBeacon' in navigator) {
    window.addEventListener('load', () => {
      const payload = {
        url: location.href,
        ref: document.referrer || '',
        ua: navigator.userAgent,
        ts: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/track', blob);
    }, { once: true });
  }
})();
