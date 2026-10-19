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

// ─── Field Row (moved outside SettingsSection to avoid static-component lint) ─

type FieldRowProps = {
  label: string
  field: string
  children: React.ReactNode
  onSave: () => boolean
  canEdit: boolean
  cooldown: string
  editing: string | null
  setEditing: (v: string | null) => void
  savedField: string | null
}

function FieldRow({ label, field, children, onSave, canEdit, cooldown, editing, setEditing, savedField }: FieldRowProps) {
  const isEditing = editing === field
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-soft transition-all ${isEditing ? 'border-brand-300 ring-2 ring-rose-200/60' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
        {!canEdit ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-200">
            🔒 Locked
          </span>
        ) : !isEditing ? (
          <button
            type="button"
            aria-label={`Edit ${label}`}
            onClick={() => setEditing(field)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-brand-500 transition-all"
          >
            <EditIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {children}

      {!canEdit && <p className="mt-2 text-[10px] text-slate-400 font-medium">{cooldown}</p>}
      {canEdit && isEditing && (
        <button
          type="button"
          onClick={() => { if (onSave()) setEditing(null) }}
          className="mt-3 rounded-xl bg-gradient-to-r from-brand-500 to-rose-400 px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all"
        >
          Save Changes
        </button>
      )}
      {savedField === field && (
        <p className="mt-2 text-[11px] font-semibold text-emerald-600">✓ Saved successfully.</p>
      )}
    </div>
  )
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
    return `Changeable again on ${nextAllowedDate(cl[`${field}ChangedAt` as keyof typeof cl], cooldowns[field])}.`
  }
  function showSaved(field: string) { setSavedField(field); setFieldError(null); setTimeout(() => setSavedField(null), 3000) }
  function showError(msg: string) { setFieldError(msg); setSavedField(null); setTimeout(() => setFieldError(null), 4000) }

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
    if (items.length > 5) { showError('Maximum of 5 interests.'); return false }
    if (items.length === 0) { showError('Please enter at least one interest.'); return false }
    updateUser({ ...user, interests: items, changelog: { ...cl, interestsChangedAt: new Date().toISOString() } })
    setInterestsInput(items.join(', ')); showSaved('interests'); return true
  }

  const inputCls = (field: string) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-rose-300/30 ${editing !== field ? 'cursor-default text-slate-500' : ''} disabled:opacity-40`

  return (
    <div className="relative flex min-h-full flex-col bg-slate-50">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-100 bg-white/95 px-5 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-rose-50 hover:text-brand-500 transition-all"
        >
          ←
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900">Settings</h1>
      </header>

      <div className="flex-1 p-4 md:p-6 space-y-3 max-w-xl mx-auto w-full">
        {fieldError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 flex items-center gap-2">
            <span>⚠️</span>
            {fieldError}
          </div>
        )}

        <FieldRow label="Full Name" field="name" onSave={saveName} canEdit={canChange('name')} cooldown={cooldownMsg('name')} editing={editing} setEditing={setEditing} savedField={savedField}>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={editing !== 'name'} readOnly={editing !== 'name'} className={inputCls('name')} />
        </FieldRow>

        <FieldRow label="Password" field="password" onSave={savePassword} canEdit={canChange('password')} cooldown={cooldownMsg('password')} editing={editing} setEditing={setEditing} savedField={savedField}>
          <div className="space-y-2.5">
            <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={editing !== 'password'} readOnly={editing !== 'password'} className={inputCls('password')} />
            <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={editing !== 'password'} readOnly={editing !== 'password'} className={inputCls('password')} />
          </div>
        </FieldRow>

        <FieldRow label="Username" field="username" onSave={saveUsername} canEdit={canChange('username')} cooldown={cooldownMsg('username')} editing={editing} setEditing={setEditing} savedField={savedField}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} disabled={editing !== 'username'} readOnly={editing !== 'username'} className={inputCls('username')} />
        </FieldRow>

        <FieldRow label="University" field="university" onSave={saveUniversity} canEdit={canChange('university')} cooldown={cooldownMsg('university')} editing={editing} setEditing={setEditing} savedField={savedField}>
          <input value={university} onChange={(e) => setUniversity(e.target.value)} disabled={editing !== 'university'} readOnly={editing !== 'university'} className={inputCls('university')} />
        </FieldRow>

        <FieldRow label="Location / Region" field="location" onSave={saveLocation} canEdit={canChange('location')} cooldown={cooldownMsg('location')} editing={editing} setEditing={setEditing} savedField={savedField}>
          <input value={location} onChange={(e) => setLocation(e.target.value)} disabled={editing !== 'location'} readOnly={editing !== 'location'} className={inputCls('location')} />
        </FieldRow>

        <FieldRow label="Interests (up to 5, comma-separated)" field="interests" onSave={saveInterests} canEdit={canChange('interests')} cooldown={cooldownMsg('interests')} editing={editing} setEditing={setEditing} savedField={savedField}>
          <input value={interestsInput} onChange={(e) => setInterestsInput(e.target.value)} placeholder="Reading, Music, Coffee…" disabled={editing !== 'interests'} readOnly={editing !== 'interests'} className={inputCls('interests')} />
        </FieldRow>

        {/* DOB — read-only */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Date of Birth</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">Not editable</span>
          </div>
          <p className="text-sm font-semibold text-slate-700">
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

  useEffect(() => {
    if (!user) { navigate({ name: 'signin' }); return }
    if (!user.accessToken) return
    api.fetchCurrentUserProfile(user.accessToken).then((data) => {
      if (!data) return
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

  const likes      = api.getLikes()
  const convos     = api.getConversations()
  const campusName = user.universityName ?? user.suc ?? 'University'
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
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-rose-100/60 bg-white/95 px-5 backdrop-blur-md">
        <h1 className="text-lg font-black tracking-tight text-slate-900">My Profile</h1>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-brand-600 border border-rose-200 hover:bg-rose-100 active:scale-95 transition-all"
        >
          <EditIcon className="h-3.5 w-3.5" />
          Edit
        </button>
      </header>

      <main className="flex-1 pb-10">
        {/* Hero banner */}
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-brand-500 via-rose-400 to-pink-500">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_70%_40%,white_0%,transparent_65%)]" />
          <div className="pointer-events-none absolute -right-6 -bottom-4 opacity-[0.12]">
            <CapIcon className="h-40 w-40 text-white" />
          </div>
          {/* Floating hearts */}
          <span className="pointer-events-none absolute left-5 top-5 text-white/20 text-3xl select-none">♥</span>
          <span className="pointer-events-none absolute right-12 top-8 text-white/15 text-xl select-none">♥</span>
          <span className="pointer-events-none absolute left-1/3 bottom-3 text-white/10 text-4xl select-none">♥</span>
        </div>

        <div className="px-5 max-w-xl mx-auto w-full">
          {/* Avatar + badges */}
          <div className="-mt-14 flex items-end justify-between pb-1">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-brand-500 to-rose-400 text-4xl font-black text-white shadow-glow ring-4 ring-white overflow-hidden">
                {user.avatar
                  ? <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
                  : initial}
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            </div>
            <div className="mb-2 flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5">
                <VerifiedBadgeIcon className="h-4 w-4 text-sky-500" />
                <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${campusColor.badge}`}>
                  {campusColor.short}
                </span>
              </div>
              {user.genderName && (
                <span className="rounded-full bg-white border border-rose-200 px-3 py-0.5 text-[11px] font-semibold text-brand-600">
                  {user.genderName}
                </span>
              )}
            </div>
          </div>

          {/* Name & handle */}
          <div className="mt-4">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">{displayName}</h2>
            <p className="text-sm font-semibold text-brand-500 mt-0.5">@{user.username}</p>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatChip value={String(likes.length)}  label="Sparks Sent" icon="🔥" />
            <StatChip value={String(convos.length)} label="Active Chats" icon="💬" />
            <StatChip value={String((user.interests ?? []).length)} label="Interests" icon="✨" />
          </div>

          {/* Info rows */}
          <div className="mt-6 space-y-2.5">
            <InfoRow icon={<CapIcon className="h-4 w-4" />} label="University" value={campusName} />
            {user.location && <InfoRow icon={<MapPinIcon className="h-4 w-4" />} label="Location" value={user.location} />}
            {user.dateOfBirth && (
              <InfoRow
                icon={<span className="text-sm">🎂</span>}
                label="Birthday"
                value={new Date(user.dateOfBirth).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
              />
            )}
            {user.genderName && <InfoRow icon={<span className="text-sm">👤</span>} label="Gender" value={user.genderName} />}
          </div>

          {/* Interests */}
          {(user.interests ?? []).length > 0 && (
            <div className="mt-7">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="h-4 w-4 text-brand-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Interests & Vibes</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.interests!.map((hobby) => (
                  <span key={hobby} className="rounded-full bg-white border border-rose-200 px-4 py-1.5 text-xs font-bold text-brand-600 shadow-soft hover:bg-rose-50 transition-colors">
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div className="mt-7 rounded-2xl bg-white border border-slate-100 p-5 shadow-soft">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">About Me</p>
              <p className="text-sm leading-relaxed text-slate-700">{user.bio}</p>
            </div>
          )}

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate({ name: 'match' })}
              className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-brand-500 to-rose-400 px-5 py-4 font-bold text-white shadow-glow hover:opacity-95 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <FlameIcon className="h-5 w-5" />
                <span className="text-sm">Discover Matches</span>
              </div>
              <span className="opacity-80">→</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ name: 'search' })}
              className="flex w-full items-center justify-between rounded-2xl bg-white border border-slate-200 px-5 py-4 font-bold text-slate-800 shadow-soft hover:border-rose-200 hover:bg-rose-50/50 transition-all"
            >
              <span className="text-sm">Browse Campus Hub</span>
              <span className="text-slate-400">→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatChip({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white border border-slate-100 py-4 gap-0.5 shadow-soft">
      <span className="text-base">{icon}</span>
      <span className="text-lg font-black text-slate-900">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center leading-tight px-1">{label}</span>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-white border border-slate-100 px-4 py-3.5 shadow-soft">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-brand-500 border border-rose-100">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  )
}
