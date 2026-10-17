import { navigate } from '../lib/router'
import { FlameIcon, SearchIcon, UserIcon, CapIcon, CloseIcon, CoffeeIcon, ChatBubbleIcon } from './icons'
import { APP_NAME } from '../data/site-content'
import { useSession } from '../lib/session'
import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import type { ConversationSummary } from '../lib/types'

type Props = {
  open: boolean
  onClose: () => void
}

export function MenuDrawer({ open, onClose }: Props) {
  const { user, signOut } = useSession()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])

  useEffect(() => {
    if (!open || !user?.accessToken) return
    let active = true
    void Promise.all([
      api.fetchUnreadCount(user.accessToken),
      api.fetchConversations(user.accessToken),
    ]).then(([cnt, convs]) => {
      if (active) {
        setUnreadCount(cnt)
        setConversations(convs)
      }
    })
    return () => {
      active = false
    }
  }, [open, user])

  if (!open) return null

  function handleLogout() {
    signOut()
    navigate({ name: 'landing' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
        aria-label="Close menu"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-[82%] max-w-[320px] flex-col bg-white shadow-2xl transition-transform dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-rose-400 text-white shadow-sm">
              <FlameIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {user && (
          <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400">Logged in as</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username}
            </p>
            <p className="text-xs text-brand-600">@{user.username}</p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
          <div className="mt-2 flex flex-col gap-1">
            <DrawerItem
              icon={<FlameIcon className="h-5 w-5 text-brand-500" />}
              label="Find Match"
              onClick={() => {
                navigate({ name: 'match' })
                onClose()
              }}
            />
            <DrawerItem
              icon={<ChatBubbleIcon className="h-5 w-5 text-brand-500" />}
              label="Messages"
              badge={
                unreadCount > 0 ? (
                  <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                    {unreadCount}
                  </span>
                ) : null
              }
              onClick={() => {
                if (conversations.length > 0) {
                  navigate({ name: 'chat', userId: conversations[0].userId })
                } else {
                  navigate({ name: 'match' })
                }
                onClose()
              }}
            />
            <DrawerItem
              icon={<SearchIcon className="h-5 w-5 text-slate-500" />}
              label="Campus Hub & Search"
              onClick={() => {
                navigate({ name: 'search' })
                onClose()
              }}
            />
            <DrawerItem
              icon={<UserIcon className="h-5 w-5 text-slate-500" />}
              label="My Profile"
              onClick={() => {
                navigate({ name: 'profile' })
                onClose()
              }}
            />
            <DrawerItem
              icon={<CapIcon className="h-5 w-5 text-slate-500" />}
              label="About Iskomeet"
              onClick={() => {
                navigate({ name: 'about' })
                onClose()
              }}
            />
            <DrawerItem
              icon={<CoffeeIcon className="h-5 w-5 text-amber-500" />}
              label="Support the Developer"
              onClick={() => {
                navigate({ name: 'developer' })
                onClose()
              }}
            />
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4 space-y-2">
          {user && (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
              onClick={() => setConfirmLogout(true)}
            >
              Log out
            </button>
          )}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
            onClick={() => {
              navigate({ name: 'match' })
              onClose()
            }}
          >
            Browse Matches
          </button>
        </div>
      </aside>

      {confirmLogout && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 p-5">
          <div role="alertdialog" aria-modal="true" aria-labelledby="logout-title" className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h2 id="logout-title" className="text-base font-bold text-slate-900 dark:text-white">Are you really sure to logout?</h2>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmLogout(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300">No</button>
              <button type="button" onClick={handleLogout} className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white">Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DrawerItem({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  badge?: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      {badge}
    </button>
  )
}
