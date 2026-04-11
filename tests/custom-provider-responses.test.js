import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { callCustomModel } from '../src/providers/custom-adapter.js';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('custom provider responses adapter', () => {
  it('sends OpenAI Responses wire format and parses function calls', async () => {
    let requestUrl = null;
    let requestBody = null;

    global.fetch = async (url, init) => {
      requestUrl = url;
      requestBody = JSON.parse(init.body);
      return new Response(JSON.stringify({
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [{ type: 'output_text', text: 'I will use a tool.' }],
          },
          {
            type: 'function_call',
            id: 'fc_123',
            call_id: 'call_123',
            name: 'lookup_issue',
            arguments: '{"id":42}',
          },
        ],
        usage: {
          input_tokens: 11,
          output_tokens: 7,
        },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const response = await callCustomModel(
      { id: 'gpt-5.4', name: 'gpt-5.4' },
      'You are Athena.',
      [
        { role: 'user', content: 'Check issue 42' },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me inspect that.' },
            { type: 'toolCall', id: 'call_prev', name: 'read_issue', arguments: { id: 41 } },
          ],
        },
        {
          role: 'toolResult',
          toolCallId: 'call_prev',
          content: [{ type: 'text', text: 'Issue 41 is closed.' }],
        },
      ],
      [{ name: 'lookup_issue', description: 'Look up an issue', parameters: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] } }],
      {
        token: 'test-token',
        customConfig: {
          apiStyle: 'openai',
          interfaceType: 'responses',
          baseUrl: 'https://example.com/v1',
          defaultModel: 'gpt-5.4',
        },
      },
    );

    assert.strictEqual(requestUrl, 'https://example.com/v1/responses');
    assert.strictEqual(requestBody.model, 'gpt-5.4');
    assert.strictEqual(requestBody.instructions, 'You are Athena.');
    assert.strictEqual(requestBody.stream, true);
    assert.deepStrictEqual(requestBody.input, [
      { role: 'user', content: [{ type: 'input_text', text: 'Check issue 42' }] },
      { role: 'assistant', content: [{ type: 'output_text', text: 'Let me inspect that.' }] },
      { type: 'function_call', call_id: 'call_prev', name: 'read_issue', arguments: '{"id":41}' },
      { type: 'function_call_output', call_id: 'call_prev', output: 'Issue 41 is closed.' },
    ]);
    assert.deepStrictEqual(requestBody.tools, [
      {
        type: 'function',
        name: 'lookup_issue',
        description: 'Look up an issue',
        parameters: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
      },
    ]);

    assert.strictEqual(response.content, 'I will use a tool.');
    assert.strictEqual(response.stopReason, 'tool_use');
    assert.deepStrictEqual(response.toolCalls, [{ id: 'call_123', name: 'lookup_issue', input: { id: 42 } }]);
    assert.deepStrictEqual(response._piMessage.content, [
      { type: 'text', text: 'I will use a tool.' },
      { type: 'toolCall', id: 'call_123', name: 'lookup_issue', arguments: { id: 42 } },
    ]);
  });

  it('maps OpenAI tool_calls finish reason to tool_use', async () => {
    global.fetch = async () => new Response(JSON.stringify({
      choices: [{
        finish_reason: 'tool_calls',
        message: {
          content: 'Calling tool',
          tool_calls: [{
            id: 'call_1',
            function: {
              name: 'lookup_issue',
              arguments: '{"id":42}',
            },
          }],
        },
      }],
      usage: {
        prompt_tokens: 5,
        completion_tokens: 3,
      },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    const response = await callCustomModel(
      { id: 'gpt-5.4', name: 'gpt-5.4' },
      'You are Athena.',
      [{ role: 'user', content: 'Check issue 42' }],
      [],
      {
        token: 'test-token',
        customConfig: {
          apiStyle: 'openai',
          baseUrl: 'https://example.com/v1',
          defaultModel: 'gpt-5.4',
        },
      },
    );

    assert.strictEqual(response.stopReason, 'tool_use');
    assert.deepStrictEqual(response.toolCalls, [{ id: 'call_1', name: 'lookup_issue', input: { id: 42 } }]);
    assert.deepStrictEqual(response._piMessage.content, [
      { type: 'text', text: 'Calling tool' },
      { type: 'toolCall', id: 'call_1', name: 'lookup_issue', arguments: { id: 42 } },
    ]);
  });

  it('parses responses SSE streams', async () => {
    global.fetch = async () => new Response([
      'event: response.output_item.done',
      'data: {"type":"response.output_item.done","item":{"type":"message","role":"assistant","content":[{"type":"output_text","text":"pong"}]}}',
      '',
      'event: response.completed',
      'data: {"type":"response.completed","response":{"usage":{"input_tokens":11,"output_tokens":5,"cached_tokens":0},"incomplete_details":null}}',
      '',
    ].join('\n'), {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    });

    const response = await callCustomModel(
      { id: 'gpt-5.4', name: 'gpt-5.4' },
      'You are Athena.',
      [{ role: 'user', content: 'Ping' }],
      [],
      {
        token: 'test-token',
        customConfig: {
          apiStyle: 'openai',
          interfaceType: 'responses',
          baseUrl: 'https://example.com/v1',
          defaultModel: 'gpt-5.4',
        },
      },
    );

    assert.strictEqual(response.content, 'pong');
    assert.strictEqual(response.stopReason, 'end_turn');
    assert.deepStrictEqual(response.usage, {
      inputTokens: 11,
      outputTokens: 5,
      cacheReadTokens: 0,
    });
  });

  it('throws when provider returns an empty 2xx body', async () => {
    global.fetch = async () => new Response('', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    await assert.rejects(
      callCustomModel(
        { id: 'gpt-5.4', name: 'gpt-5.4' },
        'You are Athena.',
        [{ role: 'user', content: 'Check issue 42' }],
        [],
        {
        token: 'test-token',
        customConfig: {
          apiStyle: 'openai',
          interfaceType: 'responses',
          baseUrl: 'https://example.com/v1',
          defaultModel: 'gpt-5.4',
        },
        },
      ),
      /Custom provider returned empty response body \(200\)/,
    );
  });
});
