# halfsentence

A personal blog with admin panel, built with HTML/CSS/JS + Supabase + Vercel.

---

## Project Structure

```
halfsentence/
├── index.html          ← Homepage
├── post.html           ← Single post view
├── readers.html        ← Readers' Corner
├── about.html          ← About page
├── vercel.json         ← Vercel config
├── supabase-setup.sql  ← Run this in Supabase SQL Editor FIRST
│
├── css/
│   ├── style.css       ← Public site styles
│   └── admin.css       ← Admin panel styles
│
├── js/
│   ├── supabase.js     ← ⚠️  PUT YOUR KEYS HERE
│   └── main.js         ← Public site logic
│
└── admin/
    ├── index.html      ← Admin login
    ├── dashboard.html  ← Admin panel
    └── admin.js        ← Admin logic
```

---

## Setup (Step by Step)

### Step 1 — Supabase

1. Go to https://supabase.com → create a free account
2. New project → name it `halfsentence` → save your password
3. Go to **SQL Editor** → paste the entire `supabase-setup.sql` file → Run
4. Go to **Authentication → Users** → Invite → add your email
5. Go to **Project Settings → API** → copy:
   - Project URL
   - anon public key

### Step 2 — Add your keys

Open `js/supabase.js` and replace:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY'
```

### Step 3 — GitHub

1. Create a GitHub account at https://github.com
2. New repository → name `halfsentence` → Public
3. Download GitHub Desktop → https://desktop.github.com
4. Add your project folder → Commit → Push

### Step 4 — Vercel

1. Go to https://vercel.com → Sign in with GitHub
2. New Project → select `halfsentence` repo
3. Deploy (no config needed)
4. Your site is live at `halfsentence.vercel.app`

### Step 5 — Admin Login

1. Go to `yoursite.vercel.app/admin`
2. Use the email you added in Supabase Auth
3. First login: check your email for a magic link from Supabase
4. Set your password in Supabase → Auth → Users

---

## Adding your first post

1. Go to `/admin` → login
2. Click **New Post**
3. Write or import a .docx / .txt file
4. Upload a cover image
5. Add category, tags, excerpt
6. Click **Publish Now** or **Schedule**

---

## Custom Domain (optional)

1. Buy domain at https://namecheap.com (~₹800/year)
2. Vercel → Project → Settings → Domains → Add domain
3. Copy DNS records → paste into Namecheap
4. Done in ~10 minutes

---

## Tech Stack

| Layer     | Tool                        | Cost |
|-----------|-----------------------------|------|
| Frontend  | HTML + CSS + JavaScript     | Free |
| Database  | Supabase (PostgreSQL)       | Free |
| Storage   | Supabase Storage            | Free |
| Auth      | Supabase Auth               | Free |
| Hosting   | Vercel                      | Free |

---

## Need help?

- Supabase docs → https://supabase.com/docs
- Vercel docs → https://vercel.com/docs
- Ask Claude with your error message pasted in
