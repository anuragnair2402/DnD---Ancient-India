// GameSession: the playable game loop. Mutable, testable, and the single place App
// and automated playtests drive the game. AI hooks are injected and async; when they are
// absent or fail, the session degrades to its deterministic offline behaviour.

import { cloneState, applyIntents, hasItem, normalize } from './state.js';
import { resolveCommand, checkRiddleAnswer } from './resolver.js';
import { sanityTierOf } from '../world/world.js';
import { globalTurnBeat } from '../world/beats.js';
import { cannedLine } from '../world/entities.js';
import { genericExamine } from '../world/beats.js';
import { ROOMS, GATES } from '../world/world.js';

export class GameSession {
  constructor(initialState, hooks = {}) {
    this.state = cloneState(initialState);
    this.state.status = 'playing';
    this.log = [];
    this.activeRiddle = null;    // gateHit in progress
    this.pendingOffer = null;
    this.semanticAnswers = 0;    // gate-level semantic accepts handled in riddle instance
    this.hooks = hooks;
    this.ended = false;
    this.result = { playMode: 'playing' };
  }

  run(raw) {
    const cmd = resolveCommand(this.state, raw, {
      board: this.boardActive,
      pendingOffer: this.pendingOffer
    });
    return cmd;
  }

  get boardActive() {
    return this.state.world.currentRoom === 'djinn_sanctum';
  }

  async submit(raw) {
    if (this.ended) return this.result;
    this.log = [];

    const beforeTurn = this.state.world.turn;

    // 1. Riddle answering mode
    if (this.activeRiddle) {
      await this.handleRiddleAnswer(raw);
      return this.flush();
    }

    // 2. Normal command resolution
    const r = this.run(raw);
    if (r.gateHit) {
      this.activeRiddle = r.gateHit;
      this.state.world.objective = r.objective;
      // Voice Engine: if online, upgrade the curated riddle to a freshly generated one
      // (schema-caged + fairness-gated in the director). Offline: this is a no-op and
      // the curated catalog instance from the resolver stands.
      const storyText = await this.maybeUpgradeRiddle(r);
      this.push('narrative', storyText);
      return this.flush();
    }
    if (r.pendingOffer) {
      this.pendingOffer = r.pendingOffer;
    }

    // 3. Apply resolved intents
    if (r.intents && r.intents.length) {
      const res = applyIntents(this.state, r.intents);
      this.state = res.state;
    }

    this.push('narrative', r.storyText);

    // 4. AI enrichment (persona / narrate)
    if (r.aiRequest) {
      await this.enrich(r.aiRequest);
    }

    // 5. Turn accounting + ambient costs + dread beats
    if (r.tookTurn) {
      this.applyEndOfTurn(r);
    }

    // 6. Win / loss / finale
    if (r.finale) {
      return this.triggerEnding(r.finale);
    }
    this.evaluateDeath();

    return this.flush();
  }

  applyEndOfTurn(r) {
    this.state.world.turn += 1;
    const costs = {
      oil: r.costOil !== false ? 2 : 0,
      sanity: r.costSanity !== false ? this.ambientSanity() : 0
    };
    const wasLit = this.state.world.lit;
    if (costs.oil) this.state.world.oil -= costs.oil;
    if (costs.sanity) this.state.player.stats.sanity -= costs.sanity;
    // single clamp/derive pass — keeps the session's direct writes inside the same
    // invariants the Truth Engine's applyIntents enforces (incl. lit <=> oil > 0)
    normalize(this.state);
    if (wasLit && !this.state.world.lit) {
      this.push('system', 'Your lantern gutters and dies. The dark leans in, and the house seems to hold its breath. (Refill oil to relight it — light is safety, and some things prefer you blind.)');
    }
    let beat = globalTurnBeat(this.state.world.turn, this.state.world.maxTurns);
    if (beat) this.push('system', beat);
  }

  ambientSanity() {
    const aura = this.auraOf();
    const courage = this.state.player.stats.courage || 8;
    let cost = aura * 0.25;
    if (!this.state.world.lit) cost += 1.2;
    if (sanityTierOf(this.state.player.stats.sanity) === 'fractured') cost += 0.8;
    cost -= courage * 0.06;
    return Math.max(0, Math.round(cost * 10) / 10);
  }

  auraOf() {
    const room = ROOMS[this.state.world.currentRoom];
    const aura = (room && room.aura) || 4;
    // keep the authoritative aura on state so the UI/other systems can read it
    this.state.world.roomAura = aura;
    return aura;
  }

  // If the director can generate (online provider), replace the resolver's curated
  // riddle instance for this gate with a generated, fairness-validated one and return
  // the rewritten gate prompt. On any failure or offline mode, return the original text.
  async maybeUpgradeRiddle(r) {
    const gen = this.hooks.riddleFor;
    if (!gen) return r.storyText;
    const { from, to, gateId } = r.gateHit;
    const gate = GATES[gateId] || null;
    try {
      const seed = this.state.world.runSeed + Object.keys(this.state.world.riddleInstances).length;
      const fresh = await safe(gen(gate || { name: gateId, category: 'shadow' }, seed));
      if (!fresh || fresh.source !== 'generated') return r.storyText;
      const inst = this.state.world.riddleInstances[gateId];
      if (!inst) return r.storyText;
      this.state.world.riddleInstances[gateId] = {
        ...inst, riddle: fresh.riddle, answer: fresh.answer, variants: [...fresh.variants], hint: fresh.hint, source: 'generated'
      };
      const room = ROOMS[to];
      return `[GATE SEALED: ${(gate ? gate.name : 'the ward').toUpperCase()}]\nAn ancient ward blocks your path to ${room.name}. A ghostly whisper rises from the stone:\n\n\u201c${fresh.riddle}\u201d\n\n(Type the answer to unseal the gate.)`;
    } catch (e) {
      return r.storyText;
    }
  }

  async enrich(req) {
    if (req.type === 'persona') {
      const line = this.hooks.persona
        ? await safe(this.hooks.persona(req.entity, req.mood, req.context))
        : null;
      this.push('entity', line || cannedLine(req.entity, req.mood));
      // attach a legal offer if the personality proposes one
      if (this.hooks.personaOffer) {
        const off = await safe(this.hooks.personaOffer(req.entity, this.state));
        if (off && off.given && this.validateOffer(off)) {
          this.pendingOffer = { ...off, byName: entityName(req.entity) };
          const receiveDesc = off.receive ? off.receiveText || off.receive : (off.sanityCost ? 'the calm of a moment not spent in the dark' : 'its favour');
          const ask = `\n\n[THE BARGAIN] ${entityName(req.entity)} proposes: **you give** ${off.giveName || off.given}; **you receive** ${off.wantedText || receiveDesc}.\n(Type ACCEPT or DECLINE.)`;
          this.push('entity', (off.offerText ? off.offerText + '\n' : '') + ask);
        } else if (off && off.line) {
          this.push('entity', off.line);
        }
      }
    } else if (req.type === 'narrate') {
      const prose = this.hooks.narrate ? await safe(this.hooks.narrate(req)) : null;
      if (prose) this.push('narrative', prose);
    }
  }

  validateOffer(off) {
    // LLM cannot invent items: given/receive must map to real items or 'sanity'
    const real = (id) => id === 'sanity' || ['oil_flask','matches','bronze_key','silver_key','gold_key','rattle','herbs','silk_cloth','sacred_ash','incense_of_calm','star_of_mewar','true_name_scroll','ember','stone_of_sight','rope','artisan_key','ward','magnifying_glass','old_journal','iron_crowbar','brass_bell'].includes(id);
    return (!off.given || real(off.given)) && (!off.receive || real(off.receive));
  }

  async handleRiddleAnswer(raw) {
    const gate = this.activeRiddle;
    const key = `${gate.from}->${gate.to}`;
    const inst = this.state.world.riddleInstances[key];
    const lexical = checkRiddleAnswer(inst, raw);

    // Semantic judge for alternate-but-legit answers ("two different answers")
    if (!lexical.correct && this.hooks.riddleJudge) {
      const sem = await safe(this.hooks.riddleJudge(inst, raw));
      const capUsed = (inst.semanticUsed || 0);
      if (sem && sem.correct && capUsed < 2) {
        inst.semanticUsed = capUsed + 1;
        this.state.player.stats.sanity = Math.max(0, this.state.player.stats.sanity - 5); // strain cost
        this.push('narrative', `[RIDDLE ACCEPTED]\nThe ward considers your answer a long moment, and finds it true. (Semantic answer accepted — Sanity -5)\n${gate.successText}`);
        this.unlockAndEnter(gate, key);
        return;
      }
    }

    if (lexical.correct) {
      this.push('narrative', `[RIDDLE SOLVED!]\n${gate.successText || ''}`);
      this.unlockAndEnter(gate, key);
      return;
    }

    // wrong answer
    inst.wrongAttempts = (inst.wrongAttempts || 0) + 1;
    const attempts = inst.wrongAttempts;

    if (attempts >= 4) {
      // 4th failure: Ward fractures and forces open at a sanity cost
      this.state.player.stats.sanity = Math.max(0, this.state.player.stats.sanity - 10);
      this.state.world.turn += 1;
      const ansUpper = (inst.answer || '').toUpperCase();
      this.push('narrative', `[WARD FRACTURED]\nThe ward's binding shatters from repeated strain! With a dying wail, the spirit gives up its secret: "${ansUpper}!"\n(The gate forces open — Sanity -10)\n\n${gate.successText || ''}`);
      this.unlockAndEnter(gate, key);
      return;
    }

    this.state.player.stats.sanity = Math.max(0, this.state.player.stats.sanity - 5);
    this.state.world.turn += 1;
    const clue = formatProgressiveClue(inst, attempts);
    this.push('narrative', `[INCORRECT ANSWER]\nThe spectral ward pulses with a harsh, chilling light. A voice whispers: "Wrong, mortal." (Sanity -5)\n\n${clue}\n\n(Answer again, or type any other command to leave the gate be.)`);
  }

  unlockAndEnter(gate, key) {
    const rev = `${gate.to}->${gate.from}`;
    this.state.world.unlockedGates[key] = true;
    this.state.world.unlockedGates[rev] = true;
    this.activeRiddle = null;
    // enter the room
    const move = applyIntents(this.state, [{ type: 'move', to: gate.to }, { type: 'turn', delta: 1 }]);
    this.state = move.state;
    this.state.world.oil = Math.max(0, this.state.world.oil - 2);
    const room = ROOMS[gate.to];
    this.push('narrative', `${room.name.toUpperCase()}\n${room.description}`);
    const beat = globalTurnBeat(this.state.world.turn, this.state.world.maxTurns);
    if (beat) this.push('system', beat);
  }

  evaluateDeath() {
    if (this.state.player.stats.sanity <= 0) {
      this.ended = true;
      this.result = { playMode: 'gameover', cause: 'sanity', story: this.log };
    } else if (this.state.world.turn > this.state.world.maxTurns) {
      this.ended = true;
      this.result = { playMode: 'gameover', cause: 'midnight', story: this.log };
    }
  }

  triggerEnding(e) {
    this.ended = true;
    this.result = { playMode: 'victory', finale: e, story: this.log };
    return this.result;
  }

  push(type, text) {
    this.log.push({ type, text });
  }

  flush() {
    const out = {
      playMode: this.result.playMode || 'playing',
      story: this.log,
      activeRiddle: this.activeRiddle,
      pendingOffer: this.pendingOffer,
      finale: this.result.finale || null,
      cause: this.result.cause || null
    };
    this.result = { playMode: out.playMode, finale: out.finale };
    this.log = [];
    return out;
  }
}

function entityName(id) {
  return { djinn: 'Djinn', rani: 'Rani', yaksha: 'Yaksha', priest: 'Court-Priest', thakur: 'Thakur' }[id] || 'entity';
}

async function safe(p) {
  return Promise.resolve(p).catch(e => {
    console.warn('ai hook failed:', e);
    return null;
  });
}

function formatProgressiveClue(inst, attempts) {
  const ans = (inst.answer || '').trim().toLowerCase();
  const hintText = inst.hint || 'Ponder the true nature of the riddle.';
  if (!ans) return `Hint: ${hintText}`;

  if (attempts === 1) {
    return `Hint: ${hintText}`;
  }

  if (attempts === 2) {
    // Reveal word length and first letter: e.g. [ S _ _ _ _ _ ]
    const masked = ans.split('').map((ch, idx) => {
      if (idx === 0) return ch.toUpperCase();
      if (ch === ' ') return ' ';
      return '_';
    }).join(' ');
    return `Hint: ${hintText}\nGhostly Whisper: "The word has ${ans.length} letters: [ ${masked} ]"`;
  }

  // Attempt 3: Reveal first/last letters and vowels
  const masked = ans.split('').map((ch, idx) => {
    if (idx === 0 || idx === ans.length - 1 || 'aeiou'.includes(ch)) return ch.toUpperCase();
    if (ch === ' ') return ' ';
    return '_';
  }).join(' ');
  return `Hint: The ward begins to shudder as your willpower strains its magic.\nGhostly Whisper: "Speak the word: [ ${masked} ]"`;
}
