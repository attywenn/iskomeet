import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { MenuDrawer } from '../components/MenuDrawer'
import {
  CapIcon,
  CloseIcon,
  FlameIcon,
  HeartIcon,
  MapPinIcon,
  MenuIcon,
  RewindIcon,
  StarSparkIcon,
  VerifiedBadgeIcon,
} from '../components/icons'
import { APP_NAME, SUC_COLORS } from '../data/site-content'
import * as api from '../lib/api'
import { navigate } from '../lib/router'
import { useSession } from '../lib/session'
import { useMatchFeed } from '../lib/useQueries'
import type { Profile } from '../lib/types'

// ─── Swipe gesture hook ──────────────────────────────────────────────────────

type SwipeDir = 'left' | 'right' | 'up' | null

const THRESHOLD_X = 80
const THRESHOLD_Y = -60

function useSwipe(onSwipe: (dir: 'left' | 'right' | 'up') => void) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false })
  const startRef = useRef({ x: 0, y: 0, isDragging: false })

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startRef.current = { x: clientX, y: clientY, isDragging: true }
    setDrag({ x: 0, y: 0, active: true })
  }, [])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!startRef.current.isDragging) return
    setDrag({
      x: clientX - startRef.current.x,
      y: clientY - startRef.current.y,
      active: true,
    })
  }, [])

  const handleEnd = useCallback(() => {
    if (!startRef.current.isDragging) return
    startRef.current.isDragging = false
    setDrag((curr) => {
      const { x: dx, y: dy } = curr
      if (dy < THRESHOLD_Y && Math.abs(dy) > Math.abs(dx)) {
        onSwipe('up')
      } else if (dx > THRESHOLD_X) {
        onSwipe('right')
      } else if (dx < -THRESHOLD_X) {
        onSwipe('left')
      }
      return { x: 0, y: 0, active: false }
    })
  }, [onSwipe])

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchEnd = () => handleEnd()

  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY)
  const onMouseMove = (e: React.MouseEvent) => {
    if (drag.active) handleMove(e.clientX, e.clientY)
  }
  const onMouseUp = () => handleEnd()

  const rotate = drag.active ? `${drag.x * 0.08}deg` : '0deg'
  const translateX = drag.active ? drag.x : 0
  const translateY = drag.active ? drag.y * 0.3 : 0

  const likeOpacity = Math.max(0, Math.min(1, drag.x / 100))
  const passOpacity = Math.max(0, Math.min(1, -drag.x / 100))
  const superOpacity = Math.max(0, Math.min(1, -drag.y / 80))

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
    },
    rotate,
    translateX,
    translateY,
    dragging: drag.active,
    likeOpacity,
    passOpacity,
    superOpacity,
  }
}

// ─── Match Page ──────────────────────────────────────────────────────────────

export function MatchPage() {
  const { user } = useSession()
  const [index, setIndex] = useState(0)
  const [likes, setLikes] = useState<string[]>(() => api.getLikes())
  const [menuOpen, setMenuOpen] = useState(false)
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [chatModalProfile, setChatModalProfile] = useState<Profile | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [swipeAnim, setSwipeAnim] = useState<SwipeDir>(null)
  const [cardKey, setCardKey] = useState(0)
  const [history, setHistory] = useState<number[]>([])

  const { data: feed = [], isLoading: loading } = useMatchFeed(user?.accessToken)

  useEffect(() => { if (!user) navigate({ name: 'signin' }) }, [user])

  const profiles: Profile[] = useMemo(() => feed.map((item) => {
    let age: number | undefined
    if (item.dob) {
      const y = new Date(item.dob).getFullYear()
      if (!isNaN(y)) age = new Date().getFullYear() - y
    }
    const fullName = `${item.first_name} ${item.last_name}`.trim() || item.user_username
    return {
      id: String(item.user_id), name: fullName,
      firstName: item.first_name, lastName: item.last_name,
      genderId: item.gender_id ?? undefined,
      universityId: item.university_id ?? undefined,
      universityName: item.university_name ?? undefined,
      online: !item.is_dnd, isDnd: item.is_dnd,
      lastActiveAt: item.last_active_at,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_username}`,
      photos: [`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_username}`],
      interests: item.interests, age: age ?? 20,
      suc: item.university_name ?? undefined,
      location: item.region_name ?? undefined,
      distance: item.region_name ?? undefined,
      bio: item.interest_score > 0
        ? `✨ ${item.interest_score} shared interest${item.interest_score > 1 ? 's' : ''} in common!`
        : 'Iskolar looking to meet new people on campus.',
    }
  }), [feed])

  if (!user) return null

  const profile = profiles[index]

  function advance(dir: 'left' | 'right' | 'up') {
    setSwipeAnim(dir)
    setTimeout(() => {
      setSwipeAnim(null)
      setHistory((h) => [...h, index])
      setIndex((i) => (i + 1) % Math.max(profiles.length, 1))
      setCardKey((k) => k + 1)
    }, 420)
  }

  function handleLike(isSuperLike = false) {
    if (!profile) return
    const updated = api.toggleLike(profile.id)
    setLikes(updated)
    advance(isSuperLike ? 'up' : 'right')
    setTimeout(() => {
      setMatchedProfile(profile)
      setMatchModalOpen(true)
    }, 460)
  }

  function handlePass() { if (!profile) return; advance('left') }

  function handleRewind() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setIndex(prev)
    setCardKey((k) => k + 1)
  }

  const campusName = profile ? (profile.universityName ?? profile.suc ?? 'University') : 'University'
  const campusColor = profile
    ? (SUC_COLORS[campusName] ?? { bg: 'bg-rose-50', text: 'text-brand-600', badge: 'bg-brand-500 text-white', short: campusName.slice(0, 4) })
    : null

  return (
    <div className="relative flex min-h-full flex-col bg-gradient-to-b from-rose-50/60 via-white to-white">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-white/90 px-5 backdrop-blur-md border-b border-rose-100/60">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-rose-400 text-white shadow-glow">
            <FlameIcon className="h-4.5 w-4.5" />
          </span>
          <span className="text-lg font-black tracking-tight text-slate-900">{APP_NAME}</span>
        </div>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-rose-50 hover:text-brand-500 transition-all"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Card area */}
      <div className="flex flex-1 flex-col items-center px-4 py-4 pb-2">
        {loading ? (
          <SwipeCardSkeleton />
        ) : profile ? (
          <SwipeCard
            key={cardKey}
            profile={profile}
            campusColor={campusColor}
            swipeAnim={swipeAnim}
            isLiked={likes.includes(profile.id)}
            onLike={() => handleLike(false)}
            onPass={handlePass}
            onSuperLike={() => handleLike(true)}
            onRewind={handleRewind}
            canRewind={history.length > 0}
            onChat={() => {
              setChatModalProfile(profile)
              setChatMessage(`Hi ${profile.firstName || profile.name.split(' ')[0]}! Nice to connect.`)
            }}
          />
        ) : (
          <EmptyState onReset={() => { setIndex(0); setCardKey((k) => k + 1) }} />
        )}
      </div>

      {matchModalOpen && matchedProfile ? (
        <MatchCelebrationModal
          profile={matchedProfile}
          onClose={() => setMatchModalOpen(false)}
          onChat={(text) => {
            setMatchModalOpen(false)
            if (text) void api.sendMessage(matchedProfile.id, text, user.accessToken)
            navigate({ name: 'chat', userId: matchedProfile.id })
          }}
        />
      ) : null}

      {chatModalProfile ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm animate-fadeIn sm:items-center">
          <div className="relative w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img src={chatModalProfile.avatar} alt={chatModalProfile.name} className="h-11 w-11 rounded-2xl border-2 border-rose-100 object-cover" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">{chatModalProfile.name}</h3>
                  <p className="text-xs text-brand-500 font-semibold">{chatModalProfile.universityName ?? chatModalProfile.suc ?? 'Campus Scholar'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setChatModalProfile(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Send a Message</label>
              <textarea
                rows={3}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={`Say hi to ${chatModalProfile.name.split(' ')[0]}…`}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={!chatMessage.trim() || isSending}
                onClick={async () => {
                  if (!chatMessage.trim()) return
                  setIsSending(true)
                  try {
                    await api.sendMessage(chatModalProfile.id, chatMessage.trim(), user.accessToken)
                    const tid = chatModalProfile.id
                    setChatModalProfile(null)
                    navigate({ name: 'chat', userId: tid })
                  } finally { setIsSending(false) }
                }}
                className={`w-full rounded-2xl bg-gradient-to-r from-brand-500 to-rose-400 py-3.5 text-sm font-bold text-white shadow-glow transition-all ${chatMessage.trim() && !isSending ? 'hover:opacity-95 active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'}`}
              >
                {isSending ? 'Sending…' : '💬 Send Message'}
              </button>
              <button type="button" onClick={() => { const t = chatModalProfile.id; setChatModalProfile(null); navigate({ name: 'chat', userId: t }) }} className="py-1.5 text-xs font-semibold text-slate-400 hover:text-brand-500 transition-colors">
                Open Chat Directly →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}

// ─── Swipe Card ──────────────────────────────────────────────────────────────

function SwipeCard({
  profile, campusColor, swipeAnim, isLiked, onLike, onPass, onSuperLike, onRewind, canRewind, onChat,
}: {
  profile: Profile
  campusColor: { bg: string; text: string; badge: string; short: string } | null
  swipeAnim: SwipeDir
  isLiked: boolean
  onLike: () => void
  onPass: () => void
  onSuperLike: () => void
  onRewind: () => void
  canRewind: boolean
  onChat: () => void
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const photos = profile.photos && profile.photos.length > 0 ? profile.photos : [profile.avatar]

  const swipeHandler = useSwipe((dir) => {
    if (dir === 'right') onLike()
    else if (dir === 'left') onPass()
    else if (dir === 'up') onSuperLike()
  })

  const animClass = swipeAnim === 'left' ? 'animate-swipe-left'
    : swipeAnim === 'right' ? 'animate-swipe-right'
    : swipeAnim === 'up' ? 'animate-swipe-up'
    : 'animate-card-enter'

  const cardStyle: React.CSSProperties = swipeHandler.dragging ? {
    transform: `translateX(${swipeHandler.translateX}px) translateY(${swipeHandler.translateY}px) rotate(${swipeHandler.rotate})`,
    transition: 'none',
    cursor: 'grabbing',
  } : {}

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 mx-auto select-none">
      {/* Swipe Card */}
      <div
        style={cardStyle}
        className={`relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-card ${animClass} cursor-grab active:cursor-grabbing`}
        {...swipeHandler.handlers}
      >
        {/* Photo */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <img
            src={photos[currentPhotoIndex] || profile.avatar}
            alt={profile.name}
            className="h-full w-full object-cover object-center pointer-events-none"
            draggable={false}
          />

          {/* Photo tabs */}
          {photos.length > 1 && (
            <div className="absolute top-3 inset-x-4 z-10 flex gap-1.5">
              {photos.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i === currentPhotoIndex ? 'bg-white' : 'bg-white/35'}`} />
              ))}
            </div>
          )}

          {/* Photo tap zones */}
          {photos.length > 1 && (
            <>
              <button type="button" aria-label="Prev photo" onClick={() => setCurrentPhotoIndex((c) => (c - 1 + photos.length) % photos.length)} className="absolute left-0 top-0 h-full w-1/3" />
              <button type="button" aria-label="Next photo" onClick={() => setCurrentPhotoIndex((c) => (c + 1) % photos.length)} className="absolute right-0 top-0 h-full w-1/3" />
            </>
          )}

          {/* LIKE stamp */}
          {swipeHandler.likeOpacity > 0.1 && (
            <div className="absolute top-10 right-5 z-20 rotate-[12deg] rounded-2xl border-[3px] border-emerald-400 px-4 py-1.5 text-xl font-black uppercase tracking-widest text-emerald-400 bg-black/10 backdrop-blur-sm pointer-events-none"
              style={{ opacity: swipeHandler.likeOpacity }}>
              LIKE
            </div>
          )}
          {/* PASS stamp */}
          {swipeHandler.passOpacity > 0.1 && (
            <div className="absolute top-10 left-5 z-20 rotate-[-12deg] rounded-2xl border-[3px] border-rose-400 px-4 py-1.5 text-xl font-black uppercase tracking-widest text-rose-400 bg-black/10 backdrop-blur-sm pointer-events-none"
              style={{ opacity: swipeHandler.passOpacity }}>
              PASS
            </div>
          )}
          {/* SUPER stamp */}
          {swipeHandler.superOpacity > 0.1 && (
            <div className="absolute bottom-32 inset-x-0 z-20 flex justify-center pointer-events-none">
              <div className="rounded-2xl border-[3px] border-amber-400 px-4 py-1.5 text-xl font-black uppercase tracking-widest text-amber-400 bg-black/10 backdrop-blur-sm" style={{ opacity: swipeHandler.superOpacity }}>
                SUPER LIKE ⭐
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-6 left-4 z-10">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold shadow-sm backdrop-blur-md ${campusColor ? campusColor.badge : 'bg-brand-500 text-white'}`}>
              <CapIcon className="h-3.5 w-3.5" />
              {campusColor?.short || 'SUC'}
            </span>
          </div>
          {profile.online && (
            <div className="absolute top-6 right-4 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </div>
          )}

          {/* Profile info overlay */}
          <div className="absolute bottom-0 inset-x-0 z-10 p-5">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                  {profile.name}{profile.age ? `, ${profile.age}` : ''}
                  {profile.verified && <VerifiedBadgeIcon className="ml-1.5 inline h-5 w-5 text-sky-400" />}
                </h2>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-200">
                  <MapPinIcon className="h-3.5 w-3.5 text-rose-300 shrink-0" />
                  <span className="truncate">{profile.distance || profile.universityName || 'Campus Scholar'}</span>
                </div>
              </div>
            </div>

            {/* Bio preview */}
            {profile.bio && (
              <p className="mt-3 text-xs text-slate-200/90 leading-relaxed line-clamp-2">{profile.bio}</p>
            )}

            {/* Interest chips */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.interests.slice(0, 4).map((i) => (
                  <span key={i} className="rounded-full bg-white/15 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white border border-white/20">
                    {i}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 px-2 pb-1">
        {/* Rewind */}
        <button
          type="button"
          aria-label="Undo"
          onClick={onRewind}
          disabled={!canRewind}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-soft border border-slate-200 transition-all hover:scale-105 hover:border-amber-300 hover:text-amber-500 disabled:opacity-30 active:scale-95"
        >
          <RewindIcon className="h-5 w-5" />
        </button>

        {/* Pass */}
        <button
          type="button"
          aria-label="Pass"
          onClick={onPass}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-rose-500 shadow-md border border-rose-200 transition-all hover:scale-110 hover:bg-rose-50 hover:border-rose-300 active:scale-95"
        >
          <CloseIcon className="h-8 w-8 stroke-[2.5]" />
        </button>

        {/* Super Like */}
        <button
          type="button"
          aria-label="Super Like"
          onClick={onSuperLike}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-white shadow-spark transition-all hover:scale-110 active:scale-90"
        >
          <StarSparkIcon className="h-5 w-5" />
        </button>

        {/* Like */}
        <button
          type="button"
          aria-label="Like"
          onClick={onLike}
          className={`flex h-16 w-16 items-center justify-center rounded-full shadow-glow transition-all hover:scale-110 active:scale-95 ${
            isLiked
              ? 'bg-gradient-to-tr from-brand-600 to-rose-500 text-white ring-4 ring-rose-200'
              : 'bg-gradient-to-tr from-brand-500 to-rose-400 text-white'
          }`}
        >
          <HeartIcon className="h-8 w-8 fill-white" />
        </button>

        {/* Chat */}
        <button
          type="button"
          aria-label="Message"
          onClick={onChat}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-500 shadow-soft border border-rose-200 transition-all hover:scale-105 hover:bg-rose-50 active:scale-90"
        >
          <span className="text-[10px] font-black leading-none">Chat</span>
        </button>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-[11px] text-slate-400 font-medium pb-1">
        Swipe right to like · Swipe left to pass · Swipe up for super like
      </p>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center max-w-sm mx-auto">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-rose-400 text-white shadow-glow">
          <HeartIcon className="h-12 w-12 fill-white" />
        </div>
        <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-white shadow-spark">✓</span>
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900">You've seen everyone!</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-[240px] mx-auto">
          More scholars from SUCs across the Philippines sign up daily.
        </p>
      </div>
      <div className="flex flex-col gap-2.5 w-full">
        <button type="button" onClick={onReset} className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-rose-400 py-3.5 text-sm font-bold text-white shadow-glow hover:opacity-95 active:scale-[0.98] transition-all">
          ↺ Explore Again
        </button>
        <button type="button" onClick={() => navigate({ name: 'search' })} className="w-full rounded-2xl bg-white py-3.5 text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all">
          Browse Campus Hub
        </button>
      </div>
    </div>
  )
}

// ─── Match Modal ─────────────────────────────────────────────────────────────

function MatchCelebrationModal({ profile, onClose, onChat }: { profile: Profile; onClose: () => void; onChat: (text?: string) => void }) {
  const [selected, setSelected] = useState('')
  const first = profile.name.split(' ')[0]
  const campus = (profile.universityName ?? profile.suc ?? 'campus').split(' ')[0]

  const icebreakers = [
    `Hi ${first}! What's your favorite spot around ${campus}?`,
    `Hello! I usually enjoy talking about interests. What do you do in your free time?`,
    `Hi ${first}! Glad to connect. What's one thing you enjoy most?`,
  ]

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative flex w-full max-w-[380px] flex-col items-center overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950 p-7 text-center text-white shadow-2xl border border-rose-500/20">
        {/* Sparkle ring */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-rose-400 text-2xl shadow-glow animate-bounce-subtle">
          💖
        </div>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.2em] text-rose-300">Spark Ignited!</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight">It's a Match!</h2>
        <p className="mt-1 text-sm text-slate-300">You and <span className="font-bold text-rose-300">{profile.name}</span> liked each other.</p>

        <div className="my-7 flex items-center justify-center gap-0">
          <div className="relative -mr-4 h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-brand-500 to-rose-400 flex items-center justify-center shadow-glow z-10">
            <span className="text-sm font-black text-white">You</span>
          </div>
          <div className="z-20 flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold shadow-glow ring-4 ring-slate-900">
            ❤️
          </div>
          <div className="relative -ml-4 h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-xl">
            <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="w-full text-left mb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Send an Icebreaker</p>
          <div className="flex flex-col gap-2">
            {icebreakers.map((text, i) => (
              <button key={i} type="button" onClick={() => setSelected(text)}
                className={`rounded-xl p-3 text-left text-xs font-medium transition-all ${selected === text ? 'border border-rose-400 bg-rose-500/25 text-white' : 'border border-slate-700/60 bg-slate-800/50 text-slate-300 hover:bg-slate-800'}`}>
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <button type="button" onClick={() => onChat(selected)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-rose-400 py-3.5 text-sm font-bold text-white shadow-glow hover:opacity-95 active:scale-[0.98] transition-all">
            💬 Send Message
          </button>
          <button type="button" onClick={onClose} className="py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            Keep Exploring →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SwipeCardSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto animate-pulse">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-200 aspect-[3/4]">
        <div className="absolute top-6 left-4 h-7 w-16 rounded-full bg-slate-300/80" />
        <div className="absolute top-6 right-4 h-7 w-20 rounded-full bg-slate-300/80" />
        <div className="absolute bottom-0 inset-x-0 p-5 space-y-3">
          <div className="h-7 w-2/3 rounded-xl bg-slate-300/80" />
          <div className="h-4 w-1/2 rounded-xl bg-slate-300/60" />
          <div className="flex gap-1.5">
            {[80, 64, 72].map((w) => <div key={w} className="h-5 rounded-full bg-slate-300/60" style={{ width: w }} />)}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 px-2">
        {[48, 64, 48, 64, 48].map((s, i) => (
          <div key={i} className="rounded-full bg-slate-200" style={{ width: s, height: s }} />
        ))}
      </div>
    </div>
  )
}
