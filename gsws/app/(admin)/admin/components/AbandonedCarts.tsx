'use client'

import { CartWithProduct } from '@/app/types'

interface AbandonedCartsProps {
  abandonedCarts: Array<{ userId: string; items: CartWithProduct[]; totalValue: number }>
  sendingReminder: Record<string, boolean>
  reminderSent: Record<string, boolean>
  onSendReminder: (userId: string) => void
}

export default function AbandonedCarts({
  abandonedCarts,
  sendingReminder,
  reminderSent,
  onSendReminder,
}: AbandonedCartsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">🛒 Terkedilmiş Sepetler Analizi</h2>
        <div className="text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
          <span className="font-semibold text-orange-400">{abandonedCarts.length}</span> kullanıcı
        </div>
      </div>

      {abandonedCarts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-zinc-400">Terkedilmiş sepet bulunmuyor</p>
        </div>
      ) : (
        <div className="space-y-4">
          {abandonedCarts.map((cart) => (
            <div
              key={cart.userId}
              className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6 md:items-start">
                {/* Sol: Kullanıcı + Ürün Listesi */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white font-mono">{cart.userId.slice(0, 8)}...</p>
                      <p className="text-xs text-zinc-500">{cart.items.length} ürün türü · {cart.items.reduce((s, i) => s + i.quantity, 0)} adet</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {cart.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                        {item.product?.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product.image_url}
                            alt={item.product.title}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl">🖼️</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white line-clamp-1">{item.product?.title}</p>
                          {item.variant_id && (
                            <p className="text-xs text-violet-400">{item.quantity} adet · varyant seçili</p>
                          )}
                          <p className="text-xs text-zinc-400">{item.quantity} adet</p>
                        </div>
                        <p className="text-sm font-bold text-pink-400 flex-shrink-0">
                          {(
                            item.quantity *
                            (item.product?.is_discount_active && item.product?.discount_price
                              ? item.product.discount_price
                              : item.product?.price || 0)
                          ).toFixed(2)} ₺
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sağ: Toplam + Buton */}
                <div className="flex flex-col items-end gap-3 min-w-[160px]">
                  <div className="text-right bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 w-full">
                    <p className="text-xs text-zinc-400 mb-1">Sepet Toplam</p>
                    <p className="text-2xl font-bold text-orange-400">{cart.totalValue.toFixed(2)} ₺</p>
                  </div>

                  {reminderSent[cart.userId] ? (
                    <div className="w-full px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold rounded-xl text-center">
                      ✅ Mail Gönderildi
                    </div>
                  ) : (
                    <button
                      onClick={() => onSendReminder(cart.userId)}
                      disabled={sendingReminder[cart.userId]}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
                    >
                      {sendingReminder[cart.userId] ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>✉️ Hatırlatma Maili Gönder</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
