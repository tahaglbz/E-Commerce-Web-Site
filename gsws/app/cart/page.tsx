'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import {
  Product,
  ProductVariant,
  Coupon,
  DiscountType,
  UnifiedCartItem,
  Category,
} from '@/app/types'
import {
  getLocalCart,
  removeFromLocalCart,
  updateLocalCartQuantity,
  clearLocalCart,
  syncLocalCartToSupabase,
  addToLocalCart,
} from '@/app/utils/cartUtils'

// ── Login Modal ───────────────────────────────────────────────────
interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-pink-500/10 border-2 border-pink-500/30 rounded-full flex items-center justify-center">
            <span className="text-4xl">🔐</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-3">
          Giriş Yapmanız Gerekiyor
        </h2>
        <p className="text-zinc-400 text-sm text-center mb-8 leading-relaxed">
          Siparişinizi tamamlamak için lütfen giriş yapın veya yeni hesap oluşturun.
          Sepetinizdeki ürünler kaydedilecektir.
        </p>

        <div className="space-y-3">
          <Link
            href="/auth/login?returnTo=/cart"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-lg shadow-pink-500/20"
          >
            🚀 Giriş Yap
          </Link>
          <Link
            href="/auth/signup?returnTo=/cart"
            className="w-full flex items-center justify-center gap-2 border border-zinc-600 hover:border-pink-500 text-zinc-300 hover:text-white font-semibold py-3.5 rounded-xl transition duration-200"
          >
            ✨ Yeni Hesap Oluştur
          </Link>
          <button
            onClick={onClose}
            className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition"
          >
            Alışverişe devam et
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sepet Öğesi Kartı ─────────────────────────────────────────────
interface CartItemCardProps {
  item: UnifiedCartItem
  onUpdateQuantity: (productId: number, variantId: number | null, quantity: number, source: 'local' | 'remote', remoteId?: number) => void
  onRemove: (productId: number, variantId: number | null, source: 'local' | 'remote', remoteId?: number) => void
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const product = item.product
  const variant = item.variant
  if (!product) return null

  const basePrice = product.is_discount_active && product.discount_price
    ? product.discount_price
    : product.price
  const additionalPrice = variant?.additional_price ?? 0
  const unitPrice = basePrice + additionalPrice
  const itemTotal = unitPrice * item.quantity

  // Varyant etiketi oluştur
  const variantLabel = (() => {
    if (!variant) return null
    const parts: string[] = []
    if (variant.color) parts.push(`Renk: ${variant.color}`)
    if (variant.size_or_dimension) parts.push(`${variant.color ? 'Beden' : 'Boyut'}: ${variant.size_or_dimension}`)
    return parts.length > 0 ? parts.join(' | ') : null
  })()

  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition duration-200">
      <div className="flex gap-4">
        {/* Görsel – Varyant resmi varsa onu göster */}
        <div className="w-24 h-24 bg-zinc-950 rounded-xl flex-shrink-0 overflow-hidden border border-zinc-800">
          {(variant?.color_image_url || product.image_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={variant?.color_image_url ?? product.image_url!} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🖼️</div>
          )}
        </div>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-2 mb-1">
            <h3 className="font-semibold text-base text-white leading-snug line-clamp-2">{product.title}</h3>
            <button
              onClick={() => onRemove(item.product_id, item.variant_id, item.source, item.remote_id)}
              className="text-zinc-500 hover:text-red-400 transition flex-shrink-0 p-1"
              title="Kaldır"
            >
              🗑️
            </button>
          </div>

          {/* Varyant Etiketi */}
          {variantLabel && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 text-xs bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full border border-zinc-700">
                🏷️ {variantLabel}
              </span>
            </div>
          )}

          {/* Misafir etiketi */}
          {item.source === 'local' && (
            <span className="inline-block text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full mb-2">
              Misafir Sepeti
            </span>
          )}

          {/* Fiyat & Adet */}
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-pink-400">{unitPrice.toFixed(2)} ₺</p>
              {product.is_discount_active && product.discount_price && (
                <p className="text-xs text-zinc-500 line-through">{(product.price + additionalPrice).toFixed(2)} ₺</p>
              )}
            </div>

            {/* Adet Kontrolü */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.product_id, item.variant_id, item.quantity - 1, item.source, item.remote_id)}
                className="w-8 h-8 bg-zinc-950 border border-zinc-700 rounded-lg hover:border-pink-500 transition text-sm font-bold"
              >
                −
              </button>
              <span className="w-10 text-center font-bold text-white">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.product_id, item.variant_id, item.quantity + 1, item.source, item.remote_id)}
                className="w-8 h-8 bg-zinc-950 border border-zinc-700 rounded-lg hover:border-pink-500 transition text-sm font-bold"
              >
                +
              </button>
              <p className="text-sm text-zinc-400 ml-1">
                = <span className="font-semibold text-white">{itemTotal.toFixed(2)} ₺</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Ana Sayfa ─────────────────────────────────────────────────────
export default function CartPage() {
  const supabase = createClient()
  const router = useRouter()

  const [cartItems, setCartItems] = useState<UnifiedCartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  // Çapraz Satış (Cross-Selling) State'leri ve Ref
  const [categories, setCategories] = useState<Category[]>([])
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [recLoading, setRecLoading] = useState(false)
  const [addingProductId, setAddingProductId] = useState<number | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  // ── Veri Yükleme ─────────────────────────────────────────────────
  const loadCart = useCallback(async () => {
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const loggedInUser = userData.user

      if (loggedInUser) {
        setUser({ id: loggedInUser.id, email: loggedInUser.email || '' })
        setCustomerEmail(loggedInUser.email || '')
      }

      // Kategorileri yükle
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
      if (categoriesData) {
        setCategories(categoriesData as Category[])
      }

      const unifiedItems: UnifiedCartItem[] = []

      // ── LocalStorage Sepeti ──
      const localItems = getLocalCart()
      const localProductIds = localItems.map((i) => i.product_id)
      const localVariantIds = localItems.map((i) => i.variant_id).filter(Boolean) as number[]

      // ── Supabase Sepeti (sadece giriş yapılmışsa) ──
      let remoteItems: Array<{ id: number; product_id: number; variant_id: number | null; quantity: number }> = []
      if (loggedInUser) {
        const { data: dbCart } = await supabase
          .from('cart_items')
          .select('id, product_id, variant_id, quantity')
          .eq('user_id', loggedInUser.id)
          .order('created_at', { ascending: false })
        remoteItems = dbCart || []
      }

      // ── Tüm ürün ID'lerini birleştir ──
      const allProductIds = [...new Set([
        ...localProductIds,
        ...remoteItems.map((r) => r.product_id),
      ])]

      const allVariantIds = [...new Set([
        ...localVariantIds,
        ...remoteItems.map((r) => r.variant_id).filter(Boolean) as number[],
      ])]

      let productMap = new Map<number, Product>()
      let variantMap = new Map<number, ProductVariant>()

      if (allProductIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .in('id', allProductIds)
        productsData?.forEach((p) => productMap.set(p.id, p as Product))
      }

      if (allVariantIds.length > 0) {
        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('*')
          .in('id', allVariantIds)
        variantsData?.forEach((v) => variantMap.set(v.id, v as ProductVariant))
      }

      // ── Local öğeleri birleştir (remote'da aynısı yoksa) ──
      // Aynı product_id+variant_id remote'da zaten varsa local kopyayı atlıyoruz
      // Bu, giriş sonrası syncLocalCart öncesi hem local hem DB'de aynı ürün olmasını engeller
      localItems.forEach((item, index) => {
        const alreadyInRemote = remoteItems.some(
          (r) => r.product_id === item.product_id && r.variant_id === item.variant_id
        )
        if (alreadyInRemote) return // duplicate → atla

        unifiedItems.push({
          key: `local-${item.product_id}-${item.variant_id ?? 'null'}-${index}`,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          product: productMap.get(item.product_id),
          variant: item.variant_id ? variantMap.get(item.variant_id) ?? null : null,
          source: 'local',
        })
      })

      // ── Remote öğeleri birleştir ──
      remoteItems.forEach((item) => {
        unifiedItems.push({
          key: `remote-${item.id}`,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          product: productMap.get(item.product_id),
          variant: item.variant_id ? variantMap.get(item.variant_id) ?? null : null,
          source: 'remote',
          remote_id: item.id,
        })
      })

      setCartItems(unifiedItems)
    } catch (err) {
      console.error('Sepet yükleme hatası:', err)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadCart()
  }, [loadCart])

  // Çapraz satış için sepetteki kategorilere göre ürün tavsiyesi çekme
  useEffect(() => {
    async function fetchRecommendations() {
      setRecLoading(true)
      try {
        const cartProductIds = cartItems.map((item) => item.product_id)
        const categoryIds = cartItems
          .map((item) => item.product?.category_id)
          .filter((id): id is number => id !== null && id !== undefined)

        let productsData: Product[] = []

        if (categoryIds.length > 0) {
          // Sepetteki kategorilere ait diğer ürünleri getir
          let query = supabase
            .from('products')
            .select('*')
            .in('category_id', categoryIds)
            .limit(10)

          if (cartProductIds.length > 0) {
            query = query.not('id', 'in', `(${cartProductIds.join(',')})`)
          }

          const { data } = await query
          if (data) productsData = data as Product[]
        }

        // Eğer kategoriyle eşleşen ürün sayısı yetersizse popüler/en yeni ürünlerle doldur
        if (productsData.length < 8) {
          const needed = 8 - productsData.length
          let fallbackQuery = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(needed + cartProductIds.length)

          const { data: fallbackData } = await fallbackQuery
          if (fallbackData) {
            const filteredFallback = (fallbackData as Product[]).filter(
              (p) => !cartProductIds.includes(p.id) && !productsData.some((existing) => existing.id === p.id)
            )
            productsData = [...productsData, ...filteredFallback.slice(0, needed)]
          }
        }

        setRecommendations(productsData)
      } catch (err) {
        console.error('Öneriler yüklenirken hata:', err)
      } finally {
        setRecLoading(false)
      }
    }

    if (!loading) {
      fetchRecommendations()
    }
  }, [cartItems, loading, supabase])

  // Çapraz Satış Slider'ı için Sepete Ekleme Fonksiyonu
  async function handleAddToCart(productId: number, variantId: number | null = null) {
    setAddingProductId(productId)
    try {
      if (user) {
        const existingItem = cartItems.find(
          (item) => item.product_id === productId && item.variant_id === variantId && item.source === 'remote'
        )

        if (existingItem && existingItem.remote_id) {
          await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + 1 })
            .eq('id', existingItem.remote_id)
        } else {
          await supabase.from('cart_items').insert({
            user_id: user.id,
            product_id: productId,
            variant_id: variantId,
            quantity: 1,
          })
        }
      } else {
        addToLocalCart({ product_id: productId, variant_id: variantId, quantity: 1 })
      }
      
      await loadCart()
    } catch (err) {
      console.error('Sepete ürün eklenirken hata oluştu:', err)
    } finally {
      setTimeout(() => {
        setAddingProductId(null)
      }, 800)
    }
  }

  // Slider Kaydırma Fonksiyonları
  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -260, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 260, behavior: 'smooth' })
    }
  }

  // ── Adet Güncelleme ───────────────────────────────────────────────
  async function handleUpdateQuantity(
    productId: number,
    variantId: number | null,
    quantity: number,
    source: 'local' | 'remote',
    remoteId?: number
  ) {
    if (quantity <= 0) {
      handleRemove(productId, variantId, source, remoteId)
      return
    }

    if (source === 'local') {
      const updated = updateLocalCartQuantity(productId, variantId, quantity)
      setCartItems((prev) =>
        prev.map((item) =>
          item.source === 'local' && item.product_id === productId && item.variant_id === variantId
            ? { ...item, quantity }
            : item
        )
      )
      if (updated.length === 0 && cartItems.filter((i) => i.source === 'remote').length === 0) {
        setCartItems([])
      }
    } else if (remoteId) {
      await supabase.from('cart_items').update({ quantity }).eq('id', remoteId)
      setCartItems((prev) =>
        prev.map((item) => (item.remote_id === remoteId ? { ...item, quantity } : item))
      )
    }
  }

  // ── Ürün Kaldır ───────────────────────────────────────────────────
  async function handleRemove(
    productId: number,
    variantId: number | null,
    source: 'local' | 'remote',
    remoteId?: number
  ) {
    if (source === 'local') {
      removeFromLocalCart(productId, variantId)
    } else if (remoteId) {
      await supabase.from('cart_items').delete().eq('id', remoteId)
    }
    setCartItems((prev) =>
      prev.filter((item) => {
        if (source === 'local') {
          return !(item.source === 'local' && item.product_id === productId && item.variant_id === variantId)
        }
        return item.remote_id !== remoteId
      })
    )
  }

  // ── Kupon ─────────────────────────────────────────────────────────
  async function handleApplyCoupon() {
    if (!couponCode.trim()) { setCouponError('Lütfen kupon kodu girin'); return }
    setCheckingCoupon(true)
    setCouponError(null)
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()
      if (error || !data) {
        setCouponError('Geçersiz veya süresi dolmuş kupon kodu')
      } else {
        const coupon = data as Coupon
        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
          setCouponError('Bu kuponun süresi dolmuş')
        } else if (coupon.max_uses != null && coupon.current_uses >= coupon.max_uses) {
          setCouponError('Bu kupon kullanım limitine ulaşmış')
        } else {
          setAppliedCoupon(coupon)
          setCouponCode('')
        }
      }
    } catch { setCouponError('Bir hata oluştu') } finally { setCheckingCoupon(false) }
  }

  // ── Fiyat Hesaplama ───────────────────────────────────────────────
  const subtotal = cartItems.reduce((sum, item) => {
    const p = item.product
    if (!p) return sum
    const base = p.is_discount_active && p.discount_price ? p.discount_price : p.price
    const extra = item.variant?.additional_price ?? 0
    return sum + (base + extra) * item.quantity
  }, 0)

  let discount = 0
  if (appliedCoupon) {
    discount = appliedCoupon.discount_type === DiscountType.PERCENTAGE
      ? (subtotal * appliedCoupon.discount_value) / 100
      : appliedCoupon.discount_value
  }
  const afterDiscount = Math.max(0, subtotal - discount)
  // ── Kargo Baremi: 1500 TL üzeri ücretsiz, altı 150 TL ──
  const FREE_SHIPPING_THRESHOLD = 1500
  const SHIPPING_FEE = 150
  const shippingCost = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = afterDiscount + shippingCost

  // ── Ödeme Aşamasına Geç (yeni akış: /checkout sayfasına yönlendir) ──
  async function handleProceedToCheckout() {
    if (cartItems.length === 0) {
      alert('Sepetiniz boş')
      return
    }

    // 1) Giriş kontrolü
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      // Giriş yapılmamış → /login sayfasına yönlendir
      router.push('/auth/login?returnTo=/checkout')
      return
    }

    // 2) localStorage sepetini Supabase'e senkronize et (giriş yapılmışsa)
    await syncLocalCartToSupabase(userData.user.id)

    // 3) /checkout sayfasına yönlendir (middleware de zaten guard sağlıyor)
    router.push('/checkout')
  }

  // ── Eski handleCheckout (geriye uyumluluk için tutuldu, artık kullanılmıyor) ──
  async function handleCheckout() {
    await handleProceedToCheckout()
  }


  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <p className="text-zinc-400 text-sm">Sepet yükleniyor...</p>
        </div>
      </div>
    )
  }

  // ── Sipariş Başarılı ──────────────────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-3">Siparişiniz Alındı!</h1>
          <p className="text-zinc-400 mb-2">
            Siparişiniz <span className="text-amber-400 font-semibold">onay bekliyor</span> statüsünde oluşturuldu.
          </p>
          <p className="text-zinc-500 text-sm mb-8">
            Siparişiniz yönetici tarafından incelendikten sonra işleme alınacaktır.
          </p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-bold rounded-xl transition"
          >
            🛍️ Alışverişe Devam Et
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      {/* Login Modal */}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/products" className="text-pink-500 hover:text-pink-400 text-sm font-medium transition">
            ← Alışverişe Devam Et
          </Link>
          <h1 className="text-xl font-bold text-white">🛒 Sepetim</h1>
          <div className="w-24 flex justify-end">
            {user ? (
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full">
                Giriş yapıldı ✓
              </span>
            ) : (
              <Link href="/auth/login" className="text-xs text-pink-400 hover:text-pink-300 transition">
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {cartItems.length === 0 ? (
          /* ── Boş Sepet ── */
          <div className="text-center py-24">
            <p className="text-7xl mb-6">🛒</p>
            <h2 className="text-2xl font-bold text-white mb-3">Sepetiniz Boş</h2>
            <p className="text-zinc-400 mb-8">Ürünleri keşfetmeye başlayın!</p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-bold rounded-xl transition"
            >
              🛍️ Ürünleri Gör
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Sol: Ürünler ── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">Sepet Öğeleri ({cartItems.length})</h2>
                {!user && (
                  <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                    ⚠️ Sipariş için giriş gerekmektedir
                  </span>
                )}
              </div>

              {cartItems.map((item) => (
                <CartItemCard
                  key={item.key}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* ── Sağ: Özet & Ödeme ── */}
            <div className="space-y-5">
              {/* Sipariş Özeti */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24 space-y-5">
                <h2 className="text-xl font-bold">Sipariş Özeti</h2>

                {/* Kupon */}
                <div className="pb-5 border-b border-zinc-800">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">🎟️ Kupon Kodu</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Kupon girin..."
                      disabled={appliedCoupon !== null || checkingCoupon}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 transition disabled:opacity-50"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={appliedCoupon !== null || checkingCoupon}
                      className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 rounded-lg text-sm font-semibold transition"
                    >
                      {checkingCoupon ? '⏳' : '✓'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-400 mt-2">{couponError}</p>}
                  {appliedCoupon && (
                    <div className="mt-3 flex items-center justify-between p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-xs text-emerald-400 font-semibold">✅ {appliedCoupon.code} uygulandı</p>
                      <button onClick={() => setAppliedCoupon(null)} className="text-xs text-emerald-400 hover:text-emerald-300">✕</button>
                    </div>
                  )}
                </div>

                {/* Tutarlar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Ara Toplam</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} ₺</span>
                  </div>
                  {appliedCoupon && discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-400">
                      <span>İndirim ({appliedCoupon.discount_type === 'PERCENTAGE' ? `${appliedCoupon.discount_value}%` : 'Sabit'})</span>
                      <span className="font-semibold">−{discount.toFixed(2)} ₺</span>
                    </div>
                  )}
                  {/* Kargo Ücreti */}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400 flex items-center gap-1.5">🚚 Kargo</span>
                    {shippingCost === 0 ? (
                      <span className="font-semibold text-emerald-400">Ücretsiz 🎉</span>
                    ) : (
                      <span className="font-semibold text-orange-400">+{shippingCost.toFixed(2)} ₺</span>
                    )}
                  </div>
                  {shippingCost > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-emerald-400">
                        🎉 <span className="font-bold">{(FREE_SHIPPING_THRESHOLD - afterDiscount).toFixed(2)} ₺</span> daha ekleyin, kargo bedava!
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t border-zinc-800">
                    <span>Toplam</span>
                    <span className="text-pink-400">{total.toFixed(2)} ₺</span>
                  </div>
                </div>

                {/* Müşteri Bilgileri */}
                <div className="space-y-3 pb-5 border-b border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-300">👤 Teslimat Bilgileri</h3>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ad Soyad *"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Telefon Numarası *"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
                  />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="E-posta (opsiyonel)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
                  />
                </div>

                {/* Ödeme Aşamasına Geç Butonu */}
                <button
                  onClick={handleProceedToCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500
                    disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl
                    transition-all duration-200 shadow-lg shadow-pink-500/10 hover:shadow-pink-500/25
                    hover:scale-[1.01] active:scale-[0.99] text-base"
                >
                  {!user ? (
                    '🔐 Giriş Yap & Ödemeye Geç'
                  ) : (
                    '💳 Ödeme Aşamasına Geç →'
                  )}
                </button>

                {!user && (
                  <p className="text-xs text-zinc-500 text-center leading-relaxed">
                    Sepetinizdeki ürünler, giriş yaptıktan sonra otomatik olarak kaydedilecektir.
                  </p>
                )}

                <p className="text-xs text-zinc-600 text-center">
                  💳 Ödeme yönetici onayından sonra yapılacaktır
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Öneri Ürünler (Cross-Selling Slider) ── */}
        {!recLoading && recommendations.length > 0 && (
          <div className="mt-16 pt-10 border-t border-zinc-900">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  ✨ Sizin İçin Seçtiklerimiz
                </h3>
                <p className="text-zinc-500 text-sm mt-1">
                  Kategorinize özel veya ilginizi çekebilecek harika ürünler
                </p>
              </div>
            </div>

            <div className="relative group/slider">
              {/* Sol Kaydırma Butonu */}
              <button
                onClick={scrollLeft}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white w-10 h-10 rounded-full border border-zinc-800/80 shadow-2xl flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:scale-105 active:scale-95"
                title="Sola Kaydır"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Sağ Kaydırma Butonu */}
              <button
                onClick={scrollRight}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white w-10 h-10 rounded-full border border-zinc-800/80 shadow-2xl flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:scale-105 active:scale-95"
                title="Sağa Kaydır"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Slider Listesi */}
              <div
                ref={sliderRef}
                className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-4 px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {recommendations.map((product) => {
                  const basePrice = product.is_discount_active && product.discount_price
                    ? product.discount_price
                    : product.price

                  return (
                    <div
                      key={product.id}
                      className="w-[220px] flex-shrink-0 bg-zinc-900/40 border border-zinc-800/80 hover:border-pink-500/30 rounded-2xl overflow-hidden transition-all duration-300 group hover:shadow-xl hover:shadow-pink-500/5 flex flex-col justify-between snap-start"
                    >
                      <Link href={`/products/${product.id}`} className="block">
                        <div className="relative w-full aspect-square bg-zinc-950/80 overflow-hidden">
                          {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl bg-zinc-800">
                              🖼️
                            </div>
                          )}

                          {/* İndirim Rozeti */}
                          {product.is_discount_active && product.discount_price && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                              FIRSAT 🎉
                            </div>
                          )}

                          {/* Stok Uyarısı */}
                          {product.stock <= 5 && product.stock > 0 && (
                            <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-full">
                              Son {product.stock}!
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex-1">
                          <h4 className="font-medium text-sm text-zinc-200 line-clamp-2 group-hover:text-pink-400 transition-colors duration-200 h-10 mb-1 leading-snug">
                            {product.title}
                          </h4>

                          <div className="flex items-baseline gap-2 mb-3">
                            {product.is_discount_active && product.discount_price ? (
                              <>
                                <span className="text-base font-bold text-pink-400">
                                  {product.discount_price.toFixed(2)} ₺
                                </span>
                                <span className="text-xs text-zinc-500 line-through">
                                  {product.price.toFixed(2)} ₺
                                </span>
                              </>
                            ) : (
                              <span className="text-base font-bold text-white">
                                {product.price.toFixed(2)} ₺
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 w-fit">
                            {categories.find((c) => c.id === product.category_id)?.name || 'Genel'}
                          </div>
                        </div>
                      </Link>

                      {/* Sepete Ekle Butonu */}
                      <div className="p-4 pt-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleAddToCart(product.id)
                          }}
                          disabled={product.stock === 0 || addingProductId === product.id}
                          className={`w-full font-semibold text-xs py-2.5 px-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                            ${addingProductId === product.id
                              ? 'bg-emerald-500 text-white border border-transparent'
                              : 'bg-zinc-800 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-600 hover:border-transparent text-zinc-300 hover:text-white border border-zinc-700/50'
                            }`}
                        >
                          {addingProductId === product.id ? (
                            <>
                              <span>✓</span> Eklendi
                            </>
                          ) : (
                            <>
                              <span>🛒</span> {product.stock === 0 ? 'Tükendi' : 'Sepete Ekle'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
