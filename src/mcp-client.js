import { spawn } from 'child_process';

let nextRequestId = 1;

function makeError(message) {
  const err = new Error(message);
  err.name = 'McpError';
  return err;
}

async function postJson(url, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw makeError(`MCP server returned non-JSON response (${response.status})`);
    }
    if (!response.ok) {
      const message = data?.error?.message || data?.message || `MCP server request failed (${response.status})`;
      throw makeError(message);
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw makeError(`MCP request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callJsonRpc(server, method, params = {}) {
  const timeoutMs = Math.min(Math.max(Number(server.timeoutMs || 30000), 1000), 120000);
  if (server.transport === 'stdio') {
    return await callJsonRpcStdio(server, method, params, timeoutMs);
  }
  if (server.transport !== 'http') {
    throw makeError(`Unsupported MCP transport: ${server.transport}`);
  }
  if (!server.url) {
    throw makeError('MCP server URL is missing');
  }

  const payload = {
    jsonrpc: '2.0',
    id: nextRequestId++,
    method,
    params,
  };
  const data = await postJson(server.url, payload, timeoutMs);
  if (data?.error) {
    const message = data.error.message || JSON.stringify(data.error);
    throw makeError(message);
  }
  return data?.result ?? null;
}

function createJsonRpcFrame(payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf8');
  return Buffer.concat([header, body]);
}

function parseJsonRpcFrames(buffer) {
  const messages = [];
  let rest = buffer;
  while (true) {
    const headerEnd = rest.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;
    const header = rest.slice(0, headerEnd);
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) break;
    const contentLength = Number(match[1]);
    const bodyStart = headerEnd + 4;
    if (rest.length < bodyStart + contentLength) break;
    const body = rest.slice(bodyStart, bodyStart + contentLength);
    try { messages.push(JSON.parse(body)); } catch {}
    rest = rest.slice(bodyStart + contentLength);
  }
  return { messages, rest };
}

async function callJsonRpcStdio(server, method, params = {}, timeoutMs = 30000) {
  if (!server.command) throw makeError('MCP stdio command is missing');
  const child = spawn(server.command, server.args || [], {
    env: { ...process.env, ...(server.env || {}) },
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  return await new Promise((resolve, reject) => {
    const requestId = nextRequestId++;
    const initId = nextRequestId++;
    let stderr = '';
    let stdoutBuffer = '';
    let initialized = false;
    const timer = setTimeout(() => {
      try { child.kill(); } catch {}
      reject(makeError(`MCP request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const cleanup = () => clearTimeout(timer);
    const fail = (message) => {
      cleanup();
      try { child.kill(); } catch {}
      reject(makeError(message));
    };
    const succeed = (result) => {
      cleanup();
      try { child.kill(); } catch {}
      resolve(result);
    };

    child.on('error', err => fail(err.message));
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.stdout.on('data', chunk => {
      stdoutBuffer += chunk.toString();
      const parsed = parseJsonRpcFrames(stdoutBuffer);
      stdoutBuffer = parsed.rest;
      for (const message of parsed.messages) {
        if (message.id === initId) {
          if (message.error) return fail(message.error.message || JSON.stringify(message.error));
          initialized = true;
          child.stdin.write(createJsonRpcFrame({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }));
          child.stdin.write(createJsonRpcFrame({ jsonrpc: '2.0', id: requestId, method, params }));
          continue;
        }
        if (message.id === requestId) {
          if (message.error) return fail(message.error.message || JSON.stringify(message.error));
          return succeed(message.result ?? null);
        }
      }
    });
    child.on('exit', code => {
      if (!initialized) {
        fail(stderr.trim() || `MCP stdio process exited (${code}) before initialization`);
      }
    });

    child.stdin.write(createJsonRpcFrame({
      jsonrpc: '2.0',
      id: initId,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        clientInfo: { name: 'thebotgamecompany', version: '1.0.0' },
        capabilities: {},
      },
    }));
  });
}

export function listConfiguredMcpServers(projectConfig = {}) {
  const servers = projectConfig?.mcp?.servers || {};
  return Object.entries(servers)
    .filter(([, server]) => server && server.enabled !== false)
    .map(([name, server]) => ({
      name,
      transport: server.transport || 'http',
      url: server.url || null,
      command: server.command || null,
      args: Array.isArray(server.args) ? server.args : [],
      env: server.env || {},
      timeoutMs: server.timeoutMs || 30000,
    }));
}

export async function listMcpTools(projectConfig = {}, serverName = null) {
  const servers = listConfiguredMcpServers(projectConfig);
  const targetServers = serverName ? servers.filter(server => server.name === serverName) : servers;
  if (targetServers.length === 0) {
    throw makeError(serverName ? `MCP server not configured: ${serverName}` : 'No enabled MCP servers configured');
  }

  const results = [];
  for (const server of targetServers) {
    const tools = await callJsonRpc(server, 'tools/list', {});
    results.push({ server: server.name, tools: tools?.tools || tools || [] });
  }
  return results;
}

export async function callMcpTool(projectConfig = {}, serverName, toolName, argumentsObject = {}) {
  const servers = listConfiguredMcpServers(projectConfig);
  const server = servers.find(entry => entry.name === serverName);
  if (!server) {
    throw makeError(`MCP server not configured: ${serverName}`);
  }
  return await callJsonRpc(server, 'tools/call', {
    name: toolName,
    arguments: argumentsObject || {},
  });
}
