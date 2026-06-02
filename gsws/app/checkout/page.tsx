'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import { UnifiedCartItem, Product, ProductVariant } from '@/app/types'
import { getLocalCart, clearLocalCart, syncLocalCartToSupabase } from '@/app/utils/cartUtils'

// ── Konfeti Parçacığı ─────────────────────────────────────────────
interface ConfettiPiece {
  id: number
  x: number
  color: string
  size: number
  duration: number
  delay: number
}

function Confetti() {
  const colors = ['#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899']
  const pieces: ConfettiPiece[] = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 6,
    duration: Math.random() * 2 + 2,
    delay: Math.random() * 1.5,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm opacity-90"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

// ── Başarı Modalı ─────────────────────────────────────────────────
function SuccessModal({ orderId, onNavigate }: { orderId: number; onNavigate: () => void }) {
  return (
    <>
      <Confetti />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full p-10 text-center
          shadow-2xl shadow-violet-500/10 animate-[scaleIn_.4s_ease-out]">

          {/* Animasyonlu onay ikonu */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500
              rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <span className="text-5xl">✅</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Siparişiniz Alındı!</h2>
          <p className="text-emerald-400 font-bold text-lg mb-4">#{orderId}</p>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Ödemeniz <span className="text-amber-400 font-semibold">sembolik olarak</span> alındı.{' '}
            Siparişiniz admin onayından sonra işleme alınacaktır. 🎉
          </p>

          <div className="space-y-3">
            <button
              onClick={onNavigate}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90
                text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-pink-500/20"
            >
              📋 Siparişlerimi Görüntüle
            </button>
            <Link href="/products"
              className="w-full flex items-center justify-center border border-zinc-700
                hover:border-violet-500 text-zinc-400 hover:text-white font-medium py-3 rounded-xl transition">
              🛍️ Alışverişe Devam Et
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Input Komponenti ──────────────────────────────────────────────
function FormInput({
  label, id, type = 'text', value, onChange, placeholder, maxLength, required = false,
  hint,
}: {
  label: string; id: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; maxLength?: number
  required?: boolean; hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-pink-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100
          placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30
          transition duration-200"
      />
      {hint && <p className="text-xs text-zinc-600 mt-1">{hint}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ANA CHECKOUT SAYFASI
// ─────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()

  // ── Auth & Sepet ─────────────────────────────────────────────────
  const [userId, setUserId]       = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<UnifiedCartItem[]>([])
  const [loading, setLoading]     = useState(true)

  // ── Kişisel Bilgiler ─────────────────────────────────────────────
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [phone, setPhone]           = useState('')
  const [address, setAddress]       = useState('')
  const [city, setCity]             = useState('')
  const [district, setDistrict]     = useState('')

  // ── Sembolik Kart Bilgileri ───────────────────────────────────────
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc]       = useState('')
  const [cardHolder, setCardHolder] = useState('')

  // ── UI ───────────────────────────────────────────────────────────
  const [submitting, setSubmitting]     = useState(false)
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)

  // ── Kart Numarası Formatlama ──────────────────────────────────────
  function formatCardNumber(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }

  // ── Veri Yükleme ─────────────────────────────────────────────────
  useEffect(() => {
    async function loadCheckout() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/auth/login?returnTo=/checkout'); return }
        setUserId(user.id)
        setUserEmail(user.email || null)

        // localStorage'daki ürünleri DB'ye senkronize et (giriş sonrası geldiyse)
        await syncLocalCartToSupabase(user.id)

        // Supabase'den sepeti çek
        const { data: dbCart } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)

        if (!dbCart || dbCart.length === 0) {
          router.replace('/cart')
          return
        }

        // Ürün ve varyant detaylarını çek
        const productIds = [...new Set(dbCart.map((c) => c.product_id))]
        const variantIds = [...new Set(dbCart.map((c) => c.variant_id).filter(Boolean))]

        const [{ data: products }, { data: variants }] = await Promise.all([
          supabase.from('products').select('*').in('id', productIds),
          variantIds.length > 0
            ? supabase.from('product_variants').select('*').in('id', variantIds)
            : Promise.resolve({ data: [] }),
        ])

        const unified: UnifiedCartItem[] = dbCart.map((ci) => ({
          key: `remote-${ci.id}`,
          product_id: ci.product_id,
          variant_id: ci.variant_id,
          quantity: ci.quantity,
          source: 'remote' as const,
          remote_id: ci.id,
          product: (products ?? []).find((p: Product) => p.id === ci.product_id),
          variant: (variants ?? []).find((v: ProductVariant) => v.id === ci.variant_id) ?? null,
        }))

        setCartItems(unified)
      } catch (err) {
        console.error('[Checkout] load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCheckout()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fiyat Hesabı ─────────────────────────────────────────────────
  const subtotal = cartItems.reduce((total, item) => {
    const p = item.product
    if (!p) return total
    const base = p.is_discount_active && p.discount_price ? p.discount_price : p.price
    const additional = item.variant?.additional_price ?? 0
    return total + (base + additional) * item.quantity
  }, 0)
  const afterDiscount = Math.max(0, subtotal - couponDiscount)
  // ── Kargo Baremi: 1500 TL üzeri ücretsiz, altında 150 TL ──
  const FREE_SHIPPING_THRESHOLD = 1500
  const SHIPPING_FEE = 150
  const shippingCost = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = afterDiscount + shippingCost

  // ── Sipariş Oluştur ───────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || cartItems.length === 0) return
    if (!firstName || !lastName || !phone || !address) {
      alert('Lütfen zorunlu alanları doldurunuz.')
      return
    }
    if (!cardNumber || !cardExpiry || !cardCvc || !cardHolder) {
      alert('Lütfen kart bilgilerini eksiksiz doldurunuz.')
      return
    }

    setSubmitting(true)
    try {
      // ── 1) Order kaydı oluştur ────────────────────────────────────
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          customer_name: `${firstName} ${lastName}`.trim(),
          customer_phone: phone,
          customer_email: userEmail,
          customer_address: `${address.trim()}${city ? ', ' + city.trim() : ''}${district ? ' / ' + district.trim() : ''}`,
          status: 'PENDING',
          total_price: total,
          shipping_price: shippingCost,
        })
        .select('id')
        .single()

      if (orderErr || !order) throw new Error(orderErr?.message ?? 'Sipariş oluşturulamadı')

      // ── 2) Order items ekle ───────────────────────────────────────
      const orderItemRows = cartItems.map((item) => {
        const p = item.product!
        const base = p.is_discount_active && p.discount_price ? p.discount_price : p.price
        const additional = item.variant?.additional_price ?? 0
        // Varyant bilgilerini oluştur
        const variantParts: string[] = []
        if (item.variant?.color) variantParts.push(item.variant.color)
        if (item.variant?.size_or_dimension) variantParts.push(item.variant.size_or_dimension)
        return {
          order_id: order.id,
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
          price: (base + additional) * item.quantity,
          selected_variants: {
            color: item.variant?.color ?? null,
            size_or_dimension: item.variant?.size_or_dimension ?? null,
          },
          variant_image_url: item.variant?.color_image_url ?? null,
          variant_name: variantParts.length > 0 ? variantParts.join(' / ') : null,
        }
      })

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItemRows)
      if (itemsErr) throw new Error(itemsErr.message)

      // ── 3) Sepeti temizle (DB + localStorage) ─────────────────────
      await supabase.from('cart_items').delete().eq('user_id', userId)
      clearLocalCart()

      // ── 4) Sipariş alındı bildirimi mailini gönder ────────────────
      try {
        await fetch('/api/order/notify-placed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        })
      } catch (emailError) {
        console.warn('Mail gönderme hatası (placed)', emailError)
      }

      // ── 5) Başarı modalı ──────────────────────────────────────────
      setSuccessOrderId(order.id)

    } catch (err) {
      console.error('[Checkout] submit error:', err)
      alert(`❌ Sipariş oluşturulurken hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`)
    } finally {
      setSubmitting(false)
    }
  }, [userId, userEmail, cartItems, firstName, lastName, phone, address, total, cardNumber, cardExpiry, cardCvc, cardHolder]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
        <p className="text-zinc-400 text-sm">Sepet yükleniyor...</p>
      </div>
    </div>
  )

  // ── Başarı Durumu ─────────────────────────────────────────────────
  if (successOrderId) return (
    <div className="min-h-screen bg-zinc-950">
      <SuccessModal
        orderId={successOrderId}
        onNavigate={() => router.push('/orders')}
      />
    </div>
  )

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      {/* Konfeti animasyon CSS */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.85); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/cart" className="text-pink-500 hover:text-pink-400 text-sm font-medium transition flex items-center gap-1.5">
            ← Sepete Dön
          </Link>
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            🎁 TC Gift Shop
          </Link>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Adım göstergesi */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[
            { step: 1, label: 'Sepet', done: true },
            { step: 2, label: 'Ödeme', active: true },
            { step: 3, label: 'Onay', done: false },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition
                ${s.active ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-500/20'
                  : s.done ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-500'}`}>
                <span>{s.done ? '✓' : s.step}</span>
                <span>{s.label}</span>
              </div>
              {i < 2 && <div className={`w-8 h-0.5 ${s.done ? 'bg-emerald-500' : 'bg-zinc-700'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ════════════════════════════════════════
                SOL: FORM ALANLARI (3/5)
            ════════════════════════════════════════ */}
            <div className="lg:col-span-3 space-y-6">

              {/* Kişisel Bilgiler */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">Kişisel Bilgiler</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput id="firstName" label="Ad" value={firstName} onChange={setFirstName}
                    placeholder="Taha" required />
                  <FormInput id="lastName" label="Soyad" value={lastName} onChange={setLastName}
                    placeholder="Gülbaz" required />
                </div>
                <FormInput id="phone" label="Telefon" type="tel" value={phone} onChange={setPhone}
                  placeholder="05XX XXX XX XX" required />
              </div>

              {/* Teslimat Adresi */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📦</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">Teslimat Adresi</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput id="city" label="Şehir" value={city} onChange={setCity} placeholder="İstanbul" />
                  <FormInput id="district" label="İlçe" value={district} onChange={setDistrict} placeholder="Kadıköy" />
                </div>
                <div>
                  <label htmlFor="address" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                    Açık Adres <span className="text-pink-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Sokak, Cadde, Bina No, Daire No..."
                    rows={3}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100
                      placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30
                      transition duration-200 resize-none"
                  />
                </div>
              </div>

              {/* Sembolik Ödeme Kartı */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg">💳</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Ödeme Bilgileri</h2>
                    <p className="text-xs text-amber-400 font-medium">⚠️ Sembolik — gerçek ödeme alınmaz</p>
                  </div>
                </div>

                {/* Kart Ön Görsel */}
                <div className="bg-gradient-to-br from-violet-600 to-pink-600 rounded-2xl p-5 h-40 relative overflow-hidden
                  shadow-xl shadow-violet-500/20 select-none mb-2">
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="absolute top-4 right-4 flex gap-1">
                    <div className="w-7 h-7 bg-amber-400 rounded-full opacity-80" />
                    <div className="w-7 h-7 bg-red-500 rounded-full opacity-80 -ml-2" />
                  </div>
                  <div className="absolute bottom-4 left-5 right-5">
                    <p className="text-white/80 font-mono text-base tracking-widest mb-2">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/50 text-xs uppercase">Kart Sahibi</p>
                        <p className="text-white font-semibold text-sm">{cardHolder || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/50 text-xs uppercase">Son Kul.</p>
                        <p className="text-white font-semibold text-sm">{cardExpiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <FormInput id="cardHolder" label="Kart Üzerindeki İsim" value={cardHolder}
                  onChange={setCardHolder} placeholder="TAHA GÜLBAZ" />

                <FormInput
                  id="cardNumber"
                  label="Kart Numarası"
                  value={cardNumber}
                  onChange={(v) => setCardNumber(formatCardNumber(v))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  hint="Sembolik — gerçek kart bilgisi girmenize gerek yok"
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    id="cardExpiry"
                    label="Son Kullanma"
                    value={cardExpiry}
                    onChange={(v) => setCardExpiry(formatExpiry(v))}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                  <FormInput
                    id="cardCvc"
                    label="CVC"
                    value={cardCvc}
                    onChange={(v) => setCardCvc(v.replace(/\D/g, '').slice(0, 3))}
                    placeholder="•••"
                    maxLength={3}
                    hint="Kartın arkasındaki 3 hane"
                  />
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════
                SAĞ: SİPARİŞ ÖZETİ (2/5)
            ════════════════════════════════════════ */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-5">🛒 Sipariş Özeti</h2>

                  {/* Ürün Listesi */}
                  <div className="space-y-3 mb-5">
                    {cartItems.map((item) => {
                      const p = item.product
                      if (!p) return null
                      const base = p.is_discount_active && p.discount_price ? p.discount_price : p.price
                      const additional = item.variant?.additional_price ?? 0
                      const lineTotal = (base + additional) * item.quantity
                      return (
                        <div key={item.key} className="flex gap-3 items-start">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.variant?.color_image_url ?? p.image_url} alt={p.title}
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-zinc-700" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                              <span className="text-xl">🖼️</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white line-clamp-1">{p.title}</p>
                            <div className="flex gap-1 flex-wrap mt-0.5">
                              {item.variant?.color && (
                                <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                                  {item.variant.color}
                                </span>
                              )}
                              {item.variant?.size_or_dimension && (
                                <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                                  {item.variant.size_or_dimension}
                                </span>
                              )}
                              <span className="text-xs text-zinc-500">x{item.quantity}</span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-white flex-shrink-0">{lineTotal.toFixed(2)} ₺</p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t border-zinc-800 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Ara Toplam</span>
                      <span>{subtotal.toFixed(2)} ₺</span>
                    </div>
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
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-pink-400">
                        <span>İndirim</span>
                        <span>-{couponDiscount.toFixed(2)} ₺</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-black text-white border-t border-zinc-800 pt-3 mt-2">
                      <span>Toplam</span>
                      <span className="text-emerald-400">{total.toFixed(2)} ₺</span>
                    </div>
                  </div>
                </div>

                {/* Güvenlik Rozeti */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">Güvenli Simülasyon</p>
                    <p className="text-xs text-zinc-500">Gerçek ödeme alınmaz. Tüm veriler güvendedir.</p>
                  </div>
                </div>

                {/* Submit Butonu */}
                <button
                  type="submit"
                  disabled={submitting || cartItems.length === 0}
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500
                    disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg py-4
                    rounded-2xl transition-all duration-200 shadow-xl shadow-pink-500/15
                    hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      İşleniyor...
                    </span>
                  ) : (
                    <>💳 Ödemeyi Yap — {total.toFixed(2)} ₺</>
                  )}
                </button>

                <p className="text-xs text-zinc-600 text-center">
                  Siparişi Tamamla butonuna basarak{' '}
                  <span className="text-zinc-400">kullanım koşullarını</span> kabul etmiş sayılırsınız.
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
