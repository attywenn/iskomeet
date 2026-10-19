import { useQuery } from '@tanstack/react-query'
import * as api from './api'
import type { GenderOption, UniversityOption, RegionOption, MatchProfile, UserProfile } from './api'

// ─── Lookup / Static Reference Data (24h Stale Time) ────────────────────────

export function useGenders() {
  return useQuery<GenderOption[]>({
    queryKey: ['lookup', 'genders'],
    queryFn: api.fetchGenders,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
  })
}

export function useUniversities() {
  return useQuery<UniversityOption[]>({
    queryKey: ['lookup', 'universities'],
    queryFn: api.fetchUniversities,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
  })
}

export function useRegions() {
  return useQuery<RegionOption[]>({
    queryKey: ['lookup', 'regions'],
    queryFn: api.fetchRegions,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
  })
}

// ─── Match Feed (1-2 minutes Stale Time) ────────────────────────────────────

export function useMatchFeed(accessToken: string | undefined) {
  return useQuery<MatchProfile[]>({
    queryKey: ['matchFeed', accessToken],
    queryFn: () => (accessToken ? api.fetchMatchFeed(accessToken) : Promise.resolve([])),
    enabled: Boolean(accessToken),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  })
}

// ─── User Profile Views (5 minutes Stale Time) ──────────────────────────────

export function useUserProfile(userId: string | number | undefined) {
  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: () => (userId ? api.fetchUserProfile(userId) : Promise.resolve(null)),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
  })
}
