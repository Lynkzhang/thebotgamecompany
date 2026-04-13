import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const [discoveredMcp, setDiscoveredMcp] = useState([])

  useEffect(() => {
    if (!selectedProject) return
    fetch(projectApi('/config')).then(r => r.json()).then(d => {
      setKeys(d.keyPool?.keys || [])
      setKeySelection(d.keySelection || null)
      setMcpServers(cloneMcpServers(d.config))
    }).catch(() => {})
    fetch(`/api/mcp/discover?project=${encodeURIComponent(selectedProject.id)}`).then(r => r.json()).then(d => {
      setDiscoveredMcp(d.candidates || [])
    }).catch(() => setDiscoveredMcp([]))
  }, [selectedProject?.id, projectSettingsOpen])

  if (!selectedProject) return null

  const selectedKeyId = keySelection?.keyId || null
  const fallbackEnabled = keySelection?.fallback !== false
  const defaultKey = keys.find(k => k.enabled)
  const selectedKey = selectedKeyId ? keys.find(k => k.id === selectedKeyId) : null
  // Detect stale pinned key (disabled or deleted)
  const pinnedKeyStale = selectedKeyId && (!selectedKey || !selectedKey.enabled)
  const effectiveKey = (selectedKey && selectedKey.enabled) ? selectedKey : defaultKey
  const effectiveKeyMissing = !effectiveKey
  const effectiveKeyRateLimited = !!effectiveKey?.rateLimited

  const saveKeySelection = async ({ keyId, fallback, successMessage }) => {
    setSaving(true)
    try {
      const res = await authFetch(projectApi('/token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: keyId ?? null,
          fallback,
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '保存项目凭据设置失败')
      setKeySelection(data.keySelection || null)
      const configRes = await fetch(projectApi('/config'))
      const configData = await configRes.json().catch(() => ({}))
      setKeys(configData.keyPool?.keys || [])
      if (successMessage) setToast(successMessage)
    } catch (e) {
      setToast(e.message || '保存项目凭据设置失败')
    }
    setSaving(false)
  }

  const handleKeyChange = async (keyId) => {
    await saveKeySelection({
      keyId: keyId || null,
      fallback: fallbackEnabled,
      successMessage: keyId ? '已更新项目绑定凭据' : '已切回全局默认凭据'
    })
  }

  const handleFallbackChange = async (fallback) => {
    await saveKeySelection({
      keyId: selectedKeyId,
      fallback,
      successMessage: fallback ? '已开启凭据回退' : '已关闭凭据回退'
    })
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

  const importMcpServers = async (names) => {
    if (!Array.isArray(names) || names.length === 0) return
    setSaving(true)
    try {
      const res = await authFetch(`/api/mcp/import?project=${encodeURIComponent(selectedProject.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '导入 MCP 配置失败')
      await fetchProjectData()
      const configRes = await fetch(projectApi('/config'))
      const configData = await configRes.json().catch(() => ({}))
      setMcpServers(cloneMcpServers(configData.config))
      setToast(`已导入 ${names.join(', ')}`)
    } catch (e) {
      setToast(e.message || '导入 MCP 配置失败')
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
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">当前项目凭据策略</span>
                {selectedKeyId ? <Badge variant="secondary">固定项目凭据</Badge> : <Badge variant="outline">使用全局默认</Badge>}
                {effectiveKeyRateLimited && <Badge variant="warning">Rate limited</Badge>}
              </div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                {effectiveKeyMissing
                  ? '当前没有任何可用凭据。请先到全局设置添加凭据。'
                  : selectedKeyId
                    ? `当前项目固定使用 ${selectedKey?.label || selectedKeyId}。`
                    : `当前项目跟随全局默认凭据：${effectiveKey.label}。`}
              </div>
              {selectedKeyId && !pinnedKeyStale && (
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  如果这个固定凭据失效、被禁用或触发限流，项目可能无法运行。你可以切回“使用全局默认值”。
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant={selectedKeyId ? 'outline' : 'default'}
                  onClick={() => handleKeyChange(null)}
                  disabled={saving || !defaultKey}
                >
                  跟随全局默认
                </Button>
                <Button
                  size="sm"
                  variant={selectedKeyId ? 'default' : 'outline'}
                  disabled={saving || keys.filter(k => k.enabled).length === 0}
                  onClick={() => {
                    if (!selectedKeyId) {
                      const preferred = defaultKey?.id || keys.find(k => k.enabled)?.id || null
                      if (preferred) handleKeyChange(preferred)
                    }
                  }}
                >
                  固定项目凭据
                </Button>
              </div>
            </div>

            {/* Key selector */}
            {selectedKeyId ? (
              <select
                value={selectedKeyId || ''}
                onChange={e => handleKeyChange(e.target.value || null)}
                disabled={saving}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 ${pinnedKeyStale ? 'border-red-400 dark:border-red-600' : 'border-neutral-300 dark:border-neutral-600'}`}
              >
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
            ) : (
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                当前不固定项目凭据，运行时始终使用全局列表中排在最前且可用的 key。
              </div>
            )}

            {pinnedKeyStale && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <span className="text-xs text-red-600 dark:text-red-400 flex-1">
                  ⚠️ 当前选中的 key {selectedKey ? '已禁用' : '不存在'}。Agent 无法运行，请改选其他 key 或切回全局默认值。
                </span>
                <Button variant="outline" size="sm" onClick={() => handleKeyChange(null)} disabled={saving}>切回全局默认</Button>
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

            {!pinnedKeyStale && effectiveKeyRateLimited && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="text-xs text-amber-700 dark:text-amber-300 flex-1">
                  当前生效凭据正在限流冷却中。{selectedKeyId && !fallbackEnabled ? '因为项目禁用了回退，所以当前运行会直接失败。' : '如果存在其他可用凭据，系统会尝试自动回退。'}
                </span>
                {selectedKeyId && <Button variant="outline" size="sm" onClick={() => handleKeyChange(null)} disabled={saving}>改用全局默认</Button>}
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

        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-5 mt-5">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">MCP 服务（项目级）</h3>
            <div className="flex items-center gap-2">
              {isWriteMode && discoveredMcp.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => importMcpServers(discoveredMcp.filter(item => !mcpServers[item.name]).map(item => item.name))}
                >
                  一键导入全局 MCP
                </Button>
              )}
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
          </div>
          <div className="space-y-3">
            {discoveredMcp.length > 0 && (
              <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 p-3 bg-indigo-50/60 dark:bg-indigo-950/20">
                <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2">发现到的全局 MCP 配置</div>
                <div className="space-y-2">
                  {discoveredMcp.map(item => {
                    const alreadyImported = !!mcpServers[item.name]
                    return (
                      <div key={`${item.source}-${item.name}-${item.filePath}`} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2 flex-wrap">
                            <span>{item.name}</span>
                            <Badge variant="outline">{item.source}</Badge>
                            <Badge variant={item.server.transport === 'stdio' ? 'secondary' : 'default'}>{item.server.transport}</Badge>
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{item.server.url || item.server.command || item.filePath}</div>
                        </div>
                        {isWriteMode && !alreadyImported && (
                          <Button variant="outline" size="sm" disabled={saving} onClick={() => importMcpServers([item.name])}>导入</Button>
                        )}
                        {alreadyImported && <Badge variant="success">已导入</Badge>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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
