import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runnerPath = path.join(__dirname, '..', 'src', 'agent-runner.js');

describe('windows bash launcher', () => {
  it('uses Git Bash or PowerShell fallback on win32', () => {
    const src = fs.readFileSync(runnerPath, 'utf-8');

    assert.ok(src.includes('function resolveBashLauncher() {'));
    assert.ok(src.includes("if (os.platform() !== 'win32')"));
    assert.ok(src.includes("'C:\\\\Program Files\\\\Git\\\\bin\\\\bash.exe'"));
    assert.ok(src.includes("return { command: 'powershell.exe', args: (cmd) => ['-NoProfile', '-Command', cmd] }"));
  });
});
