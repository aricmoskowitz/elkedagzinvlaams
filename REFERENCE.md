# REFERENCE — Elke Dag Zin: terms, schema, sizing

> Updated for 1.5 / 2.0 (2026-10-11). The tabs are now **Pad · Woorden · Naslag · Ik**; Vandaag, Praten and Logboek are gone. Conversation, journal and photos live in the Claude Project and come back as `EDZ-VERSLAG` reports (see FORMATS.md).

Companion to `flemish-app-build-spec.md`. Last updated 2026-09-30 (plan extended to C1: 10 arcs).
Map hierarchy (town → square → guild house): **confirmed 2026-09-29.** Locking rule confirmed for all apps.

---

## 1. The hierarchy in one line

**Deel (level) → Arc → Town → Square → Guild house → Session → Exercise**

- A **Deel** is one CEFR level (A2, B1, B1+, B2, C1). It covers two arcs and is a label, not a map screen.
- An **arc** is one map world of 6–7 towns.
- A **town** is one core unit: one grammar point × one Antwerp theme × one can-do. It has 3–6 squares, and the last is its **Grote Markt** (town review + field mission).
- A **square** is one lesson inside the town, sized for one sitting.
- A **guild house** is one of the five steps inside a square.
- Entering a guild house starts a **session**, which is a run of **exercises**.

Retired or merged words: *module* → **town** (UI) / **unit** (spec). *Item* → **review item**. Item-level *skill* → **track**. *Visible confidence* → **visible competence**.

---

## 2. Glossary

### Structure (what the map shows)

| Term | Dutch in the app | Definition | Example |
|---|---|---|---|
| **Arc** | Boog | A level band of the curriculum, drawn as one invented map world of about 6–7 towns. Each arc ends in a natural barrier you cross into the next (Arc 1: a mountain pass; Arc 2: a great river; … Arc 8: the language border). Ten arcs, two per level, A2 to C1. | Arc 1 · Rondkomen (A2) |
| **Learning path** | Pad | The recommended order of all towns and squares across the arcs. The road on the map draws it, and the road never crosses itself. | Arc 1: 7 towns in a row, with side roads for extra towns from the log |
| **Town** (= **core unit**; project-wide word: **module**) | Stad / dorp | One grammar point × one theme × one can-do statement. Its invented name says what it is about. | *Wegwijzer*: verb second, set in trams and directions |
| **Square** | Plein / markt | One lesson inside a town: one sub-point of the grammar with about 8 words and 8–10 sentences, sized for 10–15 minutes. | In *Wegwijzer*: Stationsplein (verb in slot 2), Tramplein (inversion), Vragenmarkt (questions, the dropped -t) |
| **Guild house** (= **step**) | Gildehuis | One of five stations inside every square, always in this order. | See the five steps below |
| **Theme** | Thema | The real-life setting a town's words and sentences come from. It shapes vocabulary, not grammar. | Trams, the plant market, the chip shop |
| **Can-do** | Doel | One sentence saying what you can do after a town. | *Ik kan de weg vragen en uitleggen.* |
| **Checkpoint** | Checkpoint | The pass mark (80% right on first try) that inks a guild house. A **test-out** is a checkpoint taken without doing the steps. | |

**The five steps (guild houses)**

1. **Ontdek** (Notice): the rule, the sentence frame and the new words.
2. **Oefen** (Practice): drills.
3. **Lees** (Read): a short text with five comprehension questions (who, what, where, when, why; never grammar). 4 of 5 is gehaald, 5 of 5 is 100%. *Built in Batch 3; five questions since 2.5.*
4. **Luister** (Listen): listening exercises.
5. **Gebruik** (Use): tutor conversation and writing. *Batch 2.*

### Content (authored once, ships with the app)

| Term | Definition |
|---|---|
| **Word** (lexeme) | One dictionary entry with all its forms: lemma, part of speech, *de/het*, plural, diminutive, Dutch definition, hidden English gloss, example sentence and notes. Verbs add stem, past forms, participle, auxiliary, separable prefix and vowel family. |
| **Custom word** | A word you create. Same shape, but stored in learner state, not content. |
| **Sentence** | One full Dutch sentence with its English translation. It is split into **frame chunks** (each tagged with a slot, with the subject marked) and linked to the words that can be blanked out (its **targets**). |
| **Sentence bank** | All sentences in the app. It is the main authored asset, because every sentence-based exercise is built from it. |
| **Target** (word–sentence link) | "This word appears in this sentence as this form" (e.g. *neemt* → *nemen*). It makes cloze exercises possible. |
| **Grammar point** | The rule a town teaches: explanation, the "why", and example sentences shown in frames. |
| **Sentence frame** | The five-slot diagram: 1 voorveld · 2 persoonsvorm · 3 middenveld · 4 eindgroep · 5 nazin. Every main clause fits it. |
| **Extra** | A stand-alone feed card: a street-name story, a Flemish expression or a culture note. |
| **Reading text / tutor scenario / writing prompt** | One of each per town. *Batches 2–3.* |
| **Field mission** | A weekly real-world task tied to the current town. |

### Practice (what happens when you learn)

| Term | Definition |
|---|---|
| **Review item** | The memory record for one word or sentence on one track, e.g. "*tram* – gender". It is the unit the scheduler tracks: due date, interval, ease, streak and lapses. |
| **Track** | What a review item tests. There are six: **recognise, produce, gender, conjugate, order, listen**. Nouns get gender, verbs get conjugate, and sentences get order and listen. |
| **Skill** (the **eight skills**) | The learner-facing abilities: **Vocabulary, De/het, Conjugation, Grammar (word order), Listening, Reading, Speaking, Writing.** Tracks roll up into skills: recognise + produce → Vocabulary, gender → De/het, conjugate → Conjugation, order → Grammar, listen → Listening. Reading, Speaking and Writing get their own tracks in Batches 2–3. Pronunciation and culture are taught through notes but not scored. |
| **Exercise** | One question on screen, generated at runtime from a review item plus an exercise type. It is never stored. |
| **Exercise type** | A question format (section 4 lists them). Each type fits one kind of object and one track. |
| **Cloze** | A gap-fill: a sentence with one target word blanked. It comes in two types: choose from options (recognise) and type it (produce). |
| **Prompt** | What the exercise shows you: a sentence with a gap, an English sentence, a Dutch definition, a verb and person, or audio. |
| **Accepted answer** | Everything the checker counts as right: the answer itself, every valid word order (a fronted time or place phrase with inversion), the noun with or without its article, and small typos or missing accents (accepted with a note). |
| **Distractor** | A wrong but plausible option in a choice exercise: another word of the same kind, another form of the same verb, or another separable prefix. |
| **Error type** | How the checker classifies a miss. There are six: **typo, accent, wrong article, word order, wrong verb form, wrong word.** Each one gets its own "why" (e.g. word order shows the frame). |
| **Why** | The explanation after every answer: mechanism, rule or history. |
| **Session** | A run of exercises with a start and an end: one guild house, a review, or a word-set study. |
| **Review queue** | All review items due today, most overdue first, capped at the daily limit (60). It is the *Herhalen* card on Vandaag. |
| **Mastery** | The share of a town's review items you know, meaning 2+ right in a row or an interval of 3+ days. It sets how much ink the map shows. |

### Features

| Term | Definition |
|---|---|
| **Word set** | A named list of words, studied as flashcards or by typing. Every town has one automatically, and you can make your own. |
| **Flashcard** | A word-set card. Front: article, word and sentence. Back: Dutch definition, forms and hidden English. Graded on the recognise track. |
| **Feed** (Scroll) | The vertical, one-tap mode for tired moments. It uses built-in content only, works offline, costs no Claude usage, and updates only the recognise and gender tracks. |
| **Card type** (feed) | Seven types: **quiz** (de/het, gap, verb form) · **word check** ("knew it?") · **new word** · **glance** (verb table, frame or noun) · **extra** · **listen** · **break**. |
| **Log** (Logboek) | Your record of learning outside the app, as a quick one-liner or a ~150-word reflection in Dutch. Claude turns each entry into corrections, proposed words and curriculum signals. *Batch 2.* |
| **Visible competence** | The motivation principle of showing progress as real ability (words known, sentences mastered, how much of a Wablieft article you can read), not points. |
| **Skill balance chart** | The bars on *Ik*: mastery for each of the eight skills. |
| **Learner state** | Everything saved about you: review items, progress per square and step, word sets, custom words, log entries, activity, settings and placement. |

### Engine: the nine jobs

| # | Job | What it does | Status |
|---|---|---|---|
| 1 | **Content store** | Loads content and indexes it by town, word and sentence | Built |
| 2 | **Exercise generator** | Review item + type → prompt, accepted answers, distractors | Built |
| 3 | **Answer checker** | Normalises the answer, tests it against the accepted answers, assigns an error type | Built |
| 4 | **Scheduler** | Spaced repetition: updates review items and builds the review queue | Built |
| 5 | **Session runner** | Runs a session, saves after every answer, scores checkpoints | Built |
| 6 | **State store** | Saves learner state on claude.ai, with a local copy and backup | Built |
| 7 | **Audio** | Reads Dutch aloud with the Belgian voice | Built |
| 8 | **AI** | Tutor, log processing, writing grading | Batch 2 |
| 9 | **Map renderer** | Draws the arc, town and square views | Rebuild |
| (10) | **Coach** *(new)* | Teaches the app: first-run tour and first-time tips | Rebuild |

---

## 3. Progression and locking

- **Learner default:** squares and towns open in order. The next one opens when the previous checkpoint is passed.
- **Skip ahead:** any locked square or town offers a **test-out**, a short checkpoint quiz. Passing it marks it done.
- **Testmodus** (switch in *Ik*): unlocks everything, so any part of the app can be checked without playing through. It is **on by default while prototyping.**

---

## 4. Sizing: how many of each

Built counts are from the content (2026-09-30). Everything else is a target.

| Object | Built now (Towns 1–6) | Arc 1 complete | Full plan to C1 (10 arcs) |
|---|---|---|---|
| Levels (Delen) | — | — | 5 |
| Arcs | 1 | 1 | 10 |
| Towns | 7 (Arc 1 complete) | 7 | 63 |
| Squares | 21 built + 7 Grote Markt (255 planned) | 28 | ~255 |
| Guild houses (derived, 5 per square) | 90 | 140 | ~1,275 |
| Grammar points / themes / can-dos | 6 | 7 | 63 |
| Words | 177 | ~190 | ~4,500–5,500 |
| Sentences | 135 | ~135 | ~3,000–4,000 |
| Field missions | 6 | 7 | 63 |
| **Review items** | ~650 | ~810 | ~20,000 (+ custom words) |
| Distinct exercises (generated, never stored) | ~4,500 validated | ~4,500 | ~45,000 |
| Hours in the app (≈1.5 h per square incl. review) | — | ~40 | ~400–450 |

**Exercise types** (object → track):

| Built | Batch 2 | Batch 3 |
|---|---|---|
| cloze choose, cloze type, definition choose, definition type (word → recognise / produce) | free translation graded by Claude | shadowing |
| de/het (noun → gender) | *Zeg het anders* | |
| conjugate type, conjugate choose (verb → conjugate) | | |
| reorder, translate EN → NL (sentence → order) | | |
| listen-choose, listen-type (sentence → listen) | | |
| flashcard (word → recognise) | | |

---

## 5. What grows together

1. **Review items = 2.8 × words + 2 × sentences.** This is exact for the built content: 234 + 116 = 350. Every word gets recognise and produce, nouns add gender, verbs add conjugate, and sentences get order and listen.
2. **Exercises grow linearly with words and sentences, but not as (words + sentences) × all types.** Each type fits only one kind of object: gender only nouns, conjugate only verbs, reorder only sentences. The distinct pool is about 2 × links + 2 × words + nouns + 7 × verbs + 3.5 × sentences ≈ **2.3 × review items**. Random distractors and persons multiply the variety without adding data.
3. **Links grow with sentences.** Each new sentence gives about two words a new cloze context. Target: every word in at least 2 sentences. Words that only appear in their own example sentence fall back to definition exercises.
4. **Squares ≈ words ÷ 8 ≈ sentences ÷ 9.** Guild houses are always 5 × squares. They are derived, not stored.
5. **Daily review load ≈ 5 × new review items per day.** With the cap at 60, the sustainable intake is about **12 new items a day**. A square holds about 40–80 items, so a steady pace is **one square every 3–5 days**. The full C1 plan is therefore a multi-year path, which is realistic alongside Encora classes. The scheduler should throttle new items to protect the cap.
6. **Storage.** A review item takes about 72 bytes, so about 3,500 items fill the 256 KB per-document limit. On the C1 plan that happens around Arc 3, so the review-items document must be **split by arc before Arc 2 ships**. Log entries go in one document per month. Custom words grow with the log.
7. **Claude usage grows with use, not with content.** It scales with tutor turns, log entries and writing prompts. That is the number to watch against the "50% of my usage" threshold.

---

## 6. The app teaches itself (onboarding requirements)

1. **First-run tour (4 screens):** what Goesting is · the map (town → square → guild house) · the colour code (blue *de*, red *het*, the frame-slot colours, one colour for "tap me") · the daily rhythm (reviews, one square, Scroll when tired).
2. **First-time tips:** the first time each screen or feature appears, a one-line explanation with *Begrepen*. This covers the map, a square, each guild house, the feed, word sets and the review queue.
3. **First exercise of each type** opens with a worked example.
4. **Help page** in *Ik*: "Hoe werkt Goesting?", which can replay the tour and lists these terms in Dutch with English.
5. **Empty states** always say what to do next.
6. **Long-press any label** shows English. This is already built.
