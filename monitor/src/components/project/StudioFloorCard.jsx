import React from 'react'
import { Sparkles, Users, PencilRuler, Code2, Palette, ShieldCheck, Boxes, StickyNote, MonitorSpeaker, Paintbrush, ClipboardCheck, Package2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import WorkerCard from '@/components/project/WorkerCard'

function classifyWorker(agent) {
  const text = `${agent.role || ''} ${agent.name || ''}`.toLowerCase()
  if (/策划|design|planner|system|narrative|quest|ux/.test(text)) return 'design'
  if (/程序|engineer|coder|developer|client|server|technical/.test(text)) return 'engineering'
  if (/美术|art|artist|ui|ux visual|vfx|concept/.test(text)) return 'art'
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
  design: {
    title: '策划',
    description: '系统、玩法、交互和文案相关席位。',
    icon: PencilRuler,
    propIcon: StickyNote,
    sectionClass: 'border-rose-100 dark:border-rose-400/10 bg-gradient-to-br from-white to-rose-50/65 dark:from-slate-900 dark:to-rose-950/10',
    cardClass: 'border-rose-100 dark:border-rose-400/10 bg-gradient-to-br from-white to-rose-50/55 dark:from-slate-900 dark:to-rose-950/10',
    iconClass: 'from-rose-400 to-pink-500',
  },
  engineering: {
    title: '程序',
    description: '客户端、服务端、工具链和技术实现相关席位。',
    icon: Code2,
    propIcon: MonitorSpeaker,
    sectionClass: 'border-sky-100 dark:border-sky-400/10 bg-gradient-to-br from-white to-sky-50/65 dark:from-slate-900 dark:to-sky-950/10',
    cardClass: 'border-sky-100 dark:border-sky-400/10 bg-gradient-to-br from-white to-sky-50/55 dark:from-slate-900 dark:to-sky-950/10',
    iconClass: 'from-sky-400 to-indigo-500',
  },
  art: {
    title: '美术',
    description: '概念、美术、UI 和视觉相关席位。',
    icon: Palette,
    propIcon: Paintbrush,
    sectionClass: 'border-fuchsia-100 dark:border-fuchsia-400/10 bg-gradient-to-br from-white to-fuchsia-50/65 dark:from-slate-900 dark:to-fuchsia-950/10',
    cardClass: 'border-fuchsia-100 dark:border-fuchsia-400/10 bg-gradient-to-br from-white to-fuchsia-50/55 dark:from-slate-900 dark:to-fuchsia-950/10',
    iconClass: 'from-fuchsia-400 to-violet-500',
  },
  qa: {
    title: 'QA',
    description: '验证、回归、检查和问题回流相关席位。',
    icon: ShieldCheck,
    propIcon: ClipboardCheck,
    sectionClass: 'border-emerald-100 dark:border-emerald-400/10 bg-gradient-to-br from-white to-emerald-50/65 dark:from-slate-900 dark:to-emerald-950/10',
    cardClass: 'border-emerald-100 dark:border-emerald-400/10 bg-gradient-to-br from-white to-emerald-50/55 dark:from-slate-900 dark:to-emerald-950/10',
    iconClass: 'from-emerald-400 to-teal-500',
  },
  ops: {
    title: '支援',
    description: '未明确归类的执行角色与机动支援席位。',
    icon: Boxes,
    propIcon: Package2,
    sectionClass: 'border-amber-100 dark:border-amber-400/10 bg-gradient-to-br from-white to-amber-50/65 dark:from-slate-900 dark:to-amber-950/10',
    cardClass: 'border-amber-100 dark:border-amber-400/10 bg-gradient-to-br from-white to-amber-50/55 dark:from-slate-900 dark:to-amber-950/10',
    iconClass: 'from-amber-400 to-orange-500',
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
    acc[key].push(agent)
    return acc
  }, { design: [], engineering: [], art: [], qa: [], ops: [] })

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="cute-panel-header min-h-[64px] border-b border-fuchsia-100/80 dark:border-white/8 justify-center">
        <CardTitle className="flex items-center gap-2 text-neutral-800 dark:text-neutral-100">
          <Sparkles className="w-4 h-4 text-fuchsia-500 dark:text-pink-300" />
          办公区席位图
          <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">管理岗位 {managers.length} · 执行岗位 {workers.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
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
                <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-white/70 dark:bg-white/8 border border-fuchsia-100 dark:border-fuchsia-300/10 text-[11px] uppercase tracking-[0.22em] text-fuchsia-500 dark:text-fuchsia-300">
                  <span>主会议席</span>
                  <span className="text-xs">✦</span>
                </div>
                <div className="grid gap-3">
                  {groupedManagers.producer.map((agent) => (
                    <WorkerCard
                      key={agent.name}
                      agent={agent}
                      isManager
                      className="rounded-2xl border border-fuchsia-200/80 dark:border-fuchsia-300/15 bg-gradient-to-br from-white to-fuchsia-50/70 dark:from-slate-900 dark:to-fuchsia-950/10 shadow-sm p-3"
                      selectedProject={selectedProject}
                      selectedAgent={selectedAgent}
                      openAgentModal={openAgentModal}
                      openAgentSettings={openAgentSettings}
                      selectAgent={selectAgent}
                      clearAgentFilter={clearAgentFilter}
                    />
                  ))}
                  {groupedManagers.producer.length === 0 && <p className="text-sm text-neutral-400 dark:text-neutral-500">主会议席暂无负责人</p>}
                </div>
              </div>

              <div className="rounded-[22px] border border-violet-100 dark:border-violet-300/10 bg-gradient-to-br from-white to-violet-50/65 dark:from-slate-900 dark:to-violet-950/10 p-3 min-h-[158px]">
                <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-white/70 dark:bg-white/8 border border-violet-100 dark:border-violet-300/10 text-[11px] uppercase tracking-[0.22em] text-violet-500 dark:text-violet-300">
                  <span>调度排班台</span>
                  <span className="text-xs">✦</span>
                </div>
                <div className="grid gap-3">
                  {groupedManagers.pm.map((agent) => (
                    <WorkerCard
                      key={agent.name}
                      agent={agent}
                      isManager
                      className="rounded-2xl border border-violet-100 dark:border-violet-300/10 bg-gradient-to-br from-white to-violet-50/65 dark:from-slate-900 dark:to-violet-950/10 shadow-sm"
                      selectedProject={selectedProject}
                      selectedAgent={selectedAgent}
                      openAgentModal={openAgentModal}
                      openAgentSettings={openAgentSettings}
                      selectAgent={selectAgent}
                      clearAgentFilter={clearAgentFilter}
                    />
                  ))}
                  {groupedManagers.pm.length === 0 && <p className="text-sm text-neutral-400 dark:text-neutral-500">暂无 PM</p>}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[...groupedManagers.qa, ...groupedManagers.review, ...groupedManagers.other].map((agent) => (
                <WorkerCard
                  key={agent.name}
                  agent={agent}
                  isManager
                  className="rounded-2xl border border-fuchsia-100 dark:border-fuchsia-400/10 bg-gradient-to-br from-white to-fuchsia-50/60 dark:from-slate-900 dark:to-fuchsia-950/10 shadow-sm"
                  selectedProject={selectedProject}
                  selectedAgent={selectedAgent}
                  openAgentModal={openAgentModal}
                  openAgentSettings={openAgentSettings}
                  selectAgent={selectAgent}
                  clearAgentFilter={clearAgentFilter}
                />
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
                  <div className="absolute right-4 top-4 opacity-20 dark:opacity-15">
                    <PropIcon className="w-6 h-6 text-neutral-500 dark:text-neutral-300" />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${zone.iconClass} flex items-center justify-center text-white shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-white/8 border border-white/70 dark:border-white/10 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                        <span>{zone.title}</span>
                        <span className="text-xs opacity-70">✦</span>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">{zone.description}</div>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.12fr_0.88fr]">
                    {zoneAgents.map((agent, index) => (
                      <WorkerCard
                        key={agent.name}
                        agent={agent}
                        className={`rounded-2xl border shadow-sm ${zone.cardClass} ${index % 3 === 0 ? 'xl:translate-y-1' : index % 3 === 1 ? 'xl:-translate-y-1' : ''}`}
                        selectedProject={selectedProject}
                        selectedAgent={selectedAgent}
                        openAgentModal={openAgentModal}
                        openAgentSettings={openAgentSettings}
                        selectAgent={selectAgent}
                        clearAgentFilter={clearAgentFilter}
                      />
                    ))}
                    {zoneAgents.length === 0 && <p className="text-sm text-neutral-400 dark:text-neutral-500">该分区暂无席位</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
