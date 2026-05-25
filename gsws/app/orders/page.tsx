'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import { Order, OrderItem, Product, ProductVariant } from '@/app/types'

// ── Sipariş Durumu Badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; style: string }> = {
    PENDING:   { label: 'Onay Bekliyor', style: 'bg-amber-500/10 border-amber-500/40 text-amber-400' },
    CONFIRMED: { label: 'Onaylandı',     style: 'bg-blue-500/10  border-blue-500/40  text-blue-400'  },
    SHIPPED:   { label: 'Kargoda',       style: 'bg-violet-500/10 border-violet-500/40 text-violet-400' },
    DELIVERED: { label: 'Teslim Edildi', style: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' },
    CANCELLED: { label: 'İptal',         style: 'bg-red-500/10   border-red-500/40   text-red-400'   },
  }
  const info = map[status] ?? { label: status, style: 'bg-zinc-700 border-zinc-600 text-zinc-300' }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${info.style}`}>
      {info.label}
    </span>
  )
}

// ── Sipariş Öğesi Satırı ──────────────────────────────────────────
interface RichOrderItem extends OrderItem {
  product?: Product
  variant?: ProductVariant | null
}

function OrderCard({ order, items }: { order: Order; items: RichOrderItem[] }) {
  const [expanded, setExpanded] = useState(false)
  const formattedDate = new Date(order.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition hover:border-zinc-700">
      {/* Sipariş Başlığı */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-zinc-800/40 transition text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Sipariş #{order.id}</p>
            <p className="text-xs text-zinc-500">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-white">{order.total_price.toFixed(2)} ₺</p>
            <p className="text-xs text-zinc-500">{items.length} ürün</p>
          </div>
          <StatusBadge status={order.status} />
          <span className={`text-zinc-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Sipariş Detayları */}
      {expanded && (
        <div className="border-t border-zinc-800 p-5">
          {order.customer_name && (
            <p className="text-xs text-zinc-500 mb-4">
              Alıcı: <span className="text-zinc-300 font-medium">{order.customer_name}</span>
              {order.customer_phone && (
                <> — <span className="text-zinc-300 font-medium">{order.customer_phone}</span></>
              )}
            </p>
          )}

          <div className="space-y-3">
            {items.map((item) => {
              const p = item.product
              const base = p ? (p.is_discount_active && p.discount_price ? p.discount_price : p.price) : 0
              const additional = item.variant?.additional_price ?? 0
              return (
                <div key={item.id} className="flex gap-3 items-center">
                  {p?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.variant?.color_image_url ?? p.image_url}
                      alt={p.title}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-zinc-800"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🖼️</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white line-clamp-1">{p?.title ?? 'Ürün'}</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {item.variant?.color && (
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{item.variant.color}</span>
                      )}
                      {item.variant?.size_or_dimension && (
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{item.variant.size_or_dimension}</span>
                      )}
                      <span className="text-xs text-zinc-600">x{item.quantity}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white flex-shrink-0">
                    {((base + additional) * item.quantity).toFixed(2)} ₺
                  </p>
                </div>
              )
            })}
          </div>

          {/* Toplam */}
          <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
            <span className="text-sm text-zinc-400">Sipariş Toplamı</span>
            <span className="text-lg font-black text-emerald-400">{order.total_price.toFixed(2)} ₺</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ANA SAYFA
// ─────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [orders, setOrders]   = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<RichOrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login?returnTo=/orders'); return }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!ordersData || ordersData.length === 0) { setLoading(false); return }
      setOrders(ordersData as Order[])

      const orderIds = ordersData.map((o) => o.id)
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)

      if (!itemsData) { setLoading(false); return }

      const productIds = [...new Set(itemsData.map((i) => i.product_id))]
      const variantIds = [...new Set(itemsData.map((i) => i.variant_id).filter(Boolean))]

      const [{ data: products }, { data: variants }] = await Promise.all([
        supabase.from('products').select('*').in('id', productIds),
        variantIds.length > 0
          ? supabase.from('product_variants').select('*').in('id', variantIds)
          : Promise.resolve({ data: [] }),
      ])

      const richItems: RichOrderItem[] = itemsData.map((item) => ({
        ...item,
        product: (products ?? []).find((p: Product) => p.id === item.product_id),
        variant: (variants ?? []).find((v: ProductVariant) => v.id === item.variant_id) ?? null,
      }))

      setOrderItems(richItems)
      setLoading(false)
    }
    loadOrders()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
        <p className="text-zinc-400 text-sm">Siparişler yükleniyor...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900/60 border-b border-zinc-800/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-pink-500 hover:text-pink-400 text-sm font-medium transition flex items-center gap-1.5">
            ← Ana Sayfa
          </Link>
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            🎁 TC Gift Shop
          </Link>
          <Link href="/cart" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition">
            🛒 Sepet
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">📋 Siparişlerim</h1>
          <p className="text-zinc-400 mt-2">Tüm sipariş geçmişiniz ve durumları</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-7xl mb-5">📭</p>
            <h2 className="text-2xl font-bold text-white mb-3">Henüz siparişiniz yok</h2>
            <p className="text-zinc-400 mb-8">İlk siparişinizi vermek için alışverişe başlayın.</p>
            <Link href="/products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-600
                hover:opacity-90 text-white font-bold rounded-xl transition shadow-lg shadow-pink-500/20">
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
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
