# Woordenboek (the built-in dictionary)

When Ari taps a word the app has no card for, the app looks it up here and shows a filled-in card.
One tap adds it to his own words or to a set. `python3 build.py` joins every `*.jsonl` file in this folder into
`woordenboek.json` at the repo root. The page loads that file only when it first needs it, and the service
worker keeps it for offline use. `tests/validate.js` checks every entry.

## One entry per line (JSON)

```json
{"w":"kiezen","p":"v","d":"uit een paar dingen het ene nemen dat je wilt","en":"to choose","s":"Ik kies de rode jas.","se":"I choose the red coat.","v":{"t":"s","st":"kies","im":["koos","kozen"],"pp":"gekozen","aux":"h"}}
{"w":"kast","p":"n","g":"de","pl":"kasten","dim":"kastje","d":"een meubel met deuren waarin je dingen bewaart","en":"cupboard","s":"De borden staan in de kast.","se":"The plates are in the cupboard."}
{"w":"mooi","p":"adj","e":"mooie","f":["mooier","mooist"],"d":"leuk om te zien of te horen","en":"beautiful, nice","s":"Wat een mooie dag!","se":"What a beautiful day!"}
```

| key | for | meaning |
|---|---|---|
| `w` | all | the lemma: infinitive, singular, base form. Lowercase (except a proper adjective). |
| `p` | all | `n` noun, `v` verb, `adj` adjective, `adv` adverb, `prep` preposition, `pron` pronoun, `conj` conjunction, `num` number, `int` interjection, `q` question word |
| `d` | all | a short **Dutch** explanation at A2 level, in standard Belgian Dutch. Do not use the word itself. |
| `en` | all | the English meaning (two at most, comma between) |
| `s`, `se` | all | an example sentence (max 12 words, everyday Antwerp life) that contains the word or one of its forms, and its English translation |
| `g`, `pl`, `dim` | n | `de` or `het`; the plural (`null` if none); the diminutive (`null` if none) |
| `e` | adj | the form with `-e` (`mooie`, `rode`, `grote`); `null` for adjectives that never change (`gratis`, `oranje`) |
| `v` | v | `t`: `w` weak, `s` strong, `o` irregular; `st` the stem (ik-form); `im` past [singular, plural]; `pp` the participle without a separable prefix; `aux` `h` hebben, `z` zijn, `hz` both; `sep` the separable prefix (`op` for opbellen); `o` present-tense forms that are not stem / stem+t (keys `ik jij inv u hij pl ge`), `imp` the imperative if it is not the stem |
| `f` | any | other forms that should find this entry (comparatives, `mij` for `ik`, `hun`/`hen`, ...) |
| `vl` | any | `true` for a Flemish word (spreektaal) that a Dutch dictionary may not have; `d` says it is Flemish |

Rules: Belgian Dutch norms (*gsm*, *voetpad*, *beenhouwer*, *nonkel*, *frieten*). No word that is already in the
app (`LEX`). No offensive words. Every form you list must really exist.
