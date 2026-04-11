import React, { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Plus, Trash2 } from 'lucide-react'
import DashboardWidget from '@/components/ui/DashboardWidget'
import { useAuth } from '@/hooks/useAuth'

export default function ChatCard({ selectedProject, onOpenChat, onNewChat, agents = [] }) {
  const { authFetch } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [newAgent, setNewAgent] = useState('')

  const chatAgents = useMemo(() => agents.filter(agent => agent?.name), [agents])

  useEffect(() => {
    if (!newAgent && chatAgents.length > 0) setNewAgent(chatAgents[0].name)
  }, [chatAgents, newAgent])

  const fetchSessions = async () => {
    if (!selectedProject) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/chats`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSessions() }, [selectedProject?.id])

  const handleNew = () => {
    if (!selectedProject || !newAgent) return
    // Create a temporary unsaved session — only persists to DB on first message
    const tempSession = { id: null, title: `与 ${newAgent} 对话`, agent_name: newAgent, _temp: true }
    if (onNewChat) onNewChat(tempSession)
  }

  const handleDelete = async (e, chatId) => {
    e.stopPropagation()
    try {
      await authFetch(`/api/projects/${selectedProject.id}/chats/${chatId}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== chatId))
    } catch {}
  }

  return (
    <DashboardWidget
      icon={MessageCircle}
      title="Agent 对话"
      headerRight={
        <div className="flex items-center gap-1.5">
          <select
            value={newAgent}
            onChange={(e) => setNewAgent(e.target.value)}
            className="max-w-[150px] px-2 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
            title="选择对话 agent"
          >
            {chatAgents.map(agent => <option key={agent.name} value={agent.name}>{agent.name}</option>)}
          </select>
          <button
            onClick={handleNew}
            disabled={!newAgent}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors disabled:opacity-50"
            title="新建对话"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      }
    >
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 overflow-y-auto h-full">
          {sessions.length === 0 && !loading && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4">
              暂无对话
            </p>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className="py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors -mx-1 px-1 rounded group"
              onClick={() => onOpenChat(session)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate flex-1">
                  {session.title}
                </span>
                {session.agent_name && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                    {session.agent_name}
                  </span>
                )}
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                  {session.message_count || 0} 条消息
                </span>
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-all"
                  title="删除对话"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                {new Date(session.updated_at).toLocaleString()}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center justify-center py-3 text-neutral-400">
              <span className="text-xs">加载中...</span>
            </div>
          )}
        </div>
    </DashboardWidget>
  )
}
