import { useEffect, useState } from 'react'
import {
  CapIcon,
  EditIcon,
  FlameIcon,
  MapPinIcon,
  SparklesIcon,
  VerifiedBadgeIcon,
} from '../components/icons'
import { SUC_COLORS } from '../data/site-content'
import * as api from '../lib/api'
import { navigate } from '../lib/router'
import { useSession } from '../lib/session'
import type { SessionUser } from '../lib/types'

// ─── Cooldown helpers ───────────────────────────────────────────────────────

function daysSince(isoDate?: string): number {
  if (!isoDate) return Infinity
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24)
}

function nextAllowedDate(isoDate: string | undefined, cooldownDays: number): string {
  if (!isoDate) return 'now'
  const next = new Date(new Date(isoDate).getTime() + cooldownDays * 24 * 60 * 60 * 1000)
  return next.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })
}

// ─── Settings Section ────────────────────────────────────────────────────────

function SettingsSection({ user, onBack }: { user: SessionUser; onBack: () => void }) {
  const { updateUser } = useSession()

  const [name, setName] = useState(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim())
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState(user.username)
  const [university, setUniversity] = useState(user.universityName ?? '')
  const [location, setLocation] = useState(user.location ?? '')
  const [interestsInput, setInterestsInput] = useState((user.interests ?? []).join(', '))

  const [savedField, setSavedField] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const cl = user.changelog ?? {}

  const cooldowns = { name: 60, password: 1, username: 7, university: 60, location: 60, interests: 7 }

  function canChange(field: keyof typeof cooldowns) {
    return daysSince(cl[`${field}ChangedAt` as keyof typeof cl]) >= cooldowns[field]
  }

  function cooldownMsg(field: keyof typeof cooldowns) {
    return `You can change this again on ${nextAllowedDate(cl[`${field}ChangedAt` as keyof typeof cl], cooldowns[field])}.`
  }

  function showSaved(field: string) {
    setSavedField(field); setFieldError(null)
    setTimeout(() => setSavedField(null), 3000)
  }

  function showError(msg: string) {
    setFieldError(msg); setSavedField(null)
    setTimeout(() => setFieldError(null), 4000)
  }

  function saveName() {
    if (!canChange('name')) { showError(cooldownMsg('name')); return false }
    const trimmed = name.trim()
    if (!trimmed) { showError('Name cannot be empty.'); return false }
    const [firstName, ...rest] = trimmed.split(' ')
    updateUser({ ...user, firstName, lastName: rest.join(' ') || '', changelog: { ...cl, nameChangedAt: new Date().toISOString() } })
    showSaved('name'); return true
  }

  function savePassword() {
    if (!canChange('password')) { showError(cooldownMsg('password')); return false }
    if (password.length < 8 || password.length > 20) { showError('Password must be 8–20 characters.'); return false }
    if (!/[^A-Za-z0-9]/.test(password)) { showError('Password must contain at least 1 symbol.'); return false }
    if (password !== confirmPassword) { showError('Passwords do not match.'); return false }
    const all = api.getStoredAccounts()
    localStorage.setItem('wellfleet:users', JSON.stringify(
      all.map((a) => a.username.toLowerCase() === user.username.toLowerCase() ? { ...a, password } : a)
    ))
    updateUser({ ...user, changelog: { ...cl, passwordChangedAt: new Date().toISOString() } })
    setPassword(''); setConfirmPassword(''); showSaved('password'); return true
  }

  function saveUsername() {
    if (!canChange('username')) { showError(cooldownMsg('username')); return false }
    const trimmed = username.trim()
    if (!/^[A-Za-z0-9_]{8,20}$/.test(trimmed)) { showError('Username: 8–20 chars, letters/numbers/underscore only.'); return false }
    const accounts = api.getStoredAccounts()
    if (accounts.some((a) => a.username.toLowerCase() === trimmed.toLowerCase() && a.username.toLowerCase() !== user.username.toLowerCase())) {
      showError('That username is already taken.'); return false
    }
    localStorage.setItem('wellfleet:users', JSON.stringify(
      accounts.map((a) => a.username.toLowerCase() === user.username.toLowerCase()
        ? { ...a, username: trimmed, profile: { ...a.profile, username: trimmed } } : a)
    ))
    updateUser({ ...user, username: trimmed, changelog: { ...cl, usernameChangedAt: new Date().toISOString() } })
    showSaved('username'); return true
  }

  function saveUniversity() {
    if (!canChange('university')) { showError(cooldownMsg('university')); return false }
    const trimmed = university.trim()
    if (!trimmed) { showError('University cannot be empty.'); return false }
    updateUser({ ...user, universityName: trimmed, suc: trimmed, changelog: { ...cl, universityChangedAt: new Date().toISOString() } })
    showSaved('university'); return true
  }

  function saveLocation() {
    if (!canChange('location')) { showError(cooldownMsg('location')); return false }
    const trimmed = location.trim()
    if (!trimmed) { showError('Location cannot be empty.'); return false }
    updateUser({ ...user, location: trimmed, changelog: { ...cl, locationChangedAt: new Date().toISOString() } })
    showSaved('location'); return true
  }

  function saveInterests() {
    if (!canChange('interests')) { showError(cooldownMsg('interests')); return false }
    const items = interestsInput.split(',').map((s) => s.trim()).filter(Boolean)
    if (items.length > 5) { showError('You can have at most 5 interests.'); return false }
    if (items.length === 0) { showError('Please enter at least one interest.'); return false }
    updateUser({ ...user, interests: items, changelog: { ...cl, interestsChangedAt: new Date().toISOString() } })
    setInterestsInput(items.join(', ')); showSaved('interests'); return true
  }

  function FieldRow({
    label, field, children, onSave, canEdit, cooldown,
  }: {
    label: string; field: string; children: React.ReactNode
    onSave: () => boolean; canEdit: boolean; cooldown: string
  }) {
    const isEditing = editing === field
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
          {!canEdit ? (
            <span className="text-[10px] text-amber-600 font-semibold">Locked</span>
          ) : !isEditing ? (
            <button
              type="button"
              aria-label={`Edit ${label}`}
              onClick={() => setEditing(field)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-brand-500 transition-colors"
            >
              <EditIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {children}
        {!canEdit && <p className="mt-1 text-[10px] text-slate-400">{cooldown}</p>}
        {canEdit && isEditing && (
          <button
            type="button"
            onClick={() => { if (onSave()) setEditing(null) }}
            className="mt-2 rounded-xl bg-brand-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors"
          >
            Save
          </button>
        )}
        {savedField === field && (
          <p className="mt-1 text-[11px] font-semibold text-emerald-600">Saved successfully.</p>
        )}
      </div>
    )
  }

  return (
    <div className="relative flex min-h-full flex-col bg-slate-50">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
        >
          ←
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900">Settings</h1>
      </header>

      <div className="flex-1 space-y-3 p-4 md:p-6 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0 lg:p-8">
        {fieldError && (
          <div className="lg:col-span-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {fieldError}
          </div>
        )}

        <FieldRow label="Full Name (changeable every 2 months)" field="name" onSave={saveName} canEdit={canChange('name')} cooldown={cooldownMsg('name')}>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!canChange('name') || editing !== 'name'} readOnly={editing !== 'name'} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 disabled:opacity-50" />
        </FieldRow>

        <FieldRow label="Password (changeable every 1 day)" field="password" onSave={savePassword} canEdit={canChange('password')} cooldown={cooldownMsg('password')}>
          <div className="space-y-2">
            <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!canChange('password') || editing !== 'password'} readOnly={editing !== 'password'} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 disabled:opacity-50" />
            <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={!canChange('password') || editing !== 'password'} readOnly={editing !== 'password'} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 disabled:opacity-50" />
          </div>
        </FieldRow>

        <FieldRow label="Username (changeable every 7 days)" field="username" onSave={saveUsername} canEdit={canChange('username')} cooldown={cooldownMsg('username')}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} disabled={!canChange('username') || editing !== 'username'} readOnly={editing !== 'username'} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 disabled:opacity-50" />
        </FieldRow>

        <FieldRow label="University (changeable every 2 months)" field="university" onSave={saveUniversity} canEdit={canChange('university')} cooldown={cooldownMsg('university')}>
          <input value={university} onChange={(e) => setUniversity(e.target.value)} disabled={!canChange('university') || editing !== 'university'} readOnly={editing !== 'university'} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 disabled:opacity-50" />
        </FieldRow>

        <FieldRow label="Location (changeable every 2 months)" field="location" onSave={saveLocation} canEdit={canChange('location')} cooldown={cooldownMsg('location')}>
          <input value={location} onChange={(e) => setLocation(e.target.value)} disabled={!canChange('location') || editing !== 'location'} readOnly={editing !== 'location'} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 disabled:opacity-50" />
        </FieldRow>

        <FieldRow label="Interests — up to 5 (changeable every 7 days)" field="interests" onSave={saveInterests} canEdit={canChange('interests')} cooldown={cooldownMsg('interests')}>
          <input value={interestsInput} onChange={(e) => setInterestsInput(e.target.value)} placeholder="Reading, Music, Coffee…" disabled={!canChange('interests') || editing !== 'interests'} readOnly={editing !== 'interests'} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 disabled:opacity-50" />
          <p className="mt-1 text-[10px] text-slate-400">Comma-separated, max 5.</p>
        </FieldRow>

        {/* Date of Birth — read-only */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:col-span-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date of Birth</span>
            <span className="text-[10px] text-slate-400 font-semibold">Not changeable</span>
          </div>
          <p className="text-sm font-medium text-slate-700">
            {user.dateOfBirth
              ? new Date(user.dateOfBirth).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })
              : 'Not provided'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Profile Page ───────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, updateUser } = useSession()
  const [showSettings, setShowSettings] = useState(false)

  // Fetch fresh profile data from backend and sync into session
  useEffect(() => {
    if (!user) { navigate({ name: 'signin' }); return }
    if (!user.accessToken) return

    api.fetchCurrentUserProfile(user.accessToken).then((data) => {
      if (!data) return
      // Merge fresh backend fields into the existing session so nothing is lost
      updateUser({
        ...user,
        firstName:      data.first_name   || user.firstName,
        lastName:       data.last_name    || user.lastName,
        genderName:     data.gender       ?? user.genderName,
        universityName: data.university   ?? user.universityName,
        suc:            data.university   ?? user.suc,
        location:       data.location     ?? user.location,
        interests:      data.interests.length ? data.interests : (user.interests ?? []),
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.accessToken])

  if (!user) return null
  if (showSettings) return <SettingsSection user={user} onBack={() => setShowSettings(false)} />

  const likes       = api.getLikes()
  const convos      = api.getConversations()
  const campusName  = user.universityName ?? user.suc ?? 'University'
  const campusColor = SUC_COLORS[campusName] ?? {
    bg: 'bg-rose-50', text: 'text-brand-600',
    badge: 'bg-brand-500 text-white',
    short: campusName.slice(0, 4).toUpperCase(),
  }

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName ?? user.username

  const initial = (displayName[0] ?? user.username[0] ?? 'U').toUpperCase()

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-100 bg-white/95 px-5 backdrop-blur-md">
        <h1 className="text-lg font-black tracking-tight text-slate-900">My Profile</h1>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-brand-600 border border-rose-200 hover:bg-rose-100 transition-colors active:scale-95"
        >
          Edit
        </button>
      </header>

      <main className="flex-1 pb-8">
        {/* Hero gradient banner */}
        <div className="relative h-36 w-full bg-gradient-to-br from-brand-500 via-rose-400 to-pink-400 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_50%,white_0%,transparent_60%)]" />
          {/* Decorative campus icon */}
          <div className="pointer-events-none absolute -right-4 -bottom-4 text-white/10">
            <CapIcon className="h-32 w-32" />
          </div>
        </div>

        <div className="px-5 max-w-lg mx-auto w-full">
          {/* Avatar overlapping the banner */}
          <div className="-mt-12 flex items-end justify-between">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-brand-500 to-rose-400 text-3xl font-black text-white shadow-xl shadow-brand-500/30 ring-4 ring-white">
              {user.avatar
                ? <img src={user.avatar} alt={displayName} className="h-full w-full rounded-3xl object-cover" />
                : initial
              }
              {/* Online dot */}
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            </div>
            <div className="mb-1 flex items-center gap-1.5">
              <VerifiedBadgeIcon className="h-4 w-4 text-sky-500" />
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${campusColor.badge}`}>
                {campusColor.short}
              </span>
            </div>
          </div>

          {/* Name & handle */}
          <div className="mt-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">{displayName}</h2>
            <p className="text-sm font-semibold text-brand-500">@{user.username}</p>
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatChip value={String(likes.length)}  label="Sparks Sent" />
            <StatChip value={String(convos.length)} label="Active Chats" />
            <StatChip value={String((user.interests ?? []).length)} label="Interests" />
          </div>

          {/* Info rows */}
          <div className="mt-6 space-y-3">
            <InfoRow
              icon={<CapIcon className="h-4 w-4" />}
              label="University"
              value={campusName}
            />
            {user.location && (
              <InfoRow
                icon={<MapPinIcon className="h-4 w-4" />}
                label="Location"
                value={user.location}
              />
            )}
            {user.dateOfBirth && (
              <InfoRow
                icon={<span className="text-xs font-black">🎂</span>}
                label="Birthday"
                value={new Date(user.dateOfBirth).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
              />
            )}
          </div>

          {/* Interests */}
          {(user.interests ?? []).length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-1.5 mb-3">
                <SparklesIcon className="h-4 w-4 text-brand-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Interests</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.interests!.map((hobby) => (
                  <span
                    key={hobby}
                    className="rounded-full bg-white border border-rose-200 px-3 py-1.5 text-xs font-semibold text-brand-600 shadow-sm"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div className="mt-6 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">About Me</p>
              <p className="text-sm leading-relaxed text-slate-700 font-medium">{user.bio}</p>
            </div>
          )}

          {/* CTA buttons */}
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate({ name: 'match' })}
              className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-brand-500 to-rose-500 p-4 font-bold text-white shadow-md shadow-rose-500/20 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <FlameIcon className="h-5 w-5" />
                <span className="text-sm">Explore Discover Stack</span>
              </div>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ name: 'search' })}
              className="flex w-full items-center justify-between rounded-2xl bg-white p-4 font-bold text-slate-800 border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm">Browse Campus Hub</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white border border-slate-100 py-3 shadow-sm">
      <span className="text-base font-black text-slate-900 truncate px-1 text-center">{value}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 px-4 py-3.5 shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-brand-500 border border-rose-100">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  )
}
