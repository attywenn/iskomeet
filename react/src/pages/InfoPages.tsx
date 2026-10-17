import { useState, type ReactNode } from 'react'
import { APP_NAME } from '../data/site-content'
import { BackArrow, FlameIcon, SendIcon } from '../components/icons'
import { navigate } from '../lib/router'

export { SearchPage } from './Search'

export function AboutPage() {
  return (
    <StaticPage title="About Iskomeet">
      <div className="space-y-4 text-xs leading-relaxed text-slate-700">
        <p className="font-medium text-sm text-slate-900">
          <strong>{APP_NAME}</strong> is the premier college dating and social discovery platform built exclusively for <span className="text-brand-600 font-bold">Iskolar ng Bayan</span> — students and alumni across Philippine State Universities and Colleges (SUCs).
        </p>

        <div className="rounded-2xl bg-rose-50/60 p-4 border border-rose-100">
          <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wider">Our Mission</h3>
          <p className="mt-1 text-xs text-slate-700">
            To provide a wholesonme, safe, and authentic space where students under state scholarships can meet potential partners, study buddies, and lifelong companions who share the same values, struggles, and passion for national service.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-slate-900">Participating Campuses</h3>
          <p className="mt-1 text-xs text-slate-600">
            Scholars from UP Diliman, UP Manila, UP Los Baños, PUP Sta. Mesa, Philippine Normal University, EARIST, Technological University of the Philippines, Batangas State University, Cavite State University, Mindanao State University, and 35+ more SUCs across Luzon, Visayas, and Mindanao.
          </p>
        </div>
      </div>
    </StaticPage>
  )
}

export function DeveloperPage() {
  return (
    <StaticPage title="Developer & Stack">
      <div className="space-y-4 text-xs leading-relaxed text-slate-700">
        <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-md">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white">
              <FlameIcon className="h-4 w-4" />
            </span>
            <span className="font-bold text-sm">Iskomeet Design System</span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            Crafted with modern Human-Computer Interaction (HCI) best practices, WCAG 2.1 AA accessibility standards, responsive mobile-first shell, and micro-interactions.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="font-bold text-slate-900">Frontend Technology Stack</h3>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li><strong>React 19 & TypeScript:</strong> Modern component architecture with type-safety</li>
            <li><strong>Tailwind CSS 3:</strong> Custom dating design tokens, soft gradients, and modern shadows</li>
            <li><strong>Plus Jakarta Sans:</strong> Clean, high-legibility geometric neo-grotesque font</li>
            <li><strong>State & Storage:</strong> Resilient localStorage mock API with persona-based chat simulation</li>
          </ul>
        </div>
      </div>
    </StaticPage>
  )
}

export function TalkToDevPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <StaticPage title="Talk to the Developer">
      <p className="text-xs text-slate-600">
        Have feedback, feature requests, or want your campus organization featured on Iskomeet? Drop a message below!
      </p>

      {submitted ? (
        <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
          <span className="text-2xl">💌</span>
          <p className="mt-2 text-xs font-bold text-emerald-800">Message sent successfully!</p>
          <p className="text-[11px] text-emerald-600">Salamat sa pagsuporta sa Iskomeet community.</p>
        </div>
      ) : (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            setSubmitted(true)
          }}
        >
          <div>
            <label className="text-xs font-semibold text-slate-700">Your Message</label>
            <textarea
              name="message"
              required
              placeholder="Suggest a feature, report a bug, or say hi..."
              className="mt-1 min-h-[130px] w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-rose-500 py-3 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:opacity-95 active:scale-95 transition-all"
          >
            <span>Send Feedback</span>
            <SendIcon className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </StaticPage>
  )
}

function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-white px-5 py-6 lg:px-16 lg:py-10">
      <button
        type="button"
        className="flex items-center gap-1.5 self-start text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors"
        onClick={() => navigate({ name: 'landing' })}
      >
        <BackArrow className="h-4 w-4" />
        <span>Back to Home</span>
      </button>

      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">{title}</h1>
      <div className="mt-4 flex-1 lg:max-w-4xl lg:text-sm">{children}</div>
    </div>
  )
}
