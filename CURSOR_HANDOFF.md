# Keep — Handoff Doc for Cursor

## What this app is

Mike has three existing personal apps: **For The Record** (journal with archive/search/mood themes), **For The Ages** (chapters, "My Book" export, AI interviewer "Georgia," narrator voice playback), and **3 Word Journal** (AI Suggested vs Manual toggle, tags, searchable headline + body).

This project, internally named **Keep**, is a v1 prototype that combines the parts of those three apps Mike actually wants, into one app:

- Daily prompt journaling (a deterministic question-of-the-day, type your answer)
- Ambient capture: hit record, talk, get a transcript, then decide if it was a personal thought or a work/meeting note
- AI does the busywork: turns raw text into a headline + tags, with a manual override always available (the "AI Suggested / Manual" toggle pattern from 3 Word Journal)
- One searchable archive for everything, journal and meeting notes together, filterable by kind and tag, grid or list view (modeled on For The Record's archive)

**Explicitly deferred for v1** (don't build these unless asked):
- Book/Chapter export ("My Book" from For The Ages)
- TTS / narrator voice playback
- Multi-device sync or any real backend database
- Any kind of account system or auth

Keep v1 is intentionally a single-user, browser-local prototype. The point was to get something real and clickable fast, not to build the final architecture.

## Current tech stack

- **Next.js 14.2.5**, App Router, TypeScript
- **Tailwind CSS** for styling
- **localStorage** for persistence — there is no database. Everything lives in the browser under the key `keep_entries_v1`. This means entries do not sync across devices or browsers. That's a known, accepted limitation of v1, not a bug.
- **OpenAI API** — `gpt-4o-mini` for headline/tag generation (JSON mode), `whisper-1` for audio transcription. One API key (`OPENAI_API_KEY`) covers both; there's no Anthropic key in this build, that idea was discussed and dropped in favor of keeping a single provider.
- Browser `MediaRecorder` API for mic capture, sent to a Next.js API route as `FormData`.

## File structure (what exists today)

```
app/
  layout.tsx              — root layout, "Keep" header, bottom NavBar
  globals.css             — dark theme base styles
  page.tsx                — the main Capture screen (see "Capture flow" below)
  archive/page.tsx         — search/filter/grid-list archive view
  api/generate/route.ts    — POST: {text, kind} -> {headline, tags} via gpt-4o-mini
  api/transcribe/route.ts  — POST: FormData audio -> {text} via whisper-1
components/
  NavBar.tsx               — bottom tab bar: Capture / Archive
  EntryCard.tsx            — renders one entry in the archive list/grid
  Recorder.tsx             — mic capture UI, MediaRecorder, posts to /api/transcribe
lib/
  types.ts                 — Entry type definition
  storage.ts               — localStorage get/save/delete, allTags(), getTodaysPrompt()
package.json / tsconfig.json / tailwind.config.js / postcss.config.js / next.config.js
.env.local                — OPENAI_API_KEY (gitignored, not in the repo)
```

### Entry data shape (`lib/types.ts`)

```ts
type EntryKind = "journal" | "meeting";
type EntrySource = "prompt" | "ambient" | "manual";
interface Entry {
  id: string;
  createdAt: string;
  kind: EntryKind;
  source: EntrySource;
  rawText: string;
  headline: string;
  tags: string[];
  aiGenerated: boolean;
  promptQuestion?: string;
}
```

### Capture flow (`app/page.tsx`)

Two top-level modes, toggled by pill buttons: **Daily Prompt** and **Record**.

- **Daily Prompt**: shows a deterministic prompt-of-the-day (hashed from today's date, see `getTodaysPrompt()` in `lib/storage.ts`, 7 prompts in rotation), a textarea, then the AI Suggested/Manual toggle, then Continue.
- **Record**: shows the `<Recorder>` component (tap to record, stop, auto-transcribes via `/api/transcribe`) with a manual type/paste textarea as a fallback if mic access fails or the user just prefers typing. Once there's text, it advances to a **fork** step: "Was this personal or work?" — this sets `kind` to `journal` or `meeting`. Then the same AI Suggested/Manual toggle, then Continue.
- Both paths converge on a **review** step: editable headline + tags fields, raw text shown below, Save Entry button. AI mode calls `/api/generate`; Manual mode just truncates the raw text as a starting headline with no tags.
- Save builds an `Entry`, writes it via `saveEntry()`, redirects to `/archive`.

### Archive (`app/archive/page.tsx`)

Search box (matches headline + body + tags), kind filter (all/journal/meeting), tag filter (populated from `allTags()`), grid/list toggle, renders `<EntryCard>` per entry, empty state copy: "Nothing here yet. Go capture something."

### Design system

Dark, warm aesthetic pulled directly from screenshots of the three source apps:

- `ink` `#1A1A1A` — background
- `paper` `#F5EFE3` — primary text
- `card` `#241F14` / border `#3a3324` — input and card surfaces
- `amber` `#C7943C` / `amberlight` `#E0B468` — accent, active states, primary buttons
- Headlines use a serif font (Georgia stack); body UI uses system sans-serif.

There's also a static HTML mockup (`keep-app-preview.html`, not part of the Next.js app) that demonstrates this same look with fake data, useful as a visual reference if you need to eyeball the intended design without running the app.

## Current state / what's broken right now

The code builds cleanly (`npm run build` compiles, all 7 routes generate with no errors). It's pushed to GitHub at `liquidgolf-cmd/journal-app` (branch `master`) and connected to a Vercel project also named `journal-app`.

**The last production deployment failed**, not because of the code, but because of Vercel project configuration:

```
Error: No Output Directory named "public" found after the Build completed.
Configure the Output Directory in your Project Settings.
```

This means the Vercel project's Framework Preset / Output Directory override is set wrong for a Next.js app (likely defaulted to a static-site preset expecting a `public` folder instead of using Next.js's own `.next` output). **Fix needed in the Vercel dashboard, not in code**: Project → Settings → Build and Deployment → set Framework Preset to "Next.js" and clear any custom Output Directory value, then redeploy.

Also still outstanding:
- `OPENAI_API_KEY` needs to be added in Vercel → Settings → Environment Variables (Production, and Preview if you want preview deploys to also work). It's in `.env.local` locally but that file is gitignored on purpose and never made it to Vercel.
- `next@14.2.5` has a known security advisory flagged in the build logs (see https://nextjs.org/blog/security-update-2025-12-11). Worth bumping to a patched 14.x version before this goes anywhere near real use, shouldn't require code changes, just a dependency bump and a rebuild.
- Once live, the mic recording flow specifically needs a real test (HTTPS + browser permission prompt + actual round trip through `/api/transcribe`), it's only been verified in local build, not against a live deployment.

## What I'd want you to do next

1. Fix the Vercel project settings issue above and confirm a clean production deploy.
2. Bump `next` to the latest patched 14.x and re-verify the build.
3. Smoke-test all three flows on the live URL: Daily Prompt save, Record → transcribe → fork → save, and Archive search/filter.
4. After that's solid, treat this as a real v1 and start iterating, performance, edge cases (empty states, long recordings, failed transcriptions), and eventually the bigger open questions Mike hasn't decided yet: whether to add a real backend/sync (currently localStorage-only, single device), and whether/how to bring back Book export or narrator voice from the other two apps later. Don't build either of those without explicit confirmation, they were intentionally cut from v1 scope.
