'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import { getLocalCart } from '@/app/utils/cartUtils'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()

    // Auth state değişikliklerini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase])

  // Profil avatarının baş harfi
  const getInitial = (email?: string) => {
    if (!email) return '?'
    return email.charAt(0).toUpperCase()
  }

  // Dropdown'ı kapat (klik dışında)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById('profile-dropdown')
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Sepet sayısını takip et
  useEffect(() => {
    function updateCartCount() {
      const localItems = getLocalCart()
      const localCount = localItems.reduce((sum, item) => sum + item.quantity, 0)
      setCartCount(localCount)
    }
    updateCartCount()
    // localStorage değişikliklerini dinle
    window.addEventListener('storage', updateCartCount)
    // Periyodik kontrol (aynı tab'da localStorage event tetiklenmez)
    const interval = setInterval(updateCartCount, 2000)
    return () => {
      window.removeEventListener('storage', updateCartCount)
      clearInterval(interval)
    }
  }, [])

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent hover:opacity-80 transition">
          🎁 TC Gift Shop
        </Link>

        {/* Right section - Auth buttons or Profile */}
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : user ? (
          // Kullanıcı giriş yaptıysa: Sepet + Avatar + Dropdown
          <div className="flex items-center gap-1">
            {/* Sepet Butonu */}
            <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-zinc-800 transition">
              <span className="text-lg">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-pink-500 text-white text-xs font-bold rounded-full px-1 shadow-lg shadow-pink-500/30 animate-pulse">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <div id="profile-dropdown" className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 transition group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition">
                {getInitial(user.email)}
              </div>
              {/* Email (sadece desktop'ta) */}
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs text-zinc-400">Hesabım</span>
                <span className="text-sm font-semibold text-white">{user.email?.split('@')[0]}</span>
              </div>
              {/* Dropdown arrow */}
              <span className={`ml-1 transition duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
                  <p className="text-xs text-zinc-500 uppercase font-semibold">Giriş yapılan hesap</p>
                  <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                </div>

                {/* Menu Items */}
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                >
                  <span>👤</span> Profilim
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition border-t border-zinc-800"
                >
                  <span>📦</span> Siparişlerim
                </Link>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    setIsDropdownOpen(false)
                    router.push('/')
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition border-t border-zinc-800"
                >
                  <span>🚪</span> Çıkış Yap
                </button>
              </div>
            )}
            </div>
          </div>
        ) : (
          // Kullanıcı giriş yapmadıysa: Login/Signup butonları
          <div className="flex gap-2 items-center">
            {/* Sepet Butonu */}
            <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-zinc-800 transition">
              <span className="text-lg">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-pink-500 text-white text-xs font-bold rounded-full px-1 shadow-lg shadow-pink-500/30 animate-pulse">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white border border-zinc-700 hover:border-pink-500 rounded-lg transition"
            >
              🔐 Giriş Yap
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 rounded-lg transition shadow-lg shadow-pink-500/20"
            >
              ✍️ Kayıt Ol
            </Link>
          </div>
        )}
      </div>
      {/* Kargo Duyuru Bandı */}
      <div className="bg-gradient-to-r from-zinc-800 via-zinc-900 to-zinc-800 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
          <span className="text-sm font-medium text-zinc-300">
            🎉 <span className="text-emerald-400 font-bold">1500 TL</span> Üzeri Alışverişlerde <span className="text-emerald-400 font-bold">Kargo Bedava!</span>
          </span>
        </div>
      </div>
    </nav>
  )
}
