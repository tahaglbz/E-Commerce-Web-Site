'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import { getLocalCart } from '@/app/utils/cartUtils'
import { Category, SubCategory } from '@/app/types'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  // hover edilen kategori id'si
  const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase])

  // Kategorileri yükle
  useEffect(() => {
    async function loadCategories() {
      try {
        const [{ data: catsData }, { data: subCatsData }] = await Promise.all([
          supabase.from('categories').select('*').order('name', { ascending: true }),
          supabase.from('sub_categories').select('*').order('name', { ascending: true }),
        ])
        if (catsData) setCategories(catsData as Category[])
        if (subCatsData) setSubCategories(subCatsData as SubCategory[])
      } catch (err) {
        console.error('Kategoriler yüklenirken hata:', err)
      }
    }
    loadCategories()
  }, [])

  const getInitial = (email?: string) => {
    if (!email) return '?'
    return email.charAt(0).toUpperCase()
  }

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

  const updateCartCount = useCallback(async () => {
    const localItems = getLocalCart()
    const localCount = localItems.reduce((sum, item) => sum + item.quantity, 0)

    let dbCount = 0
    if (user) {
      const { data } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id)
      if (data) {
        dbCount = data.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)
      }
    }

    setCartCount(localCount + dbCount)
  }, [user, supabase])

  useEffect(() => {
    updateCartCount()
    window.addEventListener('storage', () => updateCartCount())
    const interval = setInterval(updateCartCount, 3000)
    return () => {
      window.removeEventListener('storage', () => updateCartCount())
      clearInterval(interval)
    }
  }, [updateCartCount])

  // Hover handlers — slight delay prevents accidental close
  function handleCategoryMouseEnter(catId: number) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHoveredCategoryId(catId)
  }

  function handleCategoryMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategoryId(null)
    }, 150)
  }

  function handleDropdownMouseEnter() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
  }

  function handleDropdownMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategoryId(null)
    }, 150)
  }

  function CartButton() {
    return (
      <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-zinc-800 transition group">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-zinc-300 group-hover:text-pink-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center bg-pink-500 text-white text-[11px] font-bold rounded-full px-1 shadow-lg shadow-pink-500/40 ring-2 ring-zinc-900">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </Link>
    )
  }

  const hoveredCatSubs = hoveredCategoryId
    ? subCategories.filter(sc => sc.category_id === hoveredCategoryId)
    : []

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top Bar */}
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent hover:opacity-80 transition">
            🎁 TC Gift Shop
          </Link>

          {/* Desktop Navigation — Category Hover Dropdown */}
          <div className="hidden sm:flex items-center gap-1">
            {/* Ürünler — ana dropdown trigger */}
            <div className="relative">
              <Link
                href="/products"
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition flex items-center gap-1"
              >
                🛍️ Ürünler
              </Link>
            </div>

            {/* Kategori hover menüsü */}
            <div className="relative flex items-center gap-1">
              {categories.map(cat => {
                const catSubs = subCategories.filter(sc => sc.category_id === cat.id)
                const isHovered = hoveredCategoryId === cat.id
                return (
                  <div
                    key={cat.id}
                    className="relative"
                    onMouseEnter={() => handleCategoryMouseEnter(cat.id)}
                    onMouseLeave={handleCategoryMouseLeave}
                  >
                    <Link
                      href={`/products?category=${cat.id}`}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap flex items-center gap-1 ${isHovered
                          ? 'text-pink-400 bg-zinc-800'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                    >
                      {cat.name}
                      {catSubs.length > 0 && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`w-3 h-3 transition-transform duration-200 ${isHovered ? 'rotate-180 text-pink-400' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </Link>

                    {/* Dropdown Panel */}
                    {isHovered && catSubs.length > 0 && (
                      <div
                        className="absolute top-full left-0 mt-1 min-w-[200px] bg-zinc-950 border border-zinc-700/80 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-150"
                        onMouseEnter={handleDropdownMouseEnter}
                        onMouseLeave={handleDropdownMouseLeave}
                      >
                        {/* Header */}
                        <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{cat.name}</p>
                        </div>
                        {/* Alt kategori linkleri */}
                        <div className="py-1">
                          <Link
                            href={`/products?category=${cat.id}`}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition group"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-pink-500 transition" />
                            Tümünü Gör
                          </Link>
                          {catSubs.map(sub => (
                            <Link
                              key={sub.id}
                              href={`/products?category=${cat.id}&sub=${sub.id}`}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition group"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-violet-500 transition" />
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <Link href="/contact" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
              📞 İletişim
            </Link>
          </div>

          {/* Right section */}
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <CartButton />
              <div id="profile-dropdown" className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition">
                    {getInitial(user.email)}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs text-zinc-400">Hesabım</span>
                    <span className="text-sm font-semibold text-white">{user.email?.split('@')[0]}</span>
                  </div>
                  <span className={`ml-1 transition duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
                      <p className="text-xs text-zinc-500 uppercase font-semibold">Giriş yapılan hesap</p>
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                    >
                      <span>👤</span> Profilim ve Siparişlerim
                    </Link>

                    <Link
                      href="/contact"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition border-t border-zinc-800"
                    >
                      <span>📞</span> İletişim
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
            <div className="flex gap-2 items-center">
              <CartButton />
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
      </div>

      {/* Products sayfasında URL'den gelen sub category parametresini de oku */}

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
