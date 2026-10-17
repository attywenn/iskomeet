import { type FormEvent, useEffect, useRef, useState } from 'react'
import {
  BackArrow,
  CheckCheckIcon,
  SendIcon,
} from '../components/icons'
import * as api from '../lib/api'
import { navigate } from '../lib/router'
import { useSession } from '../lib/session'
import type { ChatMessage, Conversation } from '../lib/types'

type Props = {
  userId: string
}

export function ChatPage({ userId }: Props) {
  const { user } = useSession()
  const [conversation, setConversation] = useState<Conversation>({ userId, messages: [] })
  const [partnerName, setPartnerName] = useState<string>(`Scholar #${userId.slice(0, 8)}`)
  const [draft, setDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!user) {
      navigate({ name: 'signin' })
      return
    }

    let active = true
    const loadConvo = async () => {
      const convo = await api.openConversation(userId, user.accessToken, user.id)
      if (active) {
        setConversation(convo)
      }
    }

    void loadConvo().then(() => setTimeout(scrollToBottom, 100))
    const interval = setInterval(loadConvo, 3000)

    if (user.accessToken) {
      void api.fetchConversations(user.accessToken).then((list) => {
        const found = list.find((c) => c.userId === userId)
        if (found && active) {
          const name = found.firstName && found.lastName ? `${found.firstName} ${found.lastName}` : found.username
          setPartnerName(name)
        }
      })
    }

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [user, userId])

  useEffect(() => {
    scrollToBottom()
  }, [conversation.messages])

  if (!user) return null

  async function onSend(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')

    const convo = await api.sendMessage(userId, text, user?.accessToken)
    setConversation(convo)
  }

  function handleReaction(messageId: string, emoji: string) {
    const updated = api.reactToMessage(userId, messageId, emoji)
    setConversation(updated)
  }

  const messages: ChatMessage[] = conversation.messages

  return (
    <div className="relative flex h-full min-h-full flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 px-3 backdrop-blur-md lg:px-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Back to matches"
            onClick={() => navigate({ name: 'match' })}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <BackArrow className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <span className="truncate text-sm font-bold text-slate-900">
              {partnerName}
            </span>
            <p className="text-[11px] text-slate-400">Direct Message</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 lg:px-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm font-bold text-slate-700">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Send the first message to start the conversation.
            </p>
          </div>
        ) : null}

        {/* Message bubbles */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`group relative flex flex-col ${
              message.from === 'me' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`relative max-w-[82%] px-4 py-2.5 shadow-sm transition-all lg:max-w-[52%] ${
                message.from === 'me'
                  ? 'rounded-2xl rounded-tr-xs bg-gradient-to-r from-brand-500 to-rose-500 text-white'
                  : 'rounded-2xl rounded-tl-xs bg-white text-slate-900 border border-slate-100'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>

              {/* Reaction Badge if any */}
              {message.reaction ? (
                <span className="absolute -bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] shadow-sm border border-slate-100">
                  {message.reaction}
                </span>
              ) : null}
            </div>

            {/* Bubble Meta */}
            <div className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-slate-400">
              <span>{message.timestamp || 'Just now'}</span>
              {message.from === 'me' ? (
                <CheckCheckIcon className="h-3.5 w-3.5 text-brand-500" />
              ) : null}

              {/* Quick reaction on hover */}
              <div className="hidden group-hover:flex items-center gap-1 ml-2">
                {['❤️', '😂', '🔥'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReaction(message.id, emoji)}
                    className="hover:scale-125 transition-transform text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={onSend} className="sticky bottom-0 z-20 border-t border-slate-200/80 bg-white p-3 lg:px-10">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message…"
            className="w-full bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
              draft.trim()
                ? 'bg-gradient-to-tr from-brand-500 to-rose-500 text-white shadow-md shadow-rose-500/25 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
