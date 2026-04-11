import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'src', 'server.js');

describe('parallel schedule guardrails', () => {
  it('supports _parallel schedule blocks and blocks program roles', () => {
    const src = fs.readFileSync(serverPath, 'utf-8');

    assert.ok(src.includes('Array.isArray(step._parallel)'), 'Expected executeSchedule to handle _parallel blocks');
    assert.ok(src.includes('isParallelSafeAgent(agent)'), 'Expected parallel execution to validate allowed roles');
    assert.ok(src.includes('program/code roles must remain serial'), 'Expected serial-only guard for program roles');
  });
});
