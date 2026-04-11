import React, { useState } from 'react'
import { Activity, DollarSign, Settings, Save, Info, AlertTriangle } from 'lucide-react'
import DashboardWidget from '@/components/ui/DashboardWidget'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import SleepCountdown from '@/components/layout/SleepCountdown'

export function OrchestratorStateCard({ selectedProject, globalUptime, controlAction, isWriteMode }) {
  const activeAgents = selectedProject.activeAgents || []
  const activeLabel = activeAgents.length > 1
    ? `${activeAgents.length} 个 agent`
    : selectedProject.currentAgent || '无'
  return (
    <DashboardWidget icon={Activity} title="编排器状态">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">状态</span>
            <Badge variant={selectedProject.isComplete ? (selectedProject.completionSuccess ? 'success' : 'destructive') : selectedProject.paused ? 'warning' : selectedProject.running ? 'success' : 'destructive'}>
              {selectedProject.isComplete ? (selectedProject.completionSuccess ? '✅ Complete' : '🛑 Ended')
                : selectedProject.paused && selectedProject.currentAgent ? '⏳ Pausing...' : selectedProject.paused ? '⏸️ Paused' : selectedProject.running ? '▶️ Running' : '⏹️ Stopped'}
            </Badge>
          </div>
          {selectedProject.isComplete && selectedProject.completionMessage && (
            <div className={`p-3 rounded-lg text-sm ${selectedProject.completionSuccess ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
              🏁 {selectedProject.completionMessage}
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">Epoch / Cycle</span>
            <span className="text-2xl font-mono font-bold">{selectedProject.epochCount || 0}<span className="text-base text-neutral-400 dark:text-neutral-500 mx-1">/</span>{selectedProject.cycleCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">当前 Agent</span>
            {selectedProject.sleeping ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                💤 Sleeping
                {isWriteMode && <button onClick={(e) => { e.stopPropagation(); controlAction('skip') }} className="ml-1 hover:text-red-500 cursor-pointer" title="跳过休眠">✕</button>}
              </Badge>
            ) : (
              <Badge variant="secondary">{activeLabel}</Badge>
            )}
          </div>
          {activeAgents.length > 1 && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {activeAgents.map(agent => agent.name).join(', ')}
            </div>
          )}
          {selectedProject.sleeping && selectedProject.sleepUntil && !selectedProject.paused && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 dark:text-neutral-300">下一轮</span>
              <SleepCountdown sleepUntil={selectedProject.sleepUntil} />
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">阶段</span>
            <Badge variant={
              selectedProject.phase === 'planning' ? 'default' :
              selectedProject.phase === 'implementation' ? 'success' :
              selectedProject.phase === 'verification' ? 'warning' : 'secondary'
            }>
              {selectedProject.phase === 'planning' ? '🧠 规划 / 执行制作人' :
               selectedProject.phase === 'implementation' ? (selectedProject.isFixRound ? '🔧 修复 / PM' : '🔨 实现 / PM') :
               selectedProject.phase === 'verification' ? '✅ 验证 / QA 负责人' :
               selectedProject.phase || '未知'}
            </Badge>
          </div>
          {selectedProject.phase === 'implementation' && selectedProject.milestoneCyclesBudget > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 dark:text-neutral-300">里程碑进度</span>
              <span className="text-sm font-mono">{selectedProject.milestoneCyclesUsed || 0} / {selectedProject.milestoneCyclesBudget} 轮</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">上一轮耗时</span>
            <span className="text-sm font-mono">
              {selectedProject.cost?.lastCycleDuration 
                ? `${Math.floor(selectedProject.cost.lastCycleDuration / 60000)}m ${Math.floor((selectedProject.cost.lastCycleDuration % 60000) / 1000)}s`
                : '--'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">平均轮耗时</span>
            <span className="text-sm font-mono">
              {selectedProject.cost?.avgCycleDuration 
                ? `${Math.floor(selectedProject.cost.avgCycleDuration / 60000)}m ${Math.floor((selectedProject.cost.avgCycleDuration % 60000) / 1000)}s`
                : '--'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">运行时长</span>
            <span className="text-sm font-mono">{Math.floor(globalUptime / 3600)}h {Math.floor((globalUptime % 3600) / 60)}m</span>
          </div>
        </div>
        {isWriteMode && !selectedProject.paused && selectedProject.running && (
          <DangerZone controlAction={controlAction} selectedProject={selectedProject} />
        )}
    </DashboardWidget>
  )
}

function DangerZone({ controlAction, selectedProject }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(null) // 'kill-run' | 'kill-cycle' | 'kill-epoch'

  const handleKill = (action) => {
    if (confirming === action) {
      controlAction(action)
      setConfirming(null)
      setOpen(false)
    } else {
      setConfirming(action)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
      <button
        onClick={() => { setOpen(!open); setConfirming(null) }}
        className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        <AlertTriangle className="w-3 h-3" />
        {open ? '隐藏危险操作' : '危险操作'}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <button
            onClick={() => handleKill('kill-run')}
            disabled={!selectedProject.currentAgent}
            className="w-full px-3 py-1.5 text-xs font-medium rounded border transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950"
          >
            {confirming === 'kill-run' ? '⚠️ Click again to confirm' : '⏹ Kill Run'}
            <span className="block text-[10px] font-normal opacity-60">终止当前 agent，进入调度中的下一项</span>
          </button>
          <button
            onClick={() => handleKill('kill-cycle')}
            className="w-full px-3 py-1.5 text-xs font-medium rounded border transition-colors border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
          >
            {confirming === 'kill-cycle' ? '⚠️ Click again to confirm' : '⏹ Kill Cycle'}
            <span className="block text-[10px] font-normal opacity-60">终止当前 agent，并跳过剩余 worker</span>
          </button>
          <button
            onClick={() => handleKill('kill-epoch')}
            className="w-full px-3 py-1.5 text-xs font-medium rounded border transition-colors border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
          >
            {confirming === 'kill-epoch' ? '⚠️ Click again to confirm' : '💀 Kill Epoch'}
            <span className="block text-[10px] font-normal opacity-60">终止全部执行，回到 producer 规划阶段</span>
          </button>
        </div>
      )}
    </div>
  )
}

export function CostBudgetCard({ selectedProject, setBudgetInfoModal, configForm, configError, configDirty, configSaving, updateConfigField, resetConfig, saveConfig, isWriteMode, setIntervalInfoModal, setTimeoutInfoModal }) {
  return (
    <DashboardWidget icon={DollarSign} title="成本、预算与配置">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">上一轮成本</span>
            <span className="text-sm font-mono">${(selectedProject.cost?.lastCycleCost || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">平均轮成本</span>
            <span className="text-sm font-mono">${(selectedProject.cost?.avgCycleCost || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">最近 24 小时</span>
            <span className="text-sm font-mono">${(selectedProject.cost?.last24hCost || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-300">累计</span>
            <span className="text-sm font-mono">${(selectedProject.cost?.totalCost || 0).toFixed(2)}</span>
          </div>
          {selectedProject.budget && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-300">预算</span>
                <span className="text-sm font-mono">
                  ${selectedProject.budget.spent24h.toFixed(2)} / ${selectedProject.budget.budgetPer24h.toFixed(2)}
                  <span className="text-neutral-400 ml-1">({selectedProject.budget.percentUsed.toFixed(0)}%)</span>
                </span>
              </div>
              {selectedProject.budget.exhausted && (
                <div className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-between">
                  <span>预算已耗尽，本轮已暂停</span>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/projects/${selectedProject.id}/config`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ budgetPer24h: 0 }),
                        })
                        if (res.ok) window.location.reload()
                      } catch {}
                    }}
                    className="ml-2 px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium whitespace-nowrap"
                  >
                    移除限制
                  </button>
                </div>
              )}
              {!selectedProject.budget.exhausted && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-300">计算得到的间隔</span>
                  <span className="text-sm font-mono">
                    {selectedProject.budget.computedSleepMs >= 60000
                      ? `${Math.floor(selectedProject.budget.computedSleepMs / 60000)}m ${Math.floor((selectedProject.budget.computedSleepMs % 60000) / 1000)}s`
                      : `${Math.floor(selectedProject.budget.computedSleepMs / 1000)}s`}
                  </span>
                </div>
              )}
            </>
          )}
          {/* Configuration */}
          <div className="pt-3 border-t mt-3">
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">配置</h4>
            {configError && <div className="mb-3 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-xs">{configError}</div>}
            <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <label className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
              轮次间隔
              <button onClick={() => setIntervalInfoModal(true)} className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300">
                <Info className="w-3 h-3" />
              </button>
            </label>
            <select 
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              value={configForm.cycleIntervalMs} 
              onChange={(e) => updateConfigField('cycleIntervalMs', Number(e.target.value))}
            >
              <option value={0}>不延迟</option><option value={300000}>5m</option><option value={600000}>10m</option><option value={1200000}>20m</option><option value={1800000}>30m</option><option value={3600000}>1h</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
              Agent 超时
              <button onClick={() => setTimeoutInfoModal(true)} className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300">
                <Info className="w-3 h-3" />
              </button>
            </label>
            <select 
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              value={configForm.agentTimeoutMs} 
              onChange={(e) => updateConfigField('agentTimeoutMs', Number(e.target.value))}
            >
              <option value={300000}>5m</option><option value={600000}>10m</option><option value={900000}>15m</option><option value={1800000}>30m</option><option value={3600000}>1h</option><option value={7200000}>2h</option><option value={14400000}>4h</option><option value={0}>永不</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
              24 小时预算
              <button onClick={() => setBudgetInfoModal(true)} className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300">
                <Info className="w-3 h-3" />
              </button>
            </label>
            <div className="flex items-center">
              {configForm.budgetPer24h > 0 && (
                <button
                  onClick={() => updateConfigField('budgetPer24h', 0)}
                  className="mr-2 px-2 py-1.5 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                  title="移除预算限制"
                >
                  ✕
                </button>
              )}
              <button
                onClick={() => updateConfigField('budgetPer24h', Math.max(0, (configForm.budgetPer24h || 0) - 20))}
                className="px-2 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-l-md text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                −
              </button>
              <div className="px-3 py-1.5 bg-white dark:bg-neutral-800 border-y border-neutral-300 dark:border-neutral-600 text-sm dark:text-neutral-200 text-center min-w-[60px]">
                {configForm.budgetPer24h ? `$${configForm.budgetPer24h}` : '关闭'}
              </div>
              <button
                onClick={() => updateConfigField('budgetPer24h', (configForm.budgetPer24h || 0) + 20)}
                className="px-2 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-r-md text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                +
              </button>
            </div>
          </div>
        </div>
          {configDirty && (
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
              <Badge variant="warning">未保存</Badge>
              <button onClick={resetConfig} className="px-2 py-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                重置
              </button>
              {isWriteMode && <button 
                onClick={saveConfig} 
                disabled={configSaving}
                className="px-3 py-1.5 rounded text-xs font-medium inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Save className="w-3 h-3 mr-1.5" />{configSaving ? '...' : '保存'}
              </button>}
            </div>
          )}
          <div className="pt-2 border-t mt-3">
            <button
              onClick={() => setBudgetInfoModal(true)}
              className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
            >
              预算如何生效 →
            </button>
          </div>
          </div>
        </div>
    </DashboardWidget>
  )
}
