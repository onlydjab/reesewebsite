/* ============================================================
   DJ REESE — shared content store
   Used by both the public site (main.js) and the dashboard (admin.js).

   Content resolution order (last wins):
     1. DEFAULTS               — embedded below, so the site also works
                                 when opened directly from disk (file://)
     2. data/content.json      — the published file committed to the repo
     3. localStorage draft     — unpublished dashboard edits (owner only)
   ============================================================ */
(function (global) {
  'use strict';

  var STORE_KEY   = 'djreese:draft';
  var SESSION_KEY = 'djreese:session';

  /* ---------- embedded defaults (fallback for file://) ---------- */
  var DEFAULTS = {
    version: 1,
    site: {
      name: 'DJ Reese',
      tagline: 'Open Format. Any Crowd. All Energy.',
      url: 'https://omgdjreese.com',
      description: 'DJ Reese is an open format DJ based in Tuscaloosa, Alabama. Clubs, bars, fraternity and private events across the Southeast and beyond. Seamless transitions, unique mixes, unmatched energy.'
    },
    theme: {
      preset: 'midnight',
      primary: '#3B82F6', secondary: '#8B5CF6', accent: '#EC4899',
      bg: '#05060F', surface: '#0C0E20', text: '#EEF1FF'
    },
    hero: {
      eyebrow: 'Tuscaloosa, Alabama — Open Format DJ',
      titleLine1: 'Open Format.', titleLine2: 'Any Crowd.', titleLine3: 'All Energy.',
      subtitle: 'Clubs, bars, fraternities and private events across the Southeast — and wherever the booking takes him.',
      ctaPrimary: 'Book DJ Reese', ctaSecondary: 'Download EPK',
      image: 'assets/img/hero/hero', focalPoint: '50% 38%',
      ticker: ["Egan's", 'Twelve25', 'The Houndstooth', 'The Fennec', 'Tin Roof',
               'Rounders', 'The Grandstand', 'Bimini, Bahamas', 'Bar South',
               "Tango's", 'The Silver Dollar', 'Rhythm and Brews']
    },
    stats: [
      { value: '7',  suffix: '',  label: 'States Played' },
      { value: '2',  suffix: '+', label: 'Years Experience' },
      { value: '18', suffix: '+', label: 'Venues & Clubs' },
      { value: '1',  suffix: '',  label: 'International Booking' }
    ],
    about: {
      eyebrow: 'The Artist',
      heading: 'Reads the room. Runs the night.',
      bio1: 'DJ Reese is a rising open-format DJ based in Tuscaloosa, Alabama, known for his ability to read any crowd and seamlessly switch between genres to keep the energy high all night. With a deep passion for music, Reese began DJing out of pure love for sound and quickly turned that passion into a fast-growing career.',
      bio2: 'What sets DJ Reese apart is his versatility and creativity. From hip-hop to house and everything in between, he blends styles effortlessly while incorporating his own unique mixes and edits of popular tracks. His ability to adapt to an audience has made him one of the most in-demand DJs in the region.',
      image: 'assets/img/gallery/reese-club-purple',
      imageAlt: 'DJ Reese behind the decks under purple club lighting',
      facts: [
        { label: 'Genre', value: 'Open Format' },
        { label: 'Experience', value: '2+ Years' },
        { label: 'Based In', value: 'Tuscaloosa, Alabama' },
        { label: 'States Played', value: '7' },
        { label: 'Known For', value: 'Seamless Transitions, Unique Mixes & Unmatched Energy' }
      ]
    },
    collaborations: {
      eyebrow: 'Notable Collaborations',
      heading: 'Shared the stage with',
      items: [
        { name: 'Lil Mosey', role: 'Recording Artist' },
        { name: 'Nate Wyatt', role: 'Recording Artist' },
        { name: 'RedCup Nation', role: 'Event Brand' },
        { name: '2Checks', role: 'Recording Artist' }
      ]
    },
    venues: {
      eyebrow: 'Locations Played',
      heading: 'From Tuscaloosa to the Bahamas',
      subheading: 'Multi-state performances across the Southeast, plus international bookings.',
      groups: [
        { city: 'Tuscaloosa', region: 'Alabama',
          items: ["Egan's", 'Twelve25', 'The Grandstand', 'The Houndstooth', 'Rounders', 'Cocktail Collection', 'Rhythm and Brews'] },
        { city: 'Birmingham', region: 'Alabama',
          items: ['The Fennec', 'Tin Roof'] },
        { city: 'Other Cities', region: 'Southeast & International',
          items: ["Tango's — Oxford, MS", 'Updawg — Athens, GA', 'Cloud — Athens, GA',
                  'The Silver Dollar — Athens, GA', 'The Tiki Bar — Panama City Beach, FL',
                  'Bimini, Bahamas — Spring Break Booking', 'Undeclared — Knoxville, TN',
                  'Bar South — Atlanta, GA'] }
      ],
      highlights: [
        'Multi-State Performances Across the Southeast',
        'International Booking (Bimini, Bahamas)',
        'Fraternity & Private Events',
        'Clubs, Bars & Signature Events',
        'High-Energy, Crowd-Focused Sets'
      ]
    },
    gallery: {
      eyebrow: 'Media', heading: 'Photos & Video',
      subheading: 'Live sets, packed rooms and late nights.',
      items: [
        { id: 'g1', type: 'image', src: 'assets/img/gallery/reese-crowd-fisheye',   alt: 'Crowd with hands up during a DJ Reese open format set', caption: 'Hands up — peak hour', size: 'wide' },
        { id: 'g2', type: 'image', src: 'assets/img/gallery/reese-club-purple',     alt: 'DJ Reese behind the decks under purple club lighting',  caption: 'Club night',   size: 'tall' },
        { id: 'g3', type: 'image', src: 'assets/img/gallery/reese-decks-hellstar',  alt: 'DJ Reese mixing on Pioneer CDJs during a live set',     caption: 'On the decks', size: 'tall' },
        { id: 'g4', type: 'image', src: 'assets/img/gallery/reese-packed-house',    alt: 'DJ Reese playing to a packed bar crowd',                caption: 'Packed house', size: 'wide' },
        { id: 'g5', type: 'image', src: 'assets/img/gallery/reese-blue-mix',        alt: 'DJ Reese blending tracks under blue stage lights',      caption: 'Blue hour',    size: 'normal' },
        { id: 'g6', type: 'image', src: 'assets/img/gallery/reese-rane-turntables', alt: 'DJ Reese on Rane turntables at a club night',           caption: 'Turntables',   size: 'normal' },
        { id: 'g7', type: 'image', src: 'assets/img/gallery/reese-live-crowd',      alt: 'DJ Reese working a packed tent party in Tuscaloosa, Alabama', caption: 'Tent party', size: 'normal' },
        { id: 'g8', type: 'image', src: 'assets/img/gallery/reese-booth-portrait',  alt: 'DJ Reese in the booth wearing headphones',              caption: 'In the booth', size: 'normal' },
        { id: 'g9', type: 'image', src: 'assets/img/gallery/reese-green-lights',    alt: 'DJ Reese performing for a crowd under stage lighting',  caption: 'Lights down',  size: 'normal' }
      ]
    },
    epk: {
      eyebrow: 'Press Kit', heading: 'Electronic Press Kit',
      body: 'Everything promoters and venues need in one place — bio, stats, notable collaborations, venue history and contact details. Download the full EPK or view it below.',
      preview: 'assets/img/epk/epk-preview',
      previewAlt: 'DJ Reese electronic press kit',
      downloadPdf: 'assets/epk/DJ-Reese-EPK.pdf',
      downloadImage: 'assets/epk/DJ-Reese-EPK.jpg',
      buttonLabel: 'Download EPK (PDF)'
    },
    availability: {
      eyebrow: 'Availability', heading: 'Book a date',
      subheading: 'Open dates are live below. Select a date to start a booking request — bookings are confirmed by DJ Reese directly.',
      note: 'Availability is updated regularly. If a date shows as held, reach out anyway — plans change.',
      dates: {}
    },
    socials: [
      { id: 's1', platform: 'instagram',  username: '@omgdjreese', url: 'https://instagram.com/omgdjreese', enabled: true },
      { id: 's2', platform: 'tiktok',     username: '@iamdjreese', url: 'https://tiktok.com/@iamdjreese',   enabled: true },
      // real handles were not supplied — fill these in via the dashboard, then switch them on
      { id: 's3', platform: 'youtube',    username: '@yourhandle', url: '', enabled: false },
      { id: 's4', platform: 'soundcloud', username: 'yourhandle',  url: '', enabled: false }
    ],
    contact: {
      eyebrow: 'Bookings', heading: "Let's make it a movie.",
      subheading: 'Clubs, bars, fraternity formals, private parties and festivals. Tell me the date and the vibe.',
      phone: '(205) 773-9529', phoneHref: '+12057739529',
      location: 'Tuscaloosa, Alabama',
      travelNote: 'Available for travel — Southeast and international.',
      formEndpoint: '',
      quote: '"Open format, nonstop energy — DJ Reese controls the crowd."'
    },
    footer: {
      blurb: 'Open format DJ based in Tuscaloosa, Alabama. Booking nationwide and international.',
      credit: 'DJ Reese'
    }
  };

  /* ---------- colour presets for the dashboard ---------- */
  var PRESETS = {
    midnight:  { label: 'Midnight (default)', primary: '#3B82F6', secondary: '#8B5CF6', accent: '#EC4899', bg: '#05060F', surface: '#0C0E20', text: '#EEF1FF' },
    electric:  { label: 'Electric Blue',      primary: '#22D3EE', secondary: '#3B82F6', accent: '#818CF8', bg: '#03060F', surface: '#08101F', text: '#EAF6FF' },
    ultraviolet:{label: 'Ultraviolet',        primary: '#8B5CF6', secondary: '#C026D3', accent: '#F472B6', bg: '#07041A', surface: '#120B29', text: '#F3EEFF' },
    neonNoir:  { label: 'Neon Noir',          primary: '#6366F1', secondary: '#A855F7', accent: '#F43F5E', bg: '#04040A', surface: '#0B0B16', text: '#F0F0FA' },
    chrome:    { label: 'Chrome & Ice',       primary: '#60A5FA', secondary: '#94A3B8', accent: '#38BDF8', bg: '#06080F', surface: '#0E131F', text: '#F1F5FF' },
    sunsetMia: { label: 'Miami Sunset',       primary: '#F97316', secondary: '#DB2777', accent: '#8B5CF6', bg: '#0B0510', surface: '#180C1C', text: '#FFF1E8' }
  };

  /* ---------- social icons (inline, no network requests) ---------- */
  var ICONS = {
    instagram:  '<path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.25.07 1.63.07 4.81s-.01 3.56-.07 4.81c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.25.06-1.63.07-4.85.07s-3.6-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 01-1.38-.9 3.8 3.8 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.56 2.2 15.18 2.2 12s.01-3.56.07-4.81c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.44 2.21 8.82 2.2 12 2.2zm0 3.05A6.75 6.75 0 1018.75 12 6.75 6.75 0 0012 5.25zm0 11.13A4.38 4.38 0 1116.38 12 4.38 4.38 0 0112 16.38zm6.99-11.4a1.58 1.58 0 11-1.58-1.58 1.58 1.58 0 011.58 1.58z"/>',
    tiktok:     '<path d="M16.6 5.82A4.28 4.28 0 0115.54 3h-3.1v12.4a2.59 2.59 0 01-2.6 2.5 2.6 2.6 0 01-.6-5.13V9.6a5.68 5.68 0 103.2 5.1V8.9a7.34 7.34 0 004.3 1.38V7.18a4.29 4.29 0 01-.14-1.36z"/>',
    youtube:    '<path d="M21.58 7.19a2.5 2.5 0 00-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42a2.5 2.5 0 00-1.76 1.77A26.1 26.1 0 002 12a26.1 26.1 0 00.42 4.81 2.5 2.5 0 001.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 001.76-1.77A26.1 26.1 0 0022 12a26.1 26.1 0 00-.42-4.81zM10 15.02V8.98L15.2 12z"/>',
    soundcloud: '<path d="M1.2 13.3c-.1 0-.15.06-.16.15l-.2 1.62.2 1.58c.01.09.06.15.16.15s.15-.06.16-.15l.23-1.58-.23-1.62c-.01-.09-.06-.15-.16-.15zm1.2-.86c-.1 0-.18.08-.19.18l-.26 2.45.26 2.37c.01.1.09.18.19.18.1 0 .17-.08.19-.18l.3-2.37-.3-2.45c-.02-.1-.09-.18-.19-.18zm2.44-.9c-.12 0-.22.1-.23.22l-.24 3.31.24 2.2c.01.13.11.23.23.23s.22-.1.23-.23l.28-2.2-.28-3.31c-.01-.12-.11-.22-.23-.22zm1.25-.28c-.13 0-.24.11-.25.25l-.22 3.56.22 2.19c.01.14.12.25.25.25s.24-.11.25-.25l.25-2.19-.25-3.56c-.01-.14-.12-.25-.25-.25zm1.28-1.4c-.15 0-.26.12-.27.27l-.2 4.94.2 2.16c.01.15.12.27.27.27s.26-.12.27-.27l.23-2.16-.23-4.94c-.01-.15-.12-.27-.27-.27zm1.3-.6c-.16 0-.29.13-.3.29l-.18 5.52.18 2.14c.01.16.14.29.3.29s.29-.13.3-.29l.2-2.14-.2-5.52c-.01-.16-.14-.29-.3-.29zm1.33.13c-.17 0-.31.14-.32.31l-.17 5.38.17 2.12c.01.17.15.31.32.31s.31-.14.32-.31l.19-2.12-.19-5.38c-.01-.17-.15-.31-.32-.31zm1.4-1.2c-.19 0-.34.15-.35.34l-.15 6.55.15 2.09c.01.19.16.34.35.34s.34-.15.35-.34l.17-2.09-.17-6.55c-.01-.19-.16-.34-.35-.34zM13.6 8c-.2 0-.36.16-.37.36l-.13 8.15.13 2.06c.01.2.17.36.37.36s.36-.16.37-.36l.15-2.06-.15-8.15A.37.37 0 0013.6 8zm5.63 3.35a3.1 3.1 0 00-1.2.24c-.2-2.3-2.12-4.1-4.47-4.1-.58 0-1.14.11-1.63.31-.19.08-.24.16-.24.32v10.63c0 .17.13.31.3.33h7.24a3.37 3.37 0 100-6.73z"/>',
    spotify:    '<path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm4.59 14.43a.62.62 0 01-.86.21c-2.35-1.44-5.31-1.76-8.79-.96a.62.62 0 11-.28-1.21c3.81-.87 7.09-.5 9.72 1.1a.62.62 0 01.21.86zm1.22-2.72a.78.78 0 01-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 11-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33a.78.78 0 01.25 1.07zm.11-2.84C14.7 8.95 9.4 8.77 6.32 9.71a.93.93 0 11-.54-1.78c3.54-1.08 9.39-.87 13.09 1.33a.93.93 0 11-.95 1.61z"/>',
    x:          '<path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-5.9l-4.62-6.04L5.94 21H2.92l7.06-8.07L2.5 3h6.05l4.18 5.52L17.53 3zm-1.06 16.2h1.67L7.6 4.71H5.81l10.66 14.49z"/>',
    facebook:   '<path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z"/>',
    applemusic: '<path d="M18.7 6.36a3.9 3.9 0 00-1.86 3.29 3.79 3.79 0 002.31 3.48 9.06 9.06 0 01-1.18 2.44c-.74 1.06-1.5 2.12-2.68 2.12s-1.48-.68-2.83-.68-1.78.7-2.85.7-1.83-.98-2.68-2.19a10.66 10.66 0 01-1.81-5.75c0-3.38 2.2-5.17 4.36-5.17 1.15 0 2.1.75 2.82.75.68 0 1.75-.8 3.06-.8a4.1 4.1 0 013.34 1.81zM15.5 3.9a3.72 3.72 0 00.89-2.32 3.2 3.2 0 00-.02-.31 3.75 3.75 0 00-2.47 1.28 3.6 3.6 0 00-.92 2.25c0 .11.02.22.03.26a1.3 1.3 0 00.24.02 3.24 3.24 0 002.25-1.18z"/>',
    twitch:     '<path d="M4.27 2L2.5 5.77v13.4h4.6V22h2.6l2.6-2.83h3.77L21.5 14V2zm15.4 11.3l-2.83 2.83h-4.6l-2.6 2.6v-2.6H5.9V3.9h13.77z M14.4 7.2h1.9v5.2h-1.9zm-4.6 0h1.9v5.2H9.8z"/>',
    website:    '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.94 9h-3.02a15.7 15.7 0 00-1.2-5.42A8.03 8.03 0 0119.94 11zM12 4.06c.74 1.05 1.7 3.1 1.9 6.94h-3.8c.2-3.84 1.16-5.89 1.9-6.94zM4.06 13h3.02a15.7 15.7 0 001.2 5.42A8.03 8.03 0 014.06 13zm3.02-2H4.06a8.03 8.03 0 014.22-5.42A15.7 15.7 0 007.08 11zM12 19.94c-.74-1.05-1.7-3.1-1.9-6.94h3.8c-.2 3.84-1.16 5.89-1.9 6.94zm3.72-1.52a15.7 15.7 0 001.2-5.42h3.02a8.03 8.03 0 01-4.22 5.42z"/>',
    email:      '<path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.24l-8 4.99-8-4.99V6l8 4.99L20 6z"/>'
  };

  var PLATFORM_LABELS = {
    instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube',
    soundcloud: 'SoundCloud', spotify: 'Spotify', x: 'X (Twitter)',
    facebook: 'Facebook', applemusic: 'Apple Music', twitch: 'Twitch',
    website: 'Website', email: 'Email'
  };

  /* ---------- helpers ---------- */
  function isPlainObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  /** Deep-merge `src` onto a clone of `base`. Arrays replace wholesale. */
  function merge(base, src) {
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!isPlainObject(src)) return out;
    Object.keys(src).forEach(function (k) {
      if (isPlainObject(src[k]) && isPlainObject(out[k])) out[k] = merge(out[k], src[k]);
      else out[k] = src[k];
    });
    return out;
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function get(obj, path) {
    return path.split('.').reduce(function (a, k) {
      return (a === undefined || a === null) ? undefined : a[k];
    }, obj);
  }

  function set(obj, path, value) {
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function (a, k) {
      if (!isPlainObject(a[k])) a[k] = {};
      return a[k];
    }, obj);
    target[last] = value;
    return obj;
  }

  /* ---------- storage ---------- */
  function readDraft() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeDraft(data) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Could not save draft:', e);
      return false;
    }
  }

  function clearDraft() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
  }

  /**
   * Resolve the effective content.
   * @returns {Promise<{content:Object, published:Object, hasDraft:boolean}>}
   */
  function load() {
    return fetch('data/content.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (published) {
        var base = published ? merge(DEFAULTS, published) : clone(DEFAULTS);
        var draft = readDraft();
        return {
          content: draft ? merge(base, draft) : base,
          published: base,
          hasDraft: !!draft
        };
      });
  }

  /* ---------- theme ---------- */
  function applyTheme(theme, root) {
    if (!theme) return;
    var el = root || document.documentElement;
    var map = {
      primary: '--c-primary', secondary: '--c-secondary', accent: '--c-accent',
      bg: '--c-bg', surface: '--c-surface', text: '--c-text'
    };
    Object.keys(map).forEach(function (k) {
      if (theme[k]) el.style.setProperty(map[k], theme[k]);
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && theme.bg) meta.setAttribute('content', theme.bg);
  }

  /* ---------- social markup ---------- */
  function socialIcon(platform) {
    return ICONS[platform] || ICONS.website;
  }

  function socialLabel(platform) {
    return PLATFORM_LABELS[platform] || platform;
  }

  /** Build one social pill element. */
  function socialEl(s) {
    var a = document.createElement('a');
    a.className = 'social';
    a.href = s.platform === 'email' ? 'mailto:' + String(s.url).replace(/^mailto:/, '') : s.url;
    if (s.platform !== 'email') { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    a.setAttribute('aria-label', socialLabel(s.platform) + ' — ' + (s.username || ''));
    a.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + socialIcon(s.platform) + '</svg>' +
      '<span class="social__name"></span>';
    a.querySelector('.social__name').textContent = s.username || socialLabel(s.platform);
    return a;
  }

  global.DJContent = {
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    ICONS: ICONS,
    PLATFORM_LABELS: PLATFORM_LABELS,
    STORE_KEY: STORE_KEY,
    SESSION_KEY: SESSION_KEY,
    merge: merge,
    clone: clone,
    get: get,
    set: set,
    load: load,
    readDraft: readDraft,
    writeDraft: writeDraft,
    clearDraft: clearDraft,
    applyTheme: applyTheme,
    socialEl: socialEl,
    socialIcon: socialIcon,
    socialLabel: socialLabel
  };
})(window);
