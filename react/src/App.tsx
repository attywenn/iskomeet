import { useEffect } from 'react'
import { PhoneShell } from './components/PhoneShell'
import { useRoute } from './lib/router'
import { SessionProvider } from './lib/session'
import { useSession } from './lib/session'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import * as api from './lib/api'
import { LandingPage } from './pages/Landing'
import { MatchPage } from './pages/Match'
import { ChatPage } from './pages/Chat'
import { ProfilePage } from './pages/Profile'
import { RegisterPage } from './pages/Register'
import { SignInPage } from './pages/SignIn'
import {
  AboutPage,
  DeveloperPage,
  SearchPage,
  TalkToDevPage,
} from './pages/InfoPages'

function Screen() {
  const { route } = useRoute()

  switch (route.name) {
    case 'landing':
      return <LandingPage />
    case 'signin':
      return <SignInPage />
    case 'register':
      return <RegisterPage />
    case 'match':
      return <MatchPage />
    case 'chat':
      return <ChatPage userId={route.userId} />
    case 'profile':
    case 'settings':
      return <ProfilePage />
    case 'about':
      return <AboutPage />
    case 'developer':
      return <DeveloperPage />
    case 'talk':
      return <TalkToDevPage />
    case 'search':
      return <SearchPage />
  }
}

function PresenceSync() {
  const { user } = useSession()
  useEffect(() => {
    if (!user?.accessToken) return
    const heartbeat = () => {
      if (document.visibilityState === 'visible') void api.sendPresenceHeartbeat(user.accessToken!)
    }
    heartbeat()
    const timer = window.setInterval(heartbeat, 30_000)
    document.addEventListener('visibilitychange', heartbeat)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', heartbeat)
    }
  }, [user?.accessToken])
  return null
}

export default function App() {
  useEffect(() => {
    const root = document.documentElement
    const stored = localStorage.getItem('iskomeet-theme')
    const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored ? stored === 'dark' : preferredDark

    root.classList.toggle('dark', isDark)
    root.style.colorScheme = isDark ? 'dark' : 'light'
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <PresenceSync />
        <PhoneShell>
          <Screen />
        </PhoneShell>
      </SessionProvider>
    </QueryClientProvider>
  )
}
