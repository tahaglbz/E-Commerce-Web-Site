'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CartWithProduct, Product, Coupon, DiscountType } from '@/app/types'

export default function CartPage() {
  const router = useRouter()
  const supabase = createClient()

  const [cartItems, setCartItems] = useState<CartWithProduct[]>([])
  const [products, setProducts] = useState<Map<number, Product>>(new Map())
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  // Verileri yükle
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/auth/login')
          return
        }

        setUser(userData.user)
        setCustomerEmail(userData.user.email || '')

        // Sepet öğelerini yükle
        const { data: cartData } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false })

        if (cartData) {
          setCartItems(cartData as CartWithProduct[])

          // Ürünleri yükle
          const productIds = [...new Set(cartData.map((item) => item.product_id))]
          if (productIds.length > 0) {
            const { data: productsData } = await supabase
              .from('products')
              .select('*')
              .in('id', productIds)

            if (productsData) {
              const productMap = new Map<number, Product>()
              productsData.forEach((p) => productMap.set(p.id, p as Product))
              setProducts(productMap)
            }
          }
        }
      } catch (err) {
        console.error('Veri yükleme hatası:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Kupon kontrolü
  async function handleApplyCoupon() {
    if (!couponCode.trim()) {
      setCouponError('Lütfen kupon kodu girin')
      return
    }

    setCheckingCoupon(true)
    setCouponError(null)

    try {
      const { data: couponData, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !couponData) {
        setCouponError('Geçersiz veya süresi dolmuş kupon kodu')
      } else {
        const coupon = couponData as Coupon
        // Expiry date kontrol et
        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
          setCouponError('Bu kuponun süresi dolmuş')
        } else if (coupon.current_uses >= (coupon.max_uses || Infinity)) {
          setCouponError('Bu kupon kullanım limitine ulaşmış')
        } else {
          setAppliedCoupon(coupon)
          setCouponCode('')
          setCouponError(null)
        }
      }
    } catch (err) {
      console.error(err)
      setCouponError('Bir hata oluştu')
    } finally {
      setCheckingCoupon(false)
    }
  }

  // Kupon kaldır
  function handleRemoveCoupon() {
    setAppliedCoupon(null)
  }

  // Sepetten kaldır
  async function handleRemoveItem(cartItemId: number) {
    try {
      await supabase.from('cart_items').delete().eq('id', cartItemId)
      setCartItems(cartItems.filter((item) => item.id !== cartItemId))
    } catch (err) {
      console.error(err)
      alert('Hata: Ürün kaldırılamadı')
    }
  }

  // Miktar güncelle
  async function handleUpdateQuantity(cartItemId: number, newQuantity: number) {
    if (newQuantity < 1) {
      handleRemoveItem(cartItemId)
      return
    }

    try {
      await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', cartItemId)
      setCartItems(
        cartItems.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Toplam hesapla
  const subtotal = cartItems.reduce((sum, item) => {
    const product = products.get(item.product_id)
    if (!product) return sum
    const price = product.is_discount_active && product.discount_price ? product.discount_price : product.price
    return sum + price * item.quantity
  }, 0)

  let discount = 0
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === DiscountType.PERCENTAGE) {
      discount = (subtotal * appliedCoupon.discount_value) / 100
    } else {
      discount = appliedCoupon.discount_value
    }
  }

  const total = Math.max(0, subtotal - discount)

  // Siparişi tamamla
  async function handleCheckout() {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Lütfen ad ve telefon numaranızı girin')
      return
    }

    if (cartItems.length === 0) {
      alert('Sepetiniz boş')
      return
    }

    setCheckingOut(true)

    try {
      // Order oluştur
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user?.id || null,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail || null,
            status: 'PENDING',
            total_price: total,
            applied_coupon: appliedCoupon?.code || null,
          },
        ])
        .select()
        .single()

      if (orderError || !orderData) {
        alert('Sipariş oluşturulamadı')
        return
      }

      const orderId = orderData.id

      // Order items oluştur
      const orderItems = cartItems.map((item) => {
        const product = products.get(item.product_id)
        const price = product?.is_discount_active && product?.discount_price ? product.discount_price : product?.price || 0
        return {
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price,
          selected_variants: item.selected_variants,
        }
      })

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

      if (itemsError) {
        alert('Sipariş öğeleri eklenirken hata oluştu')
        return
      }

      // Kupon kullanımını artır
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ current_uses: appliedCoupon.current_uses + 1 })
          .eq('id', appliedCoupon.id)
      }

      // Sepeti temizle
      await supabase.from('cart_items').delete().eq('user_id', user.id)

      alert(
        `✅ Siparişiniz başarıyla oluşturuldu!\n\nSipariş No: ${orderId}\nToplam: ${total.toFixed(2)} ₺\n\nYöneticiye bekleme listesi gösterilecektir.`
      )
      setCartItems([])
      setCustomerName('')
      setCustomerPhone('')
      setAppliedCoupon(null)
    } catch (err) {
      console.error(err)
      alert('Siparişi tamamlarken bir hata oluştu')
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900/50 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/products" className="text-pink-500 hover:text-pink-400 text-sm font-medium">
            ← Alışverişe Devam Et
          </Link>
          <h1 className="text-xl font-bold">🛒 Sepet</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-xl text-zinc-400 mb-6">Sepetiniz boş</p>
            <Link href="/products" className="inline-block px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-medium transition">
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold mb-6">Sepet Öğeleri ({cartItems.length})</h2>

              {cartItems.map((item) => {
                const product = products.get(item.product_id)
                if (!product) return null

                const price = product.is_discount_active && product.discount_price ? product.discount_price : product.price
                const itemTotal = price * item.quantity

                return (
                  <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 bg-zinc-950 rounded-lg flex-shrink-0 overflow-hidden">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🖼️</div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{product.title}</h3>

                        {/* Selected Variants */}
                        {item.selected_variants && Object.keys(item.selected_variants).length > 0 && (
                          <div className="flex gap-2 mb-3 flex-wrap">
                            {Object.entries(item.selected_variants).map(([type, value]) => (
                              <span key={type} className="text-xs bg-zinc-800 px-2 py-1 rounded">
                                {type}: <span className="font-semibold">{value}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-2 mb-3">
                          <p className="text-lg font-bold text-pink-400">{price.toFixed(2)} ₺</p>
                          {product.is_discount_active && product.discount_price && (
                            <p className="text-sm text-zinc-500 line-through">{product.price.toFixed(2)} ₺</p>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 w-fit">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-zinc-950 border border-zinc-800 rounded hover:border-pink-500 transition text-sm font-bold"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-12 bg-zinc-950 border border-zinc-800 rounded text-center font-bold text-white text-sm"
                            min="1"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-zinc-950 border border-zinc-800 rounded hover:border-pink-500 transition text-sm font-bold"
                          >
                            +
                          </button>
                          <p className="text-sm text-zinc-400 ml-2">
                            = <span className="font-semibold">{itemTotal.toFixed(2)} ₺</span>
                          </p>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium p-2"
                      >
                        🗑️ Kaldır
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary & Checkout */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-20">
                <h2 className="text-xl font-bold mb-6">Sipariş Özeti</h2>

                {/* Coupon Input */}
                <div className="mb-6 pb-6 border-b border-zinc-800">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">🎟️ Kupon Kodu</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Kupon girin..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
                      disabled={appliedCoupon !== null || checkingCoupon}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={appliedCoupon !== null || checkingCoupon}
                      className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                    >
                      {checkingCoupon ? '⏳' : '✓'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-400 mt-2">{couponError}</p>}
                  {appliedCoupon && (
                    <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded flex justify-between items-center">
                      <p className="text-xs text-emerald-400 font-semibold">✅ {appliedCoupon.code} uygulandı</p>
                      <button onClick={handleRemoveCoupon} className="text-xs text-emerald-400 hover:text-emerald-300">
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Ara Toplam:</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} ₺</span>
                  </div>
                  {appliedCoupon && discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-400">
                      <span>İndirim ({appliedCoupon.discount_type === 'PERCENTAGE' ? `${appliedCoupon.discount_value}%` : 'Sabit'}):</span>
                      <span className="font-semibold">-{discount.toFixed(2)} ₺</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-zinc-800">
                    <span>Toplam:</span>
                    <span className="text-pink-400">{total.toFixed(2)} ₺</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-3 mb-6 pb-6 border-b border-zinc-800">
                  <h3 className="text-sm font-semibold mb-3">👤 Teslimat Bilgileriniz</h3>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Telefon Numarası"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
                  />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email (opsiyonel)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
                  />
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || cartItems.length === 0 || !customerName.trim() || !customerPhone.trim()}
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition duration-200"
                >
                  {checkingOut ? '⏳ İşleniyor...' : '✓ Siparişi Tamamla'}
                </button>

                <p className="text-xs text-zinc-500 text-center mt-3">
                  💳 Ödeme işlemi yöneticiye gönderilecektir
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
