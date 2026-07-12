import { useEffect, useState } from 'react'

export default function DemoForm({ open, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return

    setSubmitted(false)
    setName('')
    setEmail('')
    setPhone('')

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.2)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-form-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Book a demo</p>
            <h2 id="demo-form-title" className="mt-3 text-2xl font-semibold text-ink">
              We’ll get back to you soon.
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-6">
          {submitted ? (
            <div className="rounded-3xl border border-green-200 bg-emerald-50 p-6 text-center">
              <p className="text-lg font-semibold text-ink">Thanks for reaching out!</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                We will get in touch with you soon with the next steps.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} action="https://send.pageclip.co/XqysqrSeABXPkbWHcEsNuhBU4g7CD9Pt/contactForm" className="space-y-5" method="post">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="demo-name">
                  Name
                </label>
                <input
                  id="demo-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="demo-email">
                  Email
                </label>
                <input
                  id="demo-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="demo-phone">
                  Contact number
                </label>
                <input
                  id="demo-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="(123) 456-7890"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-teal-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-button transition hover:brightness-110"
              >
                Submit request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
