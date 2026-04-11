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

export function listConfiguredMcpServers(projectConfig = {}) {
  const servers = projectConfig?.mcp?.servers || {};
  return Object.entries(servers)
    .filter(([, server]) => server && server.enabled !== false)
    .map(([name, server]) => ({
      name,
      transport: server.transport || 'http',
      url: server.url || null,
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
