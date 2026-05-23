'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import { Product, ProductVariant, Category } from '@/app/types'

export default function ProductDetail() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [user, setUser] = useState<any>(null)
  const [addingToCart, setAddingToCart] = useState(false)

  // Ürün verilerini yükle
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const { data: user } = await supabase.auth.getUser()
        setUser(user.user)

        const [{ data: productData }, { data: variantsData }, { data: categoriesData }] = await Promise.all([
          supabase.from('products').select('*').eq('id', productId).single(),
          supabase.from('product_variants').select('*').eq('product_id', productId),
          supabase.from('categories').select('*'),
        ])

        if (productData) setProduct(productData as Product)
        if (variantsData) setVariants(variantsData as ProductVariant[])
        if (categoriesData) setCategories(categoriesData as Category[])
      } catch (err) {
        console.error('Veri yükleme hatası:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [productId])

  // Varyant gruplarını oluştur (type'a göre)
  const variantTypes = Array.from(new Set(variants.map((v) => v.variant_type)))
  const variantsByType: Record<string, ProductVariant[]> = {}
  variantTypes.forEach((type) => {
    variantsByType[type] = variants.filter((v) => v.variant_type === type)
  })

  // Sepete ekle
  async function handleAddToCart() {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Seçilmiş varyantları kontrol et
    for (const type of variantTypes) {
      if (!selectedVariants[type]) {
        alert(`Lütfen ${type} seçiniz`)
        return
      }
    }

    setAddingToCart(true)
    try {
      const { error } = await supabase.from('cart_items').insert([
        {
          user_id: user.id,
          product_id: parseInt(productId),
          quantity,
          selected_variants: selectedVariants,
        },
      ])

      if (error) {
        alert('Sepete eklenirken hata oluştu: ' + error.message)
      } else {
        alert('✅ Ürün sepete eklendi!')
        setQuantity(1)
        setSelectedVariants({})
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Yükleniyor...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400 text-lg">Ürün bulunamadı</p>
        <Link href="/products" className="text-pink-500 hover:text-pink-400">
          ← Ürünlere Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900/50 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/products" className="text-pink-500 hover:text-pink-400 text-sm font-medium">
            ← Ürünlere Dön
          </Link>
          <Link href="/cart" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition">
            🛒 Sepet
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="flex flex-col gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl aspect-square flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl">🖼️</div>
              )}
            </div>

            {/* Badges */}
            <div className="flex gap-3">
              {product.stock <= 5 && product.stock > 0 && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg px-4 py-2 flex items-center gap-2">
                  <span className="animate-pulse">⚠️</span>
                  <span className="text-red-400 font-semibold text-sm">Son {product.stock} Ürün!</span>
                </div>
              )}
              {product.stock === 0 && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg px-4 py-2">
                  <span className="text-red-400 font-semibold text-sm">🔴 Tükendi</span>
                </div>
              )}
              {product.is_discount_active && product.discount_price && (
                <div className="bg-emerald-500/10 border border-emerald-500 rounded-lg px-4 py-2">
                  <span className="text-emerald-400 font-semibold text-sm">🎉 İndirim Aktif</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col gap-8">
            {/* Title & Category */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">{product.title}</h1>
              <p className="text-zinc-400 text-base leading-relaxed">{product.description}</p>

              {product.category_id && (
                <div className="mt-4">
                  <span className="inline-block text-xs font-semibold text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                    📂 {categories.find((c) => c.id === product.category_id)?.name}
                  </span>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-baseline gap-4">
                {product.is_discount_active && product.discount_price ? (
                  <>
                    <p className="text-5xl font-bold text-emerald-400">
                      {product.discount_price.toFixed(2)} ₺
                    </p>
                    <p className="text-2xl text-zinc-500 line-through">
                      {product.price.toFixed(2)} ₺
                    </p>
                  </>
                ) : (
                  <p className="text-5xl font-bold text-white">{product.price.toFixed(2)} ₺</p>
                )}
              </div>
              {product.is_discount_active && product.discount_price && (
                <p className="text-sm text-emerald-400 mt-3 font-medium">
                  💰 {Math.round(((product.price - product.discount_price) / product.price) * 100)}% indirim
                </p>
              )}
            </div>

            {/* Variants Selection */}
            {variantTypes.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
                <h3 className="font-semibold text-lg text-white">🎨 Seçenekler</h3>
                {variantTypes.map((type) => (
                  <div key={type}>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      {type === 'SIZE' ? '📏 Beden' : type === 'COLOR' ? '🎨 Renk' : type}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variantsByType[type].map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() =>
                            setSelectedVariants({
                              ...selectedVariants,
                              [type]: variant.variant_value,
                            })
                          }
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                            selectedVariants[type] === variant.variant_value
                              ? 'bg-pink-500 text-white border-pink-500'
                              : 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-pink-500'
                          }`}
                        >
                          {variant.variant_value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Selection */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <label className="block text-sm font-medium text-zinc-300 mb-3">📦 Adet</label>
              <div className="flex items-center gap-3 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-pink-500 transition font-bold"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg text-center font-bold text-white"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-pink-500 transition font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addingToCart || variantTypes.length > 0 && Object.keys(selectedVariants).length !== variantTypes.length}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl transition duration-200"
            >
              {addingToCart ? (
                <>⏳ Ekleniyor...</>
              ) : product.stock === 0 ? (
                <>🔴 Tükendi</>
              ) : (
                <>🛒 Sepete Ekle</>
              )}
            </button>

            {/* Stock Info */}
            <p className={`text-sm font-medium text-center ${product.stock > 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {product.stock > 0 ? `✅ ${product.stock} adet stokta mevcuttur` : '🔴 Bu ürün şu anda stokta yok'}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
