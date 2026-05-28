'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import { Order, OrderItem, Product, ProductVariant } from '@/app/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ── Zenginleştirilmiş Sipariş Öğesi ──────────────────────────────
interface RichOrderItem extends OrderItem {
  product?: Product
  variant?: ProductVariant | null
}

// ── Durum Rozeti ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: Order['status'] }) {
  const map: Record<Order['status'], { label: string; cls: string; icon: string }> = {
    PENDING:          { label: 'Beklemede',            icon: '⏳', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/10' },
    APPROVED:         { label: 'Onaylandı',            icon: '✅', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10' },
    REJECTED:         { label: 'Reddedildi',           icon: '❌', cls: 'bg-red-500/15 text-red-400 border-red-500/30 shadow-red-500/10' },
    CANCELLED:        { label: 'İptal Edildi',         icon: '🚫', cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30 shadow-zinc-500/10' },
    CANCEL_REQUESTED: { label: 'İptal İncelemede',     icon: '🔄', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30 shadow-orange-500/10' },
  }
  const s = map[status] ?? { label: status, icon: '❓', cls: 'bg-zinc-700 text-zinc-300 border-zinc-600' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm ${s.cls}`}>
      <span>{s.icon}</span>{s.label}
    </span>
  )
}

// ── Onay Modalı (İptal Talebi – APPROVED sipariş için) ───────────
function CancelRequestModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={!loading ? onClose : undefined}
      />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-black/50 animate-scaleIn">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white text-center mb-3">
          İptal Talebi Oluştur
        </h3>
        <p className="text-zinc-400 text-center text-sm leading-relaxed mb-8">
          Bu sipariş zaten onaylanmış durumda. İptal talebi oluşturduğunuzda,
          admin tarafından incelenecektir.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold rounded-xl transition disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-5 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              '📝 Evet, İptal Talebi Gönder'
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.25s ease-out; }
      `}</style>
    </div>
  )
}

// ── Direkt İptal Modalı (PENDING sipariş için) ───────────────────
function DirectCancelModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={!loading ? onClose : undefined}
      />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-black/50 animate-scaleIn">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/30 flex items-center justify-center">
            <span className="text-3xl">🚫</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white text-center mb-3">
          Siparişi İptal Et
        </h3>
        <p className="text-zinc-400 text-center text-sm leading-relaxed mb-8">
          Bu siparişi iptal etmek istediğinize emin misiniz?
          İptal işlemi geri alınamaz.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold rounded-xl transition disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                İptal ediliyor...
              </>
            ) : (
              '🚫 Evet, İptal Et'
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.25s ease-out; }
      `}</style>
    </div>
  )
}

// ── Toast Bildirimi ───────────────────────────────────────────────
function SuccessToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="fixed top-6 right-6 z-[110] animate-slideIn">
      <div className="bg-emerald-500/10 border border-emerald-500/40 backdrop-blur-lg rounded-xl px-6 py-4 shadow-2xl shadow-emerald-500/10 flex items-center gap-3 max-w-sm">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">✅</span>
        </div>
        <p className="text-sm font-medium text-emerald-300">{message}</p>
        <button onClick={onDismiss} className="text-emerald-400/50 hover:text-emerald-300 transition ml-2 flex-shrink-0">✕</button>
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.35s ease-out; }
      `}</style>
    </div>
  )
}

// ── Sipariş Kartı (Genişletilebilir) ──────────────────────────────
function OrderCard({
  order,
  items,
  onDirectCancel,
  onCancelRequest,
  cancelling,
}: {
  order: Order
  items: RichOrderItem[]
  onDirectCancel: (orderId: number) => void
  onCancelRequest: (orderId: number) => void
  cancelling: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const isPending = order.status === 'PENDING'
  const isApproved = order.status === 'APPROVED'
  const isCancelRequested = order.status === 'CANCEL_REQUESTED'
  const isCancelled = order.status === 'CANCELLED'

  // Sipariş kartı kenar rengi duruma göre
  const borderColorMap: Record<string, string> = {
    PENDING:          'border-amber-500/20 hover:border-amber-500/40',
    APPROVED:         'border-emerald-500/20 hover:border-emerald-500/40',
    REJECTED:         'border-red-500/20 hover:border-red-500/30',
    CANCELLED:        'border-zinc-700 hover:border-zinc-600',
    CANCEL_REQUESTED: 'border-orange-500/20 hover:border-orange-500/40',
  }
  const borderCls = borderColorMap[order.status] || 'border-zinc-800 hover:border-zinc-700'

  // İlk ürünün thumbnail'i: variant_image_url > color_image_url > product image
  const thumbnailUrl = items[0]?.variant_image_url
    ?? items[0]?.variant?.color_image_url
    ?? items[0]?.product?.image_url
    ?? null

  return (
    <div className={`bg-zinc-900/80 backdrop-blur-sm border ${borderCls} rounded-2xl overflow-hidden transition-all duration-300`}>
      {/* Sipariş Başlığı */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-zinc-800/40 transition text-left group"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Thumbnail */}
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt="Sipariş"
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-zinc-700 group-hover:border-pink-500/30 transition"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700">
              <span className="text-2xl">📦</span>
            </div>
          )}
          {/* Sipariş Bilgisi */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-base font-bold text-white">Sipariş #{order.id}</p>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>
                📅 {new Date(order.created_at).toLocaleDateString('tr-TR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>{items.length} ürün</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-lg font-black bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
              {order.total_price.toFixed(2)} ₺
            </p>
          </div>
          <span className={`text-zinc-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Genişletilmiş Detay */}
      {expanded && (
        <div className="border-t border-zinc-800 animate-expandIn">
          {/* Müşteri Bilgileri */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-4 text-sm text-zinc-400 flex-wrap">
              <span>👤 <span className="text-zinc-200 font-medium">{order.customer_name}</span></span>
              {order.customer_phone && <span>📞 {order.customer_phone}</span>}
              {order.customer_email && <span>📧 {order.customer_email}</span>}
            </div>
          </div>

          {/* Ürün Listesi */}
          <div className="px-5 py-3">
            <div className="bg-zinc-950/80 rounded-xl border border-zinc-800/50 divide-y divide-zinc-800/50">
              {items.map((item) => {
                const p = item.product
                // Resim: variant_image_url (order_items) → variant color_image → product image
                const imgUrl = item.variant_image_url
                  ?? item.variant?.color_image_url
                  ?? p?.image_url
                  ?? null

                // Fiyat: order_items.price (satın alma anındaki fiyat × miktar)
                const lineTotal = item.price

                return (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    {/* Ürün Resmi */}
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl}
                        alt={p?.title || 'Ürün'}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-zinc-700"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700">
                        <span className="text-2xl">🖼️</span>
                      </div>
                    )}

                    {/* Ürün Detayları */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white line-clamp-1">{p?.title ?? 'Ürün'}</p>
                      {/* Varyant adı */}
                      {item.variant_name && (
                        <p className="text-xs text-violet-400 font-medium mt-0.5">{item.variant_name}</p>
                      )}
                      <div className="flex gap-1.5 flex-wrap mt-1.5">
                        {item.variant?.color && (
                          <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-0.5 rounded-md border border-zinc-700/50">
                            🎨 {item.variant.color}
                          </span>
                        )}
                        {item.variant?.size_or_dimension && (
                          <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-0.5 rounded-md border border-zinc-700/50">
                            📏 {item.variant.size_or_dimension}
                          </span>
                        )}
                        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-md">
                          x{item.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Fiyat: order_items.price kullanılıyor */}
                    <p className="text-sm font-bold text-white flex-shrink-0">
                      {lineTotal.toFixed(2)} ₺
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alt Bar: Toplam + Kargo + İptal Butonları */}
          <div className="px-5 pb-5 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-950/50 rounded-xl border border-zinc-800/50 px-5 py-4 gap-4">
              <div>
                {/* Kargo bilgisi */}
                {order.shipping_price != null && order.shipping_price > 0 && (
                  <p className="text-xs text-zinc-500 mb-0.5">
                    🚚 Kargo: <span className="text-zinc-300 font-medium">{order.shipping_price.toFixed(2)} ₺</span>
                  </p>
                )}
                {order.shipping_price != null && order.shipping_price === 0 && (
                  <p className="text-xs text-emerald-400 mb-0.5">🚚 Kargo: Ücretsiz 🎉</p>
                )}
                <p className="text-xs text-zinc-500 font-medium uppercase mb-1">Sipariş Toplamı</p>
                <p className="text-2xl font-black bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
                  {order.total_price.toFixed(2)} ₺
                </p>
              </div>

              {/* ── İPTAL BUTONLARI ── */}

              {/* PENDING → Direkt İptal */}
              {isPending && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDirectCancel(order.id) }}
                  disabled={cancelling}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  <span>🚫</span> Siparişi İptal Et
                </button>
              )}

              {/* APPROVED → İptal Talebi */}
              {isApproved && (
                <button
                  onClick={(e) => { e.stopPropagation(); onCancelRequest(order.id) }}
                  disabled={cancelling}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 border border-orange-500/40 hover:border-orange-500 text-orange-400 hover:text-orange-300 text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  <span>📝</span> İptal Talebi Oluştur
                </button>
              )}

              {/* CANCEL_REQUESTED → İncelemede */}
              {isCancelRequested && (
                <span className="px-5 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-bold rounded-xl flex items-center gap-2 cursor-default">
                  <span className="w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                  İncelemede ⏳
                </span>
              )}

              {/* CANCELLED → İptal Edildi */}
              {isCancelled && (
                <span className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 text-zinc-500 text-sm font-bold rounded-xl cursor-default">
                  İptal Edildi ❌
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes expandIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 1200px; }
        }
        .animate-expandIn { animation: expandIn 0.3s ease-out; }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ANA SAYFA
// ═══════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<RichOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingAddress, setSavingAddress] = useState(false)
  const [cancelling, setCancelling] = useState<Record<number, boolean>>({})

  // Modal & Toast
  const [directCancelOrderId, setDirectCancelOrderId] = useState<number | null>(null)
  const [cancelRequestOrderId, setCancelRequestOrderId] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form state
  const [address, setAddress] = useState('')
  const [addressSaved, setAddressSaved] = useState(false)

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login?returnTo=/profile')
          return
        }

        setUser(user)

        // Siparişleri yükle (sadece bu kullanıcının)
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (ordersData && ordersData.length > 0) {
          setOrders(ordersData as Order[])

          // ── Sipariş öğelerini yükle (ürün & varyant bilgisiyle) ──
          const orderIds = ordersData.map((o: Order) => o.id)
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds)

          if (itemsData && itemsData.length > 0) {
            const productIds = [...new Set(itemsData.map((i: OrderItem) => i.product_id))]
            const variantIds = [...new Set(itemsData.map((i: OrderItem) => i.variant_id).filter(Boolean))] as number[]

            const [{ data: products }, { data: variants }] = await Promise.all([
              supabase.from('products').select('*').in('id', productIds),
              variantIds.length > 0
                ? supabase.from('product_variants').select('*').in('id', variantIds)
                : Promise.resolve({ data: [] as ProductVariant[] }),
            ])

            const richItems: RichOrderItem[] = itemsData.map((item: OrderItem) => ({
              ...item,
              product: (products ?? []).find((p: Product) => p.id === item.product_id),
              variant: (variants ?? []).find((v: ProductVariant) => v.id === item.variant_id) ?? null,
            }))

            setOrderItems(richItems)
          }
        }

        // LocalStorage'dan adresi yükle
        const savedAddress = localStorage.getItem('user_address')
        if (savedAddress) {
          setAddress(savedAddress)
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Adresi kaydet
  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault()
    setSavingAddress(true)
    try {
      if (address.trim()) {
        localStorage.setItem('user_address', address)
        setAddressSaved(true)
        setTimeout(() => setAddressSaved(false), 3000)
      }
    } catch (error) {
      console.error('Adres kaydedilirken hata:', error)
    } finally {
      setSavingAddress(false)
    }
  }

  // ── PENDING → Direkt İptal (CANCELLED) ──────────────────────────
  async function handleConfirmDirectCancel() {
    if (directCancelOrderId === null) return
    const orderId = directCancelOrderId
    setCancelling((p) => ({ ...p, [orderId]: true }))
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', orderId)
      if (!error) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o))
        setDirectCancelOrderId(null)
        setToastMessage('Siparişiniz başarıyla iptal edildi.')
      } else {
        alert(`Hata: ${error.message}`)
      }
    } finally {
      setCancelling((p) => ({ ...p, [orderId]: false }))
    }
  }

  // ── APPROVED → İptal Talebi (CANCEL_REQUESTED) ──────────────────
  async function handleConfirmCancelRequest() {
    if (cancelRequestOrderId === null) return
    const orderId = cancelRequestOrderId
    setCancelling((p) => ({ ...p, [orderId]: true }))
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'CANCEL_REQUESTED' })
        .eq('id', orderId)
      if (!error) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'CANCEL_REQUESTED' as const } : o))
        setCancelRequestOrderId(null)
        setToastMessage('İptal talebiniz admine iletildi. En kısa sürede değerlendirilecektir.')
      } else {
        alert(`Hata: ${error.message}`)
      }
    } finally {
      setCancelling((p) => ({ ...p, [orderId]: false }))
    }
  }

  // Çıkış yap
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
            <p className="text-zinc-400 text-sm">Profil yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Giriş yapmalısınız</p>
          <Link href="/auth/login" className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg transition">
            Giriş Yap
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100 flex flex-col">
      <Navbar />

      {/* Direkt İptal Modalı (PENDING) */}
      <DirectCancelModal
        isOpen={directCancelOrderId !== null}
        onClose={() => setDirectCancelOrderId(null)}
        onConfirm={handleConfirmDirectCancel}
        loading={directCancelOrderId !== null && !!cancelling[directCancelOrderId]}
      />

      {/* İptal Talebi Modalı (APPROVED) */}
      <CancelRequestModal
        isOpen={cancelRequestOrderId !== null}
        onClose={() => setCancelRequestOrderId(null)}
        onConfirm={handleConfirmCancelRequest}
        loading={cancelRequestOrderId !== null && !!cancelling[cancelRequestOrderId]}
      />

      {/* Başarı Toast */}
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-pink-500/30">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Profil Sayfası</h1>
              <p className="text-zinc-400 text-sm">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── 1. GENEL BİLGİLER ── */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">👤</span>
              <h2 className="text-xl font-bold">Genel Bilgiler</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <label className="text-xs font-semibold text-zinc-400 uppercase">E-posta Adresi</label>
                <p className="text-lg font-semibold text-white mt-2">{user.email}</p>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Hesap Oluşturma Tarihi</label>
                <p className="text-lg font-semibold text-white mt-2">
                  {new Date(user.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Kullanıcı ID</label>
                <p className="text-sm font-mono text-zinc-300 mt-2 truncate">{user.id}</p>
              </div>
            </div>
          </div>

          {/* ── 2. ADRES BİLGİLERİ ── */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🏠</span>
              <h2 className="text-xl font-bold">Adres Bilgilerim</h2>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Teslimat Adresi</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Şehir, sokak, bina no... vb."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition resize-none"
                  rows={4}
                />
              </div>

              {addressSaved && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                  <span>✅</span>
                  <p className="text-sm text-emerald-400">Adres başarıyla kaydedildi!</p>
                </div>
              )}

              <button
                type="submit"
                disabled={savingAddress}
                className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {savingAddress ? 'Kaydediliyor...' : '💾 Adresi Kaydet'}
              </button>
            </form>
          </div>

          {/* ── 3. SİPARİŞLERİM (Zenginleştirilmiş) ── */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <h2 className="text-xl font-bold">Siparişlerim</h2>
              </div>
              {orders.length > 0 && (
                <span className="text-xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1.5 rounded-full">
                  {orders.length} sipariş
                </span>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-4xl">📭</span>
                </div>
                <p className="text-zinc-400 mb-6 text-lg">Henüz sipariş vermemişsiniz</p>
                <Link href="/products" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-pink-500/20">
                  🛍️ Alışverişe Başla
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    items={orderItems.filter((item) => item.order_id === order.id)}
                    onDirectCancel={(id) => setDirectCancelOrderId(id)}
                    onCancelRequest={(id) => setCancelRequestOrderId(id)}
                    cancelling={!!cancelling[order.id]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── 4. ÇIKIŞ YAP ── */}
          <div className="md:col-span-2">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 font-bold py-4 rounded-xl transition duration-200 text-lg flex items-center justify-center gap-2"
            >
              <span>🚪</span> Çıkış Yap
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
