import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { callCustomModel } from '../src/providers/custom-adapter.js';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('custom provider error formatting', () => {
  it('surfaces nested object errors as readable text', async () => {
    global.fetch = async () => new Response(JSON.stringify({
      error: {
        message: {
          detail: 'context length exceeded',
        },
      },
    }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });

    await assert.rejects(
      callCustomModel(
        { id: 'gpt-5.4', name: 'gpt-5.4' },
        'You are Athena.',
        [{ role: 'user', content: 'Ping' }],
        [],
        {
          token: 'test-token',
          customConfig: {
            apiStyle: 'openai',
            baseUrl: 'https://example.com/v1',
            defaultModel: 'gpt-5.4',
          },
        },
      ),
      /context length exceeded/,
    );
  });
});
