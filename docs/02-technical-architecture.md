# TECHNICAL ARCHITECTURE — "THE DJINN OF MEWAR"
**Version:** Foundation V1

## 1. Layering principle: Truth Engine + Voice Engine

The single most important architectural decision: **the AI must never own game state.**

```
       ┌────────────────────────────────────────────────────────────┐
       │                        UI  (React)                          │
       │  menu · creator · terminal · map · entity/sanity · codex    │
       └───────────────▲───────────────────────────────▲─────────────┘
                       │ commands                     │ state/props
        ┌──────────────┴───────────┐   ┌───────────────┴──────────────┐
        │    TRUTH ENGINE (own)    │   │  AI DIRECTOR SERVICE (ai/)    │
        │  engine/  world/         │   │  director.js  → orchestration │
        │  • owns authoritative    │ ◄─│  generators/  → content       │
        │    player + world state  │   │    riddleGen.js (gen+judge)   │
        │  • validates ALL state   │   │    persona.js    (entities)   │
        │    changes (whitelist)   │   │    narration.js  (flavor)     │
        │  • resolves commands     │   │  harness/  → validators       │
        │  • decides win/loss      │   │    schema.js  shape checks    │
        └──────────────┬───────────┘   │    world.js   legality checks │
                       │              │  providers/  → gemini / webllm │
                       │              └───────────────────────────────┘
         proposed intents (never direct mutation) ⇄ validated intents
```

**Data flow when the player types a command:**
1. `App` sends the raw command to the **Truth Engine** (`engine/parser.js` → `engine/resolver.js`).
2. The resolver classifies the command as: **system / movement / interaction / craft / entity / examine / generative**.
3. Deterministic content resolves instantly and returns a **result object** `{ storyText, objective, stateUpdates, requiresRiddle, requiresEntity, promptHint }`.
4. If a step needs the **Voice Engine** (a fresh riddle, entity speech, free-form examine):
   - The resolver emits a *request descriptor* (not free text) with the allowed effect scope.
   - `director.js` calls the appropriate generator with a system prompt + bounded context.
   - The generator returns **structured JSON** → `harness/schema.js` validates shape → `harness/world.js` validates legality → only then is the resulting intent handed back to the resolver to apply through `engine/state.js` `apply()`.
5. All state mutations funnel through a single `state.apply(intents)` that clamps to [0..max], respects the 6-slot inventory cap, flags keys, and triggers win/loss evaluation.

**Why this matters:** even if the LLM produces a brilliant, insubordinate response that *says* "you now have all three keys," it cannot — the world validator rejects the key-flag because no legal intent grants it. The writing can be wild; the *world* stays coherent.

## 2. Directory layout (new `src/game` colocated with `src/ui`)

```
src/
  main.jsx
  ui/
    App.jsx                 ← orchestration + screens (rewritten)
    components/
      Terminal.jsx          ← log feed + prompt (from App)
      MansionMap.jsx        ← NEW 3-layer SVG map
      EntityPanel.jsx       ← NEW Djinn/entity presence + talk/trade
      SanityGauge.jsx       ← NEW tiered visibility
      Codex.jsx             ← NEW almanac/bestiary (localStorage)
      HelpModal.jsx         ← expanded verb reference
      CharacterCreator.jsx  ← expanded (4th class? keep 3, tune)
      AudioEngine.js        ← kept
  game/
    engine/
      state.js              ← authoritative player/world state + apply()
      parser.js             ← command classification & tokeniser
      resolver.js           ← command → result + Voice requests
      checks.js             ← attribute roll-gates, sanity tiers, madness
      endings.js            ← resonance evaluation + scoring
    world/
      world.js              ← room graph, exits, layers, secret doors
      items.js              ← item defs, combine recipes, containers
      entities.js           ← entity cards (Djinn, Rani, Priest, Yaksha, Thakur)
      riddles-curated.js    ← deterministic fallback riddle catalog
      beats.js              ← ambient prose, turn dread-beats, sanity vignettes
    ai/
      director.js           ← orchestrates providers, caching, fallback
      harness/
        schema.js           ← JSON schema validators
        world-guard.js      ← intent legality whitelist
        judge.js            ← semantic answer reviewer (conservative prior)
      generators/
        riddleGen.js        ← procedural riddle generation + round-trip
        persona.js          ← entity dialogue/bargain generation
        narrate.js          ← free-form environmental flavor
      providers/
        provider.js         ← adapter interface
        gemini.js
        webllm.js           ← preserved, adapted to schema
    meta/
      almanac.js            ← discoveries, bestiary, Higher Resonance
  index.css, App.css        ← styling (extended, same art direction)
```

## 3. State model (authoritative)

```js
player = {
  name, classId,
  stats: { sanity:100,maxSanity:100, resolve, perception, courage, terror, maxResolve },
  inventory: [itemId, ...],   // max 6
  keys: { bronze, silver, gold },   // flags; may be spent
  flags: { learnedDjinnName, madeWard, freedRani, ... },
  craftKnowledge: [recipeId, ...]
}
world = {
  currentRoom: 'Front Foyer',
  turn: 1, maxTurns: 50,
  oil: 100, maxOil: 100, lit: true,
  unlockedGates: { 'A->B': true },
  doorStates: { elementOrder: [], mirrorsAngled: 0, observatoryLampsLit: [] },
  entityStates: { djinn: {...}, rani: {...}, yaksha: {...} },
  riddleInstances: { 'gateId': {riddle, answer, variants, hint, usedSemantic: 0} },
  objective, log: [...],  // log lives in React, engine returns append
  status: 'creation'|'playing'|'gameover'|'victory'|'resonance'
}
```

**Single mutation surface:** `engine/state.js::applyIntents(state, intents)`:
- `{sanity: n}`, `{oil: n}`, `{addItem}`, `{removeItem}`, `{setKey}`, `{spendKey}`, `{move}` (validated against open exits), `{unlockGate}`, `{setDoor}`, `{setEntity}`, `{learnCraft}`, `{setFlag}`, `{turn:+}`.
- Clamps, cap-checks, and returns a normalized diff + optional win/loss signal.

## 4. Sanity tier machine (`engine/checks.js`)

```
tierOf(sanity): Lucid(100-70) | Unsettled(69-45) | Haunted(44-20) | Fractured(19-0)
Sight access: Fractured ⇐ Echo Veil doors visible; Haunted ⇐ other echoes
surrender() → sanity -25 in a safe room, grants Veil access token (1 use/turn)
meditate()  → sanity +20, costs 1 turn, requires low-aura room
```
Tier transitions fire an **atmosphere event** (append to log + UI glow shift).

## 5. Events / turn beats
`resolver` appends turn-beats (dread at 45/30/15), sanity-tier vignettes, and chronometer pressure (a corridor sealing, the cistern flooding) via `world/beats.js`.

## 6. Meta / persistence (`meta/almanac.js`)
- `almanac` in localStorage: discovered room ids, entity-memories, ending flags, bestiaries, stats.
- `unlockMemory(id)` → title-screen vignette.
- **Higher Resonance:** a `{higherResonance:true}` flag re-seeds riddles, raises `STATUS.dread`, shrinks oil economy, enables True-Resonance ending condition.

## 7. Offline / degradation
Every Voice Engine feature has a deterministic twin:
- Riddles → `world/riddles-curated.js` (30+ quality riddles, per-gate pools).
- Entity dialogue → `world/entities.js` canned lines per mood.
- Narrate → `world/beats.js` rich ambient pool.
`director.js` picks providers by priority: `gemini` (if key) > `webllm` (if ready) > `offline`. All failures degrade one step and are cached to avoid repeated calls.

## 8. Build / test
- `npm run test` → vitest across `engine/*`, `ai/harness/*`, `meta/*`, plus a **play-simulation** that walks a full scripted run through the Truth Engine and asserts win/reward invariants.
- `npm run build` → vite (code-split the heavy webllm chunk).
- Lint: `npm run lint`.
