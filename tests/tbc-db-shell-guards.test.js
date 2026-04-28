import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'bin', 'tbc-db.js');

function readCli() {
  return fs.readFileSync(cliPath, 'utf-8');
}

describe('tbc-db shell issue guards', () => {
  it('detects shell issue titles and referenced human issues', () => {
    const src = readCli();
    assert.match(src, /SHELL_ISSUE_TITLE_RE/);
    assert.match(src, /function extractIssueRefs\(/);
    assert.match(src, /function findReferencedHumanIssueIds\(/);
  });

  it('reuses existing active shell issues in issue-create', () => {
    const src = readCli();
    assert.match(src, /const reusableIssue = findReusableShellIssue\(/);
    assert.match(src, /Reused existing active shell issue instead of creating a duplicate/);
    assert.match(src, /console\.log\(`Reused issue #\$\{reusableIssue\.id\}`\)/);
  });

  it('auto-closes stale shell issues from issue-create', () => {
    const src = readCli();
    assert.match(src, /const autoClosed = autoCloseStaleShellIssues\(/);
    assert.match(src, /Auto-closed stale issues:/);
    assert.match(src, /Auto-closed as superseded by/);
  });
});
