import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shouldCompactHistory } from '../src/agent-runner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('QA context management guidance', () => {
  it('qa_lead prompt requires sub-agent verification by default', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'agent', 'managers', 'qa_lead.md'), 'utf-8');

    assert.match(src, /分子 agent 验收/);
    assert.match(src, /至少安排 1 个 QA 子 agent/);
    assert.match(src, /至少安排 1 个独立复核角色/);
    assert.match(src, /blind|focused/);
  });

  it('shared prompts tell agents and managers to compress long context', () => {
    const everyone = fs.readFileSync(path.join(__dirname, '..', 'agent', 'everyone.md'), 'utf-8');
    const manager = fs.readFileSync(path.join(__dirname, '..', 'agent', 'manager.md'), 'utf-8');

    assert.match(everyone, /结论压缩成 5-10 条要点写进 `note\.md`/);
    assert.match(everyone, /上下文快变长时先压缩/);
    assert.match(manager, /不要自己吞下所有上下文/);
    assert.match(manager, /处理上下文膨胀/);
  });

  it('compacts history proactively before extreme token overflow', () => {
    assert.equal(shouldCompactHistory(120001, 20), true);
    assert.equal(shouldCompactHistory(1000, 121), true);
    assert.equal(shouldCompactHistory(1000, 20), false);
  });
});
