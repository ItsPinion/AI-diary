# Inkwell — a private diary

> A calm, handcrafted diary. Write today's page, keep your moods, streaks and memories.
> No account. No cloud. No database. Just you, a page, and your words.

Inkwell is a premium personal-diary web app that feels like opening your favourite
notebook: warm paper, ink, generous whitespace and quiet, deliberate motion. Everything
is stored in your browser's LocalStorage and the entire app works offline. The one
optional exception is **Fix with AI**, which calls Gemini only when you press it.

Built with **Next.js 15**, **React 19**, **TypeScript**, **TailwindCSS**, **Framer Motion**
and **shadcn/ui**-style components.

---

## ✨ Features

- **One page per day** — opening the app drops you straight onto today's page. No buttons, no ceremony.
- **Distraction-free writing** — a large auto-expanding editor with serif title, rotating writing prompts, a glowing caret and nothing else between you and the page.
- **Fix with AI (optional)** — with a Gemini key (server env, or your own in Settings with a **Test key** check), a button sends the open page to Gemini, which streams a corrected version back under your text. You read the suggestion, then accept or discard it; the page is never rewritten behind your back. Guard rails keep it a proofreader, not a ghostwriter: meaning, tone, names, code and URLs are left alone. No key, no button — the feature is hidden rather than broken.
- **Autosave** — your words are saved on a gentle cadence (default every second), when the tab hides, and on close. Nothing is ever lost.
- **Moods** — eight feelings, each with its own colour that quietly tints the page you're writing on.
- **Journal timeline** — all pages grouped by month, newest first, with previews, word counts and reading time.
- **Instant search** — across titles, content and even dates ("july", "Tuesday"), with live filtering.
- **Favourite pages** — star the ones that matter; they get their own sidebar section.
- **Calendar** — a monthly view with mood-coloured dots; click any day to open (or start) its page.
- **Insights** — total pages, current & longest streaks, words, characters, favourite mood, a monthly bar chart and a year-long writing heatmap.
- **Six handcrafted themes** — Aurora, Ocean, Forest, Lavender, Sunset and Midnight — each with a light and dark variant.
- **Dark mode** — light / dark / system, independent of the palette.
- **Backups** — one-click full backup to a single JSON file, plus a reminder on your chosen cadence (daily → monthly, or off) that appears in the sidebar only when pages have changed since the last backup.
- **Export & import** — JSON, Markdown and plain text export; JSON import with merge or replace, which is also how a backup is restored.
- **Keyboard shortcuts** — ⌘/Ctrl+S, ⌘/Ctrl+F, ⌘/Ctrl+1–4, ⌘/Ctrl+D, `?` for the cheat sheet.
- **Micro-interactions** — ink ripples on press, card lifts, staggered list entrances, page-transition fades, floating action button, bottom-sheet navigation on mobile.
- **Accessible** — semantic markup, ARIA labels, focus rings, skip-to-content, `prefers-reduced-motion` support, full keyboard navigation.

---

## 🚀 Getting started

```bash
npm install        # install dependencies
npm run dev        # start the dev server → http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint (zero warnings expected)
npm run verify     # zero-dependency checks: proofreader, streaming route, backup rules
npm run verify:ai  # just the proofreader checks
```

> **Node 18.18+** required (Node 22+ for `npm run verify`). The diary itself
> needs no environment variables, no API keys and no database.

### Fix with AI (optional)

The proofreader is the one feature that talks to the outside world, and it stays
hidden until a key exists. Two ways to provide one:

| Where | How | Good for |
| ----- | --- | -------- |
| **Server** | `cp .env.example .env.local` and set `GEMINI_API_KEY` | Deployments — one key for everyone, never sent to a browser |
| **Settings → AI writing assistant** | Paste a key and press **Test key** | Running locally, or a deployment you don't control |

A key typed into Settings lives in `localStorage`, is sent only to your own
Inkwell server in an `x-gemini-api-key` header, and takes precedence over the
server key. With neither, the **Fix with AI** button is not rendered at all, so
there is nothing to press that could fail. Only an "is a server key configured?"
boolean is passed to the browser for the env case.

**Test key** calls `POST /api/gemini/test`, which runs `models.countTokens`
against the model the proofreader uses — free, generates nothing, and answers in
a moment. It reports either:

- ✓ `Saved and working — gemini-3.8-flash in 412 ms` (a key that passes is saved
  automatically, so you can't test one and forget it), or
- ✗ `That Gemini key isn't valid.` / `Couldn't reach Gemini — this server has no
  route to Google's API.` / and friends

Pressing **Fix with AI** calls `POST /api/proofread`, which streams Gemini's
reply back as Server-Sent Events so the correction appears word by word. Pin a
different model with `GEMINI_MODEL` (default `gemini-3.8-flash`). Pages longer
than 30 000 characters are refused before anything is billed.

> **Privacy** — pressing **Fix with AI** sends the text of the open page to
> Google's Gemini API. Nothing else leaves the device, and nothing is sent
> unless you press the button.

> Because the server-key flag is read at build time on statically rendered
> pages, add an env key *before* `npm run build`. In `npm run dev` it is picked
> up on the next request. A key typed into Settings applies immediately.

### Deploy

Everything except the proofreader is static, so the app deploys anywhere Node is
available — Vercel, Netlify, Cloudflare Pages, or any static host:

```bash
npm run build
npx serve out     # if you export static, or just deploy the Next build
```

On Vercel: import the repo, keep the defaults (framework preset *Next.js*) and add
`GEMINI_API_KEY` under *Settings → Environment Variables* if you want **Fix with AI**.
A fully static export (`output: "export"`) drops `POST /api/proofread`; the diary
itself keeps working, and the button reports that no server is available.

---

## 🧭 Architecture

```
src/
├── app/               # Next.js App Router entry (layout, page, icon) + api/proofread
├── components/
│   ├── animations/    # Framer Motion primitives (FadeIn, Stagger…)
│   ├── calendar/      # Monthly calendar view
│   ├── cards/         # EntryCard, StatCard, FavoriteButton
│   ├── dialogs/       # ConfirmDialog, ShortcutsDialog
│   ├── editor/        # The writing experience (editor, mood picker, prompts)
│   ├── illustrations/ # Hand-drawn-style diary SVG
│   ├── layout/        # Sidebar, header, mobile nav, app shell
│   ├── search/        # Search bar + mobile search sheet
│   ├── settings/      # Settings dialog (appearance, writing, data)
│   ├── stats/         # Insights view, heatmap
│   ├── theme/         # Theme switcher
│   ├── timeline/      # Journal view
│   └── ui/            # shadcn-style primitives (button, dialog, sheet…)
├── hooks/             # useDiary (state engine), useProofread (AI stream), autosave, shortcuts, stats…
├── lib/               # storage, dates, stats, search, export, quotes, bus, ai/proofread
├── constants/         # moods, themes, settings defaults, shortcuts
├── styles/            # Design tokens (all 6 themes), fonts, base styles
└── types/             # Shared TypeScript types
```

### Data model

```ts
interface DiaryEntry {
  id: string;          // uuid
  date: string;        // local calendar day, "yyyy-MM-dd"
  title: string;
  content: string;
  mood: MoodId | null; // happy · calm · loved · sad · angry · tired · excited · anxious
  favorite: boolean;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

interface DiarySettings {
  theme: "aurora" | "ocean" | "forest" | "lavender" | "sunset" | "midnight";
  fontSize: "sm" | "md" | "lg";
  compact: boolean;
  autosaveMs: number;  // 1000 | 2000 | 5000 | 10000
  lastBackupAt: string | null; // ISO time of the last backup download
  backupReminderDays: number;  // 1 | 3 | 7 | 14 | 30, or 0 to switch reminders off
  geminiApiKey: string;        // optional personal key for "Fix with AI" ("" = use the server's)
}
```

### Storage

Everything lives in `localStorage` under two keys:

| Key                    | Contents                  |
| ---------------------- | ------------------------- |
| `inkwell.entries.v1`   | `DiaryEntry[]` (one per day) |
| `inkwell.settings.v1`  | `DiarySettings`           |

Reads are defensive: corrupt or unknown values are ignored, invalid entries are
dropped, and entries are de-duplicated by date (last write wins). Writes are
debounced and a final flush happens on `beforeunload`.

> **Privacy** — your diary never leaves the device unless you press **Fix with
> AI**, which sends the open page to Gemini and nothing else. Export a JSON
> backup if you want to move browsers.

---

## 🎨 Design system

- **Type**: [Inter](https://fonts.google.com/specimen/Inter) (UI/body), [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) (headings), [DM Serif Display](https://fonts.google.com/specimen/DM+Serif+Display) (brand/accents). All fonts are **self-hosted** via Fontsource — no runtime font requests.
- **Colour**: every theme is a set of CSS custom properties (HSL triplets) — background, card, text, muted, accent, secondary, ring. Switching theme is a single `data-theme` attribute swap with a smooth cross-fade.
- **Motion**: 200–350 ms fades/slides/scales with a consistent spring easing `cubic-bezier(0.22, 1, 0.36, 1)`; `MotionConfig reducedMotion="user"` plus a global `prefers-reduced-motion` media query.
- **Surfaces**: soft shadows, 12–28 px radii, glassmorphism on sticky chrome, gradient hairline dividers, a subtle film-grain overlay.

### Moods

| Mood | Emoji | Colour |
| ---- | ----- | ------ |
| Happy | 😊 | gold |
| Calm | 😌 | sage |
| Loved | ❤️ | rose |
| Sad | 😔 | dusty blue |
| Angry | 😡 | terracotta |
| Tired | 😴 | mauve |
| Excited | 🤩 | amber |
| Anxious | 😨 | periwinkle |

---

## ⌨️ Keyboard shortcuts

| Keys                | Action                |
| ------------------- | --------------------- |
| `⌘/Ctrl + S`        | Save now              |
| `⌘/Ctrl + F`        | Search pages          |
| `⌘/Ctrl + 1` … `4`  | Today / Journal / Calendar / Insights |
| `⌘/Ctrl + D`        | Star / unstar page    |
| `?`                 | Shortcut cheat sheet  |
| `Esc`               | Close dialogs · clear search |

---

## 💾 Backups

Your diary lives only in this browser, so **Settings → Backups** keeps a copy
within reach:

- **Back up now** writes one lossless JSON file (`inkwell-backup-<date>.json`)
  with every page, mood and star, and stamps `lastBackupAt`.
- **Remind me to back up** picks a cadence — daily, 3 days, weekly, fortnightly,
  monthly, or never. When a reminder is due, a card appears at the bottom of the
  sidebar (and in the mobile menu) with a one-click download and a **Not now**
  to wave it away for the session.
- A reminder only fires when pages actually **changed since the last backup** —
  and for a first-time backup, only once your oldest page is older than the
  cadence, so day one is quiet.
- **Restore** with **Import** below: *Merge* keeps your current pages (imported
  pages win conflicts), *Replace* erases everything first.

## 📤 Export & import

- **JSON** — the complete diary (`{ app, version, exportedAt, entries }`), lossless round-trip.
- **Markdown** — one file with `# Title`, date, mood and content per page.
- **Plain text** — a readable, portable transcript.
- **Import (JSON)** — choose **Merge** (keeps current pages; imported pages win conflicts) or **Replace** (erases everything first).

Import validation is strict: malformed files, invalid dates and unknown moods are
rejected or ignored, and a confirmation screen shows exactly what was found.

---

## ♿ Accessibility & performance

- Semantic landmarks, labelled icon buttons, `aria-pressed`/`aria-current` state, `role="radiogroup"` mood & settings controls, skip-to-content link.
- Visible focus rings everywhere; full keyboard operability.
- Reduced-motion honours both the OS setting and a manual toggle path.
- Views are lazy-loaded (`next/dynamic`), derived data is memoised, storage writes are debounced, and the editor keeps a local buffer so typing never re-renders the rest of the app.

---

## 📄 License

MIT — use it, learn from it, make something beautiful.
