import { useState } from 'react'
import * as api from '../lib/api'
import { navigate } from '../lib/router'
import { useGenders, useUniversities, useRegions } from '../lib/useQueries'

export function RegisterPage() {
  const [step, setStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form Fields State
  const [livingFirstName, setLivingFirstName] = useState('')
  const [livingLastName, setLivingLastName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [universityId, setUniversityId] = useState<number | ''>('')
  const [regionId, setRegionId] = useState<number | ''>('')
  const [genderId, setGenderId] = useState<number | ''>('')
  const [lookingForGenderIds, setLookingForGenderIds] = useState<number[]>([])
  const [interests, setInterests] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  // Cached lookup data (cached across unmounts with 24h staleTime)
  const { data: genders = [] } = useGenders()
  const { data: universities = [] } = useUniversities()
  const { data: regions = [] } = useRegions()

  const [error, setError] = useState('')

  // Modal state
  const [successModal, setSuccessModal] = useState(false)
  const [failModal, setFailModal] = useState(false)
  const [failMessage, setFailMessage] = useState('')

  /*
   * ============================
   * AUTHENTICATION VALIDATION
   * ============================
   */

  // Username:
  // - 8 to 20 characters
  // - Only letters, numbers, and underscore
  const usernameRegex = /^[A-Za-z0-9_]{8,20}$/

  // Password:
  // - 8 to 20 characters
  // - At least 8 alphanumeric characters
  // - At least 1 symbol

  function validateUsername(value: string): string {
    if (value.length < 8) {
      return 'Username must be at least 8 characters.'
    }

    if (value.length > 20) {
      return 'Username must not exceed 20 characters.'
    }

    if (!usernameRegex.test(value)) {
      return 'Username may only contain letters, numbers, and underscores.'
    }

    return ''
  }

  function validatePassword(value: string): string {
    if (value.length < 8) {
      return 'Password must be at least 8 characters.'
    }

    if (value.length > 20) {
      return 'Password must not exceed 20 characters.'
    }

    const alphanumericCount = (value.match(/[A-Za-z0-9]/g) || []).length

    if (alphanumericCount < 8) {
      return 'Password must contain at least 8 letters or numbers.'
    }

    if (!/[^A-Za-z0-9]/.test(value)) {
      return 'Password must contain at least 1 symbol.'
    }

    return ''
  }

  const usernameError = validateUsername(username)
  const passwordError = validatePassword(password)

  const isStep1Complete =
    livingFirstName.trim() !== '' &&
    livingLastName.trim() !== '' &&
    dateOfBirth.trim() !== '' &&
    usernameError === '' &&
    passwordError === ''

  const isStep2Complete =
    universityId !== '' &&
    regionId !== ''

  const isStep3Complete =
    genderId !== '' &&
    lookingForGenderIds.length > 0 &&
    interests.trim() !== ''

  function toggleLookingForGender(id: number) {
    setLookingForGenderIds((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    )
  }

  function goToStep(nextStep: number) {
    setIsTransitioning(true)

    setTimeout(() => {
      setStep(nextStep)
      setIsTransitioning(false)
    }, 500)
  }

  /*
   * ============================
   * FORM SUBMISSION
   * ============================
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError('')

    // Final validation before registration.
    const finalUsernameError = validateUsername(username)
    const finalPasswordError = validatePassword(password)

    if (finalUsernameError) {
      setError(finalUsernameError)
      setStep(1)
      return
    }

    if (finalPasswordError) {
      setError(finalPasswordError)
      setStep(1)
      return
    }

    if (!livingFirstName.trim() || !livingLastName.trim() || !dateOfBirth.trim()) {
      setError('First name, last name, and date of birth are required.')
      setStep(1)
      return
    }

    if (universityId === '' || regionId === '') {
      setError('University and region are required.')
      setStep(2)
      return
    }

    if (genderId === '' || lookingForGenderIds.length === 0 || !interests.trim()) {
      setError('Please complete all required fields.')
      setStep(3)
      return
    }

    const registrationPayload: api.RegistrationPayload = {
      username: username.trim(),
      password,
      livingFirstName: livingFirstName.trim(),
      livingLastName: livingLastName.trim(),
      gender_id: genderId as number,
      university_id: universityId as number,
      region_id: regionId as number,
      lookingForGenderIds: lookingForGenderIds,
      interests: interests.trim(),
      dateOfBirth: dateOfBirth.trim(),
    }


    setIsSubmitting(true)
    try {
      await api.register(registrationPayload)
      setSuccessModal(true)
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'That username is already taken or the registration failed.'
      setFailMessage(msg)
      setFailModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-5 lg:h-full lg:p-0">
      <div className="hidden h-full min-h-full flex-1 flex-col justify-center bg-slate-900 px-16 text-white lg:flex">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-300">Iskomeet</p>
        <h2 className="mt-3 max-w-md text-4xl font-black leading-tight">Join the campus circuit.</h2>
        <p className="mt-4 max-w-sm text-sm text-slate-300">Create your scholar profile and start matching.</p>
      </div>
      <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 lg:flex lg:h-full lg:max-w-none lg:flex-1 lg:flex-col lg:justify-center lg:overflow-y-auto lg:rounded-none lg:border-0 lg:px-24 lg:shadow-none">

        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-600">
            ISKOMEET | <span className="text-black">ACCOUNTS</span>
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Register
          </h1>

          {/* Step Indicator */}
          <div className="mt-4 flex items-center justify-center">
            {[1, 2, 3].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                    s === step
                      ? 'bg-brand-500 text-white'
                      : s < step
                        ? 'bg-brand-100 text-brand-600'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {s}
                </div>

                {idx < 2 && (
                  <div
                    className={`h-0.5 w-8 transition-colors duration-300 ${
                      s < step
                        ? 'bg-brand-500'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit}
          noValidate
        >
          {isTransitioning ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
            </div>
          ) : (
            <>
              {/* ================= STEP 1 ================= */}
              {step === 1 && (
                <>
                  <div>
                    <label
                      htmlFor="livingFirstName"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      First Name
                    </label>

                    <input
                      id="livingFirstName"
                      value={livingFirstName}
                      onChange={(event) =>
                        setLivingFirstName(event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="livingLastName"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Last Name
                    </label>

                    <input
                      id="livingLastName"
                      value={livingLastName}
                      onChange={(event) =>
                        setLivingLastName(event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="dateOfBirth"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Date of Birth
                    </label>

                    <input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(event) =>
                        setDateOfBirth(event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                      required
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Date of birth cannot be changed after registration.
                    </p>
                  </div>

                  {/* USERNAME */}
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
                      onChange={(event) =>
                        setUsername(event.target.value)
                      }
                      className={`w-full rounded-2xl border bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:bg-white ${
                        username.length > 0 && usernameError
                          ? 'border-rose-400 focus:border-rose-500'
                          : 'border-slate-200 focus:border-brand-500'
                      }`}
                      autoComplete="username"
                      minLength={8}
                      maxLength={20}
                      pattern="[A-Za-z0-9_]{8,20}"
                      required
                    />

                    <p className="mt-1 text-[11px] text-slate-400">
                      8–20 characters. Letters, numbers, and _
                      only.
                    </p>

                    {username.length > 0 && usernameError && (
                      <p className="mt-1 text-xs font-medium text-rose-600">
                        {usernameError}
                      </p>
                    )}
                  </div>

                  {/* PASSWORD */}
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
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      className={`w-full rounded-2xl border bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:bg-white ${
                        password.length > 0 && passwordError
                          ? 'border-rose-400 focus:border-rose-500'
                          : 'border-slate-200 focus:border-brand-500'
                      }`}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={20}
                      required
                    />

                    <p className="mt-1 text-[11px] text-slate-400">
                      8–20 characters, at least 8 letters/numbers,
                      and at least 1 symbol.
                    </p>

                    {password.length > 0 && passwordError && (
                      <p className="mt-1 text-xs font-medium text-rose-600">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    disabled={!isStep1Complete}
                    className="w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200"
                  >
                    Next
                  </button>
                </>
              )}

              {/* ================= STEP 2 ================= */}
              {step === 2 && (
                <>
                  <div>
                    <label
                      htmlFor="university"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      School / University
                    </label>

                    <select
                      id="university"
                      value={universityId}
                      onChange={(event) =>
                        setUniversityId(event.target.value === '' ? '' : Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                      required
                    >
                      <option value="">Select university</option>
                      {universities.map((u) => (
                        <option key={u.university_number} value={u.university_number}>
                          {u.university_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="region"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Region
                    </label>

                    <select
                      id="region"
                      value={regionId}
                      onChange={(event) =>
                        setRegionId(event.target.value === '' ? '' : Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                      required
                    >
                      <option value="">Select region</option>
                      {regions.map((r) => (
                        <option key={r.region_id} value={r.region_id}>
                          {r.region_name}
                        </option>
                      ))}
                    </select>
                  </div>


                  {error && (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                      {error}
                    </p>
                  )}

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      disabled={!isStep2Complete}
                      className="w-1/2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {/* ================= STEP 3 ================= */}
              {step === 3 && (
                <>
                  <div>
                    <label
                      htmlFor="gender"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Gender
                    </label>

                    <select
                      id="gender"
                      value={genderId}
                      onChange={(event) =>
                        setGenderId(event.target.value === '' ? '' : Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                      required
                    >
                      <option value="">Select gender</option>
                      {genders.map((g) => (
                        <option key={g.gender_id} value={g.gender_id}>
                          {g.gender_name}
                        </option>
                      ))}
                    </select>
                  </div>


                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        Looking For (Select all that apply)
                      </label>
                      <span className="text-[11px] font-medium text-slate-400">
                        {lookingForGenderIds.length} selected
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {genders.map((g) => {
                        const isSelected = lookingForGenderIds.includes(g.gender_id)
                        return (
                          <button
                            key={g.gender_id}
                            type="button"
                            onClick={() => toggleLookingForGender(g.gender_id)}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 border ${
                              isSelected
                                ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            {isSelected && <span className="mr-1.5 font-bold">✓</span>}
                            {g.gender_name}
                          </button>
                        )
                      })}
                    </div>
                    {lookingForGenderIds.length === 0 && (
                      <p className="mt-1.5 text-[11px] text-amber-600">
                        Please choose at least one gender preference.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="interests"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Your interests (up to 5, comma-separated)
                    </label>

                    <input
                      id="interests"
                      value={interests}
                      onChange={(event) =>
                        setInterests(event.target.value)
                      }
                      placeholder="e.g. Reading, Music, Coffee"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
                      required
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Enter up to 5 interests separated by commas.
                    </p>
                  </div>

                  {error && (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                      {error}
                    </p>
                  )}

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={!isStep3Complete || isSubmitting}
                      className="w-1/2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200"
                    >
                      {isSubmitting ? 'Creating…' : 'Create account'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          Already have an account?{' '}

          <button
            type="button"
            onClick={() => navigate({ name: 'signin' })}
            className="font-bold text-brand-600 underline-offset-2 hover:underline"
          >
            Log in
          </button>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => navigate({ name: 'landing' })}
              className="mt-2 text-xs font-bold text-brand-500 hover:underline"
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
            <h2 className="mt-4 text-xl font-black text-slate-900">Account Created!</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Your Iskomeet account has been successfully created. Please log in to continue.
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccessModal(false)
                navigate({ name: 'signin' })
              }}
              className="mt-6 w-full rounded-2xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
            >
              Go to Log in
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
            <h2 className="mt-4 text-xl font-black text-slate-900">Registration Failed</h2>
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
