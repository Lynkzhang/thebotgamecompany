import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeCustomConfig } from '../src/providers/custom-config.js';

describe('custom config normalization', () => {
  it('accepts wire_api as an alias for apiStyle', () => {
    const config = normalizeCustomConfig({
      wire_api: 'responses',
      baseUrl: 'https://api-vip.codex-for.me/v1',
      defaultModel: 'gpt-5.4',
    });

    assert.strictEqual(config.apiStyle, 'openai');
    assert.strictEqual(config.interfaceType, 'responses');
    assert.strictEqual(config.baseUrl, 'https://api-vip.codex-for.me/v1');
    assert.strictEqual(config.defaultModel, 'gpt-5.4');
  });

  it('accepts explicit OpenAI interface type selection', () => {
    const config = normalizeCustomConfig({
      apiStyle: 'openai',
      interfaceType: 'responses',
      baseUrl: 'https://api.example.com/v1',
      defaultModel: 'gpt-5.4',
    });

    assert.strictEqual(config.apiStyle, 'openai');
    assert.strictEqual(config.interfaceType, 'responses');
  });

  it('accepts auto OpenAI interface selection', () => {
    const config = normalizeCustomConfig({
      apiStyle: 'openai',
      interfaceType: 'auto',
      baseUrl: 'https://api.example.com/v1',
      defaultModel: 'gpt-5.4',
    });

    assert.strictEqual(config.apiStyle, 'openai');
    assert.strictEqual(config.interfaceType, 'auto');
  });
});
