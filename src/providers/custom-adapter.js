function joinEndpoint(baseUrl, suffix) {
  if (baseUrl.endsWith(suffix)) return baseUrl;
  return `${baseUrl}${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
}

function parseJsonText(text, response, emptyMessage) {
  if (!text.trim()) {
    throw toError(emptyMessage || `Custom provider returned empty response body (${response.status})`, response.status);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw toError(`Custom provider returned non-JSON response (${response.status})`, response.status);
  }
}

function toError(message, status = 0) {
  const err = new Error(message);
  if (status) err.status = status;
  return err;
}

function stringifyErrorValue(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(item => stringifyErrorValue(item)).filter(Boolean).join('; ');
  }
  if (typeof value === 'object') {
    const preferred = [value.message, value.detail, value.error_description, value.reason]
      .map(item => stringifyErrorValue(item))
      .filter(Boolean);
    if (preferred.length > 0) return preferred.join(' | ');
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function extractErrorMessage(data, fallback) {
  const candidates = [
    data?.error?.message,
    data?.error,
    data?.message,
    data?.detail,
    data?.details,
    data?.errors,
  ];
  for (const candidate of candidates) {
    const text = stringifyErrorValue(candidate);
    if (text) return text;
  }
  return fallback;
}

function resolveOpenAIInterfaceType(model, customConfig) {
  const configured = customConfig.interfaceType || 'chat_completions';
  if (configured !== 'auto') return configured;
  const modelId = String(model?.id || model?.name || '').toLowerCase();
  if (modelId.includes('codex')) return 'responses';
  return 'chat_completions';
}

function normalizeTextContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter(block => block?.type === 'text' && block.text)
    .map(block => block.text)
    .join('\n');
}

function mapUserContentToOpenAI(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts = [];
  for (const block of content) {
    if (block?.type === 'text' && block.text) {
      parts.push({ type: 'text', text: block.text });
      continue;
    }
    if (block?.type === 'image' && block.data && block.mimeType) {
      parts.push({
        type: 'image_url',
        image_url: {
          url: `data:${block.mimeType};base64,${block.data}`,
        },
      });
    }
  }
  return parts.length > 0 ? parts : '';
}

function mapMessagesToOpenAI(messages, systemPrompt) {
  const mapped = [];
  if (systemPrompt) {
    mapped.push({ role: 'system', content: systemPrompt });
  }
  for (const message of messages) {
    if (message.role === 'user') {
      mapped.push({ role: 'user', content: mapUserContentToOpenAI(message.content) });
      continue;
    }
    if (message.role === 'assistant') {
      const content = Array.isArray(message.content) ? message.content : [];
      const text = content.filter(block => block.type === 'text').map(block => block.text).join('\n');
      const toolCalls = content
        .filter(block => block.type === 'toolCall')
        .map(block => ({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.arguments || {}),
          },
        }));
      const assistantMessage = { role: 'assistant' };
      if (text) assistantMessage.content = text;
      if (toolCalls.length > 0) assistantMessage.tool_calls = toolCalls;
      if (!assistantMessage.content && !assistantMessage.tool_calls) assistantMessage.content = '';
      mapped.push(assistantMessage);
      continue;
    }
    if (message.role === 'toolResult') {
      mapped.push({
        role: 'tool',
        tool_call_id: message.toolCallId,
        content: normalizeTextContent(message.content),
      });
    }
  }
  return mapped;
}

function mapToolsToOpenAI(tools) {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function buildPiAssistantMessage(textParts, toolCalls, stopReason, usage = {}, imageBlocks = []) {
  return {
    role: 'assistant',
    content: [
      ...textParts.map(text => ({ type: 'text', text })),
      ...toolCalls.map(toolCall => ({
        type: 'toolCall',
        id: toolCall.id,
        name: toolCall.name,
        arguments: toolCall.input,
      })),
      ...imageBlocks.map(img => ({
        type: 'image',
        mimeType: img.mimeType || 'image/png',
        data: img.data,
      })),
    ],
    stopReason,
    usage: {
      input: usage.inputTokens || 0,
      output: usage.outputTokens || 0,
      cacheRead: usage.cacheReadTokens || 0,
      cost: { total: 0 },
    },
  };
}

function parseOpenAIResponse(data) {
  const choice = data?.choices?.[0];
  const message = choice?.message || {};
  const textParts = [];
  const imageBlocks = [];
  if (typeof message.content === 'string') {
    textParts.push(message.content);
  } else if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part?.type === 'text' && part.text) {
        textParts.push(part.text);
      } else if (part?.type === 'image_url' && part.image_url?.url) {
        // Inline base64 image from multimodal generation models
        const url = part.image_url.url;
        const m = url.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
        if (m) {
          imageBlocks.push({ mimeType: m[1], data: m[2] });
        }
      }
    }
  }

  const toolCalls = (message.tool_calls || []).map(toolCall => ({
    id: toolCall.id,
    name: toolCall.function?.name || 'unknown',
    input: (() => {
      try {
        return JSON.parse(toolCall.function?.arguments || '{}');
      } catch {
        return {};
      }
    })(),
  }));

  const stopReason = choice?.finish_reason === 'tool_calls'
    ? 'tool_use'
    : choice?.finish_reason === 'length'
      ? 'max_tokens'
      : 'end_turn';

  const usage = {
    inputTokens: data?.usage?.prompt_tokens || 0,
    outputTokens: data?.usage?.completion_tokens || 0,
    cacheReadTokens: 0,
  };

  return {
    role: 'assistant',
    content: textParts.join('\n'),
    toolCalls,
    imageBlocks,
    stopReason,
    usage,
    cost: 0,
    resultText: textParts.join('\n'),
    _piMessage: buildPiAssistantMessage(textParts, toolCalls, stopReason === 'tool_use' ? 'toolUse' : stopReason === 'max_tokens' ? 'length' : 'stop', usage, imageBlocks),
  };
}

function mapMessagesToResponses(messages, systemPrompt) {
  const input = [];
  if (systemPrompt) {
    input.push({
      role: 'system',
      content: [{ type: 'input_text', text: systemPrompt }],
    });
  }
  for (const message of messages) {
    if (message.role === 'user') {
      let content = message.content;
      if (Array.isArray(content)) {
        const parts = [];
        for (const block of content) {
          if (block?.type === 'text' && block.text) {
            parts.push({ type: 'input_text', text: block.text });
          } else if (block?.type === 'image' && block.data && block.mimeType) {
            parts.push({
              type: 'input_image',
              image_url: `data:${block.mimeType};base64,${block.data}`,
            });
          }
        }
        if (parts.length > 0) {
          input.push({ role: 'user', content: parts });
        }
      } else if (typeof content === 'string') {
        input.push({
          role: 'user',
          content: [{ type: 'input_text', text: content }],
        });
      }
    } else if (message.role === 'assistant') {
      const blocks = Array.isArray(message.content) ? message.content : [];
      const textParts = [];
      const toolCalls = [];
      for (const block of blocks) {
        if (block?.type === 'text' && block.text) {
          textParts.push({ type: 'output_text', text: block.text });
          continue;
        }
        if (block?.type === 'toolCall') {
          toolCalls.push({
            type: 'function_call',
            call_id: block.id,
            name: block.name,
            arguments: JSON.stringify(block.arguments || {}),
          });
        }
      }
      if (typeof message.content === 'string' && message.content) {
        textParts.push({ type: 'output_text', text: message.content });
      }
      if (textParts.length > 0) {
        input.push({ role: 'assistant', content: textParts });
      }
      if (toolCalls.length > 0) {
        input.push(...toolCalls);
      }
    } else if (message.role === 'toolResult') {
      input.push({
        type: 'function_call_output',
        call_id: message.toolCallId,
        output: normalizeTextContent(message.content),
      });
    }
  }
  return input;
}

function parseResponsesResponse(data) {
  const output = Array.isArray(data?.output) ? data.output : [];
  const textParts = [];
  const toolCalls = [];
  const imageBlocks = [];

  for (const item of output) {
    if (item?.type === 'message') {
      const content = Array.isArray(item.content) ? item.content : [];
      for (const block of content) {
        if ((block?.type === 'output_text' || block?.type === 'text') && block.text) {
          textParts.push(block.text);
        } else if (block?.type === 'output_image' || block?.type === 'image') {
          // Inline image from multimodal generation (e.g. gpt-image-1, Gemini)
          const b64 = block.image_url || block.data || block.b64_json || '';
          const mime = block.mime_type || block.mimeType || 'image/png';
          if (b64) {
            // Strip data-url prefix if present
            const raw = b64.replace(/^data:[^;]+;base64,/, '');
            imageBlocks.push({ mimeType: mime, data: raw });
          }
        }
      }
      continue;
    }
    if (item?.type === 'function_call') {
      toolCalls.push({
        id: item.call_id || item.id,
        name: item.name || 'unknown',
        input: (() => {
          try {
            return JSON.parse(item.arguments || '{}');
          } catch {
            return {};
          }
        })(),
      });
    }
  }

  const stopReason = toolCalls.length > 0
    ? 'tool_use'
    : data?.incomplete_details?.reason === 'max_output_tokens'
      ? 'max_tokens'
      : 'end_turn';

  const usage = {
    inputTokens: data?.usage?.input_tokens || 0,
    outputTokens: data?.usage?.output_tokens || 0,
    cacheReadTokens: data?.usage?.cached_tokens || 0,
  };

  return {
    role: 'assistant',
    content: textParts.join('\n'),
    toolCalls,
    imageBlocks,
    stopReason,
    usage,
    cost: 0,
    resultText: textParts.join('\n'),
    _piMessage: buildPiAssistantMessage(textParts, toolCalls, stopReason === 'tool_use' ? 'toolUse' : stopReason === 'max_tokens' ? 'length' : 'stop', usage, imageBlocks),
  };
}

function mapMessagesToAnthropic(messages) {
  const mapped = [];
  for (const message of messages) {
    if (message.role === 'user') {
      const content = typeof message.content === 'string'
        ? [{ type: 'text', text: message.content }]
        : Array.isArray(message.content)
          ? message.content.map(block => {
              if (block?.type === 'text') return { type: 'text', text: block.text };
              if (block?.type === 'image' && block.data && block.mimeType) {
                return {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: block.mimeType,
                    data: block.data,
                  },
                };
              }
              return null;
            }).filter(Boolean)
          : [];
      mapped.push({
        role: 'user',
        content,
      });
      continue;
    }
    if (message.role === 'assistant') {
      const content = Array.isArray(message.content) ? message.content : [];
      mapped.push({
        role: 'assistant',
        content: content.map(block => {
          if (block.type === 'text') return { type: 'text', text: block.text };
          if (block.type === 'toolCall') {
            return {
              type: 'tool_use',
              id: block.id,
              name: block.name,
              input: block.arguments || {},
            };
          }
          return block;
        }),
      });
      continue;
    }
    if (message.role === 'toolResult') {
      mapped.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: message.toolCallId,
          content: normalizeTextContent(message.content),
          is_error: false,
        }],
      });
    }
  }
  return mapped;
}

function mapToolsToAnthropic(tools) {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

function parseAnthropicResponse(data) {
  const content = Array.isArray(data?.content) ? data.content : [];
  const textParts = [];
  const toolCalls = [];
  const imageBlocks = [];
  for (const block of content) {
    if (block.type === 'text') {
      textParts.push(block.text || '');
      continue;
    }
    if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        input: block.input || {},
      });
      continue;
    }
    if (block.type === 'image') {
      // Anthropic image output block
      const source = block.source || {};
      if (source.type === 'base64' && source.data) {
        imageBlocks.push({
          mimeType: source.media_type || 'image/png',
          data: source.data,
        });
      }
    }
  }

  return {
    role: 'assistant',
    content: textParts.join('\n'),
    toolCalls,
    imageBlocks,
    stopReason: data?.stop_reason === 'tool_use' ? 'tool_use' : data?.stop_reason === 'max_tokens' ? 'max_tokens' : 'end_turn',
    usage: {
      inputTokens: data?.usage?.input_tokens || 0,
      outputTokens: data?.usage?.output_tokens || 0,
      cacheReadTokens: 0,
    },
    cost: 0,
    _piMessage: buildPiAssistantMessage(
      textParts,
      toolCalls,
      data?.stop_reason === 'tool_use' ? 'toolUse' : data?.stop_reason === 'max_tokens' ? 'length' : 'stop',
      {
        inputTokens: data?.usage?.input_tokens || 0,
        outputTokens: data?.usage?.output_tokens || 0,
        cacheReadTokens: 0,
      },
      imageBlocks,
    ),
  };
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  const data = parseJsonText(text, response);
  if (!response.ok) {
    const message = extractErrorMessage(data, `Custom provider request failed (${response.status})`);
    throw toError(message, response.status);
  }
  return data;
}

function parseSseBlocks(text) {
  const blocks = text.replace(/\r\n/g, '\n').split('\n\n');
  const events = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const lines = trimmed.split('\n');
    let event = 'message';
    const dataLines = [];
    for (const line of lines) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
        continue;
      }
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }
    const dataText = dataLines.join('\n');
    if (!dataText || dataText === '[DONE]') continue;
    events.push({ event, dataText });
  }
  return events;
}

function parseResponsesSse(text, response) {
  const events = parseSseBlocks(text);
  const output = [];
  let usage = null;
  let incompleteDetails = null;

  for (const entry of events) {
    let payload;
    try {
      payload = JSON.parse(entry.dataText);
    } catch {
      throw toError(`Custom provider returned invalid SSE JSON (${response.status})`, response.status);
    }

    if (payload?.error || payload?.detail) {
      const message = extractErrorMessage(payload, `Custom provider request failed (${response.status})`);
      throw toError(message, response.status);
    }

    if (payload?.type === 'response.output_item.done' && payload.item) {
      output.push(payload.item);
      continue;
    }

    if (payload?.type === 'response.completed' && payload.response) {
      usage = payload.response.usage || null;
      incompleteDetails = payload.response.incomplete_details || null;
      if (output.length === 0 && Array.isArray(payload.response.output)) {
        output.push(...payload.response.output);
      }
    }
  }

  return {
    output,
    usage,
    incomplete_details: incompleteDetails,
  };
}

async function fetchResponsesJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    if (contentType.includes('text/event-stream')) {
      const trimmed = text.trim();
      let message = `Custom provider request failed (${response.status})`;
      if (trimmed) {
        try {
          const parsed = JSON.parse(trimmed);
          message = extractErrorMessage(parsed, message);
        } catch {
          message = trimmed;
        }
      }
      throw toError(message, response.status);
    }
    const data = parseJsonText(text, response);
    const message = extractErrorMessage(data, `Custom provider request failed (${response.status})`);
    throw toError(message, response.status);
  }

  if (contentType.includes('text/event-stream')) {
    if (!text.trim()) {
      throw toError(`Custom provider returned empty response body (${response.status})`, response.status);
    }
    return parseResponsesSse(text, response);
  }

  return parseJsonText(text, response);
}

export async function callCustomModel(model, systemPrompt, messages, tools, opts = {}) {
  const customConfig = opts.customConfig;
  if (!customConfig) {
    throw new Error('customConfig is required for custom provider calls');
  }
  if (!opts.token) {
    throw new Error('API key is required for custom provider calls');
  }

  const interfaceType = customConfig.apiStyle === 'anthropic'
    ? 'messages'
    : resolveOpenAIInterfaceType(model, customConfig.apiStyle === 'responses'
      ? { ...customConfig, interfaceType: 'responses' }
      : customConfig);

  if (customConfig.apiStyle === 'anthropic') {
    const body = {
      model: model.id || model.name,
      system: systemPrompt,
      messages: mapMessagesToAnthropic(messages),
      max_tokens: 8192,
    };
    if (tools.length > 0) body.tools = mapToolsToAnthropic(tools);
    const data = await fetchJson(joinEndpoint(customConfig.baseUrl, '/messages'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': opts.token,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    return parseAnthropicResponse(data);
  }

  if ((customConfig.apiStyle === 'openai' || customConfig.apiStyle === 'responses') && interfaceType === 'responses') {
    const body = {
      model: model.id || model.name,
      input: mapMessagesToResponses(messages),
      stream: true,
    };
    if (systemPrompt) body.instructions = systemPrompt;
    if (tools.length > 0) {
      body.tools = tools.map(tool => ({
        type: 'function',
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }));
    }
    const data = await fetchResponsesJson(joinEndpoint(customConfig.baseUrl, '/responses'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream, application/json',
        'authorization': `Bearer ${opts.token}`,
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    return parseResponsesResponse(data);
  }

  const body = {
    model: model.id || model.name,
    messages: mapMessagesToOpenAI(messages, systemPrompt),
    stream: false,
  };
  if (tools.length > 0) body.tools = mapToolsToOpenAI(tools);
  const data = await fetchJson(joinEndpoint(customConfig.baseUrl, '/chat/completions'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${opts.token}`,
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  return parseOpenAIResponse(data);
}
