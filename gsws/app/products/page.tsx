'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import { Product, Category } from '@/app/types'

export default function ProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  // Ürünleri ve kategorileri yükle
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [{ data: productsData }, { data: categoriesData }] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('name', { ascending: true }),
        ])

        if (productsData) setProducts(productsData as Product[])
        if (categoriesData) setCategories(categoriesData as Category[])
      } catch (err) {
        console.error('Veri yükleme hatası:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtreleme mantığı
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              🎁 TC Gift Shop
            </Link>
            <div className="flex gap-4">
              <Link href="/cart" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition">
                🛒 Sepet
              </Link>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Ürün adı ile ara..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
            />
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-zinc-400">Ürünler yükleniyor...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-lg">Aranan kriterlere uygun ürün bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-pink-500 transition group cursor-pointer h-full flex flex-col">
                  {/* Image Container */}
                  <div className="relative w-full aspect-square bg-zinc-950 overflow-hidden">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-zinc-800">
                        🖼️
                      </div>
                    )}

                    {/* Stock Warning Badge */}
                    {product.stock <= 5 && product.stock > 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full border-2 border-red-400 animate-pulse">
                        ⚠️ {product.stock} kaldı!
                      </div>
                    )}

                    {/* Out of Stock Badge */}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <p className="text-white font-bold text-lg">Tükendi</p>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {product.is_discount_active && product.discount_price && (
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        🎉 İndirim
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 text-zinc-100 mb-3 group-hover:text-pink-400 transition">
                      {product.title}
                    </h3>

                    {/* Price Section */}
                    <div className="flex items-baseline gap-2 mb-3">
                      {product.is_discount_active && product.discount_price ? (
                        <>
                          <p className="text-lg font-bold text-emerald-400">
                            {product.discount_price.toFixed(2)} ₺
                          </p>
                          <p className="text-xs text-zinc-500 line-through">
                            {product.price.toFixed(2)} ₺
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-white">
                          {product.price.toFixed(2)} ₺
                        </p>
                      )}
                    </div>

                    {/* Category Badge */}
                    <div className="text-[11px] text-violet-400 bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20 w-fit">
                      {categories.find((c) => c.id === product.category_id)?.name || 'Genel'}
                    </div>
                  </div>

                  {/* Button */}
                  <button
                    disabled={product.stock === 0}
                    className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2 transition"
                  >
                    {product.stock === 0 ? 'Tükendi' : 'Detayları Gör'}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
