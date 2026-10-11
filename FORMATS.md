# Formats — what moves between the app and the Project

Two blocks travel by copy and paste:

- **EDZ-START v1** goes app → Project, to start a session.
- **EDZ-VERSLAG v1** goes Project → app, at the end of a session.

Both start and end with a marker line so the app finds them even inside other text. This file is shared by the Project and by the app's code. Change it only together, and raise the version number when you do (`v2`).

---

## 1. EDZ-START v1 (app → Project)

The app writes this block. It is plain text, one field per line, and fields the mode doesn't use are left out.

```
EDZ-START v1
modus: opdracht
datum: 2026-10-12
niveau: A2 · Boog 1 · Stad 7 Waaromberg (u7) · Plein 2 Denkplein (u7q2)
focus: Dat, of en vraagwoorden (u7q2) · kan: Ik kan uitleggen waarom (omdat…).
taak: Een babbel met de buurvrouw. Zij vraagt wat je van Antwerpen vindt.
scène: sc-u7 · Jij bent een nieuwsgierige buurvrouw in de trappenhal · opener: "Dag buur! U woont hier nog niet lang, hé? Wat vindt u van Antwerpen?"
doel: zeg 3 keer waarom (omdat/want) en gebruik 1 keer "als"
recent: vinden, weten, denken, hopen, buurt, zeker, mening, druk, regenen, paraplu
zwak: u1q2 werkwoord op plaats 2 (4×) · u7q2 dat-zin (2×) · Algemeen: in het Nederlands (1×)
instellingen: vertaling ja · verbeteren per beurt · beurten 8–10
EDZ-EINDE
```

| Field | Modes | Meaning |
|---|---|---|
| `modus` | all | `onderwerp`, `opdracht`, `dagboek` or `foto` |
| `niveau` | all | Ari's current place in the curriculum (the next open square) |
| `focus` | all | the grammar of that square, plus the town's can-do |
| `taak` | all | **onderwerp**: a suggested theme from the current town and weak spots. **opdracht**: the scene in one sentence. **dagboek**: `vertel over je dag of je les`. **foto**: `verwerk de foto` |
| `scène`, `doel` | opdracht | the town's scene from `Scenes.md` and a measurable goal |
| `recent` | all | up to 30 words learned in the last 14 days (not new in the report) |
| `zwak` | all | up to 5 open corrections, grouped by square, with counts |
| `instellingen` | all | translation yes/no · corrections `per beurt` or `op het einde` · target turns |

---

## 2. EDZ-VERSLAG v1 (Project → app)

Claude writes this block. Between the markers there must be exactly one JSON object: double quotes, no comments, no trailing commas.

```
EDZ-VERSLAG v1
{"v":1,"modus":"opdracht","datum":"2026-10-12","onderwerp":"Een babbel met de buurvrouw","plein":"u7q2","beurten":9,"doelBereikt":true,
"samenvatting":"Je vertelde wat je van Antwerpen vindt en waarom. Je gebruikte omdat drie keer.",
"tip":"After omdat, wait with the verb until the end of the clause.",
"goed":[{"topic":"Omdat + werkwoord achteraan (because + verb last)","plan":"u7q1","mastered":false}],
"corrections":[
 {"wrong":"Ik vind Antwerpen mooi omdat het is oud.","right":"Ik vind Antwerpen mooi omdat het oud is.","why":"After omdat the conjugated verb goes to the end.","type":"word order","plan":"u7q1"},
 {"wrong":"Ik heb gaan naar de markt.","right":"Ik ben naar de markt gegaan.","why":"Gaan (movement to a place) takes zijn; the participle is gegaan.","type":"verb form","plan":"u5q3"},
 {"wrong":"Ik zou graag hebben een koffie.","right":"Ik had graag een koffie.","why":"Flemish polite ordering uses 'ik had graag'.","type":"word choice","plan":null,
  "newTopic":{"title":"Beleefd bestellen: ik had graag (polite ordering)","town":"u4","rule":"Flemish uses the past 'ik had graag' to order politely.","examples":[{"nl":"Ik had graag een koffie.","en":"I'd like a coffee."},{"nl":"We hadden graag de rekening.","en":"We'd like the bill."}]}}],
"words":[{"w":"trappenhal","p":"n","g":"de","pl":"trappenhallen","dim":"","d":"de ruimte met de trap in een gebouw","s":"Ik zie de buurvrouw in de trappenhal.","en":"stairwell","plan":"u6q3"}]}
EDZ-EINDE
```

| Field | Required | Meaning |
|---|---|---|
| `v` | yes | always `1` |
| `modus` | yes | the mode from the start block |
| `datum` | yes | `YYYY-MM-DD` |
| `onderwerp` | yes | short title for the history |
| `plein` | opdracht | the square the exercise targeted (from `niveau`) |
| `beurten` | yes | learner turns |
| `doelBereikt` | opdracht | `true`/`false`: the app marks that square's **Gebruik** house done when true |
| `samenvatting` | yes | 1–3 sentences in simple Dutch |
| `tip` | no | one concrete tip in English |
| `tekst` | dagboek, foto | dagboek: Ari's text, corrected. foto: the transcription of the photo |
| `bron` | foto | what the photo was ("les 12 oktober, whiteboard") |
| `goed[]` | no | up to 3 constructions used correctly: `topic`, `plan`, `mastered` |
| `corrections[]` | no | up to 8: `wrong` (Ari's exact words), `right`, `why` (short English), `type` (`word order`, `article`, `verb form`, `adjective`, `spelling`, `word choice`, `other`), `plan` (square id or null), optional `newTopic` |
| `words[]` | no | up to 10 new words: `w` lemma, `p` (`n`/`v`/`adj`/`adv`), `g` (`de`/`het`, nouns), `pl`, `dim`, `d` (simple Dutch definition), `s` (example), `en`, `plan` |
| `newTopic` | no | `title`, `town` (town id like `u4`), `rule`, `examples[]` (`nl`, `en`) |

**Rules the app checks.** Breaking one makes the item land under *Algemeen* instead of being lost.
- `plan` must be a square id from `Curriculum.md`.
- A word already in the app is skipped.
- Smart quotes (“ ”) are turned into straight quotes before reading.
- Text outside the markers is ignored.

---

## 3. Foto mode (Project only)

When Ari uploads a photo (class handout, whiteboard, textbook page, a sign, a menu, a letter):

1. **Transcribe** the Dutch text faithfully. Mark anything unreadable with […].
2. **Explain** in 3–6 short lines: what it is about, the grammar point it shows, and the key words.
3. **Place** the grammar and words in `Curriculum.md`, as for a conversation.
4. **Offer one practice** and do it if Ari wants: 3 quick questions about the text, a short conversation using its words, or making own sentences with its grammar.
5. **Correct only Ari's own writing.** If the photo shows Ari's handwriting (homework, notes), correct those sentences and put them in `corrections`.
6. **End with EDZ-VERSLAG v1:** `modus: "foto"`, `bron`, `tekst` (the transcription, up to about 1,500 characters), `words`, `goed` (grammar points seen) and `corrections` (only for Ari's writing).

Several photos in one session are fine: write one report that covers them all.
