/* ============================================================
   DJ REESE — dashboard
   Edits are held in a localStorage draft and published by
   replacing data/content.json in the repo.
   ============================================================ */
(function () {
  'use strict';

  var C = window.DJContent;
  var CFG = window.ADMIN_CONFIG || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var data = null;        // working copy
  var published = null;   // what data/content.json currently holds
  var saveTimer = null;

  /* ==========================================================
     SHA-256 — WebCrypto when available (https / localhost),
     with a small fallback so the page also works from file://
     ========================================================== */
  function sha256(str) {
    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
        .then(function (buf) {
          return Array.prototype.map.call(new Uint8Array(buf), function (b) {
            return b.toString(16).padStart(2, '0');
          }).join('');
        });
    }
    return Promise.resolve(sha256Fallback(str));
  }

  function sha256Fallback(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mathPow = Math.pow, maxWord = mathPow(2, 32), i, j, result = '';
    var words = [], asciiBitLength = ascii.length * 8;
    var hash = sha256Fallback.h = sha256Fallback.h || [];
    var k = sha256Fallback.k = sha256Fallback.k || [];
    var primeCounter = k.length, isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return null;
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;

    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), oldHash = hash.slice(0);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) +
                    ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
                    (w[i] = (i < 16) ? w[i] : (
                      w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) +
                      w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))
                    ) | 0);
        var temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) +
                    ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }

  /* ==========================================================
     Auth
     ========================================================== */
  function sessionValid() {
    try {
      var raw = sessionStorage.getItem(C.SESSION_KEY);
      if (!raw) return false;
      var s = JSON.parse(raw);
      return s.exp > Date.now();
    } catch (e) { return false; }
  }

  function startSession() {
    var mins = CFG.sessionMinutes || 120;
    try {
      sessionStorage.setItem(C.SESSION_KEY, JSON.stringify({ exp: Date.now() + mins * 60000 }));
    } catch (e) {}
  }

  function initLogin() {
    var form = $('#loginForm'), err = $('#loginErr');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = $('#user').value.trim();
      var p = $('#pass').value;
      err.textContent = '';

      sha256((CFG.salt || '') + ':' + p).then(function (hash) {
        var ok = u.toLowerCase() === String(CFG.username || '').toLowerCase() &&
                 hash === CFG.passwordHash;
        if (!ok) {
          err.textContent = 'Wrong username or password.';
          $('#pass').value = '';
          $('#pass').focus();
          return;
        }
        startSession();
        openDash();
      });
    });
  }

  function openDash() {
    $('#login').hidden = true;
    $('#dash').hidden = false;
    boot();
  }

  /* ==========================================================
     Draft persistence
     ========================================================== */
  function markDirty() {
    var chip = $('#saveChip');
    chip.textContent = 'Saving…';
    chip.classList.add('is-dirty');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var ok = C.writeDraft(data);
      chip.textContent = ok ? 'Saved' : 'Storage full';
      chip.classList.toggle('is-dirty', !ok);
      if (!ok) {
        toast('Browser storage is full — remove some uploaded photos, or reference images by path instead.');
      }
      renderJson();
    }, 400);
  }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    clearTimeout(t._timer);
    t._timer = setTimeout(function () {
      t.classList.remove('is-on');
      setTimeout(function () { t.hidden = true; }, 300);
    }, 3200);
  }

  /* ==========================================================
     Small field builders
     ========================================================== */
  function field(label, value, onInput, opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'field';
    var id = 'f_' + Math.random().toString(36).slice(2, 9);

    var lab = document.createElement('label');
    lab.setAttribute('for', id);
    lab.textContent = label;

    var input = document.createElement(opts.multiline ? 'textarea' : 'input');
    input.id = id;
    if (opts.multiline) input.rows = opts.rows || 4;
    else input.type = opts.type || 'text';
    if (opts.placeholder) input.placeholder = opts.placeholder;
    input.value = value == null ? '' : value;
    input.addEventListener('input', function () { onInput(input.value); });

    wrap.appendChild(lab);
    wrap.appendChild(input);
    if (opts.hint) {
      var h = document.createElement('p');
      h.className = 'hint';
      h.style.margin = '.35rem 0 0';
      h.textContent = opts.hint;
      wrap.appendChild(h);
    }
    return wrap;
  }

  function group(title, open) {
    var d = document.createElement('details');
    d.className = 'group';
    if (open) d.open = true;
    var s = document.createElement('summary');
    s.textContent = title;
    var body = document.createElement('div');
    body.className = 'group__body';
    d.appendChild(s); d.appendChild(body);
    d._body = body;
    return d;
  }

  function bindText(path, label, opts) {
    return field(label, C.get(data, path), function (v) {
      C.set(data, path, v);
      markDirty();
    }, opts);
  }

  function bindList(path, label, hint) {
    var arr = C.get(data, path) || [];
    return field(label, arr.join('\n'), function (v) {
      C.set(data, path, v.split('\n').map(function (s) { return s.trim(); })
                        .filter(function (s) { return s.length; }));
      markDirty();
    }, { multiline: true, rows: Math.min(12, Math.max(3, arr.length + 1)), hint: hint || 'One per line.' });
  }

  /* ==========================================================
     Panel: Text & Content
     ========================================================== */
  function renderContentPanel() {
    var host = $('#contentFields');
    host.innerHTML = '';

    /* --- hero --- */
    var g = group('Hero (top of page)', true);
    g._body.appendChild(bindText('hero.eyebrow', 'Eyebrow'));
    var row = document.createElement('div'); row.className = 'field--row';
    row.appendChild(bindText('hero.titleLine1', 'Headline line 1'));
    row.appendChild(bindText('hero.titleLine2', 'Headline line 2 (gradient)'));
    g._body.appendChild(row);
    g._body.appendChild(bindText('hero.titleLine3', 'Headline line 3'));
    g._body.appendChild(bindText('hero.subtitle', 'Sub-headline', { multiline: true, rows: 2 }));
    var row2 = document.createElement('div'); row2.className = 'field--row';
    row2.appendChild(bindText('hero.ctaPrimary', 'Primary button'));
    row2.appendChild(bindText('hero.ctaSecondary', 'Secondary button'));
    g._body.appendChild(row2);
    g._body.appendChild(bindText('hero.focalPoint', 'Hero photo focus', {
      hint: 'Horizontal% Vertical% — raise the second number to show more of the lower part of the photo. Default 50% 46%.'
    }));
    g._body.appendChild(bindList('hero.ticker', 'Scrolling venue ticker'));
    host.appendChild(g);

    /* --- stats --- */
    var gs = group('Stats bar');
    (data.stats || []).forEach(function (s, i) {
      var r = document.createElement('div');
      r.className = 'field--row';
      r.style.gridTemplateColumns = '90px 80px 1fr';
      r.appendChild(field('Number', s.value, function (v) { data.stats[i].value = v; markDirty(); }));
      r.appendChild(field('Suffix', s.suffix, function (v) { data.stats[i].suffix = v; markDirty(); }));
      r.appendChild(field('Label', s.label, function (v) { data.stats[i].label = v; markDirty(); }));
      gs._body.appendChild(r);
    });
    host.appendChild(gs);

    /* --- about --- */
    var ga = group('About / Bio');
    ga._body.appendChild(bindText('about.eyebrow', 'Eyebrow'));
    ga._body.appendChild(bindText('about.heading', 'Heading'));
    ga._body.appendChild(bindText('about.bio1', 'Bio paragraph 1', { multiline: true, rows: 5 }));
    ga._body.appendChild(bindText('about.bio2', 'Bio paragraph 2', { multiline: true, rows: 5 }));
    var fh = document.createElement('h4');
    fh.className = 'sub'; fh.textContent = 'Fact list';
    ga._body.appendChild(fh);
    (data.about.facts || []).forEach(function (f, i) {
      var r = document.createElement('div'); r.className = 'field--row';
      r.appendChild(field('Label', f.label, function (v) { data.about.facts[i].label = v; markDirty(); }));
      r.appendChild(field('Value', f.value, function (v) { data.about.facts[i].value = v; markDirty(); }));
      ga._body.appendChild(r);
    });
    host.appendChild(ga);

    /* --- collaborations --- */
    var gc = group('Notable collaborations');
    gc._body.appendChild(bindText('collaborations.eyebrow', 'Eyebrow'));
    gc._body.appendChild(bindText('collaborations.heading', 'Heading'));
    var cList = document.createElement('div');
    gc._body.appendChild(cList);
    function drawCollabs() {
      cList.innerHTML = '';
      (data.collaborations.items || []).forEach(function (it, i) {
        var r = document.createElement('div');
        r.className = 'field--row';
        r.style.gridTemplateColumns = '1fr 1fr 40px';
        r.appendChild(field('Name', it.name, function (v) { data.collaborations.items[i].name = v; markDirty(); }));
        r.appendChild(field('Role', it.role, function (v) { data.collaborations.items[i].role = v; markDirty(); }));
        var del = document.createElement('button');
        del.className = 'iconbtn iconbtn--del'; del.type = 'button';
        del.innerHTML = '&times;'; del.title = 'Remove';
        del.style.alignSelf = 'end'; del.style.marginBottom = '.5rem';
        del.addEventListener('click', function () {
          data.collaborations.items.splice(i, 1); markDirty(); drawCollabs();
        });
        r.appendChild(del);
        cList.appendChild(r);
      });
    }
    drawCollabs();
    var addC = document.createElement('button');
    addC.className = 'btn btn--ghost btn--sm'; addC.type = 'button';
    addC.textContent = 'Add collaboration';
    addC.addEventListener('click', function () {
      data.collaborations.items.push({ name: 'New name', role: 'Recording Artist' });
      markDirty(); drawCollabs();
    });
    gc._body.appendChild(addC);
    host.appendChild(gc);

    /* --- venues --- */
    var gv = group('Venues / locations played');
    gv._body.appendChild(bindText('venues.eyebrow', 'Eyebrow'));
    gv._body.appendChild(bindText('venues.heading', 'Heading'));
    gv._body.appendChild(bindText('venues.subheading', 'Sub-heading', { multiline: true, rows: 2 }));
    var vList = document.createElement('div');
    gv._body.appendChild(vList);
    function drawVenues() {
      vList.innerHTML = '';
      (data.venues.groups || []).forEach(function (grp, i) {
        var box = document.createElement('div');
        box.style.cssText = 'border:1px solid var(--c-line);border-radius:12px;padding:.9rem;margin-bottom:.8rem';
        var r = document.createElement('div');
        r.className = 'field--row'; r.style.gridTemplateColumns = '1fr 1fr 40px';
        r.appendChild(field('City / group', grp.city, function (v) { data.venues.groups[i].city = v; markDirty(); }));
        r.appendChild(field('Region label', grp.region, function (v) { data.venues.groups[i].region = v; markDirty(); }));
        var del = document.createElement('button');
        del.className = 'iconbtn iconbtn--del'; del.type = 'button';
        del.innerHTML = '&times;'; del.title = 'Remove group';
        del.style.alignSelf = 'end'; del.style.marginBottom = '.5rem';
        del.addEventListener('click', function () {
          data.venues.groups.splice(i, 1); markDirty(); drawVenues();
        });
        r.appendChild(del);
        box.appendChild(r);
        box.appendChild(field('Venues', (grp.items || []).join('\n'), function (v) {
          data.venues.groups[i].items = v.split('\n').map(function (s) { return s.trim(); })
                                          .filter(function (s) { return s.length; });
          markDirty();
        }, { multiline: true, rows: Math.min(12, (grp.items || []).length + 1), hint: 'One per line.' }));
        vList.appendChild(box);
      });
    }
    drawVenues();
    var addV = document.createElement('button');
    addV.className = 'btn btn--ghost btn--sm'; addV.type = 'button';
    addV.textContent = 'Add city group';
    addV.addEventListener('click', function () {
      data.venues.groups.push({ city: 'New City', region: 'State', items: [] });
      markDirty(); drawVenues();
    });
    gv._body.appendChild(addV);
    gv._body.appendChild(bindList('venues.highlights', 'Reach & highlights'));
    host.appendChild(gv);

    /* --- media headings --- */
    var gm = group('Media section headings');
    gm._body.appendChild(bindText('gallery.eyebrow', 'Eyebrow'));
    gm._body.appendChild(bindText('gallery.heading', 'Heading'));
    gm._body.appendChild(bindText('gallery.subheading', 'Sub-heading'));
    host.appendChild(gm);

    /* --- epk --- */
    var ge = group('EPK section');
    ge._body.appendChild(bindText('epk.eyebrow', 'Eyebrow'));
    ge._body.appendChild(bindText('epk.heading', 'Heading'));
    ge._body.appendChild(bindText('epk.body', 'Body copy', { multiline: true, rows: 4 }));
    ge._body.appendChild(bindText('epk.buttonLabel', 'Download button label'));
    ge._body.appendChild(bindText('epk.downloadPdf', 'PDF path', { hint: 'Replace the file at this path to swap the EPK.' }));
    ge._body.appendChild(bindText('epk.downloadImage', 'Image path'));
    host.appendChild(ge);

    /* --- availability copy --- */
    var gav = group('Availability section copy');
    gav._body.appendChild(bindText('availability.eyebrow', 'Eyebrow'));
    gav._body.appendChild(bindText('availability.heading', 'Heading'));
    gav._body.appendChild(bindText('availability.subheading', 'Sub-heading', { multiline: true, rows: 2 }));
    gav._body.appendChild(bindText('availability.note', 'Small print'));
    host.appendChild(gav);

    /* --- contact --- */
    var gct = group('Bookings & contact', true);
    gct._body.appendChild(bindText('contact.eyebrow', 'Eyebrow'));
    gct._body.appendChild(bindText('contact.heading', 'Heading'));
    gct._body.appendChild(bindText('contact.subheading', 'Sub-heading', { multiline: true, rows: 2 }));
    var cr = document.createElement('div'); cr.className = 'field--row';
    cr.appendChild(bindText('contact.email', 'Booking email', { type: 'email' }));
    cr.appendChild(bindText('contact.phone', 'Phone (shown)'));
    gct._body.appendChild(cr);
    gct._body.appendChild(bindText('contact.phoneHref', 'Phone (dial format)', { hint: 'Digits only with country code, e.g. +12057739529' }));
    gct._body.appendChild(bindText('contact.location', 'Based in'));
    gct._body.appendChild(bindText('contact.travelNote', 'Travel note'));
    gct._body.appendChild(bindText('contact.quote', 'Pull quote'));
    gct._body.appendChild(bindText('contact.formEndpoint', 'Booking form endpoint (optional)', {
      hint: 'Leave blank and the form opens the visitor\'s email app. Paste a Formspree/Basin URL to receive submissions by email instead.'
    }));
    host.appendChild(gct);

    /* --- footer + SEO --- */
    var gf = group('Footer & search listing');
    gf._body.appendChild(bindText('footer.blurb', 'Footer blurb', { multiline: true, rows: 2 }));
    gf._body.appendChild(bindText('footer.credit', 'Copyright name'));
    gf._body.appendChild(bindText('site.description', 'Search-engine description', {
      multiline: true, rows: 3,
      hint: 'Shown under the title in Google results. Aim for 150–160 characters.'
    }));
    host.appendChild(gf);
  }

  /* ==========================================================
     Panel: Media
     ========================================================== */
  function isManagedPath(src) {
    return src && src.indexOf('http') !== 0 && src.indexOf('data:') !== 0 && src.indexOf('.') === -1;
  }

  function thumbFor(item) {
    var src = item.type === 'video' ? (item.poster || '') : (item.src || '');
    if (!src) return null;
    return isManagedPath(src) ? src + '-500.jpg' : src;
  }

  function renderMedia() {
    var host = $('#mediaList');
    host.innerHTML = '';
    var items = data.gallery.items || [];

    if (!items.length) {
      host.innerHTML = '<p class="empty-note">No media yet. Upload a photo or add a video link above.</p>';
      return;
    }

    items.forEach(function (item, i) {
      var row = document.createElement('div');
      row.className = 'media-item';

      var t = thumbFor(item);
      if (t) {
        var img = document.createElement('img');
        img.className = 'media-item__thumb';
        img.src = t; img.alt = '';
        img.onerror = function () {
          img.replaceWith(makeVidThumb(item.type === 'video' ? 'VIDEO' : 'MISSING'));
        };
        row.appendChild(img);
      } else {
        row.appendChild(makeVidThumb(item.type === 'video' ? 'VIDEO' : 'NO IMAGE'));
      }

      var fields = document.createElement('div');
      fields.className = 'media-item__fields';

      fields.appendChild(field(item.type === 'video' ? 'Video URL (YouTube or .mp4)' : 'Image path or URL',
        item.src, function (v) { data.gallery.items[i].src = v; markDirty(); renderMedia(); }));

      if (item.type === 'video') {
        fields.appendChild(field('Poster image (path or URL)', item.poster || '',
          function (v) { data.gallery.items[i].poster = v; markDirty(); }));
      }

      var r1 = document.createElement('div'); r1.className = 'media-item__row';
      r1.appendChild(field('Caption', item.caption || '', function (v) {
        data.gallery.items[i].caption = v; markDirty();
      }));

      // tile size select
      var sizeWrap = document.createElement('div');
      sizeWrap.className = 'field';
      var sl = document.createElement('label'); sl.textContent = 'Tile size';
      var sel = document.createElement('select');
      [['normal', 'Normal'], ['wide', 'Wide'], ['tall', 'Tall']].forEach(function (o) {
        var op = document.createElement('option');
        op.value = o[0]; op.textContent = o[1];
        if ((item.size || 'normal') === o[0]) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener('change', function () {
        data.gallery.items[i].size = sel.value; markDirty();
      });
      sizeWrap.appendChild(sl); sizeWrap.appendChild(sel);
      r1.appendChild(sizeWrap);
      fields.appendChild(r1);

      fields.appendChild(field('Alt text (for accessibility & SEO)', item.alt || '', function (v) {
        data.gallery.items[i].alt = v; markDirty();
      }, { hint: 'Describe the photo in a few words.' }));

      row.appendChild(fields);

      var ctrls = document.createElement('div');
      ctrls.className = 'media-item__ctrls';
      ctrls.appendChild(iconBtn('↑', 'Move up', i === 0, function () { move(i, -1); }));
      ctrls.appendChild(iconBtn('↓', 'Move down', i === items.length - 1, function () { move(i, 1); }));
      ctrls.appendChild(iconBtn('×', 'Remove', false, function () {
        data.gallery.items.splice(i, 1); markDirty(); renderMedia();
      }, true));
      row.appendChild(ctrls);

      host.appendChild(row);
    });

    function move(i, d) {
      var arr = data.gallery.items;
      var j = i + d;
      if (j < 0 || j >= arr.length) return;
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      markDirty(); renderMedia();
    }
  }

  function makeVidThumb(text) {
    var d = document.createElement('div');
    d.className = 'media-item__thumb media-item__thumb--vid';
    d.textContent = text;
    return d;
  }

  function iconBtn(label, title, disabled, onClick, danger) {
    var b = document.createElement('button');
    b.className = 'iconbtn' + (danger ? ' iconbtn--del' : '');
    b.type = 'button';
    b.textContent = label;
    b.title = title;
    b.disabled = !!disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  /* resize an uploaded file down to a web-sane size before storing */
  function resizeToDataUrl(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(cv.toDataURL('image/jpeg', quality));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
      img.src = url;
    });
  }

  function initMediaPanel() {
    $('#addPhoto').addEventListener('click', function () { $('#photoInput').click(); });

    $('#photoInput').addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files || []);
      if (!files.length) return;
      toast('Processing ' + files.length + ' image' + (files.length > 1 ? 's' : '') + '…');

      Promise.all(files.map(function (f) {
        return resizeToDataUrl(f, 1400, 0.78).then(function (dataUrl) {
          return {
            id: 'g' + Date.now() + Math.random().toString(36).slice(2, 6),
            type: 'image',
            src: dataUrl,
            alt: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
            caption: '',
            size: 'normal'
          };
        });
      })).then(function (items) {
        data.gallery.items = (data.gallery.items || []).concat(items);
        markDirty();
        renderMedia();
        toast('Added ' + items.length + ' photo' + (items.length > 1 ? 's' : ''));
      }).catch(function (err) {
        toast('Upload failed: ' + err.message);
      });
      e.target.value = '';
    });

    $('#addVideo').addEventListener('click', function () {
      data.gallery.items = (data.gallery.items || []).concat([{
        id: 'v' + Date.now(),
        type: 'video',
        src: '',
        poster: '',
        caption: 'New video',
        alt: 'DJ Reese live video',
        size: 'wide'
      }]);
      markDirty();
      renderMedia();
      toast('Video slot added — paste a YouTube link');
    });
  }

  /* ==========================================================
     Panel: Availability
     ========================================================== */
  var acView = new Date();
  var CYCLE = { available: 'held', held: 'booked', booked: null };

  function isoKey(y, m, d) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  function entryOf(key) {
    var v = data.availability.dates[key];
    if (!v) return null;
    if (typeof v === 'string') return { status: v, label: '' };
    return v;
  }

  function renderAdminCal() {
    var grid = $('#acGrid');
    grid.innerHTML = '';
    var y = acView.getFullYear(), m = acView.getMonth();
    $('#acMonth').textContent = acView.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    var first = new Date(y, m, 1).getDay();
    var days = new Date(y, m + 1, 0).getDate();

    for (var b = 0; b < first; b++) {
      var blank = document.createElement('div');
      blank.className = 'cal__cell cal__cell--blank';
      grid.appendChild(blank);
    }

    for (var d = 1; d <= days; d++) {
      (function (day) {
        var key = isoKey(y, m, day);
        var e = entryOf(key);
        var status = e ? e.status : 'available';
        var cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cal__cell cal__cell--' + status;
        cell.textContent = day;
        if (e && e.label) cell.setAttribute('data-label', e.label);
        cell.addEventListener('click', function () {
          var cur = entryOf(key);
          var next = CYCLE[cur ? cur.status : 'available'];
          if (next) {
            data.availability.dates[key] = { status: next, label: (cur && cur.label) || '' };
          } else {
            delete data.availability.dates[key];
          }
          markDirty();
          renderAdminCal();
          renderMarked();
        });
        grid.appendChild(cell);
      })(d);
    }
  }

  function renderMarked() {
    var host = $('#markedList');
    host.innerHTML = '';
    var keys = Object.keys(data.availability.dates || {}).sort();
    if (!keys.length) {
      host.innerHTML = '<p class="empty-note">Nothing marked yet — every future date shows as available.</p>';
      return;
    }
    keys.forEach(function (k) {
      var e = entryOf(k);
      var row = document.createElement('div');
      row.className = 'marked';

      var dt = document.createElement('span');
      dt.className = 'marked__date';
      dt.textContent = new Date(k + 'T12:00:00').toLocaleDateString('en-US',
        { month: 'short', day: 'numeric', year: '2-digit' });

      var inp = document.createElement('input');
      inp.type = 'text';
      inp.placeholder = 'Venue / note (optional)';
      inp.value = e.label || '';
      inp.addEventListener('input', function () {
        data.availability.dates[k] = { status: e.status, label: inp.value };
        markDirty();
      });

      var st = document.createElement('span');
      st.className = 'marked__status marked__status--' + e.status;
      st.textContent = e.status;

      row.appendChild(dt); row.appendChild(inp); row.appendChild(st);
      host.appendChild(row);
    });
  }

  function initAvailPanel() {
    $('#acPrev').addEventListener('click', function () {
      acView = new Date(acView.getFullYear(), acView.getMonth() - 1, 1);
      renderAdminCal();
    });
    $('#acNext').addEventListener('click', function () {
      acView = new Date(acView.getFullYear(), acView.getMonth() + 1, 1);
      renderAdminCal();
    });
    $('#clearDates').addEventListener('click', function () {
      if (!confirm('Clear every marked date? Dates all go back to available.')) return;
      data.availability.dates = {};
      markDirty(); renderAdminCal(); renderMarked();
      toast('All dates cleared');
    });
  }

  /* ==========================================================
     Panel: Socials
     ========================================================== */
  function renderSocials() {
    var host = $('#socialList');
    host.innerHTML = '';
    (data.socials || []).forEach(function (s, i) {
      var row = document.createElement('div');
      row.className = 'social-row';

      // platform
      var pw = document.createElement('div'); pw.className = 'field';
      var pl = document.createElement('label'); pl.textContent = 'Platform';
      var sel = document.createElement('select');
      Object.keys(C.PLATFORM_LABELS).forEach(function (p) {
        var op = document.createElement('option');
        op.value = p; op.textContent = C.PLATFORM_LABELS[p];
        if (s.platform === p) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener('change', function () {
        data.socials[i].platform = sel.value; markDirty(); renderSocials();
      });
      pw.appendChild(pl); pw.appendChild(sel);
      row.appendChild(pw);

      row.appendChild(field('Username / title', s.username, function (v) {
        data.socials[i].username = v; markDirty();
      }, { placeholder: '@handle' }));

      row.appendChild(field('Link', s.url, function (v) {
        data.socials[i].url = v; markDirty();
      }, { placeholder: 'https://…' }));

      // enabled switch
      var lab = document.createElement('label');
      lab.className = 'switch';
      lab.title = 'Show on site';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = s.enabled !== false;
      cb.addEventListener('change', function () {
        data.socials[i].enabled = cb.checked; markDirty();
      });
      var tr = document.createElement('span'); tr.className = 'switch__track';
      lab.appendChild(cb); lab.appendChild(tr);
      row.appendChild(lab);

      row.appendChild(iconBtn('×', 'Remove', false, function () {
        data.socials.splice(i, 1); markDirty(); renderSocials();
      }, true));

      host.appendChild(row);
    });

    if (!data.socials.length) {
      host.innerHTML = '<p class="empty-note">No social links yet.</p>';
    }
  }

  function initSocialPanel() {
    $('#addSocial').addEventListener('click', function () {
      data.socials.push({
        id: 's' + Date.now(), platform: 'instagram',
        username: '@username', url: 'https://instagram.com/username', enabled: true
      });
      markDirty(); renderSocials();
    });
  }

  /* ==========================================================
     Panel: Theme
     ========================================================== */
  var SWATCHES = [
    ['primary', 'Primary', 'Buttons, links, highlights'],
    ['secondary', 'Secondary', 'Gradient midpoint'],
    ['accent', 'Accent', 'Gradient end, alerts'],
    ['bg', 'Background', 'Page background'],
    ['surface', 'Surface', 'Cards and panels'],
    ['text', 'Text', 'Body text']
  ];

  function applyPreview() {
    var t = data.theme;
    C.applyTheme(t);
    var p = $('#themePreview');
    p.style.setProperty('--tp-bg', t.bg);
    p.style.setProperty('--tp-surface', t.surface);
    p.style.setProperty('--tp-text', t.text);
    p.style.setProperty('--tp-grad',
      'linear-gradient(100deg,' + t.primary + ',' + t.secondary + ' 52%,' + t.accent + ')');
  }

  function renderTheme() {
    /* presets */
    var ph = $('#presets');
    ph.innerHTML = '';
    Object.keys(C.PRESETS).forEach(function (key) {
      var p = C.PRESETS[key];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset' + (data.theme.preset === key ? ' is-active' : '');
      b.innerHTML =
        '<span class="preset__dots">' +
          '<i style="background:' + p.primary + '"></i>' +
          '<i style="background:' + p.secondary + '"></i>' +
          '<i style="background:' + p.accent + '"></i>' +
          '<i style="background:' + p.bg + ';border:1px solid rgba(255,255,255,.18)"></i>' +
        '</span><span class="preset__name">' + p.label + '</span>';
      b.addEventListener('click', function () {
        ['primary', 'secondary', 'accent', 'bg', 'surface', 'text'].forEach(function (k) {
          data.theme[k] = p[k];
        });
        data.theme.preset = key;
        markDirty(); applyPreview(); renderTheme();
      });
      ph.appendChild(b);
    });

    /* custom swatches */
    var sh = $('#swatches');
    sh.innerHTML = '';
    SWATCHES.forEach(function (s) {
      var key = s[0];
      var w = document.createElement('div');
      w.className = 'swatch';
      var inp = document.createElement('input');
      inp.type = 'color';
      inp.value = data.theme[key];
      inp.setAttribute('aria-label', s[1] + ' colour');
      var meta = document.createElement('div');
      meta.className = 'swatch__meta';
      meta.innerHTML = '<span class="swatch__label"></span><span class="swatch__hex"></span>';
      meta.querySelector('.swatch__label').textContent = s[1];
      meta.querySelector('.swatch__hex').textContent = data.theme[key];
      inp.addEventListener('input', function () {
        data.theme[key] = inp.value;
        data.theme.preset = 'custom';
        meta.querySelector('.swatch__hex').textContent = inp.value;
        applyPreview();
        markDirty();
        $$('.preset').forEach(function (b) { b.classList.remove('is-active'); });
      });
      w.appendChild(inp); w.appendChild(meta);
      sh.appendChild(w);
    });

    applyPreview();
  }

  function initThemePanel() {
    $('#resetTheme').addEventListener('click', function () {
      data.theme = C.clone(C.DEFAULTS.theme);
      markDirty(); renderTheme();
      toast('Theme reset to default');
    });
  }

  /* ==========================================================
     Panel: Publish
     ========================================================== */
  function renderJson() {
    var out = $('#jsonOut');
    if (out) out.textContent = JSON.stringify(data, null, 2);
  }

  function initPublishPanel() {
    function download() {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'content.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast('content.json downloaded — commit it to your repo');
    }

    $('#downloadJson').addEventListener('click', download);
    $('#publishTop').addEventListener('click', function () {
      showPanel('publish');
      download();
    });

    $('#copyJson').addEventListener('click', function () {
      var text = JSON.stringify(data, null, 2);
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(function () { toast('JSON copied to clipboard'); })
          .catch(function () { toast('Could not copy — use the download button'); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); toast('JSON copied to clipboard'); }
        catch (e) { toast('Could not copy — use the download button'); }
        ta.remove();
      }
    });

    $('#discardDraft').addEventListener('click', function () {
      if (!confirm('Discard all unpublished changes? This cannot be undone.')) return;
      C.clearDraft();
      location.reload();
    });
  }

  /* ==========================================================
     Panel: Settings
     ========================================================== */
  function initSettingsPanel() {
    $('#genHash').addEventListener('click', function () {
      var pw = $('#newPass').value;
      var user = $('#newUser').value.trim() || CFG.username;
      if (pw.length < 8) { toast('Use at least 8 characters'); return; }
      sha256((CFG.salt || '') + ':' + pw).then(function (h) {
        var out = $('#hashOut');
        out.hidden = false;
        out.textContent =
          '// paste these two lines into assets/js/admin-config.js\n' +
          "  username: '" + user + "',\n" +
          "  passwordHash: '" + h + "',";
        toast('Config line generated');
      });
    });
  }

  /* ==========================================================
     Shell
     ========================================================== */
  function showPanel(name) {
    $$('.panel').forEach(function (p) {
      p.classList.toggle('is-active', p.getAttribute('data-panel') === name);
    });
    $$('.dash__navbtn').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-panel') === name);
    });
  }

  function initShell() {
    $$('.dash__navbtn').forEach(function (b) {
      b.addEventListener('click', function () { showPanel(b.getAttribute('data-panel')); });
    });
    $('#logout').addEventListener('click', function () {
      try { sessionStorage.removeItem(C.SESSION_KEY); } catch (e) {}
      location.reload();
    });
  }

  function boot() {
    C.load().then(function (res) {
      published = res.published;
      data = C.clone(res.content);

      // make sure optional containers exist so editors can write into them
      if (!data.availability) data.availability = { dates: {} };
      if (!data.availability.dates) data.availability.dates = {};
      if (!data.gallery) data.gallery = { items: [] };
      if (!Array.isArray(data.gallery.items)) data.gallery.items = [];
      if (!Array.isArray(data.socials)) data.socials = [];
      if (!data.theme) data.theme = C.clone(C.DEFAULTS.theme);

      renderContentPanel();
      renderMedia();
      renderAdminCal();
      renderMarked();
      renderSocials();
      renderTheme();
      renderJson();

      initMediaPanel();
      initAvailPanel();
      initSocialPanel();
      initThemePanel();
      initPublishPanel();
      initSettingsPanel();

      $('#saveChip').textContent = res.hasDraft ? 'Draft loaded' : 'Saved';
    });
  }

  function init() {
    initShell();
    initLogin();
    if (sessionValid()) openDash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
