# Inkwell — a private diary

> A calm, handcrafted diary. Write today's page, keep your moods, streaks and memories.
> No account. No cloud. No database. Just you, a page, and your words.

Inkwell is a premium personal-diary web app that feels like opening your favourite
notebook: warm paper, ink, generous whitespace and quiet, deliberate motion. Everything
is stored in your browser's LocalStorage and the entire app works offline.

Built with **Next.js 15**, **React 19**, **TypeScript**, **TailwindCSS**, **Framer Motion**
and **shadcn/ui**-style components, with an optional **Google Gemini** (`@google/genai`,
streaming) proofreading feature.

---

## ✨ Features

- **One page per day** — opening the app drops you straight onto today's page. No buttons, no ceremony.
- **Distraction-free writing** — a large auto-expanding editor with serif title, rotating writing prompts, a glowing caret and nothing else between you and the page.
- **Autosave** — your words are saved on a gentle cadence (default every second), when the tab hides, and on close. Nothing is ever lost.
- **Moods** — eight feelings, each with its own colour that quietly tints the page you're writing on.
- **Journal timeline** — all pages grouped by month, newest first, with previews, word counts and reading time.
- **Instant search** — across titles, content and even dates ("july", "Tuesday"), with live filtering.
- **Favourite pages** — star the ones that matter; they get their own sidebar section.
- **Calendar** — a monthly view with mood-coloured dots; click any day to open (or start) its page.
- **Insights** — total pages, current & longest streaks, words, characters, favourite mood, a monthly bar chart and a year-long writing heatmap.
- **Six handcrafted themes** — Aurora, Ocean, Forest, Lavender, Sunset and Midnight — each with a light and dark variant.
- **Dark mode** — light / dark / system, independent of the palette.
- **Export & import** — JSON, Markdown and plain text export; JSON import with merge or replace.
- **AI proofreading (optional)** — the ✨ “Fix writing” button sends the page to Google Gemini, which streams back a faithful, corrected draft live. Review it, then apply, copy, or dismiss. Requires a free Gemini API key that you add in Settings; it is stored on this device and only used when you ask.
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
```

> **Node 18.18+** required. No environment variables, no backend. The optional
> “Fix writing” feature works with your own Gemini API key, entered in
> Settings → AI proofreading (a free one from [aistudio.google.com](https://aistudio.google.com/api-keys)).

### Deploy

The app is fully static and deploys anywhere Node is available — Vercel, Netlify,
Cloudflare Pages, or any static host:

```bash
npm run build
npx serve out     # if you export static, or just deploy the Next build
```

On Vercel: import the repo and keep the defaults (framework preset *Next.js*).

---

## 🧭 Architecture

```
src/
├── app/               # Next.js App Router entry (layout, page, icon)
├── components/
│   ├── animations/    # Framer Motion primitives (FadeIn, Stagger…)
│   ├── calendar/      # Monthly calendar view
│   ├── cards/         # EntryCard, StatCard, FavoriteButton
│   ├── dialogs/       # ConfirmDialog, ShortcutsDialog
│   ├── editor/        # The writing experience (editor, mood picker, prompts,
│   │                  #   proofread panel)
│   ├── illustrations/ # Hand-drawn-style diary SVG
│   ├── layout/        # Sidebar, header, mobile nav, app shell
│   ├── search/        # Search bar + mobile search sheet
│   ├── settings/      # Settings dialog (appearance, writing, data)
│   ├── stats/         # Insights view, heatmap
│   ├── theme/         # Theme switcher
│   ├── timeline/      # Journal view
│   └── ui/            # shadcn-style primitives (button, dialog, sheet…)
├── hooks/             # useDiary (state engine), useProofread (Gemini stream), shortcuts…
├── lib/               # storage, dates, stats, search, export, quotes, bus, gemini
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
  geminiApiKey: string; // optional — empty turns the AI proofreader off
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

> **Privacy** — your diary never leaves the device. The single exception is the
> optional “Fix writing” button: when you press it, that one page's text is
> sent to Google Gemini to be proofread (streamed back live, and only written
> back after you apply it). The API key itself is stored locally like
> everything else. Export a JSON backup if you want to move browsers.

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

## 📤 Export & import

- **JSON** — the complete diary (`{ app, version, exportedAt, entries }`), lossless round-trip.
- **Markdown** — one file with `# Title`, date, mood and content per page.
- **Plain text** — a readable, portable transcript.
- **Import (JSON)** — choose **Merge** (keeps current pages; imported pages win conflicts) or **Replace** (erases everything first).

Import validation is strict: malformed files, invalid dates and unknown moods are
rejected or ignored, and a confirmation screen shows exactly what was found.

---

## ✨ AI proofreading ("Fix writing")

- The wand button in the editor header sends the page's title and body to Google
  Gemini (`gemini-3.8-flash`) with a strict guardrail: fix spelling, grammar,
  punctuation and awkward phrasing — but never change the meaning, tone or
  author's ideas.
- The corrected draft **streams in live** in a preview panel (with a blinking
  caret and a Stop button). Nothing is written back until you press
  **"Use this version"** — or copy it, or dismiss it.
- Works on a title, a body, or both; the title is fixed in the same pass and
  the reply is parsed back into the two fields.
- The key is optional and stored locally. With no key the button opens Settings.
- The model name is a single constant in `src/constants/gemini.ts` — swap it when
  a newer model ships.

---

## ♿ Accessibility & performance

- Semantic landmarks, labelled icon buttons, `aria-pressed`/`aria-current` state, `role="radiogroup"` mood & settings controls, skip-to-content link.
- Visible focus rings everywhere; full keyboard operability.
- Reduced-motion honours both the OS setting and a manual toggle path.
- Views are lazy-loaded (`next/dynamic`), derived data is memoised, storage writes are debounced, and the editor keeps a local buffer so typing never re-renders the rest of the app.

---

## 📄 License

MIT — use it, learn from it, make something beautiful.
