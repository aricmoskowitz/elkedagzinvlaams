# SPEC 2.0 — Elke Dag Zin on GitHub Pages + a Claude Project for speaking

Status: approved direction (Option 2), 2026-10-11. Source of truth for the 2.0 build. Companion docs: `FORMATS.md` (the two copy-paste blocks), `REFERENCE.md` (terms, data model, sizing), `CLAUDE.md` (build rules), `MIGRATION.md` (moving Ari's data).

## 1. Why
Version 1.5 runs as a claude.ai artifact. On iPhone it always shows Safari's "Open in Claude" banner, the claude.ai header and Safari's toolbar, which waste space and feel like a web page. Ari's other learning apps run from GitHub Pages as full-screen Home Screen apps. Speaking practice is better in the Claude app itself (voice mode, photos of class material) than inside the page.

**Decision:**
- The practice app moves to **GitHub Pages**: full screen, offline, data on the phone.
- Conversation, journaling and photo processing move to a **Claude Project**.
- The two talk through two copy-paste blocks (`FORMATS.md`).

## 2. What stays (port as is from 1.5)
- **Pad:**
  - retro world map (curving roads, lake, river, fields, mountain pass), town maps with three squares and a Grote Markt, square scene with five guild houses, cyclist
  - floating next-step card, Herhalen and Scroll links
- **Squares:** Ontdek (rule, frames, words), Oefen (checkpoint 80%, Ronde 2 and Ronde 3), Lees (text + 3 questions), Luister, test-out, locking + Testmodus.
- **Grote Markt** per town: mixed review (80%) + field mission. Its Praten and Schrijven lines become start-block buttons (§4).
- **Review scheduler** (SM-2 style, daily cap), correction cards (`c:`), added-topic sentences (`e:`).
- **Woorden tab:**
  - word list, verbs and sets
  - word facts per type (noun: de/het, meervoud, verkleinwoord · verb: ik/jij/wij now, ik/wij past, voltooid deelwoord, tegenwoordig deelwoord · adjective: vergrotende and overtreffende trap), all with Dutch definition and example
  - flashcards: simple or full, front NL/EN/mixed, swipe right = known, left = not yet
  - tap any word in a sentence to see it or add it (`quickAdd`)
- **Naslag tab:** the full curriculum as Boog → Stad → Plein, with grammar per town, rule, examples and words per square, and search.
- **Ik tab:** stats, eight skills, week bar, Toen en nu, settings (open in Scroll/Pad, tour, tips, Testmodus, voice, speed, daily cap), backup.
- Placement **review screen** (`openProc`): items grouped by Boog · Stad · Plein, tick to keep. In 2.0 it is fed by an imported report.

## 3. What leaves
- Everything that calls `window.claude`:
  - `Store.connect` with db/user and the sharded documents (app1/app11)
  - the `AI` object and the usage meter (app9/app12)
  - the in-app tutor (`startTalk`/`sendTalk`/`endTalk`), log processing, in-app writing correction, `draftWord`, *Zeg het anders*, *Vraag Claude*
- The Logboek screens: the Project's **dagboek** and **foto** modes replace them. Old log entries stay readable in *Toen en nu* and the history.
- The `downloads` capability: replaced by the browser's file download and share sheet.

## 4. What's new
### 4.1 Home Screen app
- `manifest.webmanifest`: `name` "Elke Dag Zin", `short_name` "Dagzin", `display: standalone`, `background_color` and `theme_color` white, icons 180/192/512 (the red pixel guild house) plus a maskable 512.
- `<meta name="apple-mobile-web-app-capable" content="yes">`, `apple-mobile-web-app-status-bar-style: default`, `viewport-fit=cover`. Pad the top and the tab bar with `env(safe-area-inset-*)`.
- `sw.js`: cache-first for `index.html`, manifest and icons. Bump the cache name on every release. Show a small "Nieuwe versie — herlaad" toast when an update is waiting.
- Google Fonts are optional: system fallbacks must look fine offline.

### 4.2 Storage and backup
- **Storage:**
  - one JSON state in `localStorage` key `edz.v2`, with a `migrate()` that accepts the 1.5 state shape unchanged
  - call `navigator.storage.persist()` on first run
  - write on every change (debounced 800 ms)
- **Backup (Ik):**
  - *Bewaar back-up* uses the share sheet (`navigator.share` with a `.json` file) when available, else downloads it
  - *Zet back-up terug* reads a file, accepts both 1.5 and 2.0 backups, and confirms first
  - *Kopieer als tekst* is a fallback
  - a quiet reminder appears on Pad after 14 days without a backup
- Future (not 2.0): optional sync through a private GitHub Gist.

### 4.3 Praten in Claude (start block)
Entry points:
- a **"Praten in Claude"** line on Pad (under Herhalen and Scroll)
- the **Gebruik** house of each square (opens straight in *opdracht* for that square)
- the Grote Markt (*opdracht* for the town)

The sheet:
- **Mode:** Onderwerp · Opdracht · Dagboek · Foto
- **Instellingen:** vertaling ja/nee · verbeteren per beurt / op het einde · beurten 6–8 / 8–10 / 12–15. Remembered.
- **Kopieer startblok:** builds `EDZ-START v1` from the current state (`FORMATS.md` §1) and copies it.
- **Open Claude:** a link to the Project. Its URL is stored in settings on first use: "Plak de link van je Claude Project".
- A one-line how-to: paste the block in a new conversation in the Project, then turn on voice if you like.

How the fields are built:
- `niveau` and `focus` come from `nextSquare()`.
- `recent` holds words first seen in the last 14 days (`S.seen` timestamps, new in 2.0) plus custom words.
- `zwak` holds open corrections (`S.fix`) grouped by `plan` with counts.
- For opdracht, `scène` and `doel` come from `SCENARIOS` / town goal. Each scene gets a `doel` field (measurable), added to content.

### 4.4 Report import
- **"Verslag plakken"** on Pad opens a sheet with a large text area and *Plak* (clipboard read when allowed) and *Verwerk* buttons.
- **Parser:**
  - find `EDZ-VERSLAG v1` … `EDZ-EINDE`
  - replace smart quotes, strip code fences, `JSON.parse`
  - validate fields: unknown square ids become `null` (Algemeen), and words already in the app are dropped
  - show a friendly Dutch error on failure, with what to ask Claude ("Vraag Claude: ‘geef het verslag opnieuw als geldige JSON’")
- **Then:** open the existing review screen (`openProc`) with `src: modus`. On save:
  - corrections → `S.fix` with `plan` (+ review cards)
  - words → `S.custom` with `plan` (+ set "Uit Claude – week N")
  - newTopic → added squares (`S.extras`)
  - `goed` → `sic` / pull reviews forward
  - `tekst` → a log entry (history)
  - `samenvatting` → `S.talks` history
  - opdracht with `doelBereikt` → that square's **Gebruik** house done (or the Grote Markt's Praten line)
- **Duplicates:** importing the same report twice is detected by a hash of the JSON and refused.

### 4.5 Documents for the Project (Ik → "Documenten voor Claude")
- Generates `Curriculum.md`, `Woorden.md` and `Scenes.md` from the app's data, the same generator that produced the first versions. `Woorden.md` includes Ari's own words.
- Each can be shared/downloaded. A note says to re-upload them to the Project after new towns are built or every month.

### 4.6 Tabs
Pad · Woorden · Naslag · Ik. Default start view: **Scroll** (setting: Scroll / Pad). No Vandaag or Praten tab: Praten lives in the Claude Project and enters the app through 4.3/4.4.

## 5. Data model changes (2.0)
- `S.v = 3`. New fields:
  - `S.seenAt` (word id → day number)
  - `S.imports` (hashes of imported reports)
  - `S.settings.projectUrl`, `S.settings.praten` (`{mode, vertaling, verbeteren, beurten}`)
  - `S.settings.lastBackup`
- Removed at runtime: `Store` db code and shards. `S.usage` is kept in backups but unused.
- Everything else keeps its shape, so a 1.5 backup restores without conversion.

## 6. Acceptance criteria
1. Added to the Home Screen from Safari, it opens full screen with no browser bars. The tab bar sits above the home indicator, and nothing hides under the notch.
2. It works in airplane mode after the first visit.
3. A 1.5 backup restores fully: progress per square, review items, custom words, sets, corrections with places, Grote Markt scores, settings.
4. "Praten in Claude" produces a valid `EDZ-START v1` for all four modes.
5. The example report in `FORMATS.md` imports and shows the review screen grouped by place. Saving adds 3 corrections (one under a new topic), 1 word and marks u7q2 *Gebruik* done.
6. Broken reports never crash and show a helpful message.
7. All exercise validation passes and there are no page errors in the flow test.
8. Lighthouse PWA "installable" passes. Page weight is under 1 MB without fonts.

## 7. Build order for Claude Code
1. Repo skeleton: `src/` (copied 1.5 parts), `build.py` → `index.html`, `tests/`. Pages enabled on `main` / root.
2. Strip `window.claude`: replace Store with local storage + backup, and delete the AI paths. Keep `openProc`.
3. Manifest, service worker, icons, safe areas.
4. Start block (4.3) and report import (4.4) with fixtures.
5. Documents for Claude (4.5).
6. Migration screen: first run offers "Zet je back-up uit de oude app terug" (see `MIGRATION.md`).
7. Tests, screenshots, release.
