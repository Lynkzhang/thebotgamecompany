import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Modal, ModalHeader, ModalContent } from '@/components/ui/modal'

function statusMeta(milestone) {
  const status = milestone?.status || 'active'
  if (status === 'completed') return { label: 'Completed', variant: 'success' }
  if (status === 'failed') return { label: 'Failed', variant: 'warning' }
  if (status === 'fixing') return { label: 'Fixing', variant: 'warning' }
  if (status === 'verifying') return { label: 'Verifying', variant: 'secondary' }
  return { label: 'Active', variant: 'default' }
}

export default function MilestoneDetailModal({ open, milestone, onClose }) {
  if (!milestone) return null
  const meta = statusMeta(milestone)
  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader onClose={onClose}>里程碑详情</ModalHeader>
      <ModalContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{milestone.title || '未命名里程碑'}</h3>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-neutral-400 mb-1">阶段</div>
              <div className="text-neutral-800 dark:text-neutral-100">{milestone.phase || '未知'}</div>
            </div>
            <div>
              <div className="text-neutral-400 mb-1">进度</div>
              <div className="text-neutral-800 dark:text-neutral-100">{milestone.cyclesUsed || 0} / {milestone.cyclesBudget || 0} 轮</div>
            </div>
            <div>
              <div className="text-neutral-400 mb-1">创建时间</div>
              <div className="text-neutral-800 dark:text-neutral-100">{milestone.createdAt ? new Date(milestone.createdAt).toLocaleString() : '-'}</div>
            </div>
            <div>
              <div className="text-neutral-400 mb-1">完成时间</div>
              <div className="text-neutral-800 dark:text-neutral-100">{milestone.completedAt ? new Date(milestone.completedAt).toLocaleString() : '-'}</div>
            </div>
          </div>

          <div>
            <div className="text-neutral-400 mb-1 text-sm">描述</div>
            <div className="text-sm text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed">{milestone.description || '-'}</div>
          </div>

          {milestone.verificationFeedback && milestone.verificationFeedback !== '__passed__' && (
            <div>
              <div className="text-neutral-400 mb-1 text-sm">验证反馈</div>
              <div className="text-sm text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed">{milestone.verificationFeedback}</div>
            </div>
          )}

          {milestone.examinationFeedback && (
            <div>
              <div className="text-neutral-400 mb-1 text-sm">最终验收反馈</div>
              <div className="text-sm text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed">{milestone.examinationFeedback}</div>
            </div>
          )}

          {milestone.completionMessage && (
            <div>
              <div className="text-neutral-400 mb-1 text-sm">结果说明</div>
              <div className="text-sm text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed">{milestone.completionMessage}</div>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
