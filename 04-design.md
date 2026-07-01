# 04 — Design Spec

The brief pins the direction: **minimal, calm, Notion-like.** So the work here is precision, not flash — disciplined spacing, a restrained palette, and clean type. Spend any boldness in exactly one place (see "Signature") and keep everything else quiet.

## Identity in one line

A quiet, paper-like workspace where the content (your writing and your tasks) is the loudest thing on screen. Chrome recedes; text and cards lead.

## Color tokens

A near-neutral base with a single accent. These are starting values — easy to retheme by swapping the accent.

| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#FBFBFA` | App background (warm off-white, like Notion). |
| `--surface` | `#FFFFFF` | Cards, panels, editor surface. |
| `--border` | `#EAEAE8` | Hairline borders and dividers. |
| `--text` | `#1F1F1D` | Primary text. |
| `--text-muted` | `#7A7A75` | Secondary text, metadata, placeholders. |
| `--accent` | `#4F46E5` | Primary actions, focus rings, active sidebar item (calm indigo). |
| `--accent-soft` | `#EEF0FF` | Accent backgrounds (selected row, hover on active item). |

**Status colors** (used as small dots/chips, not loud fills):
- Not Started → `#9AA0A6` (gray)
- In Progress → `#D9912B` (amber)
- Done → `#2E9E6B` (green)

**Priority colors** (small left-edge marker or chip):
- Low → gray `#9AA0A6` · Medium → blue `#3B82F6` · High → red `#E0533D`

Provide an optional dark theme later; v1 can ship light-only. If you add dark mode, keep the same restraint (true-neutral grays, same accent).

## Typography

- **UI / body:** **Inter** (system-ui fallback). Clean, neutral, excellent for dense UI.
- **Editor body:** Inter as well, slightly larger line-height for comfortable reading/writing (e.g. 1.7).
- Optional **display** accent for empty-state headlines only: a slightly characterful grotesque or a humanist serif used sparingly. Don't let it leak into the chrome.
- **Monospace:** `ui-monospace, "JetBrains Mono", monospace` for code blocks and inline code.

**Type scale (suggested):** 12 (meta), 13 (labels), 14 (UI default), 16 (editor body), 20 (project title), 28 (empty-state headline). Weights: 400 body, 500 labels/buttons, 600 titles.

## Layout

```
┌───────────────┬─────────────────────────────────────────────┐
│  SIDEBAR      │  MAIN / CANVAS                               │
│  (collapsible)│                                             │
│               │  📁 Project name                [Board|Table]│
│  Task Tracker │  ───────────────────────────────────────────│
│               │                                             │
│  📁 VNDP      │   (Board: 3 status columns of cards)        │
│  🚀 WordPunk  │     Not Started │ In Progress │ Done         │
│  + New project│       [card]    │   [card]    │  [card]      │
│               │       [card]    │             │              │
│  ─────────    │                                             │
│  People       │   (Project canvas: Markdown editor below    │
│  Settings     │    or in a "Notes" tab — implementer's call)│
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

- **Sidebar:** ~240px expanded, ~56px collapsed (icons/emoji only). Subtle right border (`--border`). Active project gets `--accent-soft` background and `--accent` text. Drag handle appears on hover for reordering. A collapse toggle at the top.
- **Main:** generous horizontal padding (e.g. 32–48px on desktop, 16px on mobile), max content width ~960px for the canvas so long Markdown stays readable.
- **Project header:** emoji + editable name on the left; the **Board/Table toggle** on the right.

## Components & states

- **Project card (board):** white surface, 1px `--border`, ~10px radius, generous padding. Shows title (1–2 lines), a row of assignee emoji/initial chips, due date (muted; turn red if overdue), and a small priority marker. Subtle shadow on drag.
- **Column header:** status name + count, with the status color dot.
- **Table row:** quiet zebra-free rows separated by hairlines; hover highlights with `--accent-soft`; status/priority/assignees editable inline.
- **Editor:** looks like a clean document — no heavy borders. Slash menu styled minimally. Checkboxes are real, clickable. Tables get light hairline borders.
- **Buttons:** primary = `--accent` fill, white text, 500 weight; secondary = transparent with `--border`. Sentence case labels.
- **Inputs/pickers:** minimal, 1px border, focus ring in `--accent`.
- **Emoji picker:** for projects and people.

**Empty states** (an invitation to act, in the interface's voice):
- No projects: headline "Nothing here yet." + "Create your first project to start tracking work." + a **New project** button.
- Empty board column: a faint "Drop tasks here" / "+ Add task."
- No people beyond yourself: "It's just you so far. Teammates appear here once they sign up."

**Loading:** quiet skeletons or a small spinner; never a blank flash.
**Errors:** plain and specific, in the UI's voice. e.g. "Couldn't save your changes. Check your connection and try again." Never vague, never an apology.

## Motion (restrained)

- Card drag: smooth lift + drop (dnd-kit defaults are fine).
- Sidebar collapse: a quick width transition (~150ms).
- Saving indicator: a subtle fade between "Saving…" and "Saved."
- Respect `prefers-reduced-motion`.

## Signature (the one memorable thing)

Make the **writing canvas** feel exceptionally calm and book-like: comfortable measure, soft paper background, roomy line-height, and a saving state so gentle it's almost unnoticed. The product should feel like a quiet place to think — that's the single impression to nail. Everything else stays utilitarian.

## Quality floor (non-negotiable)

- Responsive down to a phone (sidebar becomes a drawer; board columns scroll horizontally or stack).
- Visible keyboard focus on every interactive element.
- Sufficient color contrast for text and status indicators.
- No layout shift when data loads.

## Writing the words (UI copy)

- From the user's side of the screen: name things by what people do ("New project", "Add task", "Assign"), not by how it's built.
- Active voice; the button says what happens ("Save changes", then a "Saved" confirmation — same verb).
- Sentence case throughout. Plain verbs, no filler.
- Labels label, examples demonstrate; nothing does double duty.
