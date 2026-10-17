import { APP_NAME } from '../data/site-content'
import {
  CoffeeIcon,
  FlameIcon,
  SparklesIcon,
} from '../components/icons'
import { navigate } from '../lib/router'

export function LandingPage() {
  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden bg-white selection:bg-rose-100 selection:text-rose-900">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-5 lg:h-20 lg:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
            <FlameIcon className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">{APP_NAME}</span>
        </div>

        <button
          type="button"
          onClick={() => navigate({ name: 'signin' })}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          Open App →
        </button>
      </header>

      <section className="relative flex flex-1 items-center px-5 pt-8 pb-6 text-center lg:px-16 lg:py-0 lg:text-left">
        <div className="relative z-10 flex w-full flex-col items-center lg:max-w-4xl lg:items-start">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-semibold text-slate-700">
            <SparklesIcon className="h-3.5 w-3.5 text-brand-500" />
            <span>Dating Site for Filipino Kolehiyos</span>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-6xl lg:leading-[1.1]">
            Where Honor Meets <br />
            <span className="text-brand-500">Campus Chemistry</span>
          </h1>

          <p className="mt-3 max-w-[320px] text-xs font-normal leading-relaxed text-slate-600 lg:mt-5 lg:max-w-xl lg:text-base">
            Connect with fellow students across Philippine universities. Find your thesis buddy, coffee crawl partner, or the love of your life.
          </p>

          <div className="mt-8 flex w-full max-w-[280px] flex-col gap-2.5 lg:max-w-md lg:flex-row">
            <button
              type="button"
              onClick={() => navigate({ name: 'signin' })}
              className="flex items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-brand-600 active:scale-[0.98] transition-all"
            >
              <span>Log in</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ name: 'register' })}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              <span>Create Account</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-100 bg-slate-900 px-5 py-6 text-white lg:px-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white">
              <FlameIcon className="h-4 w-4" />
            </span>
            <span className="text-sm font-black">{APP_NAME}</span>
          </div>

          <a
            href="https://www.buymeacoffee.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/20 transition-colors"
          >
            <CoffeeIcon className="h-4 w-4" />
            <span>Support Dev</span>
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
          <button type="button" onClick={() => navigate({ name: 'about' })} className="hover:text-white">
            About
          </button>
          <button type="button" onClick={() => navigate({ name: 'developer' })} className="hover:text-white">
            Developer
          </button>
          <button type="button" onClick={() => navigate({ name: 'talk' })} className="hover:text-white">
            Talk to Dev
          </button>
          <button type="button" onClick={() => navigate({ name: 'signin' })} className="hover:text-white">
            Campus Hub
          </button>
        </div>

        <p className="mt-5 text-[10px] text-slate-500">
          © {new Date().getFullYear()} Iskomeet. Built for Filipino Kolehiyos.
        </p>
      </footer>
    </div>
  )
}
