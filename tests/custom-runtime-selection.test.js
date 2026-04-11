import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { resolveProviderRuntime } from '../src/providers/custom-config.js';

describe('custom provider runtime selection', () => {
  it('maps custom tiers to configured model names', () => {
    const result = resolveProviderRuntime({
      provider: 'custom',
      modelTier: 'xlow',
      keyResult: {
        customConfig: {
          apiStyle: 'responses',
          baseUrl: 'https://api-vip.codex-for.me/v1',
          defaultModel: 'gpt-5.4',
        },
      },
      projectModels: null,
      resolveModelTier: () => ({ model: 'xlow' }),
    });

    assert.strictEqual(result.selectedModel, 'gpt-5.4');
  });

  it('respects explicit project-level overrides for custom tiers', () => {
    const result = resolveProviderRuntime({
      provider: 'custom',
      modelTier: 'mid',
      keyResult: {
        customConfig: {
          apiStyle: 'responses',
          baseUrl: 'https://api-vip.codex-for.me/v1',
          defaultModel: 'gpt-5.4',
        },
      },
      projectModels: {
        mid: 'gpt-5.4-codex',
      },
      resolveModelTier: () => ({ model: 'mid' }),
    });

    assert.strictEqual(result.selectedModel, 'gpt-5.4-codex');
  });
});
