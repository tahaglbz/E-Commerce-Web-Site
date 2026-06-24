'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Lütfen e-posta adresinizi girin.')
      return
    }

    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
      } else {
        setSent(true)
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent mb-2 inline-block">
            🎁 TC Gift Shop
          </Link>
          <p className="text-zinc-400 text-sm mt-1">Şifre Sıfırlama</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">

          {sent ? (
            /* ── Başarı Ekranı ── */
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                <span className="text-4xl">📬</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Mail Gönderildi!</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-2">
                <span className="text-emerald-400 font-semibold">{email}</span> adresine şifre sıfırlama bağlantısı gönderildi.
              </p>
              <p className="text-zinc-500 text-xs mb-8">
                Mail gelmezse spam/junk klasörünüzü kontrol edin.
              </p>
              <Link
                href="/auth/login"
                className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-bold rounded-xl transition"
              >
                ← Giriş Sayfasına Dön
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <>
              {/* İkon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-pink-500/30 flex items-center justify-center">
                  <span className="text-3xl">🔑</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white text-center mb-2">Şifremi Unuttum</h2>
              <p className="text-zinc-400 text-sm text-center mb-6 leading-relaxed">
                Hesabınıza bağlı e-posta adresinizi girin. Şifre sıfırlama bağlantısı göndereceğiz.
              </p>

              {/* Error */}
              {error && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2 tracking-wide">
                    📧 E-posta Adresiniz
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 transition"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>✉️ Sıfırlama Maili Gönder</>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-zinc-800 pt-6">
                <Link
                  href="/auth/login"
                  className="text-zinc-400 hover:text-zinc-300 text-sm transition flex items-center justify-center gap-1"
                >
                  ← Giriş sayfasına geri dön
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
