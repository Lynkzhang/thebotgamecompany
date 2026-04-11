import React from 'react'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { Modal, ModalHeader, ModalContent } from '@/components/ui/modal'

export default function AgentSettingsModal({ agentSettingsModal, setAgentSettingsModal, saveAgentSettings, provider, availableModels = [] }) {
  const currentModelMissing = agentSettingsModal.model && !availableModels.some(m => m.id === agentSettingsModal.model)
  const usesCustomProvider = provider === 'custom'

  return (
    <Modal open={agentSettingsModal.open} onClose={() => setAgentSettingsModal({ ...agentSettingsModal, open: false })}>
      <ModalHeader onClose={() => setAgentSettingsModal({ ...agentSettingsModal, open: false })}>
        <Settings className="w-4 h-4 inline mr-2" />
        <span className="capitalize">{agentSettingsModal.agent?.name}</span> 模型设置
      </ModalHeader>
      <ModalContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">模型</label>
            {usesCustomProvider ? (
              <input
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={agentSettingsModal.model}
                onChange={(e) => setAgentSettingsModal(prev => ({ ...prev, model: e.target.value }))}
                placeholder="留空表示继承项目默认模型"
              />
            ) : (
              <select
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={agentSettingsModal.model}
                onChange={(e) => setAgentSettingsModal(prev => ({ ...prev, model: e.target.value }))}
              >
                <option value="">继承项目默认模型</option>
                {currentModelMissing && (
                  <option value={agentSettingsModal.model}>{agentSettingsModal.model}（当前值）</option>
                )}
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            )}
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {usesCustomProvider ? '自定义 provider 需要手动填写模型名。留空时继承项目默认模型。' : `当前按 ${provider || 'provider'} 的可用模型选择。留空时继承项目默认模型。`}
            </p>
          </div>
          {agentSettingsModal.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{agentSettingsModal.error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAgentSettingsModal({ ...agentSettingsModal, open: false })}>取消</Button>
            <Button onClick={saveAgentSettings} disabled={agentSettingsModal.saving}>
              {agentSettingsModal.saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
