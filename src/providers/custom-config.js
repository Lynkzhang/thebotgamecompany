function isPrivateHostname(hostname) {
  // Localhost variants
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]') return true;
  // Cloud metadata endpoints
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') return true;
  // RFC1918 private ranges
  const parts = hostname.split('.').map(Number);
  if (parts.length === 4 && parts.every(p => p >= 0 && p <= 255)) {
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true; // link-local
    if (parts[0] === 0) return true; // 0.0.0.0
  }
  return false;
}

export function normalizeBaseUrl(baseUrl, { allowPrivate = false } = {}) {
  const value = String(baseUrl || '').trim();
  if (!value) throw new Error('customConfig.baseUrl is required');
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('customConfig.baseUrl must be a valid URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('customConfig.baseUrl must use http or https');
  }
  if (!allowPrivate && isPrivateHostname(parsed.hostname)) {
    throw new Error('customConfig.baseUrl must not point to private/internal addresses');
  }
  return parsed.toString().replace(/\/$/, '');
}

export function normalizeCustomConfig(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('customConfig is required');
  }

  const requestedApiStyle = String(input.apiStyle || 'openai').trim().toLowerCase();
  if (!['openai', 'anthropic', 'responses'].includes(requestedApiStyle)) {
    throw new Error('customConfig.apiStyle must be openai, anthropic, or responses');
  }

  const apiStyle = requestedApiStyle === 'responses' ? 'openai' : requestedApiStyle;
  const requestedInterfaceType = String(
    input.interfaceType || input.interface_type || input.wireApi || input.wire_api ||
    (requestedApiStyle === 'responses' ? 'responses' : apiStyle === 'anthropic' ? 'messages' : 'chat_completions')
  ).trim().toLowerCase();

  const interfaceType = requestedInterfaceType === 'chatcompletions' ? 'chat_completions' : requestedInterfaceType;
  if (apiStyle === 'openai' && !['auto', 'chat_completions', 'responses'].includes(interfaceType)) {
    throw new Error('customConfig.interfaceType must be auto, chat_completions or responses for openai');
  }
  if (apiStyle === 'anthropic' && interfaceType !== 'messages') {
    throw new Error('customConfig.interfaceType must be messages for anthropic');
  }

  const defaultModel = String(input.defaultModel || '').trim();
  if (!defaultModel) {
    throw new Error('customConfig.defaultModel is required');
  }

  const normalized = {
    apiStyle,
    interfaceType,
    baseUrl: normalizeBaseUrl(input.baseUrl),
    defaultModel,
  };

  if (Array.isArray(input.models)) {
    const models = input.models
      .map((entry) => {
        if (typeof entry === 'string') {
          const id = entry.trim();
          return id ? { id, label: id } : null;
        }
        if (!entry || typeof entry !== 'object') return null;
        const id = String(entry.id || '').trim();
        if (!id) return null;
        const label = String(entry.label || id).trim() || id;
        const tags = Array.isArray(entry.tags) ? entry.tags.map(t => String(t || '').trim()).filter(Boolean) : undefined;
        return { id, label, ...(tags && tags.length > 0 ? { tags } : {}) };
      })
      .filter(Boolean);
    if (models.length > 0) {
      normalized.models = models;
    }
  }

  if (input.tierModels && typeof input.tierModels === 'object') {
    const tierModels = {};
    for (const tier of ['high', 'mid', 'low', 'xlow']) {
      const value = String(input.tierModels[tier] || '').trim();
      if (value) tierModels[tier] = value;
    }
    if (Object.keys(tierModels).length > 0) {
      normalized.tierModels = tierModels;
    }
  }

  return normalized;
}

export function buildCustomTierMap(customConfig) {
  const config = normalizeCustomConfig(customConfig);
  const tierModels = config.tierModels || {};
  const mid = tierModels.mid || config.defaultModel;
  const low = tierModels.low || mid;
  const xlow = tierModels.xlow || low;
  return {
    high: { model: tierModels.high || mid },
    mid: { model: mid },
    low: { model: low },
    xlow: { model: xlow },
  };
}

export function buildCustomModelList(customConfig) {
  const config = normalizeCustomConfig(customConfig);
  if (Array.isArray(config.models) && config.models.length > 0) {
    return config.models.map(model => ({
      id: model.id,
      name: model.label || model.id,
      tags: model.tags || [],
      source: 'catalog',
    }));
  }
  const tiers = buildCustomTierMap(config);
  const seen = new Set();
  return [
    { id: config.defaultModel, name: config.defaultModel, source: 'default' },
    ...Object.entries(tiers).map(([tier, value]) => ({ id: value.model, name: value.model, source: tier }))
  ].filter(model => {
    if (!model.id || seen.has(model.id)) return false;
    seen.add(model.id);
    return true;
  });
}

function fallbackResolveModelTier(tierOrModel, provider, projectModels, runtimeTiers = null) {
  const tier = String(tierOrModel || '').trim().toLowerCase();
  if (projectModels && projectModels[tier]) {
    return { model: projectModels[tier] };
  }
  if (runtimeTiers && runtimeTiers[tier]) {
    return runtimeTiers[tier];
  }
  return { model: tierOrModel };
}

function resolveCustomModelAlias(tierOrModel, runtimeTiers) {
  const raw = String(tierOrModel || '').trim();
  const lower = raw.toLowerCase();
  if (!raw || !runtimeTiers) return { model: raw };
  if (runtimeTiers[lower]) return runtimeTiers[lower];

  if (lower.includes('claude-opus')) return runtimeTiers.high || { model: raw };
  if (lower.includes('claude-sonnet')) return runtimeTiers.mid || runtimeTiers.high || { model: raw };
  if (lower.includes('claude-haiku')) return runtimeTiers.xlow || runtimeTiers.low || { model: raw };
  if (lower.includes('codex')) return runtimeTiers.low || runtimeTiers.mid || { model: raw };
  if (lower.startsWith('gpt-')) return runtimeTiers.low || runtimeTiers.mid || { model: raw };

  return { model: raw };
}

export function resolveProviderRuntime({ provider, modelTier, keyResult, projectModels, resolveModelTier = fallbackResolveModelTier }) {
  if (provider !== 'custom') {
    const selected = resolveModelTier(modelTier, provider, projectModels);
    return {
      provider,
      selectedModel: selected.model,
      reasoningEffort: selected.reasoningEffort || null,
      runtimeTiers: null,
      customConfig: null,
    };
  }

  const customConfig = normalizeCustomConfig(keyResult?.customConfig);
  const runtimeTiers = buildCustomTierMap(customConfig);
  const selected = resolveCustomModelAlias(
    fallbackResolveModelTier(modelTier, provider, projectModels, runtimeTiers).model,
    runtimeTiers,
  );
  return {
    provider,
    selectedModel: selected.model,
    reasoningEffort: selected.reasoningEffort || null,
    runtimeTiers,
    customConfig,
  };
}
