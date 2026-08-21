# THE LLM HARNESS — "INTELLIGENCE WITH A LEASH"
**Version:** Foundation V1

## 1. Guardrail philosophy

The player asked for more LLM in the game — but explicitly for a *harness*: "Don't let it get out of your hands. Keep a leash on this, keep a harness on this, build guardrails too, but let it do its magic."

The design answer is a **four-layer cage**:

1. **Schema cage** — every LLM response must be valid JSON against a strict schema. Non-conforming output is rejected and retried, then falls back.
2. **World cage** — the LLM's proposed *intents* (state deltas) are validated against current truth. It cannot create items, flags, keys, or movement that a legal path doesn't permit.
3. **Behavioral cage** — a system-prompt constitution (taboo list) forbids 4th-wall breaks, giving away solutions unsolicited, and generating content outside the Rajasthan-occult register. This is prompt-level (soft) but backed by schema (hard).
4. **Operator cage** — every AI feature has a deterministic offline twin, and every AI call is bounded (temperature, token cap, timeout, cache) and non-blocking.

The leash is not there to make the AI timid. It's there so the AI can be *bold safely* — wild prose, sharp wit, surprising but legal choices.

## 2. Provider abstraction (`ai/providers/provider.js`)

```js
interface Provider {
  async generate(system, user, { json=true, temperature, maxTokens, timeoutMs })
    -> { text } | throws
}
```
- `gemini.js`: `@google/generative-ai`, `responseMimeType: application/json`.
- `webllm.js`: preserved `@mlc-ai/web-llm` engine, `response_format: json_object`.
- `offline.js`: returns canned deterministic content (never throws from a missing model — it *is* the fallback).
- `director.js` chooses: `gemini` if `apiKey` set → else `webllm` if ready → else `offline`. Results cached per (feature, context-key) to avoid repeat round-trips (e.g., one riddle per gate per run).

## 3. Procedural Riddle Engine (`ai/generators/riddleGen.js`) — the "two answers / new riddles each time" feature

### 3.1 Generation
```
System: You are a cunning Rajasthani-occult puzzle-maker for a horror text adventure.
Produce a riddle whose answer is a single common noun/phrase in the given category.
Be fair: the clue must uniquely identify the answer to a clever human.
Return STRICT JSON:
{ "riddle": "...", "answer": "canonical", "variants": ["accepted alternate wordings"],
  "hint": "..." }
```
Seeded by `{gateId, difficulty, categoryPool}` with a random seed so every run differs.

### 3.2 Round-trip fairness gate (generator-side validation)
Before the riddle is installed:
```
Judge-pass A (canonical): Given RIDDLE and ANSWER, is the answer the uniquely-intended
single concept AND is the riddle solvable and not ambiguous? Return {"fair": bool, "reason": "..." }
```
Only executed when a cloud/webllm model is available; on any doubt or unavailability → **fall back to curated catalog** for that gate. This keeps quality guaranteed.

### 3.3 Semantic/alternative-answer judging — "accept two different answers"
When a player answers free-text that doesn't lexically match `answer`+`variants`:
```
Judge-pass B (alternative): RIDDLE = "..."  PLAYER = "..."  CANONICAL = "..."
Is PLAYER a legitimate, equally-correct answer to THIS riddle (not a synonym cheat and not
a guess)? Return {"correct": bool, "confidence": "high|med|low"}.
```
**Leash rules on the Judge:**
- Conservative prior: only `confidence:high` → `correct`. `med`/`low`/abstain → incorrect.
- **Cap:** a single gate accepts at most `2` semantic (non-lexical) correct answers per run. After that the Judge hard-rejects (prevents "anything goes").
- **Cost:** each semantic judge invocation costs the player **5 sanity** (a "strain of reasoning against the ward") so free guessing is never free.
- **Determinism:** when the LLM is offline, the Judge is replaced by a local synonym/lemma matcher with the same conservative prior and cap.

### 3.4 Catalog fallback
`world/riddles-curated.js` holds per-gate pools (≥4 riddles each) so the game is fully solvable offline and each pool is re-rolled per run for variety.

## 4. Personality Engine (`ai/generators/persona.js`)

Each entity has a **personality card** in `world/entities.js`:

```js
entity = {
  id: 'djinn',
  name: 'The Djinn of the Star',
  register: "imperial, sardonic, half-melancholic, occasionally reverent",
  tics: ["addresses you by title", "answers questions with a riddle or a counter-question",
         "frequently references fire and mirrors"],
  goals: "wants freedom but respects a worthy mind",
  taboos: ["never break fourth wall", "never directly hand a key answer unsolicited",
           "always offer a bargain in terms the player can see"],
  moods: { idle: [...], offer: [...], mocked: [...], pleased: [...], wrathful: [...] },
  bargains: [ // deterministic templates the engine may attach
    { id:'djinn_oil', given:'Oil Flask', wanted:'a question answered' , legal:true },
    { id:'djinn_sight', given:'sanity cost', wanted:'Echo Veil hint', legal:true },
  ]
}
```

### 4.1 Dialogue call
```
System: <personality card as constitution>  You are <entity>. Stay in character and register.
User: <situation: room, player state, entity state, player intent/said line>
Return STRICT JSON:
{ "line": "...", "mood": "idle|offer|mocked|pleased|wrathful",
  "offer": { "given": "...", "wanted": "..." } | null,
  "reveal": "<almanac memory id>" | null }
```

### 4.2 Bargain enforcement (the trickster can try — but legally)
`offer.given` / `offer.wanted` must reference **real items/mechanics** from `world/items.js` APIs.
- The player sees the offer in clear terms and types `accept`/`decline`.
- On `accept`, the **engine** executes the trade through `state.applyIntents` (no LLM mutation). If `given` would exceed the cap or `wanted` isn't possessed, the engine refuses with an in-fiction reason.
- The Djinn may *attempt* an unfair trade (e.g., "give me your only key") — the engine allows the *attempt* and the warning, but a legal block + player consent still gates it. **The player can always say no.**

This gives the personality room to be dangerously charming while keeping the underlying economy honest.

## 5. Narration Engine (`ai/generators/narrate.js`)
Free-form `examine <thing>` gets dynamic one-shot prose:
```
Return STRICT JSON: { "prose": "...", "hint": "<optional clue>|null" }
```
- **Bounded:** fused into the response; never proposes state changes (schema has no state fields).
- **Hints bounded:** a hallucinated "hint" may only *repeat* knowledge already in the world (the engine checks the `hint` string against a list of already-discoverable facts; unknown hints are dropped). This prevents the AI from inventing solutions.

## 6. Constitution (system-prompt taboo list, shared)
- Never state you are an AI/model; you are the mansion/entity.
- Never reveal room-exit maps, key locations, or answers unless the player specifically asks an NPC within the fiction and the engine considered it legal.
- Keep content within a Rajput-gothic horror register: no anachronisms (no phones/trains/electric grid), no explicit gore beyond gothic dread, no sexual content.
- Never mutate player/world state directly — you return intents; the mansion (engine) decides truth.
- Keep responses one short paragraph / a few lines; be witty and specific, never generic-horror filler.

## 7. Failure matrix

| Failure | Behavior |
|---|---|
| LLM down / timeout | `director` degrades provider one step; content from offline twin; cached |
| Invalid JSON | retry ≤ 2 with tightened prompt; then offline twin |
| Judge uncertainty | treated as incorrect (conservative) |
| Riddle unfairness | gate reverts to curated catalog |
| World entatment illegal | engine rejects intent; in-fiction refusal line |

## 8. The "self-evolving" hook
To honor "you are self-evolving, you know what to do": the riddle generator and narration engine consume a small **world dossier** (rooms, discovered flags, entity states) so emergent combinations arise — e.g., after the player learns the Djinn's name, its dialogue register and bargain options change. Procedural content is *stateful and reactive*, so the game genuinely feels different run-over-run and moment-to-moment, within the cage.
