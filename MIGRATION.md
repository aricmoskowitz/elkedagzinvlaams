# MIGRATION — from the claude.ai artifact (1.5) to GitHub Pages + Claude Project (2.0)

## A. Set up the Claude Project (10 minutes, on phone or computer)
1. In Claude, create a new Project called **Elke Dag Zin · Praten**.
2. Open `Instructions.md`, copy everything below the line, and paste it into the Project's **custom instructions**.
3. Add these files to the Project's knowledge:
   - `Curriculum.md`
   - `Woorden.md`
   - `Scenes.md`
   - `Formats.md`
   - `Ik.md`
4. **Test:** start a conversation in the Project, paste the start block below, talk for 4–5 turns in voice mode, then say *klaar*. Check that a summary and a valid `EDZ-VERSLAG v1` block come back. If voice mode reads the JSON aloud, end voice mode before saying *klaar*, or say it in text.

```
EDZ-START v1
modus: onderwerp
niveau: A2 · Boog 1 · Stad 7 Waaromberg (u7) · Plein 1 Omdatplein (u7q1)
focus: Omdat en want (u7q1) · kan: Ik kan uitleggen waarom (omdat…).
taak: Praat over waarom je in Antwerpen woont en wat je van de stad vindt.
instellingen: vertaling ja · verbeteren per beurt · beurten 6–8
EDZ-EINDE
```

5. **Photos:** in a Project conversation, attach a photo of your class notes and write *foto*. Claude transcribes it, explains it, offers a practice and ends with a report.

## B. Build the app (Claude Code)
1. The GitHub repo is `elkedagzinvlaams`. It holds `CLAUDE.md`, `SPEC-2.0.md`, `FORMATS.md`, `REFERENCE.md`, `MIGRATION.md` and the 1.5 source (`src/`, `build.py`, `tests/`) from the kit.
2. Start Claude Code in the repo with: *"Read CLAUDE.md and SPEC-2.0.md. Build version 2.0 following section 7, one step at a time, running the tests after each step."*
3. Turn on GitHub Pages (Settings → Pages → Deploy from a branch → `main`, `/ (root)`). The app is then at `https://aricmoskowitz.github.io/elkedagzinvlaams/`.

## C. Move your progress
1. In the **old app** (claude.ai): Ik → Back-up → **Exporteer**. Save the `.json` file to Files.
2. Open the **new app** in Safari at the Pages address. Tap Share → **Add to Home Screen**, then open it from the Home Screen.
3. First run: tap **Zet je back-up terug** and choose the file. Check:
   - Pad shows your towns and squares
   - Woorden → Mijn woorden lists your own words
   - Naslag shows your corrections on their squares
4. In the new app: Ik → **Documenten voor Claude** and upload the fresh `Woorden.md` to the Project, replacing the old one. It now includes your own words.
5. Use both apps for a week if you like, then retire the artifact. Your data stays in your claude.ai account until you delete it.

## What does not move
- The in-app tutor history and log stay readable in the old app. The backup also carries them into the new app's history.
- The weekly Claude usage meter goes away: usage now shows in the Claude app itself.
