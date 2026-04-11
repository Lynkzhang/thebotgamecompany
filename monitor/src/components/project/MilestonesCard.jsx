import React from 'react'
import { Flag } from 'lucide-react'
import DashboardWidget from '@/components/ui/DashboardWidget'
import { Badge } from '@/components/ui/badge'

function statusMeta(milestone) {
  const status = milestone.status || 'active'
  if (status === 'completed') return { label: '已完成', variant: 'success' }
  if (status === 'failed') return { label: '失败', variant: 'warning' }
  if (status === 'fixing') return { label: '修复中', variant: 'warning' }
  if (status === 'verifying') return { label: '验证中', variant: 'secondary' }
  return { label: '进行中', variant: 'default' }
}

export default function MilestonesCard({ milestones = [], currentMilestoneId = null, onOpenMilestone }) {
  return (
    <DashboardWidget icon={Flag} title={`里程碑（${milestones.length}）`}>
      <div className="space-y-2">
        {milestones.length === 0 && (
          <p className="text-sm text-neutral-400 dark:text-neutral-500">暂无里程碑记录</p>
        )}
        {milestones.map((milestone) => {
          const meta = statusMeta(milestone)
          const isCurrent = currentMilestoneId && milestone.id === currentMilestoneId
          return (
            <button
              key={milestone.id}
              onClick={() => onOpenMilestone?.(milestone)}
              className="w-full text-left p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                      {milestone.title || '未命名里程碑'}
                    </span>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    {isCurrent && <Badge variant="outline">当前</Badge>}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 whitespace-pre-wrap">
                    {milestone.description}
                  </p>
                </div>
                <div className="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0">
                  {milestone.cyclesBudget > 0 ? `${milestone.cyclesUsed || 0}/${milestone.cyclesBudget} 轮` : '-'}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </DashboardWidget>
  )
}
