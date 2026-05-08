// kairos-cantica.js — Spiral narrative weaver
import { kairosGraph } from './kairos-graph.js';

class KairosCantica {
  async spiral(cycles = 3) {
    const rows = await kairosGraph.getSpiralNarrative(cycles);
    if (!rows?.length) return '(the spiral is silent — no couplings yet)';
    return rows.map(r =>
      `${r['a.body']} —[${r['c.relation_type']}]→ ${r['b.body']}`
    ).join('\n');
  }

  async tensions() {
    const rows = await kairosGraph.getDomainTensions();
    if (!rows?.length) return '(no domain tensions recorded)';
    return rows.map(r =>
      `${r.da} × ${r.db}: ${r.n} couplings`
    ).join('\n');
  }
}

const kairosCantica = new KairosCantica();
export { kairosCantica };
