# Formats — what moves between the app and the Project

Three blocks travel by copy and paste:

- **EDZ-START v1** goes app → Project, to start a session.
- **EDZ-VERSLAG v1** goes Project → app, at the end of a session.
- **EDZ-WOORDEN v1** goes Project → app, to add a named word set.

All three start and end with a marker line so the app finds them even inside other text. This file is shared by the Project and by the app's code. Change it only together, and raise the version number when you do (`v2`).

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
doel: 1) Zeg 3 keer waarom (omdat/want) · 2) Gebruik 1 keer "als"
recent: vinden, weten, denken, hopen, buurt, zeker, mening, druk, regenen, paraplu
zwak: u1q2 werkwoord op plaats 2 (4×) · u7q2 dat-zin (2×) · Algemeen: in het Nederlands (1×)
instellingen: verbeteren op het einde · beurten 8–10
EDZ-EINDE
```

| Field | Modes | Meaning |
|---|---|---|
| `modus` | all | `onderwerp`, `opdracht`, `dagboek` or `foto` |
| `niveau` | all | The user's current place in the curriculum (the next open square) |
| `focus` | all | the grammar of that square, plus the town's can-do |
| `taak` | all | **onderwerp**: a suggested theme from the current town and weak spots. **opdracht**: the scene in one sentence. **dagboek**: `vertel over je dag of je les`. **foto**: `verwerk de foto` |
| `scène`, `doel` | opdracht | the town's scene from `Scenes.md` and a measurable goal, in numbered parts |
| `recent` | all | up to 30 words learned in the last 14 days (not new in the report) |
| `zwak` | all | up to 5 open corrections, grouped by square, with counts |
| `instellingen` | all | `verbeteren op het einde` (always: corrections only at the end; an older block may say `per beurt`, treat it the same) · target turns |

**No translations.** Conversation practice stays in Dutch: Claude never puts an English translation under its replies. A `vertaling` value in `instellingen` (from an older app version) is ignored, so the block stays v1.

---

## 2. EDZ-VERSLAG v1 (Project → app)

Claude writes this block. Between the markers there must be exactly one JSON object: double quotes, no comments, no trailing commas.

```
EDZ-VERSLAG v1
{"v":1,"modus":"opdracht","datum":"2026-10-12","onderwerp":"Een babbel met de buurvrouw","plein":"u7q2","beurten":9,"doelBereikt":true,"doelen":[1,1],
"samenvatting":"Je vertelde wat je van Antwerpen vindt en waarom. Je gebruikte omdat drie keer.",
"tip":"After omdat, wait with the verb until the end of the clause.",
"goed":[{"topic":"Omdat + werkwoord achteraan (because + verb last)","plan":"u7q1","mastered":false}],
"corrections":[
 {"wrong":"Ik vind Antwerpen mooi omdat het is oud.","right":"Ik vind Antwerpen mooi omdat het oud is.","why":"After omdat the conjugated verb goes to the end.","type":"word order","plan":"u7q1"},
 {"wrong":"Ik heb gaan naar de markt.","right":"Ik ben naar de markt gegaan.","why":"Gaan (movement to a place) takes zijn; the participle is gegaan.","type":"verb form","plan":"u5q3"},
 {"wrong":"Ik zou graag hebben een koffie.","right":"Ik had graag een koffie.","why":"Flemish polite ordering uses 'ik had graag'.","type":"word choice","plan":null,
  "newTopic":{"title":"Beleefd bestellen: ik had graag (polite ordering)","town":"u4","rule":"Flemish uses the past 'ik had graag' to order politely.","examples":[{"nl":"Ik had graag een koffie.","en":"I'd like a coffee."},{"nl":"We hadden graag de rekening.","en":"We'd like the bill."}]}}],
"words":[{"w":"trappenhal","p":"n","g":"de","pl":"trappenhallen","dim":"","d":"de ruimte met de trap in een gebouw","s":"Ik zie de buurvrouw in de trappenhal.","en":"stairwell","plan":"u6q3","thema":"wonen"}]}
EDZ-EINDE
```

| Field | Required | Meaning |
|---|---|---|
| `v` | yes | always `1` |
| `modus` | yes | the mode from the start block |
| `datum` | yes | `YYYY-MM-DD` |
| `onderwerp` | yes | short title for the history |
| `plein` | opdracht | the square the exercise targeted: copy the id in brackets at the end of the `niveau` line exactly |
| `beurten` | yes | learner turns |
| `doelen` | opdracht | one value per numbered part of `doel`, in the same order: `1` = done, `0` = not done, a fraction for a counted part that was partly done (2 of the 3 verbs → `0.67`) |
| `doelBereikt` | opdracht | `true` only when every part of `doel` is done (used by older app versions) |
| `samenvatting` | yes | 1–3 sentences in simple Dutch |
| `tip` | no | one concrete tip in English |
| `tekst` | dagboek, foto | dagboek: the user's text, corrected. foto: the transcription of the photo |
| `bron` | foto | what the photo was ("les 12 oktober, whiteboard") |
| `goed[]` | no | up to 3 constructions used correctly: `topic`, `plan`, `mastered` |
| `corrections[]` | no | up to 8: `wrong` (the user's exact words), `right`, `why` (short English), `type` (`word order`, `article`, `verb form`, `adjective`, `spelling`, `word choice`, `other`), `plan` (square id or null), optional `newTopic` |
| `words[]` | no | up to 10 new words: `w` lemma, `p` (`n`/`v`/`adj`/`adv`), `g` (`de`/`het`, nouns), `pl`, `dim`, `d` (simple Dutch definition), `s` (example), `en`, `plan`, `thema` (always, see §4), and `syn`/`ant` only where a good one exists |
| `newTopic` | no | `title`, `town` (town id like `u4`), `rule`, `examples[]` (`nl`, `en`) |

**The Gebruik score (opdracht).** The app scores Gebruik like Oefen: **70%** for the goals (the average of `doelen`) and **30%** for accuracy (1 − corrections ÷ `beurten`, never below 0). **80%** or more is gehaald and puts a flag on the square's Gebruik house; 100% gives the star. So count `beurten` honestly (the learner's turns) and list every real correction; leave out speech-recognition slips.

**Rules the app checks.** Breaking one makes the item land under *Algemeen* instead of being lost.
- `plan` must be a square id from `Curriculum.md`.
- A word already in the app is not added again; empty fields on its card (`thema`, `syn`, `ant`) are filled in.
- Smart quotes (“ ”) are turned into straight quotes before reading.
- Text outside the markers is ignored.

---

## 3. Foto mode (Project only)

When the user uploads a photo (class handout, whiteboard, textbook page, a sign, a menu, a letter):

1. **Transcribe** the Dutch text faithfully. Mark anything unreadable with […].
2. **Explain** in 3–6 short lines: what it is about, the grammar point it shows, and the key words.
3. **Place** the grammar and words in `Curriculum.md`, as for a conversation.
4. **Offer one practice** and do it if the user wants: 3 quick questions about the text, a short conversation using its words, or making own sentences with its grammar.
5. **Correct only the user's own writing.** If the photo shows the user's handwriting (homework, notes), correct those sentences and put them in `corrections`.
6. **End with EDZ-VERSLAG v1:** `modus: "foto"`, `bron`, `tekst` (the transcription, up to about 1,500 characters), `words`, `goed` (grammar points seen) and `corrections` (only for the user's writing).

Several photos in one session are fine: write one report that covers them all.

---

## 4. EDZ-WOORDEN v1 (Project → app)

A named word set: the user's own list, the words of a class, a text. The user imports it under Ik → *Woordenlijsten* (paste or a `.txt` file); the report box (*Verslag plakken*) accepts it too. The app can also write a set back out in this format (*Deel als woordenlijst* on the set's page). Between the markers there must be exactly one JSON object.

```
EDZ-WOORDEN v1
{"v":1,"set":"Mijn woorden","datum":"2026-10-12","bron":"eigen lijst","words":[
{"w":"rand","p":"n","g":"de","pl":"randen","dim":"randje","d":"de buitenkant of het einde van iets","s":"We wonen aan de rand van de stad.","en":"edge, rim; outskirts","plan":"u13q1","thema":"beschrijven"},
{"w":"vrolijk","p":"adj","d":"blij en opgewekt","s":"Zij is altijd vrolijk, zelfs als het regent.","en":"cheerful","plan":"u6q1","thema":"gevoel","syn":["opgewekt","blij"],"ant":["somber"]}]}
EDZ-EINDE
```

| Field | Required | Meaning |
|---|---|---|
| `v` | yes | always `1` |
| `set` | yes | set name; the user can change it in the preview. Importing into an existing set's name adds to that set |
| `datum` | yes | `YYYY-MM-DD` |
| `bron` | no | where the words came from ("eigen lijst", "les 12 oktober") |
| `words[]` | yes | 1–200 entries, same fields as `words[]` in EDZ-VERSLAG |

- **`thema` (per word):** one of `eten`, `winkelen`, `onderweg`, `stad`, `wonen`, `weer`, `natuur`, `werk`, `mensen`, `tijd`, `gevoel`, `lichaam`, `taal`, `vrij`, `beschrijven`, `basis` (or its Dutch name, e.g. "Natuur en dieren"). **Required in every block the Project writes.** Optional in sets the app exports. Without it the app uses its own tag for that lemma, or leaves the word "Zonder thema".
- **`syn` and `ant` (optional, per word):** synonyms and antonyms, as a list (`["vrolijk","opgewekt"]`) or comma-separated text. Only where a good one exists, in Belgian Dutch. They show on the word card and feed the synonym and antonym cards in Scroll.
- **`p` values:** `n`, `v`, `adj`, `adv`, and in this block only also `pron`, `conj` and `prep`.
- **Non-noun fields:** `g`, `pl` and `dim` may be missing for non-nouns.
- **Required per word:** `w`, `d`, `s`, `en`, and for a noun `g` (`de`/`het`).

**What the app does.**
- Same normalising as reports: smart quotes become straight quotes, code fences and text outside the markers are ignored.
- It shows a preview first: the set name, how many words are new, how many are already in the app, how many existing words get empty fields filled in (*aangevuld*), how many go to *Algemeen* (`plan` null or not a square id from `Curriculum.md`), and every rejected entry with its reason. Then *Importeer* or *Annuleer*.
- Words are matched on lemma (`w`, case-insensitive) plus `p`. A word already in the app is linked into the set. Its filled-in fields are never overwritten, but empty ones (`thema`, `syn`, `ant`, `g`, `pl`, `dim`) are filled from the block. Pasting the same block twice changes nothing the second time.
- A new word belongs to the set and to its `plan` square (or *Algemeen*). New words enter the review queue 12 a day; drilling the set brings them in at once.
- A bad entry (missing `w`, `d`, `s` or `en`; a noun without a valid `g`; an unknown `p`; the same word twice) is skipped and listed. It never blocks the rest.

---

## 5. Preparing a word list (Project only)

Use this whenever the user gives words to add to the app: a typed list, a file (CSV or export from another app), a photo of a vocabulary list, or one word from the app's Woordenboek. Don't start a session for it.

**1. Read and filter.**
- Read the whole list first. Keep only Dutch entries; leave out other languages and say how many.
- Leave out words the app already has: check `Woorden.md` (squares, sets, *Eigen woorden*, *Woordenboek*) and the own words in the newest backup. Leave out duplicates within the list. Name what was skipped.

**2. Clean each word.**
- Fix spelling and use the base form: infinitive, singular noun, adjective without -e (*zweefde* → *zweven*, *matrozen* → *matroos*, *heerlijke* → *heerlijk*).
- Correct a wrong *de/het*.
- Keep a phrase only when the phrase itself is the point (*in elkaar steken*, *laten trekken*). Otherwise reduce it to the key word, or skip it when that word is already in the app.
- Prefer the Belgian word and mention the Netherlands one in `en` or `d` where they differ (*de selder* / NL *selderij*, *de frigo*, *kuisen*).

**3. Check the meaning.**
- When the Dutch doesn't match the English (*dobbelsteen* for "to dice", *saai* for "dull"), use the right Dutch word and say so.
- When a word has a vulgar, rude or very different second meaning (*naaien*, *eikel*, *het meer* / *meer*), say so in `en`.
- When you can't identify a word, ask. Never guess it into the set.

**4. Fill every field.**
- `w`, `p`, and for nouns `g`, `pl` and `dim` (leave `dim` empty when nobody uses one).
- `d`: one simple Dutch definition at A2 level that doesn't use the word itself.
- `s`: one short, natural Belgian Dutch sentence, preferably about Antwerp, coffee, cooking or daily life.
- `en`: a short English gloss, with a note for tricky meanings.
- `plan`: the square whose grammar point or theme fits (separable verbs → u2q1, compounds and food nouns → u3q1, adjectives → u6q1…), or `null`.
- `thema`: **always**. Pick it by what the word is about, independent of `plan`:

| thema | for |
|---|---|
| `eten` | food, drink, cooking, kitchen tools, taste |
| `winkelen` | shopping, prices, comparing products |
| `onderweg` | travel, transport, the sea, distances, delays |
| `stad` | the city, neighbourhoods, areas, buildings in town |
| `wonen` | the home, household tasks, furniture, materials |
| `weer` | weather |
| `natuur` | plants, animals, the garden, landscape, the environment |
| `werk` | work, business, money, meetings, school and study subjects |
| `mensen` | people, character, relationships |
| `tijd` | time, history, change, the future |
| `gevoel` | feelings and emotions |
| `lichaam` | the body, health, appearance |
| `taal` | speaking, reading, writing, messages, explaining |
| `vrij` | hobbies, sport, arts, games |
| `beschrijven` | colours, shapes, qualities: describing things |
| `basis` | very general verbs, function words, numbers and fractions |

- `syn` / `ant`: only where a good Belgian Dutch one exists.

**5. Name and size the set.**
- Use the set name the user gives, exactly.
- Without one: a single word from the Woordenboek goes to `Mijn woorden`; a list becomes `Import - <source>` (for example `Import - Karteto`).
- At most 200 words per block. For more, write several blocks with the **same** set name: each import adds to the set.
- For more than about 30 words, also give the blocks as `.txt` files.

**6. Report before the block**, briefly, in English:
- how many new words
- what was skipped and why
- what was corrected (wrong → right)
- anything unclear, with your question
- warnings about second meanings

Then the block or blocks. `Woorden.md` comes from the app, so don't edit it; the user uploads a new copy after importing.
