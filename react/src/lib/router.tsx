import { useCallback, useEffect, useState } from 'react'
import type { Route } from './types'

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) return { name: 'landing' }

  switch (parts[0]) {
    case 'match':
      return { name: 'match' }
    case 'signin':
      return { name: 'signin' }
    case 'register':
      return { name: 'register' }
    case 'about':
      return { name: 'about' }
    case 'developer':
      return { name: 'developer' }
    case 'talk':
      return { name: 'talk' }
    case 'search':
      return { name: 'search' }
    case 'profile':
      return { name: 'profile' }
    case 'settings':
      return { name: 'settings' }
    case 'chat':
      if (parts[1]) return { name: 'chat', userId: parts[1] }
      return { name: 'match' }
    default:
      return { name: 'landing' }
  }
}

export function toHash(route: Route) {
  if (route.name === 'landing') return '#/'
  if (route.name === 'signin') return '#/signin'
  if (route.name === 'register') return '#/register'
  if (route.name === 'chat') return `#/chat/${route.userId}`
  return `#/${route.name}`
}

export function navigate(route: Route) {
  window.location.hash = toHash(route)
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() =>
    parseHash(window.location.hash),
  )

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    if (!window.location.hash) window.location.hash = '#/'
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const go = useCallback((next: Route) => {
    navigate(next)
  }, [])

  return { route, go }
}
