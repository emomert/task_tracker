# 05 — Tech Stack & Architecture

You asked for a well-supported stack. Below is the **recommended** one (what the rest of these docs assume), followed by **two solid alternatives** so the choice is yours. All three are free to run.

## Recommended — Stack A: React + Vite + Supabase + Cloudflare Pages

A static single-page app that talks directly to Supabase. No custom backend server to write or maintain. This is the simplest path to a free, owned, reliable tool for a small team.

| Layer | Choice | Why |
|-------|--------|-----|
| UI framework | **React 18 + TypeScript** | Ubiquitous, huge ecosystem, what coding agents handle best. |
| Build tool | **Vite** | Fast, simple, outputs a plain static site hostable anywhere. |
| Styling | **Tailwind CSS** | Rapid, consistent, easy to hit the minimal look with precision. |
| Editor | **BlockNote** | Purpose-built Notion-style block editor for React with **Markdown import/export** — exactly the "looks like Notion, stores Markdown" requirement. |
| Drag & drop | **dnd-kit** | Well-maintained, accessible, great for the Kanban board. |
| Data/DB/Auth | **Supabase** | Postgres + email/password auth + Row Level Security + auto client, all on a free tier. No server code needed. |
| Data fetching | **TanStack Query** | Clean caching/refetching of Supabase data. |
| Routing | **React Router** | Standard SPA routing. |
| Hosting | **Cloudflare Pages** | Free, **allows commercial/business use**, fast global CDN, simple Git or CLI deploys. |

### Architecture (Stack A)

```
[ Browser: React SPA (static files on Cloudflare Pages) ]
                  │  uses public anon key
                  ▼
        [ supabase-js client ]
                  │  HTTPS
                  ▼
[ Supabase ]  Postgres  +  Auth  +  Row Level Security
```

- The frontend is **static** — just HTML/CSS/JS served from a CDN.
- It calls Supabase directly with the **public anon key**. RLS in the database (see `03-data-model.md`) decides what each logged-in user may read/write.
- There is **no server to run** and **no email service**, which is what keeps it free and simple.
- Secrets: only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (anon key is safe to ship). The `service_role` key is never used in the app.

### Free-tier reality (so there are no surprises)

- **Supabase free tier** is generous for 4 people (a real Postgres DB, email/password auth for far more users than you'll ever have). One quirk: a free project **pauses after about a week of zero activity** — a team using it during the week keeps it awake, and waking a paused project is one click. Confirm current limits at supabase.com/pricing.
- **Cloudflare Pages free tier** allows business use and easily covers this traffic. (Note: Vercel's free "Hobby" plan **prohibits commercial use** — that's why it's not the pick here. **Netlify** is a fine free alternative to Cloudflare Pages and also allows business use.)

---

## Alternative — Stack B: Next.js + Supabase (more batteries-included)

Same data layer (Supabase), but the frontend is **Next.js** instead of a plain SPA.

- **Pros:** if you later want server-rendered pages, API routes, or an "admin creates accounts" endpoint, Next.js gives you a server side cleanly.
- **Cons:** more concepts than a static SPA; and its most natural host (Vercel) bans commercial use on the free tier, so host it on **Netlify** or **Cloudflare** instead, or self-host. Slightly more setup.
- **Editor/DnD:** same BlockNote + dnd-kit.
- **Choose this if:** you expect the tool to grow features that need a backend.

## Alternative — Stack C: React + Vite + PocketBase (maximum ownership)

Swap Supabase for **PocketBase** — a single self-hostable binary that bundles a database, email/password auth, and an admin UI.

- **Pros:** total ownership and no reliance on a SaaS free tier — run it on a tiny VPS and nothing can pause or change on you. Aligns strongly with the "never get locked out again" goal.
- **Cons:** you must run and update a small server yourself (a ~$4–5/month VPS, or a free container tier that may sleep). A bit more ops than Supabase.
- **Editor/DnD/UI:** same React + Vite + BlockNote + dnd-kit + Tailwind.
- **Choose this if:** you'd rather run your own server than depend on any free tier, and you're comfortable with a little server maintenance.

---

## Recommendation

Use **Stack A**. It's the fastest to build, free, requires no server, and is easy for the team to reach by URL. The rest of these documents (data model, build plan, setup) assume Stack A. If you prefer B or C, tell the agent and it should adapt the data-model and setup steps accordingly — the feature spec and design spec don't change.
