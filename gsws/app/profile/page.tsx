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

// ── Kargo Takip Linki Üretici ───────────────────────────────────────
function getTrackingUrl(carrier: string, code: string): string {
  const c = carrier?.trim() || ''
  switch (c) {
    case 'Yurtiçi Kargo': return `https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=${code}`
    case 'MNG Kargo': return `https://www.mngkargo.com.tr/wps/portal/mng/main/kargotakip?cargoKey=${code}`
    case 'Aras Kargo': return `https://kargotakip.araskargo.com.tr/?trackNo=${code}`
    case 'PTT Kargo': return `https://www.ptt.gov.tr/tr/subpages/kargotakip?barcode=${code}`
    case 'Sendeo': return `https://kargotakip.sendeo.com.tr/kargo-takip-popup?gonderiNo=${code}`
    case 'Sürat Kargo': return `https://www.suratkargo.com.tr/kargo-takip/?takip_no=${code}`
    case 'UPS Kargo': return `https://www.ups.com.tr/kargo-takip?takipNo=${code}`
    case 'Kargoist': return `https://www.kargoist.com.tr/kargo-takip?code=${code}`
    default: return '#'
  }
}

// ── Durum Rozeti ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: Order['status'] }) {
  const map: Record<Order['status'], { label: string; cls: string; icon: string }> = {
    PENDING: { label: 'Beklemede', icon: '⏳', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    APPROVED: { label: 'Onaylandı', icon: '✅', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    SHIPPED: { label: 'Kargoya Verildi', icon: '🚚', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    REJECTED: { label: 'Reddedildi', icon: '❌', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    CANCELLED: { label: 'İptal Edildi', icon: '🚫', cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
    CANCEL_REQUESTED: { label: 'İptal İncelemede', icon: '🔄', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  }
  const s = map[status] ?? { label: status, icon: '❓', cls: 'bg-zinc-700 text-zinc-300 border-zinc-600' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm ${s.cls}`}>
      <span>{s.icon}</span>{s.label}
    </span>
  )
}

// ── İptal Talebi Modalı ───────────────────────────────────────────
function CancelRequestModal({ isOpen, onClose, onConfirm, loading }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; loading: boolean
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center"><span className="text-3xl">⚠️</span></div>
        </div>
        <h3 className="text-xl font-bold text-white text-center mb-3">İptal Talebi Oluştur</h3>
        <p className="text-zinc-400 text-center text-sm leading-relaxed mb-8">Bu sipariş zaten onaylanmış durumda. İptal talebi oluşturduğunuzda, admin tarafından incelenecektir.</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold rounded-xl transition disabled:opacity-50">Vazgeç</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-5 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Gönderiliyor...</> : '📝 Evet, İptal Talebi Gönder'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Direkt İptal Modalı ──────────────────────────────────────────
function DirectCancelModal({ isOpen, onClose, onConfirm, loading }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; loading: boolean
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/30 flex items-center justify-center"><span className="text-3xl">🚫</span></div>
        </div>
        <h3 className="text-xl font-bold text-white text-center mb-3">Siparişi İptal Et</h3>
        <p className="text-zinc-400 text-center text-sm leading-relaxed mb-8">Bu siparişi iptal etmek istediğinize emin misiniz? İptal işlemi geri alınamaz.</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold rounded-xl transition disabled:opacity-50">Vazgeç</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />İptal ediliyor...</> : '🚫 Evet, İptal Et'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────
function SuccessToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => { const timer = setTimeout(onDismiss, 4000); return () => clearTimeout(timer) }, [onDismiss])
  return (
    <div className="fixed top-6 right-6 z-[110] animate-slideIn">
      <div className="bg-emerald-500/10 border border-emerald-500/40 backdrop-blur-lg rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 max-w-sm">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><span className="text-lg">✅</span></div>
        <p className="text-sm font-medium text-emerald-300">{message}</p>
        <button onClick={onDismiss} className="text-emerald-400/50 hover:text-emerald-300 transition ml-2 flex-shrink-0">✕</button>
      </div>
      <style jsx>{`@keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } } .animate-slideIn { animation: slideIn 0.35s ease-out; }`}</style>
    </div>
  )
}

// ── Kargo Bilgisi Kartı ───────────────────────────────────────────
function ShippingInfoCard({
  carrier,
  trackingCode,
  isShipped
}: {
  carrier: string | null | undefined;
  trackingCode: string | null | undefined;
  isShipped: boolean
}) {
  const hasCarrier = !!carrier?.trim()
  const hasTrackingCode = !!trackingCode?.trim()
  const trackingUrl = isShipped && hasCarrier && hasTrackingCode
    ? getTrackingUrl(carrier!, trackingCode!)
    : null

  // Eğer kargoya verilmediyse ama kargo bilgisi varsa bile gösterme (opsiyonel)
  // Veya her durumda göster: isShipped kontrolünü kaldırabilirsiniz
  if (!isShipped && !hasTrackingCode) return null

  return (
    <div className="px-5 pt-2 pb-2">
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📦</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-400">
              {isShipped ? 'Kargonuz Yolda!' : 'Kargo Bilgileri'}
            </h4>
            <p className="text-xs text-zinc-400">
              {isShipped
                ? 'Siparişiniz kargoya verildi ve yolda.'
                : 'Siparişiniz için kargo bilgileri hazır.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {hasCarrier && (
            <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50">
              <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Kargo Firması</p>
              <p className="text-sm font-bold text-white">{carrier}</p>
            </div>
          )}
          {hasTrackingCode && (
            <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50">
              <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Takip Kodu</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono font-bold text-blue-400">{trackingCode}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(trackingCode!)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded-lg transition"
                  title="Kopyala"
                >
                  📋
                </button>
              </div>
            </div>
          )}
        </div>

        {trackingUrl && trackingUrl !== '#' ? (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            <span>🚚</span> Kargo Takip Et <span className="text-blue-200">↗</span>
          </a>
        ) : hasTrackingCode ? (
          <div className="w-full flex items-center justify-between px-4 py-3 bg-zinc-950/50 border border-zinc-700 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Takip Kodu:</span>
              <span className="text-sm font-mono font-bold text-zinc-200">{trackingCode}</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(trackingCode!)}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition"
            >
              📋 Kopyala
            </button>
          </div>
        ) : (
          <div className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-700 rounded-xl text-center">
            <p className="text-xs text-zinc-500">Kargo takip bilgisi henüz girilmemiş.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sipariş Kartı ─────────────────────────────────────────────────
interface OrderWithShipping extends Order {
  shipping_carrier?: string | null
  tracking_code?: string | null
}

function OrderCard({
  order,
  items,
  onDirectCancel,
  onCancelRequest,
  cancelling,
}: {
  order: OrderWithShipping
  items: RichOrderItem[]
  onDirectCancel: (orderId: number) => void
  onCancelRequest: (orderId: number) => void
  cancelling: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const isPending = order.status === 'PENDING'
  const isApproved = order.status === 'APPROVED'
  const isShipped = order.status === 'SHIPPED'
  const isCancelRequested = order.status === 'CANCEL_REQUESTED'
  const isCancelled = order.status === 'CANCELLED'

  const borderColorMap: Record<string, string> = {
    PENDING: 'border-amber-500/20 hover:border-amber-500/40',
    APPROVED: 'border-emerald-500/20 hover:border-emerald-500/40',
    SHIPPED: 'border-blue-500/20 hover:border-blue-500/40',
    REJECTED: 'border-red-500/20 hover:border-red-500/30',
    CANCELLED: 'border-zinc-700 hover:border-zinc-600',
    CANCEL_REQUESTED: 'border-orange-500/20 hover:border-orange-500/40',
  }
  const borderCls = borderColorMap[order.status] || 'border-zinc-800 hover:border-zinc-700'

  const thumbnailUrl = items[0]?.variant_image_url ?? items[0]?.variant?.color_image_url ?? items[0]?.product?.image_url ?? null

  // Kargo bilgilerini güvenli şekilde al
  const carrier = order.shipping_carrier?.trim() || null
  const trackingCode = order.tracking_code?.trim() || null
  const hasCarrier = !!carrier
  const hasTrackingCode = !!trackingCode

  return (
    <div className={`bg-zinc-900/80 backdrop-blur-sm border ${borderCls} rounded-2xl overflow-hidden transition-all duration-300`}>
      {/* KAPALI BAŞLIK */}
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-5 hover:bg-zinc-800/40 transition text-left group">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="Sipariş" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-zinc-700 group-hover:border-pink-500/30 transition" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700"><span className="text-2xl">📦</span></div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-base font-bold text-white">Sipariş #{order.id}</p>
              <StatusBadge status={order.status} />
              {/* KAPALI durumda SHIPPED ise mini kargo rozet */}
              {isShipped && hasCarrier && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  🚚 {carrier}
                </span>
              )}
              {/* KAPALI durumda takip kodu varsa göster */}
              {hasTrackingCode && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  #{trackingCode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>📅 {new Date(order.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>•</span>
              <span>{items.length} ürün</span>
              {isShipped && hasTrackingCode && (
                <>
                  <span>•</span>
                  <span className="text-blue-400 font-mono">#{trackingCode}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-lg font-black bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">{order.total_price.toFixed(2)} ₺</p>
          </div>
          <span className={`text-zinc-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {/* AÇIK DETAY */}
      {expanded && (
        <div className="border-t border-zinc-800">
          {/* Müşteri Bilgileri */}
          <div className="px-5 pt-4 pb-2">
            <div className="bg-zinc-950/60 rounded-xl border border-zinc-800/50 p-4 space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Sipariş Bilgileri</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm"><span className="text-zinc-500">👤</span><span className="text-zinc-300 font-medium">{order.customer_name}</span></div>
                {order.customer_phone && <div className="flex items-center gap-2 text-sm"><span className="text-zinc-500">📞</span><span className="text-zinc-300">{order.customer_phone}</span></div>}
                {order.customer_email && <div className="flex items-center gap-2 text-sm"><span className="text-zinc-500">📧</span><span className="text-zinc-300">{order.customer_email}</span></div>}
              </div>
              {order.customer_address && <div className="flex items-start gap-2 text-sm pt-1 border-t border-zinc-800/50 mt-2"><span className="text-zinc-500 mt-0.5">🏠</span><span className="text-zinc-300 leading-relaxed">{order.customer_address}</span></div>}
            </div>
          </div>

          {/* KARGO DURUMU BANNERI - Her durumda göster */}
          <ShippingInfoCard
            carrier={order.shipping_carrier}
            trackingCode={order.tracking_code}
            isShipped={isShipped}
          />

          {/* Ürün Listesi */}
          <div className="px-5 py-3">
            <div className="bg-zinc-950/80 rounded-xl border border-zinc-800/50 divide-y divide-zinc-800/50">
              {items.map((item) => {
                const p = item.product
                const imgUrl = item.variant_image_url ?? item.variant?.color_image_url ?? p?.image_url ?? null
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    {imgUrl ? <img src={imgUrl} alt={p?.title || 'Ürün'} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-zinc-700" /> : <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700"><span className="text-2xl">🖼️</span></div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white line-clamp-1">{p?.title ?? 'Ürün'}</p>
                      {item.variant_name && <p className="text-xs text-violet-400 font-medium mt-0.5">{item.variant_name}</p>}
                      <div className="flex gap-1.5 flex-wrap mt-1.5">
                        {item.variant?.color && <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-0.5 rounded-md border border-zinc-700/50">🎨 {item.variant.color}</span>}
                        {item.variant?.size_or_dimension && <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-0.5 rounded-md border border-zinc-700/50">📏 {item.variant.size_or_dimension}</span>}
                        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-md">x{item.quantity}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white flex-shrink-0">{item.price.toFixed(2)} ₺</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alt Bar */}
          <div className="px-5 pb-5 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-950/50 rounded-xl border border-zinc-800/50 px-5 py-4 gap-4">
              <div>
                {order.shipping_price != null && order.shipping_price > 0 && <p className="text-xs text-zinc-500 mb-0.5">🚚 Kargo: <span className="text-zinc-300 font-medium">{order.shipping_price.toFixed(2)} ₺</span></p>}
                {order.shipping_price != null && order.shipping_price === 0 && <p className="text-xs text-emerald-400 mb-0.5">🚚 Kargo: Ücretsiz 🎉</p>}
                <p className="text-xs text-zinc-500 font-medium uppercase mb-1">Sipariş Toplamı</p>
                <p className="text-2xl font-black bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">{order.total_price.toFixed(2)} ₺</p>
              </div>
              {isPending && <button onClick={(e) => { e.stopPropagation(); onDirectCancel(order.id) }} disabled={cancelling} className="px-5 py-2.5 bg-gradient-to-r from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2"><span>🚫</span> Siparişi İptal Et</button>}
              {isApproved && <button onClick={(e) => { e.stopPropagation(); onCancelRequest(order.id) }} disabled={cancelling} className="px-5 py-2.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 border border-orange-500/40 hover:border-orange-500 text-orange-400 hover:text-orange-300 text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2"><span>📝</span> İptal Talebi Oluştur</button>}
              {isShipped && hasTrackingCode && (
                <a
                  href={getTrackingUrl(carrier!, trackingCode!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  <span>📦</span> Kargo Takip Et
                </a>
              )}
              {isCancelRequested && <span className="px-5 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-bold rounded-xl flex items-center gap-2 cursor-default"><span className="w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />İncelemede ⏳</span>}
              {isCancelled && <span className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 text-zinc-500 text-sm font-bold rounded-xl cursor-default">İptal Edildi ❌</span>}
            </div>
          </div>
        </div>
      )}
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
  const [orders, setOrders] = useState<OrderWithShipping[]>([])
  const [orderItems, setOrderItems] = useState<RichOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingAddress, setSavingAddress] = useState(false)
  const [cancelling, setCancelling] = useState<Record<number, boolean>>({})

  const [directCancelOrderId, setDirectCancelOrderId] = useState<number | null>(null)
  const [cancelRequestOrderId, setCancelRequestOrderId] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [address, setAddress] = useState('')
  const [addressSaved, setAddressSaved] = useState(false)

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login?returnTo=/profile'); return }
        setUser(user)

        // ✅ DÜZELTME: .select('*') kullanarak tüm sütunları tip-güvenli çek
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (ordersError) {
          console.error('Orders fetch error:', ordersError)
          setLoading(false)
          return
        }

        if (ordersData && ordersData.length > 0) {
          // DEBUG: Log first order fields
          console.log('First order fields:', Object.keys(ordersData[0]))
          console.log('First order shipping_carrier:', (ordersData[0] as any).shipping_carrier)
          console.log('First order tracking_code:', (ordersData[0] as any).tracking_code)

          // ✅ DÜZELTME: Açık tip dönüşümü ile kargo alanlarını garantile
          const typedOrders: OrderWithShipping[] = ordersData.map((o: any) => ({
            ...o,
            shipping_carrier: o.shipping_carrier ?? null,
            tracking_code: o.tracking_code ?? null,
          }))
          setOrders(typedOrders)

          const orderIds = ordersData.map((o: any) => o.id)

          // ✅ DÜZELTME: order_items sorgusunu da tip-güvenli hale getir
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds)

          if (itemsError) {
            console.error('Order items fetch error:', itemsError)
            setLoading(false)
            return
          }

          if (itemsData && itemsData.length > 0) {
            const productIds = [...new Set(itemsData.map((i: any) => i.product_id))]
            const variantIds = [...new Set(itemsData.map((i: any) => i.variant_id).filter(Boolean))] as number[]

            const [{ data: products }, { data: variants }] = await Promise.all([
              supabase.from('products').select('*').in('id', productIds),
              variantIds.length > 0
                ? supabase.from('product_variants').select('*').in('id', variantIds)
                : Promise.resolve({ data: [] as ProductVariant[] }),
            ])

            const richItems: RichOrderItem[] = itemsData.map((item: any) => ({
              ...item,
              product: (products ?? []).find((p: Product) => p.id === item.product_id),
              variant: (variants ?? []).find((v: ProductVariant) => v.id === item.variant_id) ?? null,
            }))
            setOrderItems(richItems)
          }
        }

        const savedAddress = localStorage.getItem('user_address')
        if (savedAddress) setAddress(savedAddress)
      } catch (error) {
        console.error('Profil yükleme hatası:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUserData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault(); setSavingAddress(true)
    try {
      if (address.trim()) {
        localStorage.setItem('user_address', address);
        setAddressSaved(true);
        setTimeout(() => setAddressSaved(false), 3000)
      }
    } catch (error) {
      console.error('Adres kaydedilirken hata:', error)
    } finally {
      setSavingAddress(false)
    }
  }

  async function handleConfirmDirectCancel() {
    if (directCancelOrderId === null) return
    const orderId = directCancelOrderId
    setCancelling((p) => ({ ...p, [orderId]: true }))
    try {
      const { error } = await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', orderId)
      if (!error) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o));
        setDirectCancelOrderId(null);
        setToastMessage('Siparişiniz başarıyla iptal edildi.')
      } else {
        alert(`Hata: ${error.message}`)
      }
    } finally {
      setCancelling((p) => ({ ...p, [orderId]: false }))
    }
  }

  async function handleConfirmCancelRequest() {
    if (cancelRequestOrderId === null) return
    const orderId = cancelRequestOrderId
    setCancelling((p) => ({ ...p, [orderId]: true }))
    try {
      const { error } = await supabase.from('orders').update({ status: 'CANCEL_REQUESTED' }).eq('id', orderId)
      if (!error) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'CANCEL_REQUESTED' as const } : o));
        setCancelRequestOrderId(null);
        setToastMessage('İptal talebiniz admine iletildi. En kısa sürede değerlendirilecektir.')
      } else {
        alert(`Hata: ${error.message}`)
      }
    } finally {
      setCancelling((p) => ({ ...p, [orderId]: false }))
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/')
  }

  if (loading) return (
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

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-bold mb-4">Giriş yapmalısınız</p>
        <Link href="/auth/login" className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg transition">Giriş Yap</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100 flex flex-col">
      <Navbar />
      <DirectCancelModal
        isOpen={directCancelOrderId !== null}
        onClose={() => setDirectCancelOrderId(null)}
        onConfirm={handleConfirmDirectCancel}
        loading={directCancelOrderId !== null && !!cancelling[directCancelOrderId]}
      />
      <CancelRequestModal
        isOpen={cancelRequestOrderId !== null}
        onClose={() => setCancelRequestOrderId(null)}
        onConfirm={handleConfirmCancelRequest}
        loading={cancelRequestOrderId !== null && !!cancelling[cancelRequestOrderId]}
      />
      {toastMessage && <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />}

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
                  {new Date(user.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Kullanıcı ID</label>
                <p className="text-sm font-mono text-zinc-300 mt-2 truncate">{user.id}</p>
              </div>
            </div>
          </div>

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
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-pink-500/20"
                >
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