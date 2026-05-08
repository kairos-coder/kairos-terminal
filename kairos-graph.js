// kairos-graph.js — Temporal Mythic Graph
// Primary: Kùzu-WASM (graph database in browser)
// Fallback: Pure JS in-memory graph (always works)

class KairosGraph {
  constructor() {
    this.db = null;
    this.mode = 'js'; // 'kuzu' or 'js'
    this.ready = this._init();
  }

  async _init() {
    // Try Kùzu-WASM first, fall back to pure JS
    try {
      const KuzuModule = await import('https://esm.sh/kuzu-wasm@0.0.1');
      this.db = new KuzuModule.Kuzu.Database(':memory:');
      await this.db.execute(`CREATE NODE TABLE Token (body STRING, domain STRING, word_type STRING, score DOUBLE, extracted_at STRING, PRIMARY KEY (body))`);
      await this.db.execute(`CREATE REL TABLE Coupling (FROM Token TO Token, relation_type STRING, visual_modifier STRING, composed_at STRING)`);
      await this.db.execute(`CREATE REL TABLE Transformation (FROM Token TO Token, verb STRING, verb_class STRING, tension DOUBLE, transformed_at STRING)`);
      this.mode = 'kuzu';
      console.log('KairosGraph: Kùzu-WASM loaded');
    } catch (e) {
      // Pure JS fallback
      console.log('KairosGraph: Using pure JS fallback (Kùzu-WASM unavailable)');
      this.db = {
        tokens: new Map(),
        couplings: [],
        transformations: []
      };
      this.mode = 'js';
    }
  }

  async rememberToken(token) {
    await this.ready;
    if (this.mode === 'kuzu') {
      await this.db.execute(
        `MERGE (t:Token {body: $body}) SET t.domain = $domain, t.word_type = $word_type, t.score = $score, t.extracted_at = $ts`,
        { body: token.body, domain: token.domain, word_type: token.word_type, score: token.score, ts: token.extracted_at }
      );
    } else {
      this.db.tokens.set(token.body, {
        body: token.body,
        domain: token.domain,
        word_type: token.word_type,
        score: token.score,
        extracted_at: token.extracted_at
      });
    }
  }

  async rememberCoupling(a, b, relation, modifier, ts) {
    await this.ready;
    if (this.mode === 'kuzu') {
      await this.db.execute(
        `MATCH (a:Token {body: $a}), (b:Token {body: $b}) CREATE (a)-[:Coupling {relation_type: $rel, visual_modifier: $mod, composed_at: $ts}]->(b)`,
        { a, b, rel: relation, mod: modifier, ts }
      );
    } else {
      this.db.couplings.push({ a, b, relation_type: relation, visual_modifier: modifier, composed_at: ts });
    }
  }

  async rememberTransformation(subj, verb, obj, verbClass, tension, ts) {
    await this.ready;
    if (this.mode === 'kuzu') {
      await this.db.execute(
        `MATCH (s:Token {body: $s}), (o:Token {body: $o}) CREATE (s)-[:Transformation {verb: $v, verb_class: $vc, tension: $t, transformed_at: $ts}]->(o)`,
        { s: subj, o: obj, v: verb, vc: verbClass, t: tension, ts }
      );
    } else {
      this.db.transformations.push({ subject: subj, verb, object: obj, verb_class: verbClass, tension, transformed_at: ts });
    }
  }

  async getSpiralNarrative(cycles = 3) {
    await this.ready;
    const cycleMs = 16 * 60 * 1000;
    const since = new Date(Date.now() - cycles * cycleMs).toISOString();

    if (this.mode === 'kuzu') {
      return await this.db.execute(
        `MATCH (a:Token)-[c:Coupling]->(b:Token) WHERE c.composed_at > $since RETURN a.body, b.body, c.relation_type, c.visual_modifier, c.composed_at ORDER BY c.composed_at ASC`,
        { since }
      );
    } else {
      const filtered = this.db.couplings
        .filter(c => c.composed_at > since)
        .sort((a, b) => a.composed_at.localeCompare(b.composed_at));
      
      return filtered.map(c => ({
        'a.body': c.a,
        'b.body': c.b,
        'c.relation_type': c.relation_type,
        'c.visual_modifier': c.visual_modifier,
        'c.composed_at': c.composed_at
      }));
    }
  }

  async getDomainTensions() {
    await this.ready;
    if (this.mode === 'kuzu') {
      return await this.db.execute(
        `MATCH (a:Token)-[c:Coupling]->(b:Token) RETURN a.domain AS da, b.domain AS db, count(*) AS n ORDER BY n DESC`
      );
    } else {
      const tensions = {};
      for (const c of this.db.couplings) {
        const tokenA = this.db.tokens.get(c.a);
        const tokenB = this.db.tokens.get(c.b);
        if (tokenA && tokenB) {
          const key = `${tokenA.domain} × ${tokenB.domain}`;
          tensions[key] = (tensions[key] || 0) + 1;
        }
      }
      return Object.entries(tensions)
        .sort((a, b) => b[1] - a[1])
        .map(([key, n]) => ({ da: key.split(' × ')[0], db: key.split(' × ')[1], n }));
    }
  }
}

const kairosGraph = new KairosGraph();
export { kairosGraph, KairosGraph };
