'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center">
        <p className="text-zinc-400">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          {/* Main Title */}
          <div>
            <h2 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Hoş Geldiniz TC Gift Shop'a
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Özel hediyelik ürünleri, giyim ve dekorasyon ürünlerinin en geniş koleksiyonu burada. En kaliteli ürünleri en iyi fiyatlarla sunuyoruz.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-pink-500 transition">
              <p className="text-4xl mb-3">🎁</p>
              <h3 className="text-xl font-bold mb-2">Geniş Ürün Yelpazesi</h3>
              <p className="text-zinc-400">Binlerce kaliteli ürün arasından seçim yapın</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-pink-500 transition">
              <p className="text-4xl mb-3">💰</p>
              <h3 className="text-xl font-bold mb-2">Uygun Fiyatlar</h3>
              <p className="text-zinc-400">Sürekli indirimsiz ve promosyonlu ürünler</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-pink-500 transition">
              <p className="text-4xl mb-3">🚀</p>
              <h3 className="text-xl font-bold mb-2">Hızlı Hizmet</h3>
              <p className="text-zinc-400">Siparişleriniz hızlı şekilde işlenir</p>
            </div>
          </div>

          {/* Product Categories */}
          <div className="mt-16">
            <h3 className="text-3xl font-bold mb-8">📂 Ürün Kategorileri</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Ev Dekorasyon', emoji: '🏠', color: 'from-blue-500' },
                { name: 'Giyim', emoji: '👕', color: 'from-pink-500' },
                { name: 'Hediyelik', emoji: '🎀', color: 'from-purple-500' },
                { name: 'Dijital Ürün', emoji: '💻', color: 'from-green-500' },
              ].map((cat) => (
                <div
                  key={cat.name}
                  className={`bg-gradient-to-br ${cat.color} to-transparent rounded-xl p-6 border border-zinc-800 hover:border-zinc-600 transition cursor-pointer`}
                >
                  <p className="text-4xl mb-2">{cat.emoji}</p>
                  <p className="font-semibold text-white">{cat.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-16">
            {user ? (
              <Link
                href="/products"
                className="inline-block px-10 py-4 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-bold text-lg rounded-xl transition duration-200"
              >
                🛍️ Alışverişe Başla
              </Link>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-zinc-400 mb-6">Alışverişe başlamak için lütfen giriş yapınız veya kaydolunuz</p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/auth/login"
                    className="inline-block px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition"
                  >
                    🔐 Giriş Yap
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-bold rounded-xl transition"
                  >
                    ✨ Yeni Hesap Oluştur
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-zinc-500 text-sm">
          <p>© 2026 TC Gift Shop. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}

