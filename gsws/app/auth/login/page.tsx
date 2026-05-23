'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Validate
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
      } else {
        // Login başarılı
        router.push('/products')
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
      console.error(err)
    } finally {
      setLoading(false)
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
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2 tracking-wide">
                🔐 Şifre
              </label>
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
                  <span className="animate-spin">⏳</span> Giriş Yapılıyor...
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
                href="/auth/signup"
                className="text-pink-500 hover:text-pink-400 font-semibold transition"
              >
                Kaydol
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg text-center">
          <p className="text-xs text-zinc-400 mb-2">🎯 Demo Erişimi</p>
          <p className="text-xs text-zinc-500">Giriş yaparak alışverişe başlayabilirsiniz. Sepet ve siparişleriniz kaydedilecektir.</p>
        </div>
      </div>
    </div>
  )
}
