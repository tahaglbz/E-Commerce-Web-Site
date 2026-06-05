'use client'

import Link from 'next/link'
import { Order, OrderItem, Product } from '@/app/types'

// ── Yardımcı: Sipariş öğesi listesi ───────────────────────────────
function OrderItemList({ items, products }: { items: OrderItem[]; products: Product[] }) {
  if (items.length === 0) return <p className="text-xs text-zinc-500">Ürün bilgisi bulunamadı</p>
  return (
    <ul className="space-y-3">
      {items.map((item, idx) => {
        const product = products.find((p) => p.id === item.product_id)
        const imgUrl = item.variant_image_url || product?.image_url || null
        return (
          <li key={idx} className="text-xs text-zinc-400 flex items-center justify-between gap-3 pb-3 border-b border-zinc-800 last:border-0">
            <div className="flex items-center gap-3 flex-1">
              {imgUrl ? (
                <Link href={`/products/${product?.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt={product?.title || ''} className="w-12 h-12 rounded-lg object-cover hover:opacity-80 transition cursor-pointer" />
                </Link>
              ) : (
                <Link href={`/products/${product?.id}`}>
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-lg hover:opacity-80 transition cursor-pointer">🖼️</div>
                </Link>
              )}
              <div className="flex-1">
                <Link href={`/products/${product?.id}`}>
                  <p className="text-sm text-zinc-300 hover:text-pink-400 transition cursor-pointer font-medium">{product?.title}</p>
                </Link>
                {item.variant_name && <p className="text-xs text-violet-400 font-medium">{item.variant_name}</p>}
                <p className="text-xs text-zinc-500">x{item.quantity}</p>
              </div>
            </div>
            <span className="font-semibold text-emerald-400 whitespace-nowrap">{item.price.toFixed(2)} ₺</span>
          </li>
        )
      })}
    </ul>
  )
}

// ── Props ──────────────────────────────────────────────────────────
interface OrderManagementProps {
  pendingOrders: Order[]
  approvedOrders: Order[]
  cancelRequestedOrders: Order[]
  orderItems: OrderItem[]
  products: Product[]
  trackingCodes: Record<number, string>
  savingTracking: Record<number, boolean>
  onApprove: (orderId: number) => void
  onCancel: (orderId: number) => void
  onApproveCancelRequest: (orderId: number) => void
  onRejectCancelRequest: (orderId: number) => void
  onSaveTrackingCode: (orderId: number) => void
  onTrackingCodeChange: (orderId: number, value: string) => void
  activeSubTab: 'pending' | 'approved' | 'cancel-requests'
  onSubTabChange: (tab: 'pending' | 'approved' | 'cancel-requests') => void
}

export default function OrderManagement({
  pendingOrders,
  approvedOrders,
  cancelRequestedOrders,
  orderItems,
  products,
  trackingCodes,
  savingTracking,
  onApprove,
  onCancel,
  onApproveCancelRequest,
  onRejectCancelRequest,
  onSaveTrackingCode,
  onTrackingCodeChange,
  activeSubTab,
  onSubTabChange,
}: OrderManagementProps) {
  const subTabs = [
    { id: 'pending' as const, label: '⏳ Onay Bekliyor', count: pendingOrders.length, color: 'amber' },
    { id: 'approved' as const, label: '✅ Onaylananlar', count: approvedOrders.length, color: 'emerald' },
    { id: 'cancel-requests' as const, label: '🔴 İptal Talepleri', count: cancelRequestedOrders.length, color: 'red' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">📋 Sipariş Yönetimi</h2>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-0 overflow-x-auto">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSubTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap -mb-px ${
              activeSubTab === tab.id
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 bg-pink-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── ONAY BEKLİYOR ── */}
      {activeSubTab === 'pending' && (
        pendingOrders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-zinc-400">Onay bekleme listesi boş</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => {
              const items = orderItems.filter((oi) => oi.order_id === order.id)
              return (
                <div key={order.id} className="bg-zinc-900 border-2 border-amber-500/30 hover:border-amber-500 rounded-xl p-6 transition">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-white">{order.customer_name}</h3>
                          <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">⏳ ONAY BEKLİYOR</span>
                          <span className="text-xs text-zinc-500">#{order.id}</span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">📞 {order.customer_phone}</p>
                        {order.customer_email && <p className="text-sm text-zinc-400">📧 {order.customer_email}</p>}
                        {order.customer_address && <p className="text-sm text-zinc-400">🏠 {order.customer_address}</p>}
                        <p className="text-xs text-zinc-500 mt-1">
                          📅 {new Date(order.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="bg-zinc-950 rounded-lg p-4">
                        <p className="text-xs font-semibold text-zinc-300 mb-3">Sipariş Öğeleri:</p>
                        <OrderItemList items={items} products={products} />
                      </div>
                    </div>
                    <div className="flex flex-col justify-between md:items-end gap-3">
                      <div className="text-right">
                        <p className="text-xs text-zinc-400">Toplam Tutar</p>
                        <p className="text-2xl font-bold text-emerald-400">{order.total_price.toFixed(2)} ₺</p>
                        {order.shipping_price != null && (
                          <p className="text-xs text-zinc-500">Kargo: {order.shipping_price === 0 ? 'Ücretsiz' : `${order.shipping_price.toFixed(2)} ₺`}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onApprove(order.id)}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition"
                      >
                        ✅ Siparişi Onayla
                      </button>
                      <button
                        onClick={() => onCancel(order.id)}
                        className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 hover:border-red-500 text-red-400 text-sm font-bold rounded-xl transition"
                      >
                        🚫 İptal Et
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── ONAYLANANLAR ── */}
      {activeSubTab === 'approved' && (
        approvedOrders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-zinc-400">Onaylanan sipariş bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvedOrders.map((order) => {
              const items = orderItems.filter((oi) => oi.order_id === order.id)
              return (
                <div key={order.id} className="bg-zinc-900 border-2 border-emerald-500/30 hover:border-emerald-500 rounded-xl p-6 transition">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-white">{order.customer_name}</h3>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">✅ ONAYLANDI</span>
                        <span className="text-xs text-zinc-500">#{order.id}</span>
                      </div>
                      <div className="bg-zinc-950 rounded-lg p-4 space-y-1.5">
                        <p className="text-sm font-semibold text-zinc-300 mb-2">Müşteri Detayları:</p>
                        <p className="text-sm text-zinc-400">📞 {order.customer_phone}</p>
                        {order.customer_email && <p className="text-sm text-zinc-400">📧 {order.customer_email}</p>}
                        {order.customer_address && <p className="text-sm text-zinc-400">🏠 {order.customer_address}</p>}
                        <p className="text-xs text-zinc-500 pt-1">
                          📅 {new Date(order.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="bg-zinc-950 rounded-lg p-4">
                        <p className="text-xs font-semibold text-zinc-300 mb-3">Sipariş Öğeleri:</p>
                        <OrderItemList items={items} products={products} />
                      </div>
                      {/* Kargo Takip */}
                      <div className="bg-zinc-950 rounded-lg p-4">
                        <p className="text-xs font-semibold text-zinc-300 mb-3">🚚 Kargo Takip Kodu:</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Takip kodunu girin..."
                            value={trackingCodes[order.id] ?? order.tracking_code ?? ''}
                            onChange={(e) => onTrackingCodeChange(order.id, e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
                          />
                          <button
                            onClick={() => onSaveTrackingCode(order.id)}
                            disabled={savingTracking[order.id]}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white font-semibold text-sm rounded-lg transition"
                          >
                            {savingTracking[order.id] ? '💾...' : '💾 Kaydet'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between md:items-end gap-3">
                      <div className="text-right bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <p className="text-xs text-zinc-400">Toplam Tutar</p>
                        <p className="text-3xl font-bold text-emerald-400">{order.total_price.toFixed(2)} ₺</p>
                        {order.shipping_price != null && (
                          <p className="text-xs text-zinc-500 mt-1">Kargo: {order.shipping_price === 0 ? 'Ücretsiz' : `${order.shipping_price.toFixed(2)} ₺`}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onCancel(order.id)}
                        className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 hover:border-red-500 text-red-400 text-sm font-bold rounded-xl transition"
                      >
                        🚫 Siparişi İptal Et
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── İPTAL TALEPLERİ ── */}
      {activeSubTab === 'cancel-requests' && (
        cancelRequestedOrders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-zinc-400">Bekleyen iptal talebi yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cancelRequestedOrders.map((order) => (
              <div key={order.id} className="bg-zinc-900 border-2 border-orange-500/30 hover:border-orange-500 rounded-xl p-6 transition">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-white">{order.customer_name}</h3>
                      <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded border border-orange-500/20">⏳ İPTAL TALEBİ</span>
                      <span className="text-xs text-zinc-500">#{order.id}</span>
                    </div>
                    <div className="bg-zinc-950 rounded-lg p-4 space-y-1.5">
                      <p className="text-sm text-zinc-400">📞 {order.customer_phone}</p>
                      {order.customer_email && <p className="text-sm text-zinc-400">📧 {order.customer_email}</p>}
                      {order.customer_address && <p className="text-sm text-zinc-400">🏠 {order.customer_address}</p>}
                      <p className="text-xs text-zinc-500">
                        📅 {new Date(order.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="bg-zinc-950 rounded-lg p-4">
                      <p className="text-xs font-semibold text-zinc-300 mb-3">Sipariş Öğeleri:</p>
                      <OrderItemList items={orderItems.filter((oi) => oi.order_id === order.id)} products={products} />
                    </div>
                  </div>
                  <div className="flex flex-col justify-between md:items-end gap-3">
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">Toplam Tutar</p>
                      <p className="text-2xl font-bold text-orange-400">{order.total_price.toFixed(2)} ₺</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onApproveCancelRequest(order.id)}
                        className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition"
                      >
                        🚫 İptali Onayla
                      </button>
                      <button
                        onClick={() => onRejectCancelRequest(order.id)}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition"
                      >
                        ✅ Talebi Reddet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
