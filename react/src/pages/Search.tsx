import { useEffect, useState } from 'react'
import {
  CloseIcon,
  HeartIcon,
  SearchIcon,
  VerifiedBadgeIcon,
} from '../components/icons'
import { SUC_COLORS } from '../data/site-content'
import * as api from '../lib/api'
import { navigate } from '../lib/router'
import type { Profile } from '../lib/types'

export function SearchPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCampus, setSelectedCampus] = useState<string>('all')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [likes, setLikes] = useState<string[]>(() => api.getLikes())

  useEffect(() => {
    void api.getProfiles().then(setProfiles)
  }, [])

  function handleToggleLike(id: string) {
    const next = api.toggleLike(id)
    setLikes(next)
  }

  // Filter scholars based on query, campus, and online status
  const filteredProfiles = profiles.filter((p) => {
    const campusName = p.universityName ?? p.suc ?? ''
    const programName = p.program ?? ''
    const matchesQuery =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campusName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.interests && p.interests.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())))

    const matchesCampus =
      selectedCampus === 'all' || campusName.toLowerCase().includes(selectedCampus.toLowerCase())

    const matchesOnline = !onlineOnly || p.online

    return matchesQuery && matchesCampus && matchesOnline
  })

  const popularCampuses = [
    { id: 'all', label: 'All Campuses' },
    { id: 'Diliman', label: 'UP Diliman' },
    { id: 'Polytechnic', label: 'PUP Sta. Mesa' },
    { id: 'Normal', label: 'PNU Manila' },
    { id: 'EARIST', label: 'EARIST' },
    { id: 'Batangas', label: 'BatStateU' },
    { id: 'Cavite', label: 'CvSU' },
  ]

  return (
    <div className="relative flex min-h-full flex-col bg-slate-50">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 pt-4 pb-3 backdrop-blur-md lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">Campus Hub</h1>
            <p className="text-xs text-slate-500 font-medium">Explore scholars across Philippine universities</p>
          </div>
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-brand-600 border border-rose-100">
            {filteredProfiles.length} Scholars Found
          </span>
        </div>

        {/* Search Bar Input */}
        <div className="relative mt-3 flex items-center">
          <span className="pointer-events-none absolute left-3 text-slate-400">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, program, or campus..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Campus Filter Pills */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {popularCampuses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCampus(c.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                selectedCampus === c.id
                  ? 'bg-brand-500 text-white shadow-sm shadow-rose-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Online Only toggle */}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
              className="rounded text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
            />
            <span className="font-medium text-[11px]">Active Scholars Only</span>
          </label>
          <span className="text-[11px] text-slate-400">Showing {filteredProfiles.length} of {profiles.length}</span>
        </div>
      </header>

      {/* Scholars Grid */}
      <div className="flex-1 p-4 lg:p-8">
        {filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredProfiles.map((item) => {
              const isLiked = likes.includes(item.id)
              const campusName = item.universityName ?? item.suc ?? 'University'
              const campusColor = SUC_COLORS[campusName] ?? { bg: 'bg-rose-50', text: 'text-brand-600', badge: 'bg-brand-500 text-white', short: 'Campus' }

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-slate-200"
                >
                  {/* Portrait Card */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-900">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Online status indicator */}
                    {item.online ? (
                      <span className="absolute top-2 right-2 flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    ) : null}

                    {/* University Tag Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold shadow-sm ${
                          campusColor ? campusColor.badge : 'bg-brand-500 text-white'
                        }`}
                      >
                        {campusColor?.short || 'SUC'}
                      </span>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                    {/* Bottom details on image */}
                    <div className="absolute bottom-2.5 inset-x-2.5 text-white">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-bold">{item.name}, {item.age}</p>
                        {item.verified ? (
                          <VerifiedBadgeIcon className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        ) : null}
                      </div>
                      <p className="truncate text-[10px] text-slate-300 font-medium">{item.program ?? 'Student'}</p>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between p-2.5 bg-white">
                    <button
                      type="button"
                      aria-label={isLiked ? 'Unlike' : 'Like'}
                      onClick={() => handleToggleLike(item.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                        isLiked
                          ? 'bg-rose-50 border-rose-200 text-brand-500'
                          : 'border-slate-200 text-slate-400 hover:text-brand-500 hover:border-rose-200'
                      }`}
                    >
                      <HeartIcon className={`h-4 w-4 ${isLiked ? 'fill-brand-500 text-brand-500' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate({ name: 'chat', userId: item.id })}
                      className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-brand-500 transition-colors"
                    >
                      <span>Say Hi</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-slate-100">
            <p className="text-sm font-bold text-slate-900">No scholars match your filter</p>
            <p className="mt-1 text-xs text-slate-500">Try choosing a different campus or clearing your search term.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCampus('all')
                setOnlineOnly(false)
              }}
              className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
