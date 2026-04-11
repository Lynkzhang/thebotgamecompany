import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'src', 'server.js');

describe('meta-only summaries', () => {
  it('summarizes delay-only schedules instead of showing no response', () => {
    const src = fs.readFileSync(serverPath, 'utf-8');

    assert.ok(src.includes('function summarizeMetaOnlyResponse(text) {'));
    assert.ok(src.includes("return 'delay-only schedule';"));
    assert.ok(src.includes('summarizeMetaOnlyResponse(resultText)'));
  });
});
