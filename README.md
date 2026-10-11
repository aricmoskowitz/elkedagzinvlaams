# Elke Dag Zin

A Flemish (Belgian Dutch) learning app: sentences in context, a retro pixel map from A2 to C1, reviews, word cards and a reference. It runs as a full-screen Home Screen app on iPhone from GitHub Pages, works offline, and keeps its data on the phone. Speaking, the journal and photos of class notes happen in a Claude Project (*Elke Dag Zin · Praten*) and come back into the app as a pasted report.

- App: https://aricmoskowitz.github.io/elkedagzinvlaams/ (once Pages is on)
- Start here: `SPEC-2.0.md`, then `FORMATS.md`, `REFERENCE.md` and `CLAUDE.md` (build rules)
- Moving from the claude.ai version: `MIGRATION.md`
- The Claude Project's files: `praten-project/`

## Build and test

```
python3 build.py          # src/ → index.html, manifest.webmanifest, sw.js
npm install               # Playwright, for the tests only
node tests/validate.js    # every exercise accepts its own answer
node tests/flows.js       # the app end to end, offline and install checks
node tests/report.js      # report import and start block
```
