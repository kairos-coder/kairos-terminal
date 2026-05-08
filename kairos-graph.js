// kairos-graph.js — Temporal Mythic Graph
// Kùzu-WASM embedded graph, runs entirely in-browser

let KuzuModule = null;

class KairosGraph {
  constructor() {
    this.db = null;
    this.ready = this._init();
  }

  async _init() {
    if (!KuzuModule) {
      KuzuModule = await import('https://cdn.jsdelivr.net/npm/kuzu-wasm@latest/dist/kuzu-wasm.js');
    }
    this.db = new KuzuModule.Kuzu.Database(':memory:');
    await this.db.execute(`CREATE NODE TABLE Token (body STRING, domain STRING, word_type STRING, score DOUBLE, extracted_at STRING, PRIMARY KEY (body))`);
    await this.db.execute(`CREATE REL TABLE Coupling (FROM Token TO Token, relation_type STRING, visual_modifier STRING, composed_at STRING)`);
    await this.db.execute(`CREATE REL TABLE Transformation (FROM Token TO Token, verb STRING, verb_class STRING, tension DOUBLE, transformed_at STRING)`);
  }

  async rememberToken(token) {
    await this.ready;
    await this.db.execute(`MERGE (t:Token {body: $body}) SET t.domain = $domain, t.word_type = $word_type, t.score = $score, t.extracted_at = $ts`,
      { body: token.body, domain: token.domain, word_type: token.word_type, score: token.score, ts: token.extracted_at });
  }

  async rememberCoupling(a, b, relation, modifier, ts) {
    await this.ready;
    await this.db.execute(`MATCH (a:Token {body: $a}), (b:Token {body: $b}) CREATE (a)-[:Coupling {relation_type: $rel, visual_modifier: $mod, composed_at: $ts}]->(b)`,
      { a, b, rel: relation, mod: modifier, ts });
  }

  async rememberTransformation(subj, verb, obj, verbClass, tension, ts) {
    await this.ready;
    await this.db.execute(`MATCH (s:Token {body: $s}), (o:Token {body: $o}) CREATE (s)-[:Transformation {verb: $v, verb_class: $vc, tension: $t, transformed_at: $ts}]->(o)`,
      { s: subj, o: obj, v: verb, vc: verbClass, t: tension, ts });
  }

  async getSpiralNarrative(cycles = 3) {
    await this.ready;
    const cycleMs = 16 * 60 * 1000;
    const since = new Date(Date.now() - cycles * cycleMs).toISOString();
    return await this.db.execute(`MATCH (a:Token)-[c:Coupling]->(b:Token) WHERE c.composed_at > $since RETURN a.body, b.body, c.relation_type, c.visual_modifier, c.composed_at ORDER BY c.composed_at ASC`, { since });
  }

  async getDomainTensions() {
    await this.ready;
    return await this.db.execute(`MATCH (a:Token)-[c:Coupling]->(b:Token) RETURN a.domain AS da, b.domain AS db, count(*) AS n ORDER BY n DESC`);
  }
}

const kairosGraph = new KairosGraph();
export { kairosGraph, KairosGraph };
