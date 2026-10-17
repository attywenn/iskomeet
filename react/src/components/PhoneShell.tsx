import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-stretch justify-center bg-slate-100 p-0 md:p-4 lg:h-screen lg:bg-white lg:p-0">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-white md:min-h-[calc(100vh-2rem)] md:max-w-[768px] md:rounded-3xl md:border md:border-slate-200 md:shadow-soft lg:h-full lg:max-w-none lg:flex-row lg:rounded-none lg:border-0 lg:shadow-none">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
