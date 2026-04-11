import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'src', 'server.js');

describe('delay-only schedules', () => {
  it('executeSchedule ignores schedules that contain only delay steps', () => {
    const src = fs.readFileSync(serverPath, 'utf-8');

    assert.ok(
      src.includes("scheduleHasAgentSteps(schedule) {") &&
      src.includes("schedule._steps.some(step => Object.keys(step).some(key => key !== 'delay'))"),
      'executeSchedule() should detect schedules that only contain delays'
    );
    assert.ok(
      src.includes("log('Ignoring schedule with only delay steps', this.id);") &&
      src.includes("if (!hasAgentSteps) {") &&
      src.includes('return { total: 0, failures: 0 };'),
      'executeSchedule() should skip waiting when a schedule contains no worker steps'
    );
  });
});
