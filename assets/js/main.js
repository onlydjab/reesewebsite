/* ============================================================
   DJ REESE — public site behaviour
   ============================================================ */
(function () {
  'use strict';

  var C = window.DJContent;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var state = { content: null, media: [], lbIndex: 0 };

  /* ------------------------------------------------------------------
     Content hydration
     The HTML already ships with the default copy baked in (good for SEO
     and no-JS). We only touch the DOM where the live content differs.
  ------------------------------------------------------------------ */
  function sameAsDefault(path, value) {
    return JSON.stringify(C.get(C.DEFAULTS, path)) === JSON.stringify(value);
  }

  function hydrateText(content) {
    $$('[data-edit]').forEach(function (el) {
      var val = C.get(content, el.getAttribute('data-edit'));
      if (typeof val !== 'string') return;
      if (el.textContent.trim() !== val.trim()) el.textContent = val;
    });

    // links whose href mirrors their text
    var email = C.get(content, 'contact.email') || '';
    if (email) $$('a[href^="mailto:"]').forEach(function (a) { a.href = 'mailto:' + email; });

    var tel = C.get(content, 'contact.phoneHref') || '';
    $$('a[href^="tel:"]').forEach(function (a) { a.href = 'tel:' + tel; });

    // EPK download targets
    var pdf = C.get(content, 'epk.downloadPdf');
    var img = C.get(content, 'epk.downloadImage');
    var dl = $('#epkDownload'), vw = $('#epkImage');
    if (dl && pdf) dl.href = pdf;
    if (vw && img) vw.href = img;
    $$('.epk__card').forEach(function (a) { if (img) a.href = img; });

    // hero focal point
    var focus = C.get(content, 'hero.focalPoint');
    if (focus) document.documentElement.style.setProperty('--hero-focus', focus);

    // document-level SEO strings
    var title = C.get(content, 'site.name');
    var desc = C.get(content, 'site.description');
    if (desc) {
      var m = $('meta[name="description"]');
      if (m && !sameAsDefault('site.description', desc)) m.setAttribute('content', desc);
    }
    if (title) { /* title stays authored in HTML for SEO stability */ }
  }

  function renderStats(content) {
    if (sameAsDefault('stats', content.stats)) return;
    var grid = $('#statsGrid');
    if (!grid || !Array.isArray(content.stats)) return;
    grid.innerHTML = '';
    content.stats.forEach(function (s) {
      var d = document.createElement('div');
      d.className = 'stat';
      var v = document.createElement('span');
      v.className = 'stat__value';
      v.setAttribute('data-count', s.value);
      if (s.suffix) v.setAttribute('data-suffix', s.suffix);
      v.textContent = s.value + (s.suffix || '');
      var l = document.createElement('span');
      l.className = 'stat__label';
      l.textContent = s.label;
      d.appendChild(v); d.appendChild(l);
      grid.appendChild(d);
    });
  }

  function renderFacts(content) {
    var facts = C.get(content, 'about.facts');
    if (!Array.isArray(facts) || sameAsDefault('about.facts', facts)) return;
    var list = $('#factsList');
    if (!list) return;
    list.innerHTML = '';
    facts.forEach(function (f) {
      var w = document.createElement('div'); w.className = 'fact';
      var dt = document.createElement('dt'); dt.textContent = f.label;
      var dd = document.createElement('dd'); dd.textContent = f.value;
      w.appendChild(dt); w.appendChild(dd);
      list.appendChild(w);
    });
  }

  function renderCollabs(content) {
    var items = C.get(content, 'collaborations.items');
    if (!Array.isArray(items) || sameAsDefault('collaborations.items', items)) return;
    var grid = $('#collabGrid');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach(function (it, i) {
      var li = document.createElement('li');
      li.className = 'collab';
      var idx = document.createElement('span');
      idx.className = 'collab__idx';
      idx.textContent = String(i + 1).padStart(2, '0');
      var h = document.createElement('h3'); h.className = 'collab__name'; h.textContent = it.name;
      var p = document.createElement('p'); p.className = 'collab__role'; p.textContent = it.role || '';
      li.appendChild(idx); li.appendChild(h); li.appendChild(p);
      grid.appendChild(li);
    });
  }

  function renderVenues(content) {
    var groups = C.get(content, 'venues.groups');
    if (Array.isArray(groups) && !sameAsDefault('venues.groups', groups)) {
      var grid = $('#venueGrid');
      if (grid) {
        grid.innerHTML = '';
        groups.forEach(function (g) {
          var art = document.createElement('article');
          art.className = 'venue-card';
          var head = document.createElement('header');
          head.className = 'venue-card__head';
          var h3 = document.createElement('h3'); h3.textContent = g.city;
          var sp = document.createElement('span'); sp.textContent = g.region || '';
          head.appendChild(h3); head.appendChild(sp);
          var ul = document.createElement('ul'); ul.className = 'venue-list';
          (g.items || []).forEach(function (v) {
            var li = document.createElement('li'); li.textContent = v; ul.appendChild(li);
          });
          art.appendChild(head); art.appendChild(ul);
          grid.appendChild(art);
        });
      }
    }
    var hi = C.get(content, 'venues.highlights');
    if (Array.isArray(hi) && !sameAsDefault('venues.highlights', hi)) {
      var list = $('#highlightList');
      if (list) {
        list.innerHTML = '';
        hi.forEach(function (t) {
          var li = document.createElement('li'); li.textContent = t; list.appendChild(li);
        });
      }
    }
  }

  function renderTicker(content) {
    var track = $('#tickerTrack');
    if (!track) return;
    var items = C.get(content, 'hero.ticker');
    if (Array.isArray(items) && !sameAsDefault('hero.ticker', items)) {
      track.innerHTML = '';
      items.forEach(function (t) {
        var s = document.createElement('span'); s.textContent = t;
        var i = document.createElement('i'); i.textContent = '◆';
        track.appendChild(s); track.appendChild(i);
      });
    }
    // duplicate once so the -50% marquee loops seamlessly
    if (!track.dataset.doubled) {
      track.innerHTML += track.innerHTML;
      track.dataset.doubled = '1';
    }
  }

  /* ---------- gallery ---------- */
  function tileMarkup(item) {
    var fig = document.createElement('figure');
    fig.className = 'tile' + (item.size === 'wide' ? ' tile--wide' : item.size === 'tall' ? ' tile--tall' : '');
    fig.setAttribute('data-type', item.type || 'image');

    var poster = item.type === 'video' ? (item.poster || item.src) : item.src;
    var pic = document.createElement('picture');
    // site-managed images ship derivatives: …-500 / -1000 / -full
    if (poster && poster.indexOf('http') !== 0 && poster.indexOf('.') === -1) {
      pic.innerHTML =
        '<source type="image/webp" srcset="' + poster + '-500.webp 500w, ' + poster + '-1000.webp 1000w" sizes="(max-width:700px) 92vw, 34vw">' +
        '<img src="' + poster + '-1000.jpg" alt="" loading="lazy" decoding="async">';
    } else {
      pic.innerHTML = '<img src="' + poster + '" alt="" loading="lazy" decoding="async">';
    }
    var im = pic.querySelector('img');
    if (im) im.alt = item.alt || item.caption || 'DJ Reese';
    fig.appendChild(pic);

    if (item.type === 'video') {
      var play = document.createElement('div');
      play.className = 'tile__play';
      play.innerHTML = '<span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>';
      fig.appendChild(play);
    }
    if (item.caption) {
      var cap = document.createElement('figcaption');
      cap.textContent = item.caption;
      fig.appendChild(cap);
    }
    return fig;
  }

  function renderGallery(content) {
    var items = C.get(content, 'gallery.items');
    var grid = $('#gallery');
    if (!grid || !Array.isArray(items)) return;

    if (!sameAsDefault('gallery.items', items)) {
      grid.innerHTML = '';
      items.forEach(function (it) { grid.appendChild(tileMarkup(it)); });
    }
    // index tiles for the lightbox
    $$('.tile', grid).forEach(function (t, i) { t.setAttribute('data-index', i); });
    state.media = items;
    initGalleryEvents();
  }

  function fullSrc(item) {
    if (!item) return '';
    var s = item.src || '';
    if (item.type === 'video') return s;
    if (s.indexOf('.') === -1 && s.indexOf('http') !== 0) return s + '-full.jpg';
    return s;
  }

  function initGalleryEvents() {
    var grid = $('#gallery');
    if (!grid || grid.dataset.bound) return;
    grid.dataset.bound = '1';

    grid.addEventListener('click', function (e) {
      var tile = e.target.closest('.tile');
      if (!tile) return;
      openLightbox(parseInt(tile.getAttribute('data-index'), 10) || 0);
    });

    $$('.filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        $$('.filter').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        var shown = 0;
        $$('.tile', grid).forEach(function (t) {
          var ok = f === 'all' || t.getAttribute('data-type') === f;
          t.hidden = !ok;
          if (ok) shown++;
        });
        var empty = $('#galleryEmpty');
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  /* ---------- lightbox ---------- */
  function openLightbox(index) {
    var lb = $('#lightbox');
    if (!lb) return;
    var visible = $$('.tile').filter(function (t) { return !t.hidden; });
    var order = visible.map(function (t) { return parseInt(t.getAttribute('data-index'), 10); });
    state.lbOrder = order.length ? order : state.media.map(function (_, i) { return i; });
    state.lbIndex = Math.max(0, state.lbOrder.indexOf(index));
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    document.body.classList.add('is-locked');
    paintLightbox();
    $('#lbClose').focus();
  }

  function paintLightbox() {
    var stage = $('#lbStage'), cap = $('#lbCaption');
    var item = state.media[state.lbOrder[state.lbIndex]];
    if (!item || !stage) return;
    stage.innerHTML = '';

    var src = fullSrc(item);
    if (item.type === 'video') {
      var yt = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
      if (yt) {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0&autoplay=1';
        f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
        f.allowFullscreen = true;
        f.title = item.caption || 'DJ Reese video';
        stage.appendChild(f);
      } else if (/\.(mp4|webm|mov)$/i.test(src)) {
        var v = document.createElement('video');
        v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true;
        if (item.poster) v.poster = item.poster;
        stage.appendChild(v);
      } else {
        var a = document.createElement('a');
        a.href = src; a.target = '_blank'; a.rel = 'noopener';
        a.className = 'btn btn--primary btn--lg';
        a.textContent = 'Open video';
        stage.appendChild(a);
      }
    } else {
      var img = document.createElement('img');
      img.src = src;
      img.alt = item.alt || item.caption || 'DJ Reese';
      stage.appendChild(img);
    }
    if (cap) cap.textContent = item.caption || '';
  }

  function closeLightbox() {
    var lb = $('#lightbox');
    if (!lb || lb.hidden) return;
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(function () { lb.hidden = true; $('#lbStage').innerHTML = ''; }, 260);
  }

  function stepLightbox(dir) {
    if (!state.lbOrder || !state.lbOrder.length) return;
    state.lbIndex = (state.lbIndex + dir + state.lbOrder.length) % state.lbOrder.length;
    paintLightbox();
  }

  function initLightbox() {
    var lb = $('#lightbox');
    if (!lb) return;
    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lbPrev').addEventListener('click', function () { stepLightbox(-1); });
    $('#lbNext').addEventListener('click', function () { stepLightbox(1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.id === 'lbStage') closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });
  }

  /* ---------- socials ---------- */
  function renderSocials(content) {
    var list = (content.socials || []).filter(function (s) {
      return s.enabled !== false && s.url;
    });
    $$('[data-social-list]').forEach(function (host) {
      host.innerHTML = '';
      list.forEach(function (s) { host.appendChild(C.socialEl(s)); });
    });
    // keep structured data honest about which profiles exist
    var ld = $('script[type="application/ld+json"]');
    if (ld) {
      try {
        var data = JSON.parse(ld.textContent);
        var person = (data['@graph'] || []).find(function (n) {
          return String(n['@type']).indexOf('Person') !== -1;
        });
        if (person) {
          person.sameAs = list.filter(function (s) { return s.platform !== 'email'; })
                              .map(function (s) { return s.url; });
          ld.textContent = JSON.stringify(data);
        }
      } catch (e) { /* leave the authored JSON-LD alone */ }
    }
  }

  /* ------------------------------------------------------------------
     Navigation
  ------------------------------------------------------------------ */
  function initNav() {
    var nav = $('#nav');
    var progress = $('#navProgress');
    var burger = $('#burger');
    var menu = $('#mobileMenu');
    var links = $$('.nav__link');
    var sections = links.map(function (l) { return $(l.getAttribute('href')); }).filter(Boolean);
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;
      nav.classList.toggle('is-stuck', y > 24);

      if (progress) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      }

      // scrollspy
      var mid = y + window.innerHeight * 0.32;
      var active = sections[0];
      sections.forEach(function (s) { if (s.offsetTop <= mid) active = s; });
      links.forEach(function (l) {
        l.classList.toggle('is-active', active && l.getAttribute('href') === '#' + active.id);
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* hamburger */
    function setMenu(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('is-locked', open);
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add('is-open'); });
      } else {
        menu.classList.remove('is-open');
        setTimeout(function () { menu.hidden = true; }, 320);
      }
    }
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
    // a resize past the breakpoint should not leave the overlay stuck open
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080 && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }

  /* ------------------------------------------------------------------
     Reveal + counters
  ------------------------------------------------------------------ */
  /**
   * Reveal-on-scroll.
   *
   * Deliberately not IntersectionObserver: an instant jump (deep link such as
   * /#contact, or a fast scroll) moves a far-off element from "below the
   * viewport" to "above the viewport" without its intersection ratio ever
   * leaving 0, so no threshold is crossed and the callback never runs —
   * leaving those sections stuck at opacity 0. A sweep against the current
   * viewport is always correct.
   */
  function initReveal() {
    var els = $$('.reveal');
    if (!els.length) return;

    if (reduceMotion) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var pending = els.slice();
    var ticking = false;

    function sweep() {
      var limit = window.innerHeight * 0.92;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add('is-in');
          return false;
        }
        return true;
      });
      ticking = false;
      if (!pending.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(sweep); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    sweep();
    // the browser restores scroll position / jumps to a hash after load
    window.addEventListener('load', sweep);
  }

  function initCounters() {
    var vals = $$('.stat__value');
    if (!vals.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        if (isNaN(target)) return;
        var start = performance.now(), dur = 1100;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.5 });
    vals.forEach(function (v) { io.observe(v); });
  }

  /* ------------------------------------------------------------------
     Availability calendar
  ------------------------------------------------------------------ */
  var cal = { view: new Date(), dates: {} };

  function normaliseEntry(v) {
    if (!v) return null;
    if (typeof v === 'string') return { status: v, label: '' };
    return { status: v.status || 'available', label: v.label || '' };
  }

  function iso(y, m, d) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  function renderCalendar() {
    var grid = $('#calGrid'), label = $('#calMonth');
    if (!grid) return;
    var y = cal.view.getFullYear(), m = cal.view.getMonth();
    var today = new Date(); today.setHours(0, 0, 0, 0);

    label.textContent = cal.view.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    grid.innerHTML = '';

    var first = new Date(y, m, 1).getDay();
    var days = new Date(y, m + 1, 0).getDate();

    for (var b = 0; b < first; b++) {
      var blank = document.createElement('div');
      blank.className = 'cal__cell cal__cell--blank';
      blank.setAttribute('aria-hidden', 'true');
      grid.appendChild(blank);
    }

    for (var d = 1; d <= days; d++) {
      var key = iso(y, m, d);
      var dateObj = new Date(y, m, d);
      var entry = normaliseEntry(cal.dates[key]);
      var isPast = dateObj < today;
      var status = isPast ? 'past' : (entry ? entry.status : 'available');

      var cell = document.createElement(status === 'available' || status === 'held' ? 'button' : 'div');
      cell.className = 'cal__cell cal__cell--' + status;
      cell.textContent = d;
      cell.setAttribute('role', 'gridcell');

      if (dateObj.getTime() === today.getTime()) cell.classList.add('cal__cell--today');
      if (entry && entry.label) cell.setAttribute('data-label', entry.label);

      var human = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      cell.setAttribute('aria-label', human + ' — ' + status + (entry && entry.label ? ' (' + entry.label + ')' : ''));

      if (cell.tagName === 'BUTTON') {
        cell.type = 'button';
        cell.setAttribute('data-date', key);
        cell.addEventListener('click', requestDate);
      }
      grid.appendChild(cell);
    }

    // never let visitors browse into the past
    var prev = $('#calPrev');
    if (prev) {
      var atStart = y === today.getFullYear() && m === today.getMonth();
      prev.disabled = atStart;
    }
  }

  function requestDate(e) {
    var key = e.currentTarget.getAttribute('data-date');
    var input = $('#bDate');
    if (input) input.value = key;
    var form = $('#bookingForm');
    if (form) {
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { var n = $('#bName'); if (n) n.focus({ preventScroll: true }); }, reduceMotion ? 0 : 620);
    }
    var status = $('#bookingStatus');
    if (status) {
      status.textContent = 'Date selected: ' + new Date(key + 'T12:00:00')
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      status.className = 'booking__status is-ok';
    }
  }

  function initCalendar(content) {
    cal.dates = C.get(content, 'availability.dates') || {};
    var prev = $('#calPrev'), next = $('#calNext');
    if (prev) prev.addEventListener('click', function () {
      cal.view = new Date(cal.view.getFullYear(), cal.view.getMonth() - 1, 1);
      renderCalendar();
    });
    if (next) next.addEventListener('click', function () {
      cal.view = new Date(cal.view.getFullYear(), cal.view.getMonth() + 1, 1);
      renderCalendar();
    });
    renderCalendar();
  }

  /* ------------------------------------------------------------------
     Booking form
  ------------------------------------------------------------------ */
  function initForm(content) {
    var form = $('#bookingForm');
    if (!form) return;
    var status = $('#bookingStatus');
    var endpoint = C.get(content, 'contact.formEndpoint') || '';
    var to = C.get(content, 'contact.email') || '';
    var sms = C.get(content, 'contact.phoneHref') || '';
    var phone = C.get(content, 'contact.phone') || sms;
    var fineprint = $('.booking__fineprint');
    if (fineprint) {
      if (endpoint) {
        fineprint.textContent = 'Your request is sent straight to DJ Reese. Expect a reply within 48 hours.';
      } else if (to) {
        fineprint.textContent = 'Opens your email app with the details filled in, so nothing is stored on this site.';
      } else if (sms) {
        fineprint.textContent = 'Opens a text message to DJ Reese with the details filled in, so nothing is stored on this site.';
      } else {
        fineprint.textContent = 'Nothing you type here is stored on this site.';
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());

      if (!data.name || !data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
        status.textContent = 'Please add your name and a valid email.';
        status.className = 'booking__status is-err';
        (!data.name ? $('#bName') : $('#bEmail')).focus();
        return;
      }

      var lines = [
        'Name: ' + data.name,
        'Email: ' + data.email,
        'Event date: ' + (data.date || 'TBD'),
        'Event type: ' + (data.eventType || ''),
        'Venue / city: ' + (data.venue || ''),
        '', (data.message || '')
      ].join('\n');

      if (endpoint) {
        status.textContent = 'Sending…';
        status.className = 'booking__status';
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        }).then(function (r) {
          if (!r.ok) throw new Error('bad status');
          form.reset();
          status.textContent = 'Booking request sent. You will hear back shortly.';
          status.className = 'booking__status is-ok';
        }).catch(function () {
          var r = handoff(data, lines);
          status.textContent = 'Could not send — ' + r.msg;
          status.className = 'booking__status is-err';
        });
      } else {
        var r = handoff(data, lines);
        status.textContent = r.msg.charAt(0).toUpperCase() + r.msg.slice(1);
        status.className = 'booking__status ' + (r.ok ? 'is-ok' : 'is-err');
      }
    });

    /* Hands the request off to whatever channel is configured. Returns the
       sentence to show the visitor, and whether the handoff actually
       happened — if no channel is set up there is nowhere to send them. */
    function handoff(data, body) {
      var subject = 'Booking request — ' + (data.eventType || 'Event') +
                    (data.date ? ' on ' + data.date : '');

      if (to) {
        window.location.href = 'mailto:' + to +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
        return { ok: true, msg: 'your email app should now be open with the details filled in.' };
      }

      if (sms) {
        // iOS wants `&body=`, everything else wants `?body=` — `?&body=`
        // is the one form both parse correctly.
        window.location.href = 'sms:' + sms +
          '?&body=' + encodeURIComponent(subject + '\n\n' + body);
        return { ok: true, msg: 'your messages app should now be open with the details filled in.' };
      }

      return { ok: false, msg: 'text ' + (phone || 'DJ Reese') + ' with your event details to book.' };
    }
  }

  /* ------------------------------------------------------------------
     Draft banner — the owner sees unpublished edits; visitors never do
  ------------------------------------------------------------------ */
  function draftBanner() {
    if (document.getElementById('draftBanner')) return;
    var bar = document.createElement('div');
    bar.id = 'draftBanner';
    bar.style.cssText =
      'position:fixed;right:16px;bottom:16px;z-index:150;' +
      'display:flex;align-items:center;gap:.7rem;padding:.55rem .65rem .55rem 1rem;' +
      'border-radius:999px;background:rgba(10,10,25,.94);backdrop-filter:blur(14px);' +
      'border:1px solid rgba(236,72,153,.5);font-size:.78rem;color:#EEF1FF;' +
      'box-shadow:0 18px 40px -18px rgba(0,0,0,.9);max-width:calc(100vw - 32px);flex-wrap:wrap;';
    bar.innerHTML =
      '<span>Draft preview — these edits are not published yet.</span>' +
      '<a href="admin.html" style="padding:.35rem .8rem;border-radius:999px;background:linear-gradient(100deg,#3B82F6,#8B5CF6);color:#fff;font-weight:600;white-space:nowrap;">Open dashboard</a>' +
      '<button aria-label="Dismiss" style="font-size:1.2rem;line-height:1;color:#9aa3c0;padding:0 .3rem;">&times;</button>';
    bar.querySelector('button').addEventListener('click', function () { bar.remove(); });
    document.body.appendChild(bar);
  }

  /* ------------------------------------------------------------------
     Boot
  ------------------------------------------------------------------ */
  function boot(res) {
    var content = res.content;
    state.content = content;

    C.applyTheme(content.theme);
    hydrateText(content);
    renderStats(content);
    renderFacts(content);
    renderCollabs(content);
    renderVenues(content);
    renderTicker(content);
    renderGallery(content);
    renderSocials(content);
    initCalendar(content);
    initForm(content);
    initCounters();

    if (res.hasDraft) draftBanner();
  }

  function init() {
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();

    initNav();
    initReveal();
    initLightbox();

    C.load().then(boot).catch(function (err) {
      console.warn('Content load failed, using baked defaults.', err);
      boot({ content: C.clone(C.DEFAULTS), published: C.DEFAULTS, hasDraft: false });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
