import type { ChatMessage, Conversation, ConversationSummary, Profile, SessionUser, UserProfile } from './types'
export type { UserProfile }
import { readJson, writeJson, removeKey } from './storage'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const CONVOS_KEY = 'conversations'
const LIKES_KEY = 'likes'
const SESSION_KEY = 'session'
const USERS_KEY = 'users'

export type UserRead = {
  user_id: number
  user_username: string
  account_created: string
}

export type UserCreate = {
  user_username: string
  user_password: string
}

export type AuthTokenResponse = {
  access_token: string
  token_type: string
  user: UserProfile
}

type StoredAccount = {
  username: string
  password: string
  profile: SessionUser
}

export type GenderOption = { gender_id: number; gender_name: string }
export type UniversityOption = { university_number: number; university_name: string; university_location: string }
export type RegionOption = { region_id: number; region_name: string }

export type RegistrationPayload = {
  username: string
  password: string
  livingFirstName: string
  livingLastName: string
  gender_id: number
  university_id: number
  region_id: number
  lookingForGenderIds: number[]   // gender_ids of the preferred genders to date
  interests: string
  dateOfBirth: string
}

export function getSession(): SessionUser | null {
  return readJson<SessionUser | null>(SESSION_KEY, null)
}

export function getStoredAccounts(): StoredAccount[] {
  return readJson<StoredAccount[]>(USERS_KEY, [])
}

export function updateStoredAccount(username: string, updatedProfile: SessionUser) {
  const accounts = getStoredAccounts()
  const next = accounts.map((entry) =>
    entry.username.toLowerCase() === username.toLowerCase()
      ? { ...entry, profile: updatedProfile }
      : entry,
  )
  writeJson(USERS_KEY, next)
}

export async function signIn(username: string, password: string): Promise<SessionUser | null> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_username: username.trim(), user_password: password }),
  })

  if (!res.ok) return null

  const data: AuthTokenResponse = await res.json()

  // Map backend UserProfile directly from ORM → SessionUser
  const sessionUser: SessionUser = {
    id: String(data.user.user_id),
    username: data.user.user_username,
    firstName: data.user.first_name || '',
    lastName: data.user.last_name || '',
    genderName: data.user.gender ?? undefined,
    universityName: data.user.university ?? undefined,
    suc: data.user.university ?? undefined,
    location: data.user.location ?? undefined,
    interests: data.user.interests ?? [],
    accessToken: data.access_token,
  }

  writeJson(SESSION_KEY, sessionUser)
  return sessionUser
}

export async function fetchCurrentUserProfile(accessToken: string): Promise<UserProfile | null> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json()
}

export async function register(data: RegistrationPayload): Promise<SessionUser> {
  const res = await fetch(`${API_BASE}/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_username:          data.username.trim(),
      user_password:          data.password,
      first_name:             data.livingFirstName.trim(),
      last_name:              data.livingLastName.trim(),
      gender_id:              data.gender_id,
      university_id:          data.university_id,
      region_id:              data.region_id,
      looking_for_gender_ids: data.lookingForGenderIds,
      looking_for_gender_id:  data.lookingForGenderIds[0] ?? null,
      interests:              data.interests.trim(),
      date_of_birth:          data.dateOfBirth.trim(),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Registration failed.')
  }

  const created: UserRead = await res.json()

  // NOTE: do NOT write SESSION_KEY here — user must log in separately
  return {
    id:           String(created.user_id),
    username:     created.user_username,
    firstName:    data.livingFirstName.trim(),
    lastName:     data.livingLastName.trim(),
    universityId: data.university_id,
    universityName: String(data.university_id),
    suc:          String(data.university_id),
    location:     String(data.region_id),
    interests:    data.interests.split(',').map((i) => i.trim()).filter(Boolean).slice(0, 5),
    dateOfBirth:  data.dateOfBirth.trim(),
    changelog:    {},
  }
}


export function updateSession(updatedUser: SessionUser) {
  writeJson(SESSION_KEY, updatedUser)
  updateStoredAccount(updatedUser.username, updatedUser)
}

export function signOut() {
  removeKey(SESSION_KEY)
}

export type MatchProfile = {
  user_id: number
  user_username: string
  first_name: string
  last_name: string
  gender_id: number | null
  university_id: number | null
  university_name: string | null
  region_id: number | null
  region_name: string | null
  dob: string | null
  interests: string[]
  interest_score: number
  is_dnd: boolean
  last_active_at: string | null
}

export async function updatePresence(accessToken: string, isDnd: boolean): Promise<UserProfile | null> {
  const res = await fetch(`${API_BASE}/auth/presence`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_dnd: isDnd }),
  })
  return res.ok ? res.json() : null
}

export async function sendPresenceHeartbeat(accessToken: string): Promise<void> {
  await fetch(`${API_BASE}/auth/heartbeat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => undefined)
}

/** Fetch preference-filtered, interest-ranked match candidates. Requires auth. */
export async function fetchMatchFeed(accessToken: string): Promise<MatchProfile[]> {
  const res = await fetch(`${API_BASE}/users/match`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  return res.json()
}

export async function fetchGenders(): Promise<GenderOption[]> {
  const res = await fetch(`${API_BASE}/lookup/genders`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchUniversities(): Promise<UniversityOption[]> {
  const res = await fetch(`${API_BASE}/lookup/universities`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchRegions(): Promise<RegionOption[]> {
  const res = await fetch(`${API_BASE}/lookup/regions`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchUserProfile(userId: string | number): Promise<UserProfile | null> {
  const res = await fetch(`${API_BASE}/users/${userId}`)
  if (!res.ok) return null
  return res.json()
}

export async function getProfiles(): Promise<Profile[]> {
  return []
}

export async function getProfile(id: string): Promise<UserProfile | null> {
  return fetchUserProfile(id)
}

export function getLikes(): string[] {
  return readJson<string[]>(LIKES_KEY, [])
}

export function toggleLike(profileId: string): string[] {
  const likes = new Set(getLikes())
  if (likes.has(profileId)) {
    likes.delete(profileId)
  } else {
    likes.add(profileId)
  }
  const next = [...likes]
  writeJson(LIKES_KEY, next)
  return next
}

export async function fetchUnreadCount(accessToken: string): Promise<number> {
  const res = await fetch(`${API_BASE}/messages/unread-count`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return 0
  const data = await res.json()
  return data.unread_count ?? 0
}

export async function fetchConversations(accessToken: string): Promise<ConversationSummary[]> {
  const res = await fetch(`${API_BASE}/messages/conversations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.map((item: {
    user_id: number
    user_username: string
    first_name: string
    last_name: string
    last_message: string
    last_timestamp: string
    unread_count: number
  }) => ({
    userId: String(item.user_id),
    username: item.user_username,
    firstName: item.first_name || '',
    lastName: item.last_name || '',
    lastMessage: item.last_message || '',
    lastTimestamp: item.last_timestamp
      ? new Date(item.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    unreadCount: item.unread_count || 0,
  }))
}

export async function fetchThread(
  accessToken: string,
  otherUserId: string,
  currentUserId: string,
): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/messages/${otherUserId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.map((m: {
    message_id: number
    sender_id: number
    msg_content: string
    message_timestamp: string
  }) => ({
    id: String(m.message_id),
    from: String(m.sender_id) === String(currentUserId) ? 'me' : 'them',
    text: m.msg_content,
    timestamp: m.message_timestamp
      ? new Date(m.message_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
  }))
}

export async function sendDirectMessage(
  accessToken: string,
  receiverId: string,
  content: string,
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      receiver_id: Number(receiverId),
      msg_content: content,
    }),
  })
  return res.ok
}

export function getConversations(): Conversation[] {
  return readJson<Conversation[]>(CONVOS_KEY, [])
}

export function getConversation(userId: string): Conversation {
  return (
    getConversations().find((convo) => convo.userId === userId) ?? {
      userId,
      messages: [],
    }
  )
}

export async function openConversation(
  userId: string,
  accessToken?: string,
  currentUserId?: string,
): Promise<Conversation> {
  if (accessToken && currentUserId) {
    const thread = await fetchThread(accessToken, userId, currentUserId)
    const convo: Conversation = { userId, messages: thread }
    saveConversation(convo)
    return convo
  }
  return getConversation(userId)
}

export async function sendMessage(
  userId: string,
  text: string,
  accessToken?: string,
): Promise<Conversation> {
  if (accessToken) {
    await sendDirectMessage(accessToken, userId, text)
  }
  const convo = getConversation(userId)
  const next: ChatMessage = {
    id: crypto.randomUUID(),
    from: 'me',
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
  convo.messages = [...convo.messages, next]
  saveConversation(convo)
  return convo
}

export function reactToMessage(userId: string, messageId: string, emoji: string): Conversation {
  const convo = getConversation(userId)
  convo.messages = convo.messages.map((m) => (m.id === messageId ? { ...m, reaction: emoji } : m))
  saveConversation(convo)
  return convo
}

function saveConversation(convo: Conversation) {
  const all = getConversations().filter((item) => item.userId !== convo.userId)
  writeJson(CONVOS_KEY, [...all, convo])
}

