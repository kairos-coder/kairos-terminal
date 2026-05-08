// kairos-kernel.js — Command router
import { kairosGraph } from './kairos-graph.js';
import { kairosStorage } from './kairos-storage.js';
import { kairosCantica } from './kairos-cantica.js';

class KairosKernel {
  constructor({ historyEl }) {
    this.historyEl = historyEl;
    this.commands = {
      help: () => this.print('Commands: help | sync | cantica spiral [N] | cantica tensions | graph status | clear'),
      sync: () => this.cmdSync(),
      cantica: (args) => this.cmdCantica(args),
      graph: (args) => this.cmdGraph(args),
      clear: () => { this.historyEl.innerHTML = ''; }
    };
  }

  print(line) {
    const div = document.createElement('div');
    div.textContent = line;
    this.historyEl.appendChild(div);
    this.historyEl.scrollTop = this.historyEl.scrollHeight;
  }

  async handleCommand(raw) {
    this.print(`> ${raw}`);
    const [cmd, ...args] = raw.trim().split(/\s+/);
    const fn = this.commands[cmd];
    if (!fn) { this.print(`Unknown: ${cmd}`); return; }
    try { await fn(args); } catch (e) { this.print(`Error: ${e.message}`); }
  }

  async cmdSync() {
    this.print('Syncing from KairosDB...');
    const result = await kairosStorage.syncDown();
    this.print(`Loaded: ${result.tokens} tokens · ${result.pairs} pairs · ${result.triplets} triplets`);
  }

  async cmdCantica([mode, n]) {
    if (mode === 'spiral') {
      const text = await kairosCantica.spiral(Number(n) || 3);
      this.print(text);
    } else if (mode === 'tensions') {
      const text = await kairosCantica.tensions();
      this.print(text);
    } else {
      this.print('Usage: cantica spiral [N] | cantica tensions');
    }
  }

  async cmdGraph([mode]) {
    if (mode === 'status') {
      await kairosGraph.ready;
      this.print('Graph: online (Kùzu-WASM in-memory)');
      this.print('Schema: Token nodes, Coupling edges, Transformation edges');
    } else {
      this.print('Usage: graph status');
    }
  }
}

export { KairosKernel };
