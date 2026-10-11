# CLAUDE.md — Elke Dag Zin

A Flemish (Belgian Dutch) learning app for one learner (Ari, Antwerp, A2 → C1). It is hosted on **GitHub Pages** as a full-screen Home Screen app for iPhone. Conversation practice happens in a **Claude Project** (Elke Dag Zin · Praten) and comes back into the app as a pasted report. Read `SPEC-2.0.md` first, then `FORMATS.md` and `REFERENCE.md`.

## How the code is built
- Source parts live in `src/`: `content*.js` (curriculum data), `app*.js` (engine and views), `style.css`.
- `python3 build.py` concatenates them in a fixed order into **`index.html`** at the repo root, the file Pages serves. Keep it one self-contained page, plus `manifest.webmanifest`, `sw.js` and icons.
- **No frameworks, no bundler, no runtime dependencies.** Plain JS, functions declared at top level. A later part may redefine an earlier function on purpose (last declaration wins); note it in a comment when you do.
- Content ids (`u7`, `u7q2`, `u7s14`, word ids) **never change**: saved progress refers to them.

## Standing rules (from Ari, apply to every change)
1. **Locking:** squares and towns open in order. A locked square or town offers a **test-out**. **Testmodus** (switch in Ik) opens everything for testing.
2. **Flashcards are welcome but never the default.** The default practice is sentences, in context.
3. **Interface labels are Dutch**; long-press shows English (`data-en`).
4. **Colour carries meaning, white UI:**
   - green = tappable (filled green = the next step)
   - blue = *de*, red = *het*
   - gold = the verb (slot 2 and the verb end)
5. **Dutch-first definitions**; every noun shows *de/het*; verbs have full conjugation overviews.
6. **The app teaches itself:** first-run tour (only on first use, with a switch to show it again), one-time tips per screen (with a switch), and a short "Zo werkt het" on every exercise type.
7. **Core unit** = one grammar point × one Antwerp theme × one can-do. Every square has the same five guild houses, which are five different skills: Ontdek, Oefen, Lees, Luister, Gebruik.
8. Standard **Belgian Dutch** norms in all content.
9. Map style: retro pixel world, cyclist protagonist, curving roads, natural features, not overcrowded.

## Before you commit
- `node tests/validate.js`: every generated exercise must accept its own answer (currently 4,542, 0 failures). Every reorder variant must be valid Dutch.
- `node tests/flows.js`: Playwright run through tour → Pad → square → session → Woorden/Kaarten → Naslag search → Praten start block → report import → backup/restore. It fails on any page error.
- `node tests/report.js`: the report parser on the fixtures in `tests/reports/`. These cover a valid report, smart quotes, extra text around the block, a missing end marker, unknown square ids, words already known, and invalid JSON (must show a friendly error, never crash).
- Look at the screens you changed at 390×844 (iPhone). Check the safe areas at top and bottom.
- Rebuild `index.html` and commit it together with `src/`.

## Things to avoid
- No `window.claude` calls. Version 2.0 has no Claude inside the page; Claude is in the Project.
- Don't put API keys anywhere in the repo.
- Don't let a content edit change existing ids. Add new items with new ids.
- Don't make the Scroll feed, flashcards or the map slow down opening the app.
