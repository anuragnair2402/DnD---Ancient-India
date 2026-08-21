# THE DJINN OF MEWAR — GAME DESIGN DOCUMENT
### Working title kept: *Mansion Escape: The Star of Mewar*
**Version:** Foundation V1 · **Author:** Design Studio (Jeeves / Harsh Mathur)
**Genre:** Single-player horror-fantasy Interactive Fiction (text adventure) with a live AI Dungeon-Master
**Platform:** Web (React + Vite), CRT-terminal retro aesthetic

---

## 0. Design Lens — "What are we actually building?"

This is a **re-foundation**, not a patch. The previous build ("Mansion Escape 1.0") was a sound *skeleton*: a text adventure that understands verbs, a cursed-Rajasthani-haveli setting with a striking amber-CRT art direction, an oil-clock, a sanity bar, and riddle-gates gating a handful of rooms. It worked, but it played thin. A first-time player saw everything it had to offer in ~10 minutes and had no reason to return.

This document redesigns the game under four full-stack pillars — the same lens a studio would apply on a green-field horror title:

1. **The player must always be making a meaningful choice.** No dead turns, no passive waiting. Every room, every resource, every entity offers a decision with a consequence.
2. **Systems must be honest and legible.** If sanity "does something," it must do something *visible, tactile, and tradeable* — not a hidden death timer.
3. **Progression is a journey, not a checklist.** The world is a place to be *understood*, the horror is a thing to be *grasped*, and victory is *earned* by comprehension — not by walking the one correct path.
4. **The AI is a creative collaborator inside a cage.** The LLM provides unlimited new riddles, living personality, and dynamic narration. The rules engine decides what is *true*. The LLM decides how it *feels*. Never the reverse.

The fantasy we are selling: **you are an antiquarian trapped in a sentient, cursed haveli at midnight, and the entity that owns the place is having a conversation with you.** It will mock you, tempt you, help you, and lie to you. Everything you see is a test of your nerve and your wits.

---

## 1. Pillars (the "non-negotiable engagement rules")

Before any feature, every design decision is checked against these.

### P1. Choice over throughput
The most dangerous design failure in interactive fiction is turning the player into a barcode-scanner: *"open drawer → next room → open drawer."* We fix this by making each location present **at least two viable actions with divergent consequences**, and by making resources (sanity, oil, time, inventory slots, trust) genuinely limited so choices cost something.

### P2. Legible systemic depth
Every number the player can see must map to behavior they can observe:
- **Sanity** → changes what you *perceive* (Otherworld layer, hallucinated objects, garbled text, new verbs).
- **Oil** → darkness encroaches; darkness is dangerous *and* hides secrets.
- **Courage / Resolve / Perception** → roll gates on interactions.
- **Time (turns)** → the pressure clock; but we make time *buyable* and *manipulable*, not a pure death sentence.

### P3. Comprehension is the reward
The deepest puzzles are **learned by investigation**, not brute force: the Djinn's true name, the Rani's sorrow, the priest's betrayal, the resonance that ends the curse. Discovering *why* the mansion is cursed is as rewarding as escaping. This is the Annapurna note.

### P4. The AI is a harnessed intelligence
The system is split into a **Truth Engine** (deterministic rules, authoritative state) and a **Voice Engine** (LLM). The Voice proposes, the Truth disposes. When the LLM is unavailable, the game plays fully offline with a rich deterministic content tree. The player should never be able to tell whether the last sentence was written by a human, a template, or a model — only that the world is alive.

---

## 2. Core Loop

```
        ┌──────────────────────────────────────────────────────────┐
        │  PERCEIVE    →   DECIDE    →   ACT    →   CONSEQUENCE     │
        │  read room   pick among    verb +     world state        │
        │  read entity 2+ options    object     changes, sanity,   │
        │  read self   risk/trade    (move,     oil, time, trust,  │
        │              sanity spend   use,       new info           │
        │                             examine,   → feeds PERCEIVE   │
        │                             talk,      ───────────────────│
        │                             combine)                      │
        └──────────────────────────────────────────────────────────┘
```

The meta-loop the player actually plays: **"What am I willing to trade for the truth?"** — sanity for sight, oil for safety, time for exploration, trust for power. The Djinn's bargains sit exactly on this loop.

---

## 3. The World: The Haveli of Thakur Vikram Singh

### 3.1 Setting & Fiction (kept and deepened)
A 19th-century Rajasthani royal haveli, cursed when the Thakur made a pact with a desert Djinn to protect the **Star of Mewar** — a diamond that must never be sold, for in the stone lives the Djinn. The pact bound the Djinn to the diamond, and the diamond to the vault; to guard it, the haveli itself was made alive — its halls shift, its mirrors reflect other possibilities, its dead cannot leave.

**The central tension:** the curse is not evil for its own sake. It is a *symmetry*. The Thakur's greed trapped the Djinn; the Djinn's prison became the thakur's tomb and the family's madness. The player is a third party who broke in — and now the mansion treats them as the newest piece on a very old board. Whoever leaves does so after *settling an account the dead left open.*

### 3.2 The Cast (Voice Engine personas)
| Entity | Role | What it wants | How it engages |
|---|---|---|---|
| **The Djinn** (primary) | Antagonist-narrator, trickster-sage | Freedom *and* revenge — but genuinely torn; halfway charming | Talks, taunts, philosophizes, **offers bargains** in verse |
| **The Rani** (secondary) | Sorrow-bound ghost | Her child's rattle; an end to her weeping | Pleads, guides, occasionally horrifies |
| **The Mad Court-Priest** (secondary) | Fragment of the pact-making | Someone to finish his ritual *or* confess his failure | Delirious lore, half-true clues |
| **The Thakur's Ghost** | Threat | To keep the pact intact, at any cost | Blocks, attacks, tests courage |
| **The Yaksha** (guardian) | Neutral-power | To be *named* correctly (a classical rule) | Opens only to the knowledgeable |

### 3.3 World Map — three layers, non-linear, ~22 rooms

```
═══════════════════ UPPER (Echo Gallery / Rooftop) ═══════════════════
  [Rooftop & Stars]──[Maharaja's Observatory]
        │                    │
        │                    └──[Tower Stair]── (one-way from Darbar)
        │
═══════════════════ GROUND (the Haveli Proper) ═════════════════════
  [Front Foyer]──[Chowk Courtyard]──[Darbar Hall]──[Tower Stair]
        │              │ │  │  │        │
        │        [Zenana][Mardana][Library][Armory]
        │              │        │        └──[Sheeshqhana (Harem)]
        │              └────────┴─────────── └── (Secret Door → Vault)
        │
        │   down ──────────────────────────────┐   up ──────────┐
═══════════════════ SUBTERRANEAN (The Undercroft) ═════════════════
  [Rasoda Kitchen]──[Fountain Cistern]──[Charnel Vault]
        │                 │                    │
        │                 └──[Smuggler's Tunnel]──[Tamasha Pit]
        │                                      │
        └──── [Djinn's Sanctum (finale — mirror of the vault)]

Secret / gated-by-state nodes:  [Sheesh Mahal (mirror vault, endgame)]
                                 [Echo Veil rooms — only visible at low sanity]
```

**Routing features (the "map is accurate to the story" ask):**
- **Multiple convergent routes.** The Gold resonance can be reached via the Vault *or* the Tamasha Pit — different puzzles, different costs, different lore.
- **One-way passages.** The Tower Stair descends only; the tunnel from the Fountain Cistern collapses behind you. These force *reverse-route planning*.
- **Abilities open the map** (metroidvania-light): the **Rope** lets you climb the Observatory well; the **Ward (ash+bell)** lets you pass the Charnel; **Artisan's Key** opens the Smuggler's Tunnel; low sanity reveals Echo Veil doors. So progression is gated by *understanding*, not linear rooms.
- **Secret doors** (perception checks) and **hidden shortcuts** reward investigation and backtracking.

---

## 4. System Design

### 4.1 Sanity — "The Sight" (the headline redesign)
Sanity is no longer a passive lose-condition. It is **the primary currency of perception**, and it is *tactical*: sometimes the correct play is to **pay sanity down** to see what the sane cannot.

**Tiers (state machine):**
| Tier | Range | What the player sees & can do |
|---|---|---|
| **Lucid** | 100–70 | True world only. Map accurate. Text literal. |
| **Unsettled** | 69–45 | +1 **Courage** (adrenaline). Shadows writhe. Optional *Nightmare vignettes* appear. Some statues seem to *point*. |
| **Haunted** | 44–20 | **Echo Veil doors appear** (invisible Otherworld rooms now perceptible). New verbs: `gaze`, `whisper`, `reach`. False objects can appear in rooms (must be tried to be disbelieved — a kind of "inventory puzzle"). Djinn speaks directly more often. |
| **Fractured** | 19–0 | Strongest Sight: only at this tier can you perceive the **Djinn's true name** and the Sheesh Mahal's secret third mirror. Risk: **Madness Event** on certain actions (screen fracture, forced path, sanity swing toward 0). |

**Mechanical transactions involving sanity:**
- `meditate` / `pray` → restore sanity (costs turns; needs quiet room).
- `surrender` (lose sanity on purpose) → enter the **Echo Veil** at will (previously only reached by damage).
- Hallucinated **objects** — the Haunted tier spawns *decoys* (e.g., a "Ghost Key" that looks real but vanishes); examining reveals truth and costs a turn. This is a real inventory-deception puzzle.
- Courage checks & spirit defenses consume sanity as "psychic fuel."
- The sane path and the Sighted path **reach different truths** → ties directly into multiple endings.

### 4.2 Oil & Light — the pressure economy
- Lantern oil drains per turn; darkness raises the risk of sanity loss and hides details.
- Oil is **refillable** (craft oil from rendered fat; find flasks) but each refill costs an inventory slot or turns → scarcity of *capacity*, not just quantity.
- Some interactions require light (read fine print, see mirror inscription); others are *only in darkness* (the Rani appears only in unlit rooms) → trading light for safety vs darkness for knowledge.

### 4.3 Attributes → "roll gates" (petri-net interaction checks)
Attributes aren't just passive numbers; they gate verbs:
- **Resolve** → force open weak doors, resist Madness Events.
- **Perception** → reveal secret doors, read hidden inscriptions, spot decoys.
- **Courage** → pass spirits un-warded, confront the Thakur's ghost.
- **Terror** → a *threat multiplier*: high-terror states make Sanity loss per dread interaction higher (risk taken by low-courage classes / by entering high-aura rooms).

Checks are **soft** (a chance + a cost) and **hard** (requires item/state), always legibly reported ("Your Resolve falters…").

### 4.4 Inventory & Item Verb Expansion
- Slots remain limited (6) → meaningful choice of what to carry.
- **Combine/craft:** `combine oil + wick` → refill; `ash + bell` → Ward; `herbs + silk` → incense of calm; `bronze key + hammer` → pry-shiv (if you break the key — a real sacrifice of progression). Crafting recipes are discovered through the Journal or by experimentation.
- **Container/use verbs:** `read`, `open`, `search`, `use X on Y`, `give X to ENTITY`, `drop`, `take`.
- **Trade:** offer items to entities (the Djinn, the Rani) — bargains.

### 4.5 Puzzle Taxonomy (beyond riddles)
1. **Procedural Gate Riddles** (Voice Engine — see §5): LLM-generates, engine-validates, judge-pass accepts alternatives.
2. **Element Locks** — five shrines must be *actuated in the resonance order* found in the priest's cursive (a readable, non-LLM logic puzzle).
3. **Light Order** — light the observatory lamps in the constellation order to reveal the star-chart.
4. **Mirror Angles** — in the Sheeshqhana, angle three mirrors to focus a moonbeam onto a point (state puzzle).
5. **Item fabrication** — build the tools you need from parts.
6. **Entity negotiations** — give the Rani her rattle, name the Yaksha, answer the Djinn in its own game of wits.
7. **Sanity-gated sight puzzles** — read a message only visible when Fractured, at the risk of a Madness Event.
8. **Timed pressure** — a corridor seals after N turns; the fountain cistern floods after a bell is rung (stateful urgency).

### 4.6 Multiple Endings & Resonance
The finale is a **Resonance choice** (tied to what the player learned):
- **Banished** — you destroyed the pact, freed the Star, and walked out clean (the "pure" win).
- **Betrayed** — you take the diamond and abandon the Djinn to its prison (greed win — shorter, but the Rani's coda damns you).
- **Ally** — you free the Djinn and take nothing, earning the true name of every ghost (the "good" win; hardest, unlocks almanac).
- **Host** — you accept the curse into yourself (dark win — the "what have I become" ending).
Victory condition is no longer a single "have all keys." **The keys/prisons are consumables** — you can *spend* the Bronze/ Silver/Gold surprises on the resonance board, which changes the ending.

### 4.7 Meta-Progression & Replayability (persistent localStorage)
- **The Almanac / Bestiary / Journal:** "you have learned X of Y" discoveries persist between runs → discovery XP and a codex.
- **Echo Vignettes:** short unlockable memories (the Rani's story, the priest's failure) shown on the title screen as you unlock them.
- **Higher Resonance (New Game+):** re-rolls all procedural riddles, raises dread, shrinks the oil clock, unlocks a hidden True-Resonance ending for the truly committed.

---

## 5. The Voice Engine — "LLM inside a cage" (see docs/03 for spec)

### 5.1 Principles
- The **Truth Engine** (deterministic `world/` + `engine/`) owns all state: rooms, items, keys, sanity, oil, win/loss. The **LLM can never mutate truth directly** — it may only *propose* intents, which the engine validates against a whitelist.
- Every LLM call returns **structured JSON** (schema-forced), and is passed through **two validators**: a *schema validator* (shape) and a *world validator* (the proposed delta is legal given current state).
- If the LLM is down, slow, or non-compliant, the game **silently falls back** to deterministic content (the same features exist, just more templated). The player should never dead-end.

### 5.2 Procedural Riddle Engine ("new riddles every time, two answers accepted")
1. **Generator:** given a seeded context (gate, difficulty, occult flavor), the LLM produces a riddle with a canonical answer + 3 accepted variants + a hint, as JSON.
2. **Judicial pass (the "two different answers" feature):** when a player's free-text answer doesn't lexically match, the **Judge** LLM call decides semantic correctness ("is this a legitimate alternate answer to *this* riddle?"). Crucially the Judge is a *different* prompt from the Generator and is run with a **conservative prior** (abstain → false). To prevent "anything counts," the Judge is capped: a gate can accept at most **2 semantic (non-lexical) answers**, and the semantic judge carries a small sanity cost to the player — so guessing is never free.
3. **Fairness guardrail:** the Generator's answer is **round-trip checked** — we ask a second, independent model pass "given this riddle and this answer, is the riddle solvable and unambiguous?" Only puzzles passing both passes are installed. Failed generations fall back to the curated catalog.
4. **Deterministic fallback:** a hand-authored catalog of ~30 quality riddles covering all gates exists in `world/riddles.js`, so the game is always solvable offline.

### 5.3 Personality System ("the personality talks to you")
- Each entity has a **personality card** (register, vocabulary, tics, goals, taboo lines) injected into a system prompt.
- Dialogue flows through a controlled **schema**: `{"line": "...", "mood": "...", "offer": {given, wanted} | null, "reveal": "<lore id>|null"}`.
- **Bargains are deterministic** only: the LLM may propose an offer, but the *engine* checks the `given`/`wanted` items exist and are legal, and may reject an unfair trade. So the trickster can *try* to cheat — and the engine lets it — but only within legal item-space, and it always warns the player. This keeps the trickery meaningful but the *player* always able to see the terms and say no.

### 5.4 Other LLM uses
- **Dynamic environmental narration** for free-form `examine` (bounded, one-shot, no state).
- **Atmosphere cues** that respond to sanity tier (progressive dread text).
- **Almanac flavor** generation (bounded, cached).

---

## 6. Quality Bar

- **Writing:** every line of ambient prose passes a "read it aloud at midnight" test — dark, witty, and *specific* to Rajasthan (jharokhas, ghungroos, sandalwood, desert djinn, stepwells, sheesh-mahals). No generic haunted-house filler.
- **Fairness:** every death is foreshadowed; every puzzle has a solvable clue trail; the Judge never accepts a non-answer.
- **Performance:** text adventures must feel instant. Deterministic paths resolve in <1ms; LLM calls are non-blocking with a "Consulting ancient lore…" shimmer and full offline fallback. Riddle/entity generation is pre-fetched and cached at run start when possible.
- **Replay:** a run ends in 20–35 minutes; the Almanac + Higher Resonance + procedural riddles make a second and third run genuinely different.

---

## 7. Content Scope (Foundation V1 — this branch)

| System | Status in this branch |
|---|---|
| Core Truth Engine (rooms, exits, verbs, items, checks) | ✅ rebuilt & expanded |
| ~22-room, 3-layer non-linear map + secret/sanity doors | ✅ |
| Sanity "Sight" system with 4 tiers + Echo Veil + decoy objects + meditate/surrender/ward verbs | ✅ |
| Oil/light pressure + crafting | ✅ |
| Puzzle taxonomy (element locks, light order, mirrors, fabrication, negotiations, sight) | ✅ |
| Multiple Resonance endings + score chronicle | ✅ |
| Procedural Riddle Engine (LLM generate → validate → judge) + curated fallback | ✅ |
| Personality Engine (Djinn/Rani/Priest/Yaksha/Thakur) with controlled bargains | ✅ |
| Almanac/Bestiary meta-progression + Higher Resonance (localStorage) | ✅ |
| New/expanded SVG map (3 layers) + expanded Help modal + entity/sanity UI | ✅ |
| Tests for all engines + full play-simulation | ✅ |
| Playtest pass (scripted + live browser) | ✅ |

**Deliberately deferred to later branches:** full audio score, save-game mid-run persistence (only meta-progression persists now), mobile-first layout polish, and in-browser WebLLM voice (WebLLM wiring is preserved and extended to the new schema).

---

## 8. Acceptance Criteria (how we know it's better)

1. A first-time player faces a *choice* within the first 10 actions (not a single instruction-follow).
2. Sanity can be *spent down deliberately* to gain information/access that the sane path cannot reach.
3. Two different (both correct) answers to a generated riddle are both accepted at least once.
4. The 'recharge run' (a second playthrough) yields at least one riddle, one route, and one ending not seen in the first.
5. Reducing to offline mode still produces a complete, solvable, interesting game.
6. No more than ~2 turns are ever "wasted" without a decision surface.
