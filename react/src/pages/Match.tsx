import { useEffect, useState } from 'react'
import { MenuDrawer } from '../components/MenuDrawer'
import {
  CapIcon,
  CloseIcon,
  FlameIcon,
  HeartIcon,
  MapPinIcon,
  MenuIcon,
  RewindIcon,
  SparklesIcon,
  StarSparkIcon,
  VerifiedBadgeIcon,
} from '../components/icons'
import { APP_NAME, SUC_COLORS } from '../data/site-content'
import * as api from '../lib/api'
import { navigate } from '../lib/router'
import { useSession } from '../lib/session'
import type { Profile } from '../lib/types'

export function MatchPage() {
  const { user } = useSession()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [likes, setLikes] = useState<string[]>(() => api.getLikes())
  const [menuOpen, setMenuOpen] = useState(false)
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [showFullBio, setShowFullBio] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<'like' | 'pass' | 'superlike' | null>(null)
  const [chatModalProfile, setChatModalProfile] = useState<Profile | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate({ name: 'signin' })
      return
    }

    if (user.accessToken) {
      void api.fetchMatchFeed(user.accessToken).then((feed) => {
        const mapped: Profile[] = feed.map((item) => {
          let calculatedAge: number | undefined
          if (item.dob) {
            const birthYear = new Date(item.dob).getFullYear()
            if (!isNaN(birthYear)) {
              calculatedAge = new Date().getFullYear() - birthYear
            }
          }

          const fullName = `${item.first_name} ${item.last_name}`.trim() || item.user_username
          return {
            id: String(item.user_id),
            name: fullName,
            firstName: item.first_name,
            lastName: item.last_name,
            genderId: item.gender_id ?? undefined,
            universityId: item.university_id ?? undefined,
            universityName: item.university_name ?? undefined,
            online: !item.is_dnd,
            isDnd: item.is_dnd,
            lastActiveAt: item.last_active_at,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_username}`,
            photos: [`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_username}`],
            interests: item.interests,
            age: calculatedAge ?? 20,
            suc: item.university_name ?? undefined,
            location: item.region_name ?? undefined,
            distance: item.region_name ?? undefined,
            bio: item.interest_score > 0
              ? `✨ High Match: We share ${item.interest_score} interest${item.interest_score > 1 ? 's' : ''} in common!`
              : 'Iskolar looking to meet new people on campus.',
          }
        })
        setProfiles(mapped)
        setLoading(false)
      })
    }
  }, [user])

  if (!user) return null

  const profile = profiles[index]
  const isLiked = profile ? likes.includes(profile.id) : false
  const photos = profile?.photos && profile.photos.length > 0 ? profile.photos : profile ? [profile.avatar] : []

  function handleLike(isSuperLike = false) {
    if (!profile) return
    setActionFeedback(isSuperLike ? 'superlike' : 'like')
    const updated = api.toggleLike(profile.id)
    setLikes(updated)

    setTimeout(() => {
      setMatchedProfile(profile)
      setMatchModalOpen(true)
      setActionFeedback(null)
    }, 400)
  }

  function handlePass() {
    setActionFeedback('pass')
    setTimeout(() => {
      setIndex((curr) => (curr + 1) % profiles.length)
      setCurrentPhotoIndex(0)
      setShowFullBio(false)
      setActionFeedback(null)
    }, 300)
  }

  function handleRewind() {
    setIndex((curr) => (curr - 1 + profiles.length) % profiles.length)
    setCurrentPhotoIndex(0)
    setShowFullBio(false)
  }

  function nextPhoto() {
    if (photos.length > 1) {
      setCurrentPhotoIndex((curr) => (curr + 1) % photos.length)
    }
  }

  function prevPhoto() {
    if (photos.length > 1) {
      setCurrentPhotoIndex((curr) => (curr - 1 + photos.length) % photos.length)
    }
  }

  const campusName = profile ? (profile.universityName ?? profile.suc ?? 'University') : 'University'
  const campusColor = profile ? (SUC_COLORS[campusName] ?? { bg: 'bg-rose-50', text: 'text-brand-600', badge: 'bg-brand-500 text-white', short: campusName.slice(0, 4) }) : null
  const profileCampus = profile?.universityName ?? profile?.suc ?? 'Campus'

  return (
    <div className="relative flex min-h-full flex-col bg-slate-50 lg:h-full">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4 lg:h-16 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
            <FlameIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-black tracking-tight text-slate-900">{APP_NAME}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-3 lg:px-8 lg:py-6">
        {loading ? (
          <MatchCardSkeleton />
        ) : profile ? (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-900/8 lg:flex-row">
            {actionFeedback ? (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px]">
                {actionFeedback === 'like' && (
                  <div className="rotate-[-12deg] rounded-2xl border-2 border-emerald-500 bg-white/95 px-5 py-1.5 text-xl font-black uppercase tracking-widest text-emerald-600 shadow-lg">
                    LIKE
                  </div>
                )}
                {actionFeedback === 'pass' && (
                  <div className="rotate-[12deg] rounded-2xl border-2 border-rose-500 bg-white/95 px-5 py-1.5 text-xl font-black uppercase tracking-widest text-rose-600 shadow-lg">
                    PASS
                  </div>
                )}
                {actionFeedback === 'superlike' && (
                  <div className="rotate-[-6deg] rounded-2xl border-2 border-sky-500 bg-white/95 px-5 py-1.5 text-xl font-black uppercase tracking-widest text-sky-600 shadow-lg">
                    SUPER LIKE
                  </div>
                )}
              </div>
            ) : null}

            <div className="relative h-[390px] w-full shrink-0 overflow-hidden bg-slate-900 lg:h-auto lg:min-h-0 lg:flex-1">
              <img
                src={photos[currentPhotoIndex] || profile.avatar}
                alt={`${profile.name}, student at ${profileCampus}`}
                className="h-full w-full object-cover object-center transition-all duration-300"
              />

              {photos.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={prevPhoto}
                    className="absolute left-0 top-0 h-full w-1/3 cursor-pointer"
                  />
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={nextPhoto}
                    className="absolute right-0 top-0 h-full w-1/3 cursor-pointer"
                  />

                  <div className="absolute top-3 inset-x-3 z-10 flex gap-1.5">
                    {photos.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i === currentPhotoIndex ? 'bg-white shadow-sm' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : null}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              <div className="absolute top-4 left-3 z-10">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold shadow-md backdrop-blur-md ${
                    campusColor ? campusColor.badge : 'bg-brand-500 text-white'
                  }`}
                >
                  <CapIcon className="h-3.5 w-3.5" />
                  {campusColor?.short || 'SUC'}
                </span>
              </div>

              {profile.online ? (
                <div className="absolute top-4 right-3 z-10 flex items-center gap-1.5 rounded-full bg-emerald-950/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 backdrop-blur-md border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online now</span>
                </div>
              ) : null}

              <div className="absolute bottom-4 inset-x-4 z-10 text-white">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight">{profile.name}, {profile.age ?? 22}</h2>
                  {profile.verified ? (
                    <VerifiedBadgeIcon className="h-6 w-6 text-sky-400 shrink-0" />
                  ) : null}
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <CapIcon className="h-4 w-4 shrink-0 text-amber-300" />
                  <span className="truncate">{profile.program ?? 'Student'}</span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-3.5 w-3.5 text-rose-400" />
                    <span>{profile.distance || profileCampus}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                  >
                    <span>{showFullBio ? 'Less info ▴' : 'View Bio ▾'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col lg:w-[440px] lg:shrink-0 xl:w-[500px] lg:border-l lg:border-slate-100">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 lg:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">About Scholar</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700 font-medium">{profile.bio ?? 'Student profile'}</p>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 text-brand-600">
                  <CapIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Campus & College</p>
                  <p className="truncate text-xs font-bold text-slate-900">{profileCampus}</p>
                  <p className="text-[11px] font-medium text-brand-600">{profile.yearLevel ?? 'Student'}</p>
                </div>
              </div>

              {profile.interests && profile.interests.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Vibes & Interests</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        {interest}
                      </span>
                    ))}
                    {profile.mbti ? (
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-100">
                        MBTI: {profile.mbti}
                      </span>
                    ) : null}
                    {profile.zodiac ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-100">
                        {profile.zodiac}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {profile.prompts && profile.prompts.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {profile.prompts.map((prompt, pIdx) => (
                    <div
                      key={pIdx}
                      className="rounded-2xl border border-rose-100/80 bg-gradient-to-br from-rose-50/50 to-pink-50/30 p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600">
                        <SparklesIcon className="h-4 w-4" />
                        <span>{prompt.question}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
                        &ldquo;{prompt.answer}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="sticky bottom-0 z-20 flex items-center justify-around border-t border-slate-100 bg-white/95 px-6 py-3.5 backdrop-blur-md">
              <button
                type="button"
                aria-label="Rewind to previous scholar"
                onClick={handleRewind}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm transition-all hover:bg-slate-200 hover:scale-105 active:scale-90"
              >
                <RewindIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                aria-label="Pass"
                onClick={handlePass}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-rose-500 shadow-md border border-slate-200 transition-all hover:bg-rose-50 hover:border-rose-200 hover:scale-110 active:scale-95"
              >
                <CloseIcon className="h-7 w-7 stroke-[2.5]" />
              </button>

              <button
                type="button"
                aria-label="Super Like"
                onClick={() => handleLike(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-white shadow-md shadow-amber-400/30 transition-all hover:scale-110 active:scale-90"
              >
                <StarSparkIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                aria-label="Like"
                onClick={() => handleLike(false)}
                className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-rose-500/25 transition-all hover:scale-110 active:scale-95 ${
                  isLiked
                    ? 'bg-gradient-to-tr from-brand-600 to-rose-600 text-white ring-4 ring-rose-200'
                    : 'bg-gradient-to-tr from-brand-500 to-rose-400 text-white'
                }`}
              >
                <HeartIcon className="h-7 w-7 fill-white" />
              </button>

              <button
                type="button"
                aria-label="Chat with scholar"
                onClick={() => {
                  setChatModalProfile(profile)
                  setChatMessage(`Hi ${profile.firstName || profile.name.split(' ')[0]}! Nice to connect with you.`)
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-brand-600 shadow-sm border border-rose-200 transition-all hover:bg-rose-100 hover:scale-105 active:scale-90"
              >
                <span className="text-xs font-black">Chat</span>
              </button>
            </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-brand-500 text-2xl font-black shadow-inner">
              End
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">You&apos;ve seen everyone!</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 max-w-[260px]">
              More scholars from SUCs across Luzon, Visayas, and Mindanao are signing up daily.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 w-full max-w-[240px]">
              <button
                type="button"
                onClick={() => setIndex(0)}
                className="w-full rounded-2xl bg-brand-500 py-3 text-xs font-bold text-white shadow-md shadow-rose-500/25 hover:bg-brand-600 active:scale-95 transition-all"
              >
                ↺ Explore Stack Again
              </button>
              <button
                type="button"
                onClick={() => navigate({ name: 'search' })}
                className="w-full rounded-2xl bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
              >
                Search Campus Hub
              </button>
            </div>
          </div>
        )}
      </div>

      {matchModalOpen && matchedProfile ? (
        <MatchCelebrationModal
          profile={matchedProfile}
          onClose={() => {
            setMatchModalOpen(false)
            setIndex((curr) => (curr + 1) % profiles.length)
            setCurrentPhotoIndex(0)
            setShowFullBio(false)
          }}
          onChat={(initialText) => {
            setMatchModalOpen(false)
            if (initialText) {
              void api.sendMessage(matchedProfile.id, initialText, user.accessToken)
            }
            navigate({ name: 'chat', userId: matchedProfile.id })
          }}
        />
      ) : null}

      {chatModalProfile ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fadeIn"
        >
          <div className="relative flex w-full max-w-[360px] flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img
                  src={chatModalProfile.avatar}
                  alt={chatModalProfile.name}
                  className="h-10 w-10 rounded-full border border-rose-200 bg-rose-50 object-cover"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900">{chatModalProfile.name}</h3>
                  <p className="truncate text-[11px] text-brand-600 font-medium">
                    {chatModalProfile.universityName ?? chatModalProfile.suc ?? 'Campus Scholar'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatModalProfile(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Send a Message
              </label>
              <textarea
                rows={3}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={`Write a message to ${chatModalProfile.name.split(' ')[0]}...`}
                className="mt-1.5 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={!chatMessage.trim() || isSending}
                onClick={async () => {
                  if (!chatMessage.trim()) return
                  setIsSending(true)
                  try {
                    await api.sendMessage(chatModalProfile.id, chatMessage.trim(), user.accessToken)
                    const targetId = chatModalProfile.id
                    setChatModalProfile(null)
                    navigate({ name: 'chat', userId: targetId })
                  } finally {
                    setIsSending(false)
                  }
                }}
                className={`flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-rose-500 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/25 transition-all ${
                  chatMessage.trim() && !isSending
                    ? 'hover:opacity-95 active:scale-95'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {isSending ? 'Sending…' : 'Send Message'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = chatModalProfile.id
                  setChatModalProfile(null)
                  navigate({ name: 'chat', userId: targetId })
                }}
                className="py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Open Chat Directly
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}

function MatchCelebrationModal({
  profile,
  onClose,
  onChat,
}: {
  profile: Profile
  onClose: () => void
  onChat: (text?: string) => void
}) {
  const [selectedIcebreaker, setSelectedIcebreaker] = useState('')

  const icebreakers = [
    `Hi ${profile.name.split(' ')[0]}. What is your favorite place around ${(profile.universityName ?? profile.suc ?? 'campus').split(' ')[0]}?`,
    `Hello. I enjoy talking about routines and interests. What do you usually do in your free time?`,
    `Hi ${profile.name.split(' ')[0]}. I am glad to connect. What is one thing you enjoy doing most?`,
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative flex w-full max-w-[360px] flex-col items-center overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950 p-6 text-center text-white shadow-2xl border border-rose-500/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 text-xl font-black text-white shadow-lg shadow-rose-500/40 animate-bounce-subtle">
          Match
        </div>

        <p className="mt-3 text-xs font-extrabold uppercase tracking-widest text-amber-300">
          SPARK IGNITED!
        </p>
        <h2 className="text-3xl font-black tracking-tight text-white">It&apos;s a Match!</h2>
        <p className="mt-1 text-xs text-slate-300">
          You and <span className="font-bold text-rose-300">{profile.name}</span> liked each other.
        </p>

        <div className="my-6 flex items-center justify-center">
          <div className="relative -mr-3 h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-xl bg-brand-500 flex items-center justify-center">
            <span className="text-xl font-black text-white">You</span>
          </div>
          <div className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white font-bold shadow-lg ring-4 ring-slate-900">
            Like
          </div>
          <div className="relative -ml-3 h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-xl">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="w-full text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Send an Iskolar Icebreaker:
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {icebreakers.map((text, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIcebreaker(text)}
                className={`rounded-xl p-2.5 text-left text-xs font-medium transition-all ${
                  selectedIcebreaker === text
                    ? 'border border-rose-400 bg-rose-500/30 text-white font-semibold'
                    : 'border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onChat(selectedIcebreaker)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-rose-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/30 hover:opacity-95 active:scale-95 transition-all"
          >
            <span>Send Message</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Keep Exploring
          </button>
        </div>
      </div>
    </div>
  )
}

function MatchCardSkeleton() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-900/8 lg:flex-row animate-pulse">
      {/* Photo area */}
      <div className="relative h-[390px] w-full shrink-0 bg-slate-200 lg:h-auto lg:min-h-0 lg:flex-1">
        {/* Campus badge */}
        <div className="absolute top-4 left-3 h-6 w-16 rounded-full bg-slate-300/70" />
        {/* Online badge */}
        <div className="absolute top-4 right-3 h-6 w-24 rounded-full bg-slate-300/70" />
        {/* Bottom overlay info */}
        <div className="absolute bottom-4 inset-x-4 space-y-2">
          <div className="h-7 w-2/3 rounded-xl bg-slate-300/70" />
          <div className="h-4 w-1/3 rounded-xl bg-slate-300/50" />
          <div className="h-4 w-1/2 rounded-xl bg-slate-300/50" />
        </div>
      </div>

      {/* Info panel */}
      <div className="flex min-h-0 flex-1 flex-col lg:w-[440px] lg:shrink-0 xl:w-[500px] lg:border-l lg:border-slate-100">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 lg:p-6">
          {/* Bio */}
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-4/5 rounded bg-slate-100" />
          </div>

          {/* Campus row */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3 border border-slate-100">
            <div className="h-10 w-10 rounded-xl bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-3 w-36 rounded bg-slate-100" />
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="flex flex-wrap gap-1.5">
              {[80, 64, 96, 72, 56].map((w) => (
                <div key={w} className={`h-6 rounded-full bg-slate-200`} style={{ width: w }} />
              ))}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="sticky bottom-0 flex items-center justify-around border-t border-slate-100 bg-white/95 px-6 py-3.5">
          {[11, 14, 11, 14, 11].map((size, i) => (
            <div
              key={i}
              className={`rounded-full bg-slate-200`}
              style={{ width: size * 4, height: size * 4 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
