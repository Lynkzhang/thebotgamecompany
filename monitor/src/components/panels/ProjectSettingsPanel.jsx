import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'
import { Panel, PanelHeader, PanelContent } from '@/components/ui/panel'
import yaml from 'js-yaml'

function cloneMcpServers(config) {
  const servers = config?.mcp?.servers || {}
  return Object.fromEntries(Object.entries(servers).map(([name, server]) => [name, { ...server }]))
}

export default function ProjectSettingsPanel({
  selectedProject,
  projectSettingsOpen,
  setProjectSettingsOpen,
  setProjSetting,
  notifUseGlobal,
  projNotifSettings,
  setShowApiKeyHelp,
  authFetch,
  projectApi,
  setToast,
  isWriteMode,
  config,
  setSelectedProject,
  fetchProjectData,
  fetchGlobalStatus,
  removeProject,
}) {
  const [keys, setKeys] = useState([])
  const [keySelection, setKeySelection] = useState(null)
  const [saving, setSaving] = useState(false)
  const [mcpServers, setMcpServers] = useState({})

  useEffect(() => {
    if (!selectedProject) return
    // Fetch key pool and project key selection
    fetch('/api/keys').then(r => r.json()).then(d => setKeys(d.keys || [])).catch(() => {})
    fetch(projectApi('/config')).then(r => r.json()).then(d => {
      setKeySelection(d.keySelection || null)
      setMcpServers(cloneMcpServers(d.config))
    }).catch(() => {})
  }, [selectedProject?.id])

  if (!selectedProject) return null

  const selectedKeyId = keySelection?.keyId || null
  const fallbackEnabled = keySelection?.fallback !== false
  const defaultKey = keys.find(k => k.enabled)
  const selectedKey = selectedKeyId ? keys.find(k => k.id === selectedKeyId) : null
  // Detect stale pinned key (disabled or deleted)
  const pinnedKeyStale = selectedKeyId && (!selectedKey || !selectedKey.enabled)
  const effectiveKey = (selectedKey && selectedKey.enabled) ? selectedKey : defaultKey

  const handleKeyChange = async (keyId) => {
    setSaving(true)
    try {
      const res = await authFetch(projectApi('/token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: keyId || null,
          fallback: fallbackEnabled,
        })
      })
      if (res.ok) {
        const d = await res.json()
        setKeySelection(d.keySelection || null)
        setToast(keyId ? '已更新 Key 选择' : '已切回全局默认值')
      }
    } catch {}
    setSaving(false)
  }

  const handleFallbackChange = async (fallback) => {
    setSaving(true)
    try {
      const res = await authFetch(projectApi('/token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: selectedKeyId,
          fallback,
        })
      })
      if (res.ok) {
        const d = await res.json()
        setKeySelection(d.keySelection || null)
      }
    } catch {}
    setSaving(false)
  }

  const saveMcpServers = async (nextServers) => {
    setSaving(true)
    try {
      const existing = config.config || {}
      const merged = JSON.parse(JSON.stringify(existing))
      if (Object.keys(nextServers).length > 0) {
        merged.mcp = { ...(merged.mcp || {}), servers: nextServers }
      } else if (merged.mcp) {
        delete merged.mcp.servers
        if (Object.keys(merged.mcp).length === 0) delete merged.mcp
      }
      const content = `# ${selectedProject.id} - Orchestrator Configuration\n${yaml.dump(merged, { lineWidth: -1 })}`
      await authFetch(projectApi('/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      await fetchProjectData()
      setToast('MCP 设置已保存')
    } catch (e) {
      setToast(`保存 MCP 设置失败：${e.message}`)
    }
    setSaving(false)
  }

  return (
    <Panel id="project-settings" open={projectSettingsOpen} onClose={() => setProjectSettingsOpen(false)}>
      <PanelHeader onClose={() => setProjectSettingsOpen(false)}>项目设置（通知 / 凭据 / 模型 / MCP）</PanelHeader>
      <PanelContent>
        <div className="pb-5 text-xs text-neutral-500 dark:text-neutral-400">
          这里可以配置项目通知、固定凭据、默认模型覆盖，以及项目级 MCP 服务。
        </div>
        {/* Notifications section */}
        <div className="pb-5">
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">通知</h3>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-neutral-700 dark:text-neutral-300">使用全局设置</span>
            <button
              onClick={() => setProjSetting('notifs', { useGlobal: !notifUseGlobal })}
              className={`relative w-11 h-6 rounded-full transition-colors ${notifUseGlobal ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifUseGlobal ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className={notifUseGlobal ? 'opacity-40 pointer-events-none' : ''}>
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">推送通知</span>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">里程碑、验证结果和错误提醒</p>
              </div>
              <button
                onClick={() => setProjSetting('notifs', { push: !(projNotifSettings.push !== false) })}
                className={`relative w-11 h-6 rounded-full transition-colors ${projNotifSettings.push !== false ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${projNotifSettings.push !== false ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">详细通知</span>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">每次 agent 响应都推送</p>
              </div>
              <button
                onClick={() => setProjSetting('notifs', { detailed: !projNotifSettings.detailed })}
                className={`relative w-11 h-6 rounded-full transition-colors ${projNotifSettings.detailed ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${projNotifSettings.detailed ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* API Key Selection */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">API Key</h3>
            <button
              onClick={() => setShowApiKeyHelp(true)}
              className="text-neutral-400 hover:text-blue-500 dark:text-neutral-500 dark:hover:text-blue-400 transition-colors"
              title="如何获取 API Key"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Key selector */}
            <select
              value={selectedKeyId || ''}
              onChange={e => handleKeyChange(e.target.value || null)}
              disabled={saving}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 ${pinnedKeyStale ? 'border-red-400 dark:border-red-600' : 'border-neutral-300 dark:border-neutral-600'}`}
            >
              <option value="">
                使用全局默认值{defaultKey ? `（"${defaultKey.label}"）` : ''}
              </option>
              {pinnedKeyStale && (
                <option value={selectedKeyId} disabled>
                  ⚠️ {selectedKey ? selectedKey.label : selectedKeyId.slice(0, 8)} — 已禁用 / 不可用
                </option>
              )}
              {keys.filter(k => k.enabled).map(k => (
                <option key={k.id} value={k.id}>
                  {k.label} — {k.provider} ({k.preview})
                </option>
              ))}
            </select>

            {pinnedKeyStale && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <span className="text-xs text-red-600 dark:text-red-400">
                  ⚠️ 当前选中的 key {selectedKey ? '已禁用' : '不存在'}。Agent 无法运行，请改选其他 key 或切回全局默认值。
                </span>
              </div>
            )}

            {/* Effective key display */}
            {!pinnedKeyStale && effectiveKey && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  当前使用：<span className="font-medium text-neutral-800 dark:text-neutral-200">{effectiveKey.label}</span>
                  {' '}({effectiveKey.provider})
                </span>
              </div>
            )}

            {/* Fallback option — only show when a specific key is selected */}
            {selectedKeyId && (
              <div className="flex items-center justify-between py-2">
                <div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">允许回退</span>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      当前 key 达到限流时可切换到其他 key
                  </p>
                </div>
                <button
                  onClick={() => handleFallbackChange(!fallbackEnabled)}
                  disabled={saving}
                  className={`relative w-11 h-6 rounded-full transition-colors ${fallbackEnabled ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${fallbackEnabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            )}

            {keys.length === 0 && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                 还没有配置 API Key，请先到全局设置里添加。
              </p>
            )}
          </div>
        </div>

        {/* Model Overrides */}
        {isWriteMode && (() => {
          const canOverride = selectedKeyId && !fallbackEnabled && !pinnedKeyStale;
          const currentModels = selectedProject?.config?.models || {};
          const hasOverrides = !!(currentModels.high || currentModels.mid || currentModels.low || currentModels.xlow);
          const keyProvider = selectedKey?.provider || 'anthropic';
          const providerTiers = keyProvider === 'custom'
            ? (config?.tiers || {})
            : (config?.allTiers?.[keyProvider] || {});
          const availableModels = keyProvider === 'custom'
            ? []
            : (config?.availableModels?.[keyProvider] || []);

          const saveModels = async (models) => {
            try {
              await authFetch(projectApi('/models'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ models })
              });
              await fetchProjectData();
            } catch {}
          };

          return (
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-5 mt-5">
            <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">模型覆盖</h3>
              {canOverride && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasOverrides}
                  onClick={() => {
                    if (hasOverrides) {
                      setSelectedProject(prev => prev ? { ...prev, config: { ...prev.config, models: {} } } : prev);
                       saveModels({}).then(() => setToast('已关闭模型覆盖'));
                    } else {
                      const defaults = {};
                      for (const tier of ['high', 'mid', 'low', 'xlow']) {
                        if (providerTiers[tier]) defaults[tier] = providerTiers[tier].model;
                      }
                      setSelectedProject(prev => prev ? { ...prev, config: { ...prev.config, models: defaults } } : prev);
                       saveModels(defaults).then(() => setToast('已启用模型覆盖'));
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${hasOverrides ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasOverrides ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              )}
            </div>
            {!canOverride ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                 如果要覆盖模型，请先在上方选择一个固定 API Key，并关闭回退。这样项目会锁定到单一 provider，才能按档位自定义模型。
              </p>
            ) : hasOverrides ? (
              <div className="space-y-2">
                {['high', 'mid', 'low', 'xlow'].map(tier => (
                  <div key={tier} className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-10 shrink-0 ${tier === 'high' ? 'text-purple-500' : tier === 'mid' ? 'text-blue-500' : tier === 'xlow' ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'}`}>{tier.toUpperCase()}</span>
                    {keyProvider === 'custom' ? (
                      <input
                        type="text"
                        value={currentModels[tier] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const models = { ...currentModels };
                          if (val) models[tier] = val; else delete models[tier];
                          setSelectedProject(prev => prev ? { ...prev, config: { ...prev.config, models } } : prev);
                          saveModels(models);
                        }}
                        placeholder={`Default (${providerTiers[tier]?.model || '—'})`}
                        className="flex-1 min-w-0 px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      />
                    ) : (
                      <select
                        value={currentModels[tier] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const models = { ...currentModels };
                          if (val) models[tier] = val; else delete models[tier];
                          setSelectedProject(prev => prev ? { ...prev, config: { ...prev.config, models } } : prev);
                          saveModels(models);
                        }}
                        className="flex-1 min-w-0 px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      >
                         <option value="">默认值（{providerTiers[tier]?.model || '—'}{providerTiers[tier]?.reasoningEffort ? `（${providerTiers[tier].reasoningEffort}）` : ''}）</option>
                        {availableModels.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {keyProvider === 'custom'
                   ? '当前使用选中的自定义凭据默认值。启用后可手动填写各档位模型。'
                   : `当前使用 ${keyProvider} 的默认模型。启用后可按档位自定义。`}
              </p>
            )}
          </div>
          );
        })()}

        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-5 mt-5">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">MCP 服务（项目级）</h3>
            {isWriteMode && (
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => {
                  let name = 'unity'
                  let idx = 2
                  while (mcpServers[name]) name = `unity${idx++}`
                  const next = {
                    ...mcpServers,
                    [name]: { enabled: true, transport: 'http', url: 'http://127.0.0.1:8080', timeoutMs: 30000 }
                  }
                  setMcpServers(next)
                  saveMcpServers(next)
                }}
              >
                 添加服务
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {Object.keys(mcpServers).length === 0 && (
               <p className="text-xs text-neutral-400 dark:text-neutral-500">当前项目还没有配置 MCP 服务。</p>
            )}
            {Object.entries(mcpServers).map(([name, server]) => (
              <div key={name} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 space-y-3 bg-neutral-50 dark:bg-neutral-800/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm text-neutral-800 dark:text-neutral-200">{name}</div>
                  {isWriteMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={saving}
                      onClick={() => {
                        const next = { ...mcpServers }
                        delete next[name]
                        setMcpServers(next)
                        saveMcpServers(next)
                      }}
                    >
                      删除
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">启用</span>
                  <button
                    disabled={!isWriteMode || saving}
                    onClick={() => {
                      const next = { ...mcpServers, [name]: { ...server, enabled: !(server.enabled !== false) } }
                      setMcpServers(next)
                      saveMcpServers(next)
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${(server.enabled !== false) ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${(server.enabled !== false) ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={server.transport || 'http'}
                    disabled={!isWriteMode || saving}
                    onChange={e => {
                      const next = { ...mcpServers, [name]: { ...server, transport: e.target.value } }
                      setMcpServers(next)
                      saveMcpServers(next)
                    }}
                    className="px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="http">HTTP</option>
                    <option value="stdio">STDIO</option>
                  </select>
                  <input
                    type="text"
                    value={server.url || ''}
                    disabled={!isWriteMode || saving}
                    onChange={e => {
                      const next = { ...mcpServers, [name]: { ...server, url: e.target.value } }
                      setMcpServers(next)
                      saveMcpServers(next)
                    }}
                    placeholder="http://127.0.0.1:8080"
                    className="sm:col-span-2 px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={server.timeoutMs || 30000}
                  disabled={!isWriteMode || saving}
                  onChange={e => {
                    const next = { ...mcpServers, [name]: { ...server, timeoutMs: Number(e.target.value) || 30000 } }
                    setMcpServers(next)
                    saveMcpServers(next)
                  }}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        {isWriteMode && (
          <div className="border-t border-red-200 dark:border-red-900 pt-5 mt-5">
             <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider mb-3">危险操作</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {selectedProject?.archived ? '取消归档项目' : '归档项目'}
                  </span>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {selectedProject?.archived ? '把这个项目恢复到活跃列表' : '从面板隐藏该项目，数据会保留。'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const action = selectedProject?.archived ? 'unarchive' : 'archive'
                    try {
                      await authFetch(projectApi(`/${action}`), { method: 'POST' })
                      await fetchGlobalStatus()
                      await fetchProjectData()
                      setToast(action === 'archive' ? '项目已归档' : '项目已取消归档')
                    } catch {}
                  }}
                >
                  {selectedProject?.archived ? '取消归档' : '归档'}
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                <div>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">删除项目</span>
                  <p className="text-xs text-red-400 dark:text-red-500 mt-0.5">永久删除这个项目及其全部数据</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                     if (!confirm(`确定要永久删除 "${selectedProject?.id}" 吗？此操作无法撤销。`)) return
                     if (!confirm('这会删除全部工作区数据、agent 技能和历史记录，确认继续吗？')) return
                    try {
                      await removeProject(selectedProject.id)
                      setProjectSettingsOpen(false)
                    } catch {}
                  }}
                >
                  删除
                </Button>
              </div>
            </div>
          </div>
        )}
      </PanelContent>
    </Panel>
  )
}
