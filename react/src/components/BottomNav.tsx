import { useEffect, useState } from 'react'
import { FlameIcon, SearchIcon, ChatBubbleIcon, UserIcon } from './icons'
import { navigate, useRoute } from '../lib/router'
import * as api from '../lib/api'
import { useSession } from '../lib/session'
import { APP_NAME } from '../data/site-content'
import type { ConversationSummary } from '../lib/types'

export function BottomNav() {
  const { user } = useSession()
  const { route } = useRoute()
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])

  // Check how many conversations we have locally as well
  const convos = api.getConversations()

  useEffect(() => {
    if (!user?.accessToken) return

    let active = true
    const loadData = async () => {
      try {
        const [count, list] = await Promise.all([
          api.fetchUnreadCount(user.accessToken!),
          api.fetchConversations(user.accessToken!),
        ])
        if (active) {
          setUnreadCount(count)
          setConversations(list)
        }
      } catch {
        // Silently handle network errors
      }
    }

    void loadData()
    const timer = setInterval(loadData, 3000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [user, route.name])

  const currentTab =
    route.name === 'match'
      ? 'match'
      : route.name === 'search'
      ? 'search'
      : route.name === 'chat'
      ? 'chat'
      : route.name === 'profile' || route.name === 'settings'
      ? 'profile'
      : ''

  // Only show bottom nav on main app screens
  if (!['match', 'search', 'chat', 'profile', 'settings'].includes(route.name)) {
    return null
  }

  return (
    <nav
      aria-label="Main Navigation"
      className="sticky bottom-0 z-30 flex h-[68px] w-full shrink-0 items-center justify-around border-t border-slate-100 bg-white/95 px-3 backdrop-blur-md lg:order-first lg:h-full lg:w-64 lg:flex-col lg:items-stretch lg:justify-start lg:gap-1 lg:border-r lg:border-t-0 lg:px-4 lg:py-6"
    >
      <div className="mb-8 hidden items-center gap-3 px-3 lg:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-lg font-black text-white">I</span>
        <div><p className="font-black tracking-tight text-slate-900">{APP_NAME}</p><p className="text-[11px] font-medium text-slate-400">Campus connections</p></div>
      </div>
      <button
        type="button"
        aria-label="Discover Scholars"
        aria-current={currentTab === 'match' ? 'page' : undefined}
        onClick={() => navigate({ name: 'match' })}
        className={`group flex flex-1 flex-col items-center justify-center py-1 transition-all lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-2xl lg:px-3 lg:py-3 ${
          currentTab === 'match' ? 'text-brand-500 font-semibold lg:bg-rose-50' : 'text-slate-400 hover:text-slate-700 lg:hover:bg-slate-50'
        }`}
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
            currentTab === 'match'
              ? 'bg-rose-50 text-brand-500 shadow-sm shadow-rose-100 scale-105'
              : 'group-hover:bg-slate-50'
          }`}
        >
          <FlameIcon className="h-6 w-6" />
        </div>
        <span className="text-[11px] font-medium tracking-tight lg:text-sm">Discover</span>
      </button>

      <button
        type="button"
        aria-label="Campus Hub and Search"
        aria-current={currentTab === 'search' ? 'page' : undefined}
        onClick={() => navigate({ name: 'search' })}
        className={`group flex flex-1 flex-col items-center justify-center py-1 transition-all lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-2xl lg:px-3 lg:py-3 ${
          currentTab === 'search' ? 'text-brand-500 font-semibold lg:bg-rose-50' : 'text-slate-400 hover:text-slate-700 lg:hover:bg-slate-50'
        }`}
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
            currentTab === 'search'
              ? 'bg-rose-50 text-brand-500 shadow-sm shadow-rose-100 scale-105'
              : 'group-hover:bg-slate-50'
          }`}
        >
          <SearchIcon className="h-5 w-5" />
        </div>
        <span className="text-[11px] font-medium tracking-tight lg:text-sm">Campus Hub</span>
      </button>

      <button
        type="button"
        aria-label="Messages"
        aria-current={currentTab === 'chat' ? 'page' : undefined}
        onClick={() => {
          if (conversations.length > 0) {
            navigate({ name: 'chat', userId: conversations[0].userId })
          } else if (convos.length > 0) {
            navigate({ name: 'chat', userId: convos[0].userId })
          } else {
            navigate({ name: 'match' })
          }
        }}
        className={`group relative flex flex-1 flex-col items-center justify-center py-1 transition-all lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-2xl lg:px-3 lg:py-3 ${
          currentTab === 'chat' ? 'text-brand-500 font-semibold lg:bg-rose-50' : 'text-slate-400 hover:text-slate-700 lg:hover:bg-slate-50'
        }`}
      >
        <div
          className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
            currentTab === 'chat'
              ? 'bg-rose-50 text-brand-500 shadow-sm shadow-rose-100 scale-105'
              : 'group-hover:bg-slate-50'
          }`}
        >
          <ChatBubbleIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-black text-white shadow-sm lg:hidden">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium tracking-tight lg:text-sm">Messages</span>
        {unreadCount > 0 && (
          <span className="ml-auto hidden rounded-full bg-brand-500 px-2 py-0.5 text-xs font-black text-white shadow-sm lg:inline-flex">
            {unreadCount}
          </span>
        )}
      </button>

      <button
        type="button"
        aria-label="My Scholar Profile"
        aria-current={currentTab === 'profile' ? 'page' : undefined}
        onClick={() => navigate({ name: 'profile' })}
        className={`group flex flex-1 flex-col items-center justify-center py-1 transition-all lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-2xl lg:px-3 lg:py-3 ${
          currentTab === 'profile' ? 'text-brand-500 font-semibold lg:bg-rose-50' : 'text-slate-400 hover:text-slate-700 lg:hover:bg-slate-50'
        }`}
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
            currentTab === 'profile'
              ? 'bg-rose-50 text-brand-500 shadow-sm shadow-rose-100 scale-105'
              : 'group-hover:bg-slate-50'
          }`}
        >
          <UserIcon className="h-5 w-5" />
        </div>
        <span className="text-[11px] font-medium tracking-tight lg:text-sm">Profile</span>
      </button>

      {conversations.length > 0 && (
        <div className="mt-4 hidden lg:flex flex-col flex-1 min-h-0 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Recent Messages
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 border border-rose-200">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="overflow-y-auto space-y-1 pr-1 flex-1">
            {conversations.map((c) => {
              const displayName = c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.username
              const isActive = route.name === 'chat' && route.userId === c.userId
              return (
                <button
                  key={c.userId}
                  type="button"
                  onClick={() => navigate({ name: 'chat', userId: c.userId })}
                  className={`flex w-full items-center gap-2.5 rounded-2xl p-2 text-left transition-all hover:bg-slate-50 ${
                    isActive
                      ? 'bg-rose-50/80 border border-rose-200 text-brand-600'
                      : 'text-slate-700'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`}
                      alt={displayName}
                      className="h-8 w-8 rounded-full border border-slate-200 bg-slate-100 object-cover"
                    />
                    {c.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-black text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-bold text-slate-900">{displayName}</p>
                      <span className="text-[9px] text-slate-400 shrink-0">{c.lastTimestamp}</span>
                    </div>
                    <p className={`truncate text-[11px] ${c.unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>
                      {c.lastMessage}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
