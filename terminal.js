// terminal.js — Kairos Terminal UI Shell
// Wires the KairosKernel to the DOM. Handles input, history, and keybindings.

import { KairosKernel } from './kairos-kernel.js';

const historyEl = document.getElementById('history');
const inputEl = document.getElementById('prompt-input');
const kernel = new KairosKernel({ historyEl });

let cmdHistory = [];
let histIdx = -1;

inputEl.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const text = inputEl.value.trim();
    if (!text) return;
    
    cmdHistory.push(text);
    histIdx = cmdHistory.length;
    inputEl.value = '';
    
    await kernel.handleCommand(text);
  }
  
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histIdx > 0) {
      histIdx--;
      inputEl.value = cmdHistory[histIdx];
    }
  }
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIdx < cmdHistory.length - 1) {
      histIdx++;
      inputEl.value = cmdHistory[histIdx];
    } else {
      histIdx = cmdHistory.length;
      inputEl.value = '';
    }
  }
  
  // Tab autocomplete
  if (e.key === 'Tab') {
    e.preventDefault();
    const partial = inputEl.value.toLowerCase();
    const commands = ['help', 'sync', 'cantica', 'graph', 'clear'];
    const match = commands.find(c => c.startsWith(partial) && c !== partial);
    if (match) inputEl.value = match;
  }
});

// Boot message
kernel.print('🏛️  Kairos Terminal — temporal mythic graph active');
kernel.print('Type "help" for commands · "sync" to load from KairosDB');
kernel.print('');
