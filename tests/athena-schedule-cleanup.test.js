import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'src', 'server.js');

describe('athena schedule cleanup', () => {
  it('clears currentSchedule after executing athena schedules', () => {
    const src = fs.readFileSync(serverPath, 'utf-8');

    assert.ok(
      src.includes('if (this.scheduleHasAgentSteps(schedule)) {') &&
      src.includes('this.currentSchedule = schedule;'),
      'Athena should only persist schedules that contain worker steps'
    );

    assert.ok(
      src.includes('this.currentSchedule = null;') &&
      src.includes('this.completedAgents = [];'),
      'Athena should clear persisted schedule state after execution'
    );
  });
});
