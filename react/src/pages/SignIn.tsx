import { useState } from 'react'
import * as api from '../lib/api'
import { navigate } from '../lib/router'
import { useSession } from '../lib/session'

export function SignInPage() {
  const { refresh } = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal state
  const [successModal, setSuccessModal] = useState(false)
  const [failModal, setFailModal] = useState(false)
  const [failMessage, setFailMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!username.trim() || !password) {
      setFailMessage('Please enter your username and password.')
      setFailModal(true)
      return
    }

    setIsSubmitting(true)
    try {
      const user = await api.signIn(username.trim(), password)
      if (!user) {
        setFailMessage('Incorrect username or password. Please try again.')
        setFailModal(true)
        return
      }

      refresh()
      setSuccessModal(true)
    } catch {
      setFailMessage('Something went wrong. Please try again.')
      setFailModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-5 lg:h-full lg:p-0">
      <div className="hidden h-full min-h-full flex-1 flex-col justify-center bg-slate-900 px-16 text-white lg:flex">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-300">Iskomeet</p>
        <h2 className="mt-3 max-w-md text-4xl font-black leading-tight">Welcome back, scholar.</h2>
        <p className="mt-4 max-w-sm text-sm text-slate-300">Sign in to continue matching across SUC campuses.</p>
      </div>
      <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 lg:flex lg:h-full lg:max-w-none lg:flex-1 lg:flex-col lg:justify-center lg:rounded-none lg:border-0 lg:px-24 lg:shadow-none">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-600">
            ISKOMEET | <span className="text-black">ACCOUNTS</span>
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Log in
          </h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
              placeholder="yourname"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => navigate({ name: 'register' })}
            className="font-bold text-brand-600 underline-offset-2 hover:underline"
          >
            Register here
          </button>
          <div className="flex justify-center items-center">
            <button
              type="button"
              onClick={() => navigate({ name: 'landing' })}
              className="mt-2 text-xs text-brand-500 font-bold hover:underline"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>

      {/* ===== SUCCESS MODAL ===== */}
      {successModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-[320px] rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">
              ✓
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900">Welcome back!</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              You have successfully logged in to Iskomeet.
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccessModal(false)
                navigate({ name: 'match' })
              }}
              className="mt-6 w-full rounded-2xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
            >
              Start Exploring
            </button>
          </div>
        </div>
      )}

      {/* ===== FAILURE MODAL ===== */}
      {failModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-[320px] rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-2xl">
              ✕
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900">Login Failed</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {failMessage}
            </p>
            <button
              type="button"
              onClick={() => setFailModal(false)}
              className="mt-6 w-full rounded-2xl bg-rose-500 py-3 text-sm font-bold text-white hover:bg-rose-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
