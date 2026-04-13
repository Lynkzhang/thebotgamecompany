import React from 'react'
import { Sparkles, Users, PencilRuler, Code2, Palette, ShieldCheck, Boxes, StickyNote, MonitorSpeaker, Paintbrush, ClipboardCheck, Package2, Info, Settings, Filter } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import WorkerCard from '@/components/project/WorkerCard'

function classifyWorker(agent) {
  const text = `${agent.role || ''} ${agent.name || ''}`.toLowerCase()
  if (/数值策划|数值|economy|numerical|balance/.test(text)) return 'design_numeric'
  if (/系统策划|system design|system planner|system/.test(text)) return 'design_system'
  if (/战斗策划|combat design|combat planner|combat/.test(text)) return 'design_combat'
  if (/关卡策划|level design|level planner|level/.test(text)) return 'design_level'
  if (/程序|engineer|coder|developer|client|server|technical/.test(text)) return 'engineering'
  if (/(^|\s)ui($|\s)|ui设计|interface/.test(text)) return 'art_ui'
  if (/(^|\s)ue($|\s)|ue设计|user experience|ux/.test(text)) return 'art_ue'
  if (/场景|scene|environment/.test(text)) return 'art_scene'
  if (/原画|concept art|concept|illustration/.test(text)) return 'art_concept'
  if (/qa|test|测试|verify|verification/.test(text)) return 'qa'
  return 'ops'
}

function classifyManager(agent) {
  const text = `${agent.role || ''} ${agent.name || ''}`.toLowerCase()
  if (/producer|制作人|执行制作人/.test(text)) return 'producer'
  if (/(^|\s)pm($|\s)|项目经理/.test(text)) return 'pm'
  if (/qa|验证|测试/.test(text)) return 'qa'
  if (/final|review|验收/.test(text)) return 'review'
  return 'other'
}

const WORK_ZONES = {
  design_numeric: {
    title: '数值策划',
    description: '数值、平衡、成长和经济相关席位。',
    icon: PencilRuler,
    propIcon: StickyNote,
    sectionClass: 'border-rose-100 dark:border-rose-400/10 bg-gradient-to-br from-white to-rose-50/65 dark:from-slate-900 dark:to-rose-950/10',
    cardClass: 'border-rose-100 dark:border-rose-400/10 bg-gradient-to-br from-white to-rose-50/55 dark:from-slate-900 dark:to-rose-950/10',
    iconClass: 'from-rose-400 to-pink-500',
    deskClass: 'from-rose-200 to-pink-200 dark:from-rose-400/20 dark:to-pink-500/20',
    screenClass: 'from-rose-500 to-pink-500',
    chairClass: 'from-pink-300/80 to-rose-500/80 dark:from-pink-400/30 dark:to-rose-600/30',
  },
  design_system: {
    title: '系统策划',
    description: '系统结构、规则组织和功能框架相关席位。',
    icon: PencilRuler,
    propIcon: StickyNote,
    sectionClass: 'border-violet-100 dark:border-violet-400/10 bg-gradient-to-br from-white to-violet-50/65 dark:from-slate-900 dark:to-violet-950/10',
    cardClass: 'border-violet-100 dark:border-violet-400/10 bg-gradient-to-br from-white to-violet-50/55 dark:from-slate-900 dark:to-violet-950/10',
    iconClass: 'from-violet-400 to-indigo-500',
    deskClass: 'from-violet-200 to-indigo-200 dark:from-violet-400/20 dark:to-indigo-500/20',
    screenClass: 'from-violet-500 to-indigo-500',
    chairClass: 'from-indigo-300/80 to-violet-500/80 dark:from-indigo-400/30 dark:to-violet-600/30',
  },
  design_combat: {
    title: '战斗策划',
    description: '战斗循环、技能、敌人和判定相关席位。',
    icon: PencilRuler,
    propIcon: StickyNote,
    sectionClass: 'border-red-100 dark:border-red-400/10 bg-gradient-to-br from-white to-red-50/65 dark:from-slate-900 dark:to-red-950/10',
    cardClass: 'border-red-100 dark:border-red-400/10 bg-gradient-to-br from-white to-red-50/55 dark:from-slate-900 dark:to-red-950/10',
    iconClass: 'from-red-400 to-rose-500',
    deskClass: 'from-red-200 to-rose-200 dark:from-red-400/20 dark:to-rose-500/20',
    screenClass: 'from-red-500 to-rose-500',
    chairClass: 'from-rose-300/80 to-red-500/80 dark:from-rose-400/30 dark:to-red-600/30',
  },
  design_level: {
    title: '关卡策划',
    description: '流程、地图、波次和关卡节奏相关席位。',
    icon: PencilRuler,
    propIcon: StickyNote,
    sectionClass: 'border-amber-100 dark:border-amber-400/10 bg-gradient-to-br from-white to-amber-50/65 dark:from-slate-900 dark:to-amber-950/10',
    cardClass: 'border-amber-100 dark:border-amber-400/10 bg-gradient-to-br from-white to-amber-50/55 dark:from-slate-900 dark:to-amber-950/10',
    iconClass: 'from-amber-400 to-orange-500',
    deskClass: 'from-amber-200 to-orange-200 dark:from-amber-400/20 dark:to-orange-500/20',
    screenClass: 'from-amber-500 to-orange-500',
    chairClass: 'from-orange-300/80 to-amber-500/80 dark:from-orange-400/30 dark:to-amber-600/30',
  },
  engineering: {
    title: '程序',
    description: '客户端、服务端、工具链和技术实现相关席位。',
    icon: Code2,
    propIcon: MonitorSpeaker,
    sectionClass: 'border-sky-100 dark:border-sky-400/10 bg-gradient-to-br from-white to-sky-50/65 dark:from-slate-900 dark:to-sky-950/10',
    cardClass: 'border-sky-100 dark:border-sky-400/10 bg-gradient-to-br from-white to-sky-50/55 dark:from-slate-900 dark:to-sky-950/10',
    iconClass: 'from-sky-400 to-indigo-500',
    deskClass: 'from-sky-200 to-indigo-200 dark:from-sky-400/20 dark:to-indigo-500/20',
    screenClass: 'from-slate-700 to-indigo-500',
    chairClass: 'from-indigo-300/80 to-sky-500/80 dark:from-indigo-400/30 dark:to-sky-600/30',
  },
  art_ui: {
    title: 'UI',
    description: '界面视觉、版式和组件表现相关席位。',
    icon: Palette,
    propIcon: Paintbrush,
    sectionClass: 'border-fuchsia-100 dark:border-fuchsia-400/10 bg-gradient-to-br from-white to-fuchsia-50/65 dark:from-slate-900 dark:to-fuchsia-950/10',
    cardClass: 'border-fuchsia-100 dark:border-fuchsia-400/10 bg-gradient-to-br from-white to-fuchsia-50/55 dark:from-slate-900 dark:to-fuchsia-950/10',
    iconClass: 'from-fuchsia-400 to-violet-500',
    deskClass: 'from-fuchsia-200 to-violet-200 dark:from-fuchsia-400/20 dark:to-violet-500/20',
    screenClass: 'from-fuchsia-500 to-violet-500',
    chairClass: 'from-violet-300/80 to-fuchsia-500/80 dark:from-violet-400/30 dark:to-fuchsia-600/30',
  },
  art_ue: {
    title: 'UE',
    description: '体验细节、交互动效和使用感优化相关席位。',
    icon: Palette,
    propIcon: Paintbrush,
    sectionClass: 'border-indigo-100 dark:border-indigo-400/10 bg-gradient-to-br from-white to-indigo-50/65 dark:from-slate-900 dark:to-indigo-950/10',
    cardClass: 'border-indigo-100 dark:border-indigo-400/10 bg-gradient-to-br from-white to-indigo-50/55 dark:from-slate-900 dark:to-indigo-950/10',
    iconClass: 'from-indigo-400 to-blue-500',
    deskClass: 'from-indigo-200 to-blue-200 dark:from-indigo-400/20 dark:to-blue-500/20',
    screenClass: 'from-indigo-500 to-blue-500',
    chairClass: 'from-blue-300/80 to-indigo-500/80 dark:from-blue-400/30 dark:to-indigo-600/30',
  },
  art_scene: {
    title: '场景',
    description: '环境、地图表现和空间氛围相关席位。',
    icon: Palette,
    propIcon: Paintbrush,
    sectionClass: 'border-emerald-100 dark:border-emerald-400/10 bg-gradient-to-br from-white to-emerald-50/65 dark:from-slate-900 dark:to-emerald-950/10',
    cardClass: 'border-emerald-100 dark:border-emerald-400/10 bg-gradient-to-br from-white to-emerald-50/55 dark:from-slate-900 dark:to-emerald-950/10',
    iconClass: 'from-emerald-400 to-teal-500',
    deskClass: 'from-emerald-200 to-teal-200 dark:from-emerald-400/20 dark:to-teal-500/20',
    screenClass: 'from-emerald-500 to-teal-500',
    chairClass: 'from-teal-300/80 to-emerald-500/80 dark:from-teal-400/30 dark:to-emerald-600/30',
  },
  art_concept: {
    title: '原画',
    description: '角色、立绘、概念和风格板相关席位。',
    icon: Palette,
    propIcon: Paintbrush,
    sectionClass: 'border-pink-100 dark:border-pink-400/10 bg-gradient-to-br from-white to-pink-50/65 dark:from-slate-900 dark:to-pink-950/10',
    cardClass: 'border-pink-100 dark:border-pink-400/10 bg-gradient-to-br from-white to-pink-50/55 dark:from-slate-900 dark:to-pink-950/10',
    iconClass: 'from-pink-400 to-fuchsia-500',
    deskClass: 'from-pink-200 to-fuchsia-200 dark:from-pink-400/20 dark:to-fuchsia-500/20',
    screenClass: 'from-pink-500 to-fuchsia-500',
    chairClass: 'from-fuchsia-300/80 to-pink-500/80 dark:from-fuchsia-400/30 dark:to-pink-600/30',
  },
  qa: {
    title: 'QA',
    description: '验证、回归、检查和问题回流相关席位。',
    icon: ShieldCheck,
    propIcon: ClipboardCheck,
    sectionClass: 'border-emerald-100 dark:border-emerald-400/10 bg-gradient-to-br from-white to-emerald-50/65 dark:from-slate-900 dark:to-emerald-950/10',
    cardClass: 'border-emerald-100 dark:border-emerald-400/10 bg-gradient-to-br from-white to-emerald-50/55 dark:from-slate-900 dark:to-emerald-950/10',
    iconClass: 'from-emerald-400 to-teal-500',
    deskClass: 'from-emerald-200 to-teal-200 dark:from-emerald-400/20 dark:to-teal-500/20',
    screenClass: 'from-emerald-500 to-teal-500',
    chairClass: 'from-emerald-300/80 to-teal-500/80 dark:from-emerald-400/30 dark:to-teal-600/30',
  },
  ops: {
    title: '支援',
    description: '未明确归类的执行角色与机动支援席位。',
    icon: Boxes,
    propIcon: Package2,
    sectionClass: 'border-amber-100 dark:border-amber-400/10 bg-gradient-to-br from-white to-amber-50/65 dark:from-slate-900 dark:to-amber-950/10',
    cardClass: 'border-amber-100 dark:border-amber-400/10 bg-gradient-to-br from-white to-amber-50/55 dark:from-slate-900 dark:to-amber-950/10',
    iconClass: 'from-amber-400 to-orange-500',
    deskClass: 'from-amber-200 to-orange-200 dark:from-amber-400/20 dark:to-orange-500/20',
    screenClass: 'from-amber-500 to-orange-500',
    chairClass: 'from-amber-300/80 to-orange-500/80 dark:from-amber-400/30 dark:to-orange-600/30',
  },
}

export default function StudioFloorCard({
  managers = [],
  workers = [],
  selectedProject,
  selectedAgent,
  openAgentModal,
  openAgentSettings,
  selectAgent,
  clearAgentFilter,
}) {
  const groupedManagers = managers.reduce((acc, agent) => {
    const key = classifyManager(agent)
    acc[key].push(agent)
    return acc
  }, { producer: [], pm: [], qa: [], review: [], other: [] })

  const groupedWorkers = workers.reduce((acc, agent) => {
    const key = classifyWorker(agent)
    if (!acc[key]) acc[key] = []
    acc[key].push(agent)
    return acc
  }, Object.fromEntries(Object.keys(WORK_ZONES).map(key => [key, []])))

  const [mode, setMode] = React.useState(() => {
    try { return localStorage.getItem('studio-floor-mode') || 'classic' } catch { return 'classic' }
  })

  React.useEffect(() => {
    try { localStorage.setItem('studio-floor-mode', mode) } catch {}
  }, [mode])

  const SeatTile = ({ agent, zoneClass = '', deskClass = '', screenClass = '', chairClass = '', compact = false }) => {
    const activeEntry = selectedProject?.activeAgents?.find?.(entry => entry.name === agent.name) || null
    const isActive = !!activeEntry || selectedProject?.currentAgent === agent.name
    const isSelected = selectedAgent === agent.name
    const runtime = activeEntry?.runtime ?? (isActive ? selectedProject?.currentAgentRuntime : null)
    const roleLabel = agent.role || 'agent'
    return (
      <div className={`relative rounded-[18px] border ${zoneClass} ${isActive ? 'seat-active' : ''} bg-white/70 dark:bg-white/5 p-2.5 overflow-hidden min-h-[124px]`}>
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-80">
          <button onClick={() => openAgentModal(agent.name)} className="p-1 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white text-neutral-500 dark:text-neutral-300" title="查看 agent 详情"><Info className="w-3 h-3" /></button>
          <button onClick={() => openAgentSettings(agent)} className="p-1 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white text-neutral-500 dark:text-neutral-300" title="Agent 模型设置"><Settings className="w-3 h-3" /></button>
          <button onClick={() => isSelected ? clearAgentFilter() : selectAgent(agent.name)} className={`p-1 rounded-full ${isSelected ? 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-200' : 'bg-white/80 dark:bg-white/10 hover:bg-white text-neutral-500 dark:text-neutral-300'}`} title="按 agent 过滤报告"><Filter className="w-3 h-3" /></button>
        </div>

        <div className="pt-6 flex flex-col items-center text-center">
          <div className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100 leading-tight line-clamp-1 max-w-full">{agent.name}</div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1 max-w-full">{roleLabel}</div>

          <div className="relative mt-2.5 w-full max-w-[136px]">
            <div className={`h-7 rounded-[12px] border border-white/70 dark:border-white/10 bg-gradient-to-b ${deskClass} shadow-[0_5px_12px_rgba(99,102,241,0.12)]`} />
            <div className={`absolute left-1/2 top-1 -translate-x-1/2 h-3 w-12 rounded-md bg-gradient-to-r ${screenClass} shadow-sm ${isActive ? 'ring-2 ring-white/80 dark:ring-fuchsia-300/20 shadow-[0_0_16px_rgba(96,165,250,0.32)]' : ''}`} />
            <div className="absolute left-3 top-4 h-1 w-7 rounded-full bg-white/70 dark:bg-white/10" />
            <div className="absolute right-3 top-4 h-1 w-5 rounded-full bg-white/50 dark:bg-white/10" />
          </div>
          <div className={`mt-1 h-3 w-8 rounded-b-full rounded-t-[8px] bg-gradient-to-b ${chairClass}`} />

          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1">
            {agent.model && <span className="px-1.5 py-0.5 text-[10px] rounded-full border border-indigo-100 dark:border-indigo-300/10 bg-white/80 dark:bg-white/10 text-indigo-700 dark:text-indigo-200 max-w-full truncate">{agent.model}</span>}
            {isActive && <span className="seat-lamp">✦ In Seat{runtime != null ? ` · ${Math.floor(runtime / 60)}m` : ''}</span>}
          </div>
        </div>
      </div>
    )
  }

  const renderClassicMode = () => (
    <>
      <div className="rounded-[20px] border border-fuchsia-100 dark:border-white/10 bg-white/45 dark:bg-white/5 p-4 relative overflow-hidden">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-300/70 to-transparent dark:via-fuchsia-300/35" />
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Managers</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">更像靠窗会议区，负责规划、派工和验收收口</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr] items-start">
            <div className="rounded-[22px] border border-fuchsia-200/80 dark:border-fuchsia-300/15 bg-gradient-to-br from-white via-fuchsia-50/70 to-violet-50/70 dark:from-slate-900 dark:via-fuchsia-950/10 dark:to-violet-950/10 p-3 min-h-[158px]">
                <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/75 border border-fuchsia-100 dark:border-white/12 text-[11px] uppercase tracking-[0.22em] text-fuchsia-500 dark:text-white shadow-sm">
                  <span>主会议席</span>
                  <span className="text-xs opacity-80">✦</span>
                </div>
              <div className="grid gap-3">
                {groupedManagers.producer.map((agent) => (
                  <WorkerCard key={agent.name} agent={agent} isManager className="rounded-2xl border border-fuchsia-200/80 dark:border-fuchsia-300/15 bg-gradient-to-br from-white to-fuchsia-50/70 dark:from-slate-900 dark:to-fuchsia-950/10 shadow-sm p-3" selectedProject={selectedProject} selectedAgent={selectedAgent} openAgentModal={openAgentModal} openAgentSettings={openAgentSettings} selectAgent={selectAgent} clearAgentFilter={clearAgentFilter} />
                ))}
                {groupedManagers.producer.length === 0 && <p className="text-sm text-neutral-400 dark:text-neutral-500">主会议席暂无负责人</p>}
              </div>
            </div>

            <div className="rounded-[22px] border border-violet-100 dark:border-violet-300/10 bg-gradient-to-br from-white to-violet-50/65 dark:from-slate-900 dark:to-violet-950/10 p-3 min-h-[158px]">
              <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/75 border border-violet-100 dark:border-white/12 text-[11px] uppercase tracking-[0.22em] text-violet-500 dark:text-white shadow-sm">
                <span>调度排班台</span>
                <span className="text-xs opacity-80">✦</span>
              </div>
              <div className="grid gap-3">
                {groupedManagers.pm.map((agent) => (
                  <WorkerCard key={agent.name} agent={agent} isManager className="rounded-2xl border border-violet-100 dark:border-violet-300/10 bg-gradient-to-br from-white to-violet-50/65 dark:from-slate-900 dark:to-violet-950/10 shadow-sm" selectedProject={selectedProject} selectedAgent={selectedAgent} openAgentModal={openAgentModal} openAgentSettings={openAgentSettings} selectAgent={selectAgent} clearAgentFilter={clearAgentFilter} />
                ))}
                {groupedManagers.pm.length === 0 && <p className="text-sm text-neutral-400 dark:text-neutral-500">暂无 PM</p>}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[...groupedManagers.qa, ...groupedManagers.review, ...groupedManagers.other].map((agent) => (
              <WorkerCard key={agent.name} agent={agent} isManager className="rounded-2xl border border-fuchsia-100 dark:border-fuchsia-400/10 bg-gradient-to-br from-white to-fuchsia-50/60 dark:from-slate-900 dark:to-fuchsia-950/10 shadow-sm" selectedProject={selectedProject} selectedAgent={selectedAgent} openAgentModal={openAgentModal} openAgentSettings={openAgentSettings} selectAgent={selectAgent} clearAgentFilter={clearAgentFilter} />
            ))}
          </div>

          {managers.length === 0 && <p className="text-sm text-neutral-400 dark:text-neutral-500">暂无管理岗位</p>}
        </div>
      </div>

      <div className="rounded-[24px] border border-sky-100 dark:border-white/10 bg-white/40 dark:bg-white/5 p-4 relative overflow-hidden">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent dark:via-fuchsia-300/30" />
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Workers</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">像开放办公室，不同工种按桌组分区坐开，方便各自讨论也方便跨工种协作。</div>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {Object.entries(WORK_ZONES).map(([zoneKey, zone]) => {
            const zoneAgents = groupedWorkers[zoneKey]
            const Icon = zone.icon
            const PropIcon = zone.propIcon
            return (
              <div key={zoneKey} className={`rounded-[20px] border p-4 relative overflow-hidden ${zone.sectionClass}`}>
                <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20" />
                <div className="absolute right-4 top-4 opacity-20 dark:opacity-15"><PropIcon className="w-6 h-6 text-neutral-500 dark:text-neutral-300" /></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${zone.iconClass} flex items-center justify-center text-white shadow-sm`}><Icon className="w-4 h-4" /></div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/75 border border-white/70 dark:border-white/12 text-sm font-semibold text-neutral-800 dark:text-white shadow-sm"><span>{zone.title}</span><span className="text-xs opacity-80">✦</span></div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{zone.description}</div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.12fr_0.88fr]">
                  {zoneAgents.map((agent, index) => (
                    <WorkerCard key={agent.name} agent={agent} className={`rounded-2xl border shadow-sm ${zone.cardClass} ${index % 3 === 0 ? 'xl:translate-y-1' : index % 3 === 1 ? 'xl:-translate-y-1' : ''}`} selectedProject={selectedProject} selectedAgent={selectedAgent} openAgentModal={openAgentModal} openAgentSettings={openAgentSettings} selectAgent={selectAgent} clearAgentFilter={clearAgentFilter} />
                  ))}
                  {zoneAgents.length === 0 && <p className="text-sm text-neutral-400 dark:text-neutral-500">该分区暂无席位</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  const renderOfficeMode = () => (
    <div className="rounded-[26px] border border-fuchsia-100 dark:border-white/10 bg-white/40 dark:bg-white/5 p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-60 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="relative grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="rounded-[22px] border border-fuchsia-100/90 dark:border-fuchsia-300/10 bg-gradient-to-br from-white to-fuchsia-50/70 dark:from-slate-900 dark:to-fuchsia-950/10 p-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-white/8 border border-fuchsia-100 dark:border-fuchsia-300/10 text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
            Managers <span className="text-xs opacity-70">✦</span>
          </div>
          <div className="rounded-[24px] border border-fuchsia-100/80 dark:border-fuchsia-300/10 bg-white/50 dark:bg-white/5 p-4 relative overflow-hidden">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 relative">
              {[...groupedManagers.producer, ...groupedManagers.pm, ...groupedManagers.qa, ...groupedManagers.review, ...groupedManagers.other].map((agent) => (
                <SeatTile key={agent.name} agent={agent} zoneClass="border-fuchsia-100 dark:border-fuchsia-300/10" deskClass="from-fuchsia-100 to-violet-100 dark:from-fuchsia-400/18 dark:to-violet-500/18" screenClass="from-fuchsia-500 to-violet-500" chairClass="from-violet-300/80 to-fuchsia-500/80 dark:from-violet-400/30 dark:to-fuchsia-600/30" compact />
              ))}
            </div>
          </div>
            {managers.length === 0 && <p className="text-sm text-neutral-400 dark:text-neutral-500">暂无管理岗位</p>}
        </div>

        <div className="rounded-[22px] border border-sky-100/90 dark:border-sky-300/10 bg-gradient-to-br from-white to-sky-50/70 dark:from-slate-900 dark:to-sky-950/10 p-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-white/8 border border-sky-100 dark:border-sky-300/10 text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
            Workers <span className="text-xs opacity-70">✦</span>
          </div>
          <div className="space-y-4">
            {Object.entries(WORK_ZONES).map(([zoneKey, zone]) => {
              const zoneAgents = groupedWorkers[zoneKey]
              const Icon = zone.icon
              return (
                <div key={zoneKey} className={`rounded-[20px] border p-4 ${zone.sectionClass}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${zone.iconClass} flex items-center justify-center text-white shadow-sm`}><Icon className="w-4 h-4" /></div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/75 border border-white/70 dark:border-white/12 text-sm font-semibold text-neutral-800 dark:text-white shadow-sm">
                      {zone.title}<span className="text-xs opacity-70">✦</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[33%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/70 to-transparent dark:via-white/12" />
                    <div className="absolute left-[66%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/70 to-transparent dark:via-white/12" />
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {zoneAgents.map(agent => <SeatTile key={agent.name} agent={agent} zoneClass={zone.cardClass} deskClass={zone.deskClass} screenClass={zone.screenClass} chairClass={zone.chairClass} />)}
                    {zoneAgents.length === 0 && <p className="text-sm text-neutral-400 dark:text-neutral-500">该分区暂无席位</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="cute-panel-header min-h-[64px] border-b border-fuchsia-100/80 dark:border-white/8 justify-center">
        <CardTitle className="flex items-center justify-between gap-3 text-neutral-800 dark:text-neutral-100">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fuchsia-500 dark:text-pink-300" />
            办公区席位图
            <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">管理岗位 {managers.length} · 执行岗位 {workers.length}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={mode === 'classic' ? 'default' : 'outline'} onClick={() => setMode('classic')}>经典模式</Button>
            <Button size="sm" variant={mode === 'office' ? 'default' : 'outline'} onClick={() => setMode('office')}>工位模式</Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {mode === 'office' ? renderOfficeMode() : renderClassicMode()}
      </CardContent>
    </Card>
  )
}
