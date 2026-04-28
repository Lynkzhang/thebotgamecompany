import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'src', 'server.js');

function readServer() {
  return fs.readFileSync(serverPath, 'utf-8');
}

describe('Issue closure guards', () => {
  it('blocks PROJECT_COMPLETE when open issues remain', () => {
    const src = readServer();
    const block = src.match(/if \(completeMatch\) \{([\s\S]*?)continue;/);
    assert.ok(block, 'Could not find PROJECT_COMPLETE handling block');
    assert.match(block[1], /_findCompletionBlockingIssues\(\)/,
      'Expected PROJECT_COMPLETE to check for blocking open issues');
    assert.match(block[1], /Project completion blocked:/,
      'Expected a clear blocked-completion message when open issues remain');
  });

  it('ignores CLAIM_COMPLETE when PM also schedules agent work', () => {
    const src = readServer();
    const block = src.match(/Check if PM claims milestone complete([\s\S]*?)\n\s*}\n\s*}/);
    assert.ok(block, 'Could not find CLAIM_COMPLETE handling block');
    assert.match(block[1], /schedule && this\.scheduleHasAgentSteps\(schedule\)/,
      'Expected CLAIM_COMPLETE to be guarded when schedule still contains agent work');
    assert.match(block[1], /Ignoring CLAIM_COMPLETE because PM also scheduled agent work/,
      'Expected explicit log message when claim_complete is ignored');
  });

  it('auto-closes stale shell issues when a new shell issue supersedes them', () => {
    const src = readServer();
    assert.match(src, /function isShellIssueTitle\(/,
      'Expected shell-issue title classifier helper');
    assert.match(src, /_autoCloseStaleShellIssues\(/,
      'Expected stale shell auto-close helper');
    assert.match(src, /Auto-closed as superseded by/,
      'Expected auto-close comment for superseded shell issues');
    assert.match(src, /const autoClosedIssueIds = this\._autoCloseStaleShellIssues\(db/,
      'Expected createIssue to invoke stale shell auto-close');
  });

  it('reuses an existing active shell issue instead of creating duplicates', () => {
    const src = readServer();
    assert.match(src, /_findReusableShellIssue\(/,
      'Expected reusable shell issue lookup helper');
    assert.match(src, /const reusableIssue = this\._findReusableShellIssue\(db/,
      'Expected createIssue to check for reusable shell issues first');
    assert.match(src, /Reused existing active shell issue instead of creating a duplicate/,
      'Expected reuse comment when duplicate shell issue creation is avoided');
    assert.match(src, /_findReferencedHumanIssueIds\(/,
      'Expected canonical shell reuse to anchor on referenced human issues');
  });

  it('auto-closes stale shell issues after verification pass for the same issue chain', () => {
    const src = readServer();
    const verifyPassBlock = src.match(/if \(decision === 'pass'\) \{([\s\S]*?)log\(`✅ Milestone verified/);
    assert.ok(verifyPassBlock, 'Could not find verification pass block');
    assert.match(verifyPassBlock[1], /extractIssueRefs\(/,
      'Expected verification pass to extract referenced issue ids from milestone metadata');
    assert.match(verifyPassBlock[1], /_autoCloseShellIssuesForRefs\(/,
      'Expected verification pass to auto-close stale shell issues for the same chain');
  });

  it('exposes completion blockers in project status for monitor/debugging', () => {
    const src = readServer();
    assert.match(src, /const completionBlockingIssues = this\._findCompletionBlockingIssues\(\)\.map\(/,
      'Expected getStatus() to compute completion blockers');
    assert.match(src, /completionBlockingIssues,/,
      'Expected getStatus() response to include completionBlockingIssues');
  });
});
