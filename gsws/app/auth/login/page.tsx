'use client'

import { useState, FormEvent, useEffect, Suspense } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { syncLocalCartToSupabase, getLocalCartCount } from '@/app/utils/cartUtils'

// ── İç bileşen: useSearchParams burada kullanılıyor ──────────────
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const returnTo = searchParams.get('returnTo') || '/products'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLocalCart, setHasLocalCart] = useState(false)

  // Misafir sepetinde ürün var mı kontrol et
  useEffect(() => {
    setHasLocalCart(getLocalCartCount() > 0)
  }, [])

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Lütfen email ve şifrenizi girin.')
      return
    }

    setLoading(true)

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        setError(loginError.message)
      } else if (data.user) {
        // ── Giriş başarılı: LocalStorage sepetini Supabase'e senkronize et ──
        await syncLocalCartToSupabase(data.user.id)
        router.push(returnTo)
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ── Google OAuth ────────────────────────────────────────────────
  async function handleGoogleLogin() {
    setError(null)
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
        },
      })
      if (error) {
        setError(error.message)
        setGoogleLoading(false)
      }
      // Başarılı → Google OAuth sayfasına yönlendirilir, sayfa ayrılır
    } catch (err) {
      setError('Google ile giriş başlatılamadı.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent mb-2">
            🎁 TC Gift Shop
          </h1>
          <p className="text-zinc-400 text-sm">Hesabınıza Giriş Yapın</p>
        </div>

        {/* Misafir Sepet Bildirimi */}
        {hasLocalCart && (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
            <span className="text-2xl">🛒</span>
            <div>
              <p className="text-amber-400 text-sm font-semibold">Sepetinizde ürün var!</p>
              <p className="text-amber-400/70 text-xs">Giriş yaptıktan sonra misafir sepetiniz otomatik olarak kaydedilecektir.</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </p>
            </div>
          )}

          {/* ── Google ile Giriş ── */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-800 font-semibold text-sm py-3 rounded-xl transition duration-200 border border-gray-200 shadow-sm mb-5"
          >
            {googleLoading ? (
              <span className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-gray-800 animate-spin" />
            ) : (
              /* Google SVG icon */
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? 'Yönlendiriliyor...' : 'Google ile Giriş Yap'}
          </button>

          {/* Ayraç */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600 font-medium">veya e-posta ile</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2 tracking-wide">
                📧 Email Adres
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

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                  🔐 Şifre
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-pink-500 hover:text-pink-400 font-medium transition"
                >
                  Şifremi Unuttum
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 transition"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-lg transition duration-200 mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {hasLocalCart ? 'Giriş & Sepet senkronize ediliyor...' : 'Giriş Yapılıyor...'}
                </>
              ) : (
                <>
                  <span>🚀</span> Giriş Yap
                </>
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center border-t border-zinc-800 pt-6">
            <p className="text-zinc-400 text-sm">
              Henüz hesabın yok mu?{' '}
              <Link
                href={`/auth/signup${returnTo !== '/products' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                className="text-pink-500 hover:text-pink-400 font-semibold transition"
              >
                Kaydol
              </Link>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg text-center">
          <p className="text-xs text-zinc-400 mb-1">🎯 Misafir Alışveriş</p>
          <p className="text-xs text-zinc-500">
            Sepete ürün eklemek için giriş yapmanıza gerek yok. Ödeme aşamasında giriş yapmanız yeterli.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Dışa aktarılan sayfa: Suspense wrapper ile ────────────────────
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
