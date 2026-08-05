/* ============================================================
   ADMIN CREDENTIALS
   ------------------------------------------------------------
   To change the password: open the dashboard → Settings →
   "Change password", type a new one, and paste the generated
   line over `passwordHash` below. Never commit the plaintext
   password — only the hash belongs in this file.

   ⚠️  This is a client-side gate. It keeps casual visitors out of
   the dashboard, but anyone who views the page source can see this
   hash and could brute-force a weak password. Nothing secret should
   live in this repo. For real access control put the site behind
   Cloudflare Access, Netlify Identity, or a host with server-side
   auth — see the "Security" section of README.md.
   ============================================================ */
window.ADMIN_CONFIG = {
  username: 'reese',

  // SHA-256 of `salt + ":" + password`
  passwordHash: '386f5ad059f8dc534c751438845317429969fb31c366c6f38d6ff5e7c601fdf8',
  salt: 'djreese-2026',

  // how long a login stays valid, in minutes
  sessionMinutes: 120
};
