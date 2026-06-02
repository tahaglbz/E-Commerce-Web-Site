'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import { Product, Category, ProductVariant, SubCategory } from '@/app/types'

// ── Renk Kodu Haritası (varyant rengine göre CSS rengi) ──────────
const COLOR_MAP: Record<string, string> = {
  'siyah': '#18181b', 'beyaz': '#f4f4f5', 'kırmızı': '#ef4444',
  'mavi': '#3b82f6', 'lacivert': '#1e3a5f', 'yeşil': '#22c55e',
  'sarı': '#eab308', 'turuncu': '#f97316', 'mor': '#a855f7',
  'pembe': '#ec4899', 'gri': '#71717a', 'kahverengi': '#92400e',
  'bej': '#d4b896', 'bordo': '#881337', 'turkuaz': '#06b6d4',
  'haki': '#6b7a3d', 'krem': '#fef3c7', 'antrasit': '#3f3f46',
}

function getColorHex(colorName: string): string | null {
  const normalized = colorName.toLowerCase().trim()
  return COLOR_MAP[normalized] ?? null
}

// ── Varyant Renk Gösterimi (Kartın altında) ──────────────────────
function VariantSwatches({ variants }: { variants: ProductVariant[] }) {
  const uniqueColors = variants.reduce<Array<{ color: string; imageUrl: string | null }>>((acc, v) => {
    if (v.color && !acc.find(c => c.color === v.color)) {
      acc.push({ color: v.color, imageUrl: v.color_image_url })
    }
    return acc
  }, [])

  if (uniqueColors.length === 0) return null

  const maxShow = 5
  const remaining = uniqueColors.length - maxShow

  return (
    <div className="flex items-center gap-1.5 mt-2">
      {uniqueColors.slice(0, maxShow).map((c) => {
        const hex = getColorHex(c.color)
        return c.imageUrl ? (
          <img
            key={c.color}
            src={c.imageUrl}
            alt={c.color}
            title={c.color}
            className="w-6 h-6 rounded-full object-cover border-2 border-zinc-700 hover:border-pink-500 transition cursor-pointer"
          />
        ) : hex ? (
          <div
            key={c.color}
            title={c.color}
            className="w-6 h-6 rounded-full border-2 border-zinc-700 hover:border-pink-500 transition cursor-pointer"
            style={{ backgroundColor: hex }}
          />
        ) : (
          <span
            key={c.color}
            title={c.color}
            className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700"
          >
            {c.color}
          </span>
        )
      })}
      {remaining > 0 && (
        <span className="text-[10px] text-zinc-500 font-medium">+{remaining}</span>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null)
  const [priceFilter, setPriceFilter] = useState<{ min: number; max: number } | null>(null)

  // URL'den category parametresini al
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      setSelectedCategory(parseInt(categoryParam))
    }
  }, [searchParams])

  // Veri yükle
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [{ data: productsData }, { data: categoriesData }, { data: subcategoriesData }, { data: variantsData }] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('name', { ascending: true }),
          supabase.from('sub_categories').select('*').order('name', { ascending: true }),
          supabase.from('product_variants').select('*'),
        ])

        if (productsData) setProducts(productsData as Product[])
        if (categoriesData) setCategories(categoriesData as Category[])
        if (subcategoriesData) setSubCategories(subcategoriesData as SubCategory[])
        if (variantsData) setVariants(variantsData as ProductVariant[])
      } catch (err) {
        console.error('Veri yükleme hatası:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Seçili kategoriye ait alt kategorileri getir
  const filteredSubCategories = selectedCategory
    ? subCategories.filter(sc => sc.category_id === selectedCategory)
    : []

  // Filtreleme mantığı
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory
    const matchesSubCategory = selectedSubCategory === null || product.sub_category_id === selectedSubCategory
    const matchesPrice = !priceFilter || (product.price >= priceFilter.min && product.price <= priceFilter.max)
    return matchesSearch && matchesCategory && matchesSubCategory && matchesPrice
  })

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      {/* Breadcrumb Navigation */}
      {selectedCategory && (
        <div className="bg-zinc-900/30 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
            <Link href="/products" className="text-zinc-400 hover:text-white transition">
              📂 Tüm Kategoriler
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-pink-400 font-semibold">{selectedCategoryName}</span>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün adı ile ara..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 transition"
              />
            </div>

            {/* Filter Selects */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Kategori */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => {
                  setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)
                  setSelectedSubCategory(null)
                }}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 transition"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Alt Kategori */}
              {filteredSubCategories.length > 0 && (
                <select
                  value={selectedSubCategory || ''}
                  onChange={(e) => setSelectedSubCategory(e.target.value ? parseInt(e.target.value) : null)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 transition"
                >
                  <option value="">Tüm Alt Kategoriler</option>
                  {filteredSubCategories.map((subcat) => (
                    <option key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Temizle Butonu */}
              {(selectedCategory || selectedSubCategory || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSelectedSubCategory(null)
                    setSearchTerm('')
                  }}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition"
                >
                  ✕ Temizle
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Sonuç sayısı ve breadcrumb */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-zinc-500">
                <span className="text-zinc-300 font-semibold">{filteredProducts.length}</span> ürün listeleniyor
              </p>
              {selectedSubCategory && (
                <p className="text-xs text-zinc-400 mt-1">
                  Alt Kategori: <span className="text-pink-400">{subCategories.find(s => s.id === selectedSubCategory)?.name}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
            <p className="text-zinc-400 text-sm">Ürünler yükleniyor...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-zinc-400 text-lg">Aranan kriterlere uygun ürün bulunamadı.</p>
            <Link
              href="/products"
              className="inline-block mt-6 px-6 py-2 bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold rounded-lg hover:opacity-90 transition"
            >
              Tüm Ürünleri Gör
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const productVariants = variants.filter(v => v.product_id === product.id)
              return (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-pink-500/50 transition-all duration-300 group cursor-pointer h-full flex flex-col hover:shadow-lg hover:shadow-pink-500/5">
                    {/* Image Container */}
                    <div className="relative w-full aspect-square bg-zinc-950 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
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

                      {/* Out of Stock Overlay */}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <p className="text-white font-bold text-lg">Tükendi</p>
                        </div>
                      )}

                      {/* Discount Badge */}
                      {product.is_discount_active && product.discount_price && (
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          🎉 İndirim
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 text-zinc-100 mb-2 group-hover:text-pink-400 transition">
                        {product.title}
                      </h3>

                      {/* Price Section */}
                      <div className="flex items-baseline gap-2 mb-2">
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
                      <div className="text-[11px] text-violet-400 bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20 w-fit mb-1">
                        {categories.find((c) => c.id === product.category_id)?.name || 'Genel'}
                      </div>

                      {/* Variant Swatches */}
                      {productVariants.length > 0 && (
                        <VariantSwatches variants={productVariants} />
                      )}
                    </div>

                    {/* Button */}
                    <button
                      disabled={product.stock === 0}
                      className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 transition"
                    >
                      {product.stock === 0 ? 'Tükendi' : 'Detayları Gör'}
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
