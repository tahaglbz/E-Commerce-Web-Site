'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Supabase magic link / recovery token'ı hash'ten işle
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true)
      }
    })

    // Token zaten geçerliyse
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!password || password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.')
      return
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    } catch {
      setError('Şifre güncellenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  // Şifre gücü
  function getPasswordStrength(pwd: string): { label: string; color: string; width: string } {
    if (!pwd) return { label: '', color: 'bg-zinc-800', width: 'w-0' }
    if (pwd.length < 6) return { label: 'Çok Zayıf', color: 'bg-red-500', width: 'w-1/4' }
    if (pwd.length < 8) return { label: 'Zayıf', color: 'bg-orange-500', width: 'w-2/4' }
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Orta', color: 'bg-amber-500', width: 'w-3/4' }
    return { label: 'Güçlü 💪', color: 'bg-emerald-500', width: 'w-full' }
  }

  const strength = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent mb-2 inline-block">
            🎁 TC Gift Shop
          </Link>
          <p className="text-zinc-400 text-sm mt-1">Yeni Şifre Oluştur</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">

          {success ? (
            /* ── Başarı ── */
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Şifreniz Güncellendi!</h2>
              <p className="text-zinc-400 text-sm mb-2">Yeni şifrenizle giriş yapabilirsiniz.</p>
              <p className="text-zinc-500 text-xs mb-8">3 saniye içinde giriş sayfasına yönlendiriliyorsunuz...</p>
              <div className="w-8 h-8 mx-auto rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {/* İkon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30 flex items-center justify-center">
                  <span className="text-3xl">🔒</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white text-center mb-2">Yeni Şifre Belirle</h2>
              <p className="text-zinc-400 text-sm text-center mb-6">
                Güçlü bir şifre seçin. En az 8 karakter, büyük harf ve rakam içermesini öneririz.
              </p>

              {/* Session uyarısı */}
              {!sessionReady && (
                <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-400 text-sm">⏳ Oturum doğrulanıyor...</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Yeni Şifre */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2 tracking-wide">
                    🔐 Yeni Şifre
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="En az 8 karakter"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 pr-12 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 transition"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition text-lg"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>

                  {/* Şifre gücü göstergesi */}
                  {password && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{strength.label}</p>
                    </div>
                  )}
                </div>

                {/* Şifre Tekrar */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2 tracking-wide">
                    🔐 Şifre Tekrar
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    className={`w-full bg-zinc-950 border rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : confirmPassword && confirmPassword === password
                        ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                        : 'border-zinc-800 focus:border-pink-500 focus:ring-pink-500/20'
                    }`}
                    disabled={loading}
                  />
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs text-emerald-400 mt-1">✅ Şifreler eşleşiyor</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !sessionReady}
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>🔒 Şifremi Güncelle</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
