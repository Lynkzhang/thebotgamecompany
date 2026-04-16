import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildResumeCheckpoint, formatErrorDetails, normalizeResumeState } from '../src/agent-runner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Agent checkpoint resume', () => {
  it('normalizes a valid resume payload', () => {
    const resume = normalizeResumeState({
      messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
      lastResultText: 'partial',
      lastInputTokens: 321,
    });

    assert.ok(resume);
    assert.equal(resume.lastResultText, 'partial');
    assert.equal(resume.lastInputTokens, 321);
    assert.equal(resume.messages.length, 1);
    assert.notStrictEqual(resume.messages[0], undefined);
  });

  it('rejects empty resume payloads', () => {
    assert.equal(normalizeResumeState(null), null);
    assert.equal(normalizeResumeState({}), null);
    assert.equal(normalizeResumeState({ messages: [] }), null);
  });

  it('builds a serializable checkpoint snapshot', () => {
    const checkpoint = buildResumeCheckpoint([
      { role: 'user', content: [{ type: 'text', text: 'start' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'working' }] },
    ], 'working', 42);

    assert.equal(checkpoint.version, 1);
    assert.equal(checkpoint.messageCount, 2);
    assert.equal(checkpoint.lastResultText, 'working');
    assert.equal(checkpoint.lastInputTokens, 42);
    assert.ok(typeof checkpoint.messageDigest === 'string' && checkpoint.messageDigest.length > 0);
  });

  it('formats fetch errors with nested cause details', () => {
    const err = new Error('fetch failed');
    err.cause = { code: 'ECONNRESET', message: 'socket hang up', syscall: 'read' };

    const detailed = formatErrorDetails(err);
    assert.match(detailed, /fetch failed/);
    assert.match(detailed, /ECONNRESET/);
    assert.match(detailed, /socket hang up/);
  });

  it('wires checkpoint persistence into ProjectRunner.runAgent', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf-8');

    assert.match(src, /_buildAgentResumeKey\(/);
    assert.match(src, /_loadAgentCheckpoint\(/);
    assert.match(src, /_saveAgentCheckpoint\(/);
    assert.match(src, /_clearAgentCheckpoint\(/);
    assert.match(src, /resumeState:\s*checkpoint\?\.state\s*\|\|\s*null/);
    assert.match(src, /onCheckpoint:\s*\(state\)\s*=>\s*this\._saveAgentCheckpoint/);
    assert.match(src, /if \(result\.success\) \{\s*this\._clearAgentCheckpoint\(agent\.name\);/);
    assert.match(src, /Resuming .* from checkpoint/);
    assert.match(src, /Summarize error: \$\{detailedError\}/);
  });
});
