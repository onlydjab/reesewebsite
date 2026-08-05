# DJ Reese — Official Site

Static, dependency-free site for DJ Reese (open format DJ, Tuscaloosa AL) with a
password-gated dashboard for editing content, photos, availability and colours.

No build step. No npm. No server. Drop it on GitHub Pages and it runs.

---

## ⚠️ Do these five things before you go live

| # | What | Where |
|---|------|-------|
| 1 | **Optional: add a booking email.** The site ships with no email address — bookings go to the phone number by text. Add one here if you want email instead. | Dashboard → *Text & Content* → *Bookings & contact* |
| 2 | **Add YouTube + SoundCloud links.** They ship switched **off** because the real handles weren't known — guessing would have linked to strangers' profiles. Paste the real URLs and flip *Show on*. | Dashboard → *Social Links* |
| 3 | **Change the dashboard password.** The username is `reese`; the password is not stored in this repo. | Dashboard → *Settings* → *Change password* |
| 4 | ~~Replace the domain.~~ **Done** — the site is live at `https://omgdjreese.com`. The `CNAME` file sets the custom domain; changing it means updating the canonical tag, Open Graph tags, `sitemap.xml` and `robots.txt` too. | `CNAME`, `index.html`, `sitemap.xml`, `robots.txt` |
| 5 | **Fill in the availability calendar.** It ships with every future date marked available and nothing booked — deliberately, so the site never shows made-up gigs. | Dashboard → *Availability* |

---

## Deploying to GitHub Pages

1. Create a new repository on GitHub (public).
2. Upload everything in this folder — either drag the files into the GitHub web
   uploader, or from a terminal:

   ```bash
   cd ~/Desktop/djreese
   git init
   git add .
   git commit -m "DJ Reese site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

3. In the repo: **Settings → Pages → Source: Deploy from a branch**, pick
   `main` and `/ (root)`, then Save.
4. Wait ~1 minute. The site is live at
   `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

### Custom domain

Settings → Pages → Custom domain. Add your domain, then at your registrar point
an `ALIAS`/`ANAME` (or four `A` records) at GitHub's IPs and a `CNAME` for `www`.
GitHub writes a `CNAME` file into the repo for you. Tick **Enforce HTTPS**.

Then update the URLs listed in item 4 above.

---

## The dashboard

Reach it from the small **Admin** link in the footer, or go straight to
`/admin.html`.

**Login**

```
username: reese
password: (not stored in this repo — see below)
```

This repository is public, so the plaintext password is deliberately kept out of
it. Only the salted SHA-256 hash lives in `assets/js/admin-config.js`. To set a
new password, use Dashboard → *Settings* → *Change password* and paste the
generated `passwordHash` line into that file.

### What you can change

| Panel | What it does |
|-------|--------------|
| **Text & Content** | Every headline, paragraph, stat, venue, collaboration and contact detail on the site. |
| **Photos & Video** | Upload photos, add YouTube links, reorder, set captions, alt text and tile size. |
| **Availability** | Click dates to cycle Available → On hold → Booked. Add a venue label per date. |
| **Social Links** | Add/remove platforms, set the username shown, toggle visibility. |
| **Colour Scheme** | Six presets or six custom colours; the whole site re-skins from them. |
| **Publish** | Download the updated `content.json` and push it live. |
| **Settings** | Generate a new password hash. |

### How publishing works

Edits save instantly to **your browser only** (a draft in `localStorage`), so you
can preview freely. While a draft exists you'll see a *"Draft preview — not
published yet"* chip on the site. Visitors never see drafts.

To publish:

1. Dashboard → **Publish** → *Download content.json*
2. In your GitHub repo open `data/content.json` → pencil icon → paste the new
   contents → **Commit changes**
   *(or drag the downloaded file into the `data/` folder to overwrite it)*
3. Wait ~1 minute for GitHub Pages to rebuild.

*Discard draft* throws away everything unpublished.

---

## 🔒 Security — please read

The dashboard login runs **entirely in the browser**. That's the trade-off for a
free, serverless GitHub Pages site: there is no backend to check a password
against, so the check happens in JavaScript and the password hash sits in
`assets/js/admin-config.js`, which anyone can view.

**What this means**

- It keeps casual visitors and search engines out of the dashboard.
- It is **not** real access control. Someone determined who reads the page source
  can see the hash and brute-force a weak password.
- Editing through the dashboard can never damage the live site on its own —
  publishing requires a commit to the repo, which needs your GitHub account.

**Rules of thumb**

- Use a long, unique password (a passphrase is ideal).
- Never put anything sensitive in this repo — it's public.

**If you want genuine protection**, put the site behind one of these (all keep
the same code):

- **Cloudflare Access** — free tier, email-code login in front of `/admin.html`.
- **Netlify** or **Cloudflare Pages** with password protection / Identity.
- Any host with server-side auth.

---

## Adding photos

**Best quality and speed** — optimise first, then reference by path:

```bash
python3 tools/optimize-images.py ~/Desktop/new-photo.jpg --name reese-spring-break
```

That writes `-500`, `-1000` and `-full` versions in both WebP and JPEG into
`assets/img/gallery/`. Then in the dashboard paste the path **without** a size
suffix:

```
assets/img/gallery/reese-spring-break
```

The site picks the right size per device automatically.

**Quick way** — Dashboard → *Photos & Video* → *Upload photo*. The image is
resized to 1400px and embedded directly in `content.json`. Convenient, but each
photo adds a few hundred KB to that file, so use it for a handful at most.

### Adding video

*Photos & Video* → *Add video link* → paste a YouTube URL. Add a poster image
path so the tile has a thumbnail. Direct `.mp4` files work too.

### Replacing the EPK

Overwrite `assets/epk/DJ-Reese-EPK.pdf` and `assets/epk/DJ-Reese-EPK.jpg`,
keeping the same filenames. To also refresh the on-page preview, regenerate
`assets/img/epk/epk-preview-600.*` and `epk-preview-full.*`.

---

## Booking form

By default the form opens the visitor's email app with everything pre-filled —
no backend, nothing stored on the site.

To receive submissions by email instead, create a free form endpoint
([Formspree](https://formspree.io) or [Basin](https://usebasin.com)) and paste
the URL into Dashboard → *Text & Content* → *Bookings & contact* → *Booking form
endpoint*. The form switches to real submissions automatically and falls back to
email if the request fails.

---

## Project structure

```
djreese/
├── index.html              Main site (content baked in for SEO)
├── admin.html              Dashboard
├── 404.html
├── data/content.json       ← the file you publish
├── assets/
│   ├── css/styles.css      Design system (colours are CSS variables)
│   ├── css/admin.css
│   ├── js/content.js       Shared content store + theming
│   ├── js/main.js          Site behaviour
│   ├── js/admin.js         Dashboard
│   ├── js/admin-config.js  ← credentials
│   ├── fonts/              Self-hosted Inter + Sora (71 KB total)
│   ├── img/                Optimised responsive images
│   └── epk/                Downloadable press kit (PDF + JPG)
├── tools/optimize-images.py
├── _source/                Your original full-resolution photos
├── robots.txt · sitemap.xml · site.webmanifest · favicon.ico
└── .nojekyll               Tells GitHub Pages to serve files as-is
```

`_source/` holds the untouched originals from the shoot. Nothing links to them,
so they cost visitors nothing — they're kept so you can re-crop or re-export
later. Delete the folder if you'd rather keep the repo small.

---

## Built-in behaviour worth knowing

- **SEO** — semantic HTML with all copy in the markup (not JS-injected),
  Open Graph + Twitter cards, JSON-LD structured data (`Person` / `MusicGroup` /
  `Service`), sitemap, canonical URL, descriptive image alt text.
- **Performance** — self-hosted variable fonts (71 KB), WebP with JPEG
  fallbacks, responsive `srcset`, lazy loading below the fold, LCP hero
  preloaded, zero third-party requests, no framework.
- **Accessibility** — keyboard navigable, visible focus rings, skip link, ARIA
  labelling on the calendar/menu/lightbox, and full `prefers-reduced-motion`
  support.
- **Responsive** — one column on phones, hamburger menu below 1080px, tuned
  down to 380px wide.
- **Theming** — every colour derives from six CSS custom properties, which is
  why the dashboard can re-skin the entire site instantly.

---

## Local preview

The site needs to be served over HTTP for `data/content.json` to load (opening
`index.html` directly still works — it falls back to the copy embedded in
`content.js`).

```bash
cd ~/Desktop/djreese
python3 -m http.server 4173
```

Then open <http://localhost:4173>.
