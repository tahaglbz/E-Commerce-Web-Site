'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import { Product, ProductVariant, Category } from '@/app/types'
import { addToLocalCart, getLocalCartCount } from '@/app/utils/cartUtils'

// ── Kategori Sınıflandırma ────────────────────────────────────────
function getCategoryType(name?: string): 'clothing' | 'decoration' | 'none' {
  if (!name) return 'none'
  const n = name.toLowerCase()
  if (n.includes('giyim') || n.includes('clothing')) return 'clothing'
  if (n.includes('dekorasyon') || n.includes('decoration') || n.includes('ev ')) return 'decoration'
  return 'none'
}

// ── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: {
  message: string; type: 'success' | 'error' | 'info'; onClose: () => void
}) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [onClose])
  const styles: Record<string, string> = {
    success: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300',
    error:   'bg-red-500/10   border-red-500/50   text-red-300',
    info:    'bg-violet-500/10 border-violet-500/50 text-violet-300',
  }
  const icons: Record<string, string> = { success: '✅', error: '❌', info: '🛒' }
  return (
    <div className={`toast-slide-in fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-md ${styles[type]}`}>
      <span className="text-xl">{icons[type]}</span>
      <p className="text-sm font-semibold">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition text-lg leading-none">✕</button>
    </div>
  )
}

// ── Renk Swatch ──────────────────────────────────────────────────
function ColorSwatch({ color, imageUrl, isSelected, outOfStock, onSelect }: {
  color: string; imageUrl: string | null; isSelected: boolean; outOfStock: boolean; onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      title={`${color}${outOfStock ? ' (Tükendi)' : ''}`}
      className={`relative w-[68px] h-[68px] rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 group
        ${isSelected
          ? 'border-pink-500 ring-2 ring-pink-500/40 scale-110 shadow-lg shadow-pink-500/25'
          : outOfStock
          ? 'border-zinc-700 opacity-45 cursor-not-allowed grayscale'
          : 'border-zinc-700 hover:border-zinc-400 hover:scale-105'
        }`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={color} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
          <span className="text-xs text-zinc-300 font-bold">{color.slice(0, 3)}</span>
        </div>
      )}

      {/* Seçili işareti */}
      {isSelected && (
        <div className="absolute inset-0 flex items-end justify-center pb-1 bg-black/10">
          <span className="w-2 h-2 bg-pink-500 rounded-full shadow" />
        </div>
      )}

      {/* Tükendi üstü çizgi */}
      {outOfStock && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[85%] h-0.5 bg-red-500/80 rotate-45" />
        </div>
      )}

      {/* Hover tooltip */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-[10px] font-medium py-1 text-center
        translate-y-full group-hover:translate-y-0 transition-transform duration-200 whitespace-nowrap truncate px-1">
        {color}
      </div>
    </button>
  )
}

// ── Beden / Boyut Butonu ──────────────────────────────────────────
function SizeButton({ label, stock, isSelected, onSelect }: {
  label: string; stock: number; isSelected: boolean; onSelect: () => void
}) {
  const inStock = stock > 0
  const lowStock = stock > 0 && stock <= 5
  return (
    <button
      onClick={() => inStock && onSelect()}
      disabled={!inStock}
      className={`relative min-w-[52px] px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 border-2
        ${isSelected
          ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/25'
          : inStock
          ? 'bg-zinc-950 text-zinc-300 border-zinc-700 hover:border-violet-500/60 hover:text-white'
          : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed opacity-50'
        }`}
    >
      <span className={!inStock ? 'line-through decoration-red-500' : ''}>{label}</span>
      {!inStock && <span className="block text-[10px] font-normal text-zinc-600 mt-0.5">Yok</span>}
      {lowStock && inStock && (
        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
          <span className="animate-ping absolute h-3 w-3 rounded-full bg-amber-400 opacity-75" />
          <span className="relative h-3 w-3 rounded-full bg-amber-400" />
        </span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// ANA ÜRÜN DETAY SAYFASI
// ─────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams()
  const supabase = createClient()
  const productId = params.id as string

  // ── Veri ─────────────────────────────────────────────────────────
  const [product, setProduct]     = useState<Product | null>(null)
  const [variants, setVariants]   = useState<ProductVariant[]>([])
  const [category, setCategory]   = useState<Category | null>(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)

  // ── Seçim ────────────────────────────────────────────────────────
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize]   = useState<string | null>(null)
  const [quantity, setQuantity]           = useState(1)

  // ── UI ───────────────────────────────────────────────────────────
  const [user, setUser]           = useState<{ id: string } | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)
  const [toast, setToast]         = useState<{ message: string; type: 'success'|'error'|'info' } | null>(null)
  const [mainImgKey, setMainImgKey] = useState(0) // değişince fade animasyonu tetikler

  const showToast = useCallback((message: string, type: 'success'|'error'|'info') => {
    setToast({ message, type })
  }, [])

  // ── Veri Yükleme ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: userData } = await supabase.auth.getUser()
        setUser(userData.user ? { id: userData.user.id } : null)
        setCartCount(getLocalCartCount())

        const [{ data: productData, error: pErr }, { data: variantsData }] = await Promise.all([
          supabase
            .from('products')
            .select('*, categories(id, name)')
            .eq('id', productId)
            .single(),
          supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .order('color', { ascending: true })
            .order('size_or_dimension', { ascending: true }),
        ])

        if (pErr || !productData) { setNotFound(true); return }

        const { categories: catRaw, ...prod } = productData as Product & { categories?: Category }
        setProduct(prod as Product)
        if (catRaw) setCategory(catRaw)

        const vList = (variantsData ?? []) as ProductVariant[]
        setVariants(vList)

        // İlk rengi otomatik seç (giyim kategorisi)
        const firstColor = vList.find((v) => v.color)?.color ?? null
        if (firstColor) setSelectedColor(firstColor)

      } catch (err) {
        console.error('[ProductDetail] load error:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Türetilen Veriler ─────────────────────────────────────────────
  const categoryType = getCategoryType(category?.name)
  const isClothing   = categoryType === 'clothing'
  const isDecoration = categoryType === 'decoration'

  // Benzersiz renk listesi → [renk, color_image_url]
  const colorMap = new Map<string, string | null>()
  variants.forEach((v) => { if (v.color && !colorMap.has(v.color)) colorMap.set(v.color, v.color_image_url) })
  const uniqueColors = Array.from(colorMap.entries()) as [string, string | null][]

  // Benzersiz boyutlar (Ev Dekorasyon)
  const uniqueSizes = Array.from(new Set(variants.map((v) => v.size_or_dimension).filter(Boolean))) as string[]

  // Seçili renge ait bedenler
  const sizesForColor: string[] = selectedColor
    ? (Array.from(new Set(
        variants.filter((v) => v.color === selectedColor && v.size_or_dimension).map((v) => v.size_or_dimension!)
      )))
    : uniqueSizes

  // Seçili varyantı bul
  const selectedVariant: ProductVariant | null = (() => {
    if (isClothing && selectedColor && selectedSize)
      return variants.find((v) => v.color === selectedColor && v.size_or_dimension === selectedSize) ?? null
    if (isDecoration && selectedSize)
      return variants.find((v) => v.size_or_dimension === selectedSize) ?? null
    if (variants.length === 1 && !variants[0].color && !variants[0].size_or_dimension)
      return variants[0]
    return null
  })()

  // Ana görsel URL'si
  const colorImageUrl  = selectedColor ? (colorMap.get(selectedColor) ?? null) : null
  const displayImgUrl  = colorImageUrl ?? product?.image_url ?? null

  // Stok
  const effectiveStock  = selectedVariant?.stock ?? (isClothing || isDecoration ? null : product?.stock ?? 0)
  const isOutOfStock    = effectiveStock !== null && effectiveStock === 0
  const isLowStock      = effectiveStock !== null && effectiveStock > 0 && effectiveStock <= 5

  // Rengin toplam stoğu (hiç bedeni yoksa tükendi)
  function colorTotalStock(color: string): number {
    return variants.filter((v) => v.color === color).reduce((s, v) => s + v.stock, 0)
  }
  function sizeStock(size: string): number {
    if (isClothing && selectedColor)
      return variants.find((v) => v.color === selectedColor && v.size_or_dimension === size)?.stock ?? 0
    return variants.find((v) => v.size_or_dimension === size)?.stock ?? 0
  }

  // Fiyat
  const basePrice       = product ? (product.is_discount_active && product.discount_price ? product.discount_price : product.price) : 0
  const additionalPrice = selectedVariant?.additional_price ?? 0
  const displayPrice    = basePrice + additionalPrice
  const originalPrice   = (product?.price ?? 0) + additionalPrice
  const hasDiscount     = !!(product?.is_discount_active && product.discount_price)
  const discountPct     = hasDiscount ? Math.round(((product!.price - product!.discount_price!) / product!.price) * 100) : 0

  // Buton metni kontrolü
  const needsColor      = isClothing && uniqueColors.length > 0 && !selectedColor
  const needsSize       = sizesForColor.length > 0 && !selectedSize && (isClothing ? !!selectedColor : isDecoration)
  const canAddToCart    = !needsColor && !needsSize && !isOutOfStock && !!product

  // ── Renk Seçimi (Görsel Geçişi) ──────────────────────────────────
  function handleColorSelect(color: string) {
    if (color === selectedColor) return
    setSelectedColor(color)
    setMainImgKey((k) => k + 1)   // key değişince React img'i yeniden mount → fade
    // Önceki beden bu renkle yoksa sıfırla
    if (selectedSize) {
      const stillValid = variants.some(
        (v) => v.color === color && v.size_or_dimension === selectedSize && v.stock > 0
      )
      if (!stillValid) setSelectedSize(null)
    }
    setQuantity(1)
  }

  // ── Sepete Ekle ──────────────────────────────────────────────────
  async function handleAddToCart() {
    if (!product || !canAddToCart) return
    setAddingToCart(true)
    try {
      if (!user) {
        // Misafir → localStorage
        addToLocalCart({ product_id: parseInt(productId), variant_id: selectedVariant?.id ?? null, quantity })
        setCartCount(getLocalCartCount())
        showToast('🛒 Misafir sepetine eklendi!', 'info')
      } else {
        // Giriş yapılmış → Supabase
        const { error } = await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: parseInt(productId),
          variant_id: selectedVariant?.id ?? null,
          quantity,
        })
        if (error) throw error
        showToast('✅ Ürün sepete eklendi!', 'success')
      }
      setQuantity(1)
    } catch (err) {
      console.error('[AddToCart]', err)
      showToast('Sepete eklenirken hata oluştu', 'error')
    } finally {
      setAddingToCart(false)
    }
  }

  // ── Yükleniyor ───────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
        <p className="text-zinc-400 text-sm animate-pulse">Ürün yükleniyor...</p>
      </div>
    </div>
  )

  if (notFound || !product) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-5">
      <p className="text-7xl">😔</p>
      <h1 className="text-2xl font-bold text-white">Ürün Bulunamadı</h1>
      <p className="text-zinc-400">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
      <Link href="/products" className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition">
        ← Tüm Ürünlere Dön
      </Link>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/products"
            className="text-pink-500 hover:text-pink-400 text-sm font-medium transition flex items-center gap-1.5">
            ← Ürünlere Dön
          </Link>
          <Link href="/"
            className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            🎁 TC Gift Shop
          </Link>
          <Link href="/cart"
            className="relative px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition flex items-center gap-2">
            🛒 Sepet
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-xs font-bold
                w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* ── İÇERİK ───────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 xl:gap-16">

          {/* ════════════════════════════════════
              SOL: GÖRSEL BLOKU
          ════════════════════════════════════ */}
          <div className="flex flex-col gap-4">

            {/* Ana Görsel */}
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl aspect-square overflow-hidden group">
              {displayImgUrl ? (
                // key değişince React yeni img elemanı oluşturur → CSS animasyon tetiklenir
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={mainImgKey}
                  src={displayImgUrl}
                  alt={selectedColor ? `${product.title} — ${selectedColor}` : product.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 img-fade"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-zinc-800 text-zinc-600">🖼️</div>
              )}

              {/* Seçili renk etiketi */}
              {selectedColor && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <p className="text-xs font-semibold text-white">🎨 {selectedColor}</p>
                </div>
              )}

              {/* İndirim rozeti */}
              {hasDiscount && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500 to-teal-500
                  text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  🎉 -%{discountPct} İndirim
                </div>
              )}

              {/* Tükendi overlay (varyant seçilmişse) */}
              {isOutOfStock && selectedVariant && (
                <div className="absolute inset-0 bg-black/65 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-red-500/20 border-2 border-red-500 rounded-2xl px-10 py-5">
                    <p className="text-red-400 font-black text-2xl text-center">🔴 Tükendi</p>
                  </div>
                </div>
              )}
            </div>

            {/* ─── GİYİM: Renk Önizleme Galerisi ──────────────── */}
            {isClothing && uniqueColors.length > 1 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  🎨 Renk Seçenekleri — {uniqueColors.length} renk
                </p>
                <div className="flex gap-3 flex-wrap">
                  {uniqueColors.map(([color, imgUrl]) => (
                    <ColorSwatch
                      key={color}
                      color={color}
                      imageUrl={imgUrl}
                      isSelected={selectedColor === color}
                      outOfStock={colorTotalStock(color) === 0}
                      onSelect={() => handleColorSelect(color)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stok bilgi kartı */}
            {selectedVariant && (
              <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border transition-all duration-300
                ${isLowStock
                  ? 'bg-red-500/10 border-red-500/50 animate-pulse'
                  : isOutOfStock
                  ? 'bg-zinc-900 border-zinc-700'
                  : 'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                {isLowStock && <span className="text-xl">⚠️</span>}
                {!isOutOfStock && !isLowStock && <span className="text-emerald-400">✅</span>}
                {isOutOfStock && <span className="text-xl">🔴</span>}
                <div>
                  {isLowStock && (
                    <>
                      <p className="text-red-400 font-bold text-sm">Son {effectiveStock} ürün!</p>
                      <p className="text-red-400/60 text-xs">Bu kombinasyon hızla tükeniyor</p>
                    </>
                  )}
                  {!isOutOfStock && !isLowStock && (
                    <p className="text-emerald-400 text-sm font-medium">{effectiveStock} adet stokta mevcut</p>
                  )}
                  {isOutOfStock && (
                    <p className="text-zinc-500 text-sm">Bu kombinasyon tükendi</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════
              SAĞ: ÜRÜN BİLGİLERİ
          ════════════════════════════════════ */}
          <div className="flex flex-col gap-5">

            {/* Kategori + Başlık */}
            <div>
              {category && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400
                  bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20 mb-3">
                  📂 {category.name}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
                {product.title}
              </h1>
              {product.description && (
                <p className="text-zinc-400 text-base leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Fiyat Kartı */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-end gap-4">
                <p className={`text-4xl font-black leading-none
                  ${hasDiscount ? 'text-emerald-400' : 'text-white'}`}>
                  {displayPrice.toFixed(2)} ₺
                </p>
                {hasDiscount && (
                  <p className="text-lg text-zinc-500 line-through leading-none mb-1">
                    {originalPrice.toFixed(2)} ₺
                  </p>
                )}
              </div>
              {additionalPrice > 0 && (
                <p className="text-xs text-zinc-400 mt-2">
                  Ana fiyat +{' '}
                  <span className="text-pink-400 font-semibold">+{additionalPrice.toFixed(2)} ₺</span>
                  {' '}(seçilen varyant fark fiyatı)
                </p>
              )}
              {hasDiscount && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400
                  bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  🎉 %{discountPct} tasarruf ettiniz
                </div>
              )}
            </div>

            {/* ─── GİYİM: Sağ Panel Renk Seçimi ───────────────── */}
            {isClothing && uniqueColors.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-zinc-200 uppercase tracking-wide">
                    🎨 Renk
                  </h3>
                  {selectedColor && (
                    <span className="text-xs text-pink-400 font-bold bg-pink-500/10 px-2.5 py-1 rounded-full">
                      {selectedColor}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map(([color, imgUrl]) => {
                    const cs = colorTotalStock(color)
                    return (
                      <button
                        key={color}
                        onClick={() => cs > 0 && handleColorSelect(color)}
                        disabled={cs === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 border-2
                          ${selectedColor === color
                            ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/25'
                            : cs === 0
                            ? 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed opacity-50 line-through'
                            : 'bg-zinc-950 text-zinc-300 border-zinc-700 hover:border-pink-500/60 hover:text-white'
                          }`}
                      >
                        {imgUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgUrl} alt={color}
                            className="w-5 h-5 rounded object-cover border border-white/20 flex-shrink-0" />
                        )}
                        {color}
                        {cs === 0 && <span className="text-[10px] font-normal opacity-70">(Yok)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ─── BEDEN / BOYUT SEÇİMİ ───────────────────────── */}
            {sizesForColor.length > 0 && (isClothing ? !!selectedColor : true) && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-zinc-200 uppercase tracking-wide">
                    {isClothing ? '📏 Beden' : '📐 Boyut'}
                  </h3>
                  {selectedSize && (
                    <span className="text-xs text-violet-400 font-bold bg-violet-500/10 px-2.5 py-1 rounded-full">
                      {selectedSize}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map((size) => (
                    <SizeButton
                      key={size}
                      label={size}
                      stock={sizeStock(size)}
                      isSelected={selectedSize === size}
                      onSelect={() => { setSelectedSize(size); setQuantity(1) }}
                    />
                  ))}
                </div>

                {/* Seçili varyantın tam bilgisi */}
                {selectedSize && selectedVariant && (
                  <p className="text-xs text-zinc-500 pt-1">
                    Stok:{' '}
                    <span className={
                      isLowStock ? 'text-amber-400 font-bold' :
                      isOutOfStock ? 'text-red-400 font-bold' :
                      'text-zinc-300 font-semibold'
                    }>
                      {effectiveStock} adet
                    </span>
                    {additionalPrice > 0 && (
                      <> · Fiyat farkı: <span className="text-pink-400 font-semibold">+{additionalPrice.toFixed(2)} ₺</span></>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* ─── ADET SEÇİMİ ─────────────────────────────────── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-sm font-medium text-zinc-300 mb-3">📦 Adet</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 bg-zinc-950 border border-zinc-700 rounded-xl hover:border-pink-500
                    hover:text-pink-400 transition font-bold text-xl flex items-center justify-center"
                >−</button>
                <input
                  type="number"
                  value={quantity}
                  min={1}
                  max={effectiveStock ?? 99}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1
                    setQuantity(Math.max(1, Math.min(effectiveStock ?? 99, v)))
                  }}
                  className="w-16 bg-zinc-950 border border-zinc-700 rounded-xl text-center
                    font-bold text-white text-lg py-2.5 focus:outline-none focus:border-pink-500 transition"
                />
                <button
                  onClick={() => setQuantity((q) => Math.min(effectiveStock ?? 99, q + 1))}
                  className="w-11 h-11 bg-zinc-950 border border-zinc-700 rounded-xl hover:border-pink-500
                    hover:text-pink-400 transition font-bold text-xl flex items-center justify-center"
                >+</button>
                {effectiveStock !== null && effectiveStock > 0 && (
                  <p className="text-xs text-zinc-500">maks. {effectiveStock}</p>
                )}
              </div>
            </div>

            {/* ─── SEPETE EKLE ─────────────────────────────────── */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart || addingToCart}
                className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500
                  disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg py-4
                  rounded-2xl transition-all duration-200 shadow-xl shadow-pink-500/10
                  hover:shadow-pink-500/25 hover:scale-[1.01] active:scale-[0.99]"
              >
                {addingToCart ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Ekleniyor...
                  </span>
                ) : isOutOfStock && selectedVariant ? '🔴 Tükendi'
                  : needsColor       ? '← Önce bir renk seçin'
                  : needsSize        ? `← ${isClothing ? 'Beden' : 'Boyut'} seçin`
                  : '🛒 Sepete Ekle'}
              </button>

              {/* Misafir kullanıcı notu */}
              {!user && (
                <p className="text-xs text-zinc-500 text-center leading-relaxed">
                  🔒 Misafir olarak sepete ekleyebilirsiniz.{' '}
                  Sipariş vermek için{' '}
                  <Link href="/auth/login?returnTo=/cart"
                    className="text-pink-400 hover:text-pink-300 underline font-medium">
                    giriş yapmanız
                  </Link>{' '}
                  gerekecek.
                </p>
              )}

              <Link
                href="/cart"
                className="w-full flex items-center justify-center gap-2 border border-zinc-700
                  hover:border-violet-500 text-zinc-300 hover:text-white font-semibold py-3
                  rounded-2xl transition-all duration-200 hover:bg-violet-500/5"
              >
                🛒 Sepeti Görüntüle
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
