'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import type { User } from '@supabase/supabase-js'
import { Category } from '@/app/types'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [])

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true })
        
        if (data) {
          setCategories(data as Category[])
        }
      } catch (err) {
        console.error('Kategoriler yüklenirken hata:', err)
      }
    }
    loadCategories()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center">
        <p className="text-zinc-400">Yükleniyor...</p>
      </div>
    )
  }

  // Emoji haritası kategoriler için
  const categoryEmojis: Record<string, string> = {
    'giyim': '👕',
    'ev dekorasyon': '🏠',
    'hediyelik': '🎀',
    'dijital': '💻',
    'aksesuar': '⌚',
    'elektronik': '📱',
    'spor': '⚽',
    'kitap': '📚',
  }

  const getCategoryEmoji = (name: string): string => {
    const lowerName = name.toLowerCase()
    for (const [key, emoji] of Object.entries(categoryEmojis)) {
      if (lowerName.includes(key)) return emoji
    }
    return '📂'
  }

  // Gradient colorlar kategori kartları için
  const categoryGradients = [
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-red-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-indigo-500 to-purple-500',
    'from-red-500 to-pink-500',
    'from-teal-500 to-blue-500',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        <div className="text-center space-y-6">
          {/* Main Title */}
          <div>
            <h2 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Hoş Geldiniz TC Gift Shop'a
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Özel hediyelik ürünleri, giyim ve dekorasyon ürünlerinin en geniş koleksiyonu burada. En kaliteli ürünleri en iyi fiyatlarla sunuyoruz.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
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
        </div>

        {/* Product Categories Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-4xl font-bold">📂 Kategoriler</h3>
            <Link
              href="/products"
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-semibold rounded-lg transition text-sm"
            >
              Tüm Ürünleri Gör →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* "Tüm Ürünler" Kartı */}
            <Link
              href="/products"
              className="group relative overflow-hidden rounded-xl border border-zinc-800 p-8 bg-gradient-to-br from-zinc-800 to-zinc-900 hover:border-zinc-600 transition"
            >
              <div className="relative z-10">
                <div className="text-5xl mb-4 group-hover:scale-110 transition">✨</div>
                <h4 className="text-2xl font-bold text-white mb-2">Tüm Ürünler</h4>
                <p className="text-zinc-400 text-sm">Koleksiyonumuzun tamamına göz atın</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-violet-500/0 group-hover:from-pink-500/10 group-hover:to-violet-500/10 transition" />
            </Link>

            {/* Kategori Kartları */}
            {categories.map((category, idx) => {
              const gradient = categoryGradients[idx % categoryGradients.length]
              const emoji = getCategoryEmoji(category.name)
              
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className={`group relative overflow-hidden rounded-xl border border-zinc-800 p-8 bg-gradient-to-br ${gradient} hover:shadow-lg transition`}
                >
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />
                  <div className="relative z-10">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition">{emoji}</div>
                    <h4 className="text-xl font-bold text-white mb-1 group-hover:translate-x-1 transition">{category.name}</h4>
                    <p className="text-white/70 text-sm opacity-0 group-hover:opacity-100 transition">Kategoriye git →</p>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* CTA Button */}
          {!user && (
            <div className="bg-gradient-to-r from-pink-500/10 to-violet-500/10 border border-pink-500/20 rounded-xl p-8 text-center space-y-4">
              <h4 className="text-2xl font-bold">Alışverişe Başlamaya Hazır mısınız?</h4>
              <p className="text-zinc-400">Giriş yaparak favori ürünlerinizi sepetinize ekleyin</p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/auth/login"
                  className="px-6 py-3 border border-pink-500 text-pink-400 hover:bg-pink-500/10 rounded-lg font-semibold transition"
                >
                  🔐 Giriş Yap
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white hover:opacity-90 rounded-lg font-semibold transition"
                >
                  ✍️ Kayıt Ol
                </Link>
              </div>
            </div>
          )}
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

