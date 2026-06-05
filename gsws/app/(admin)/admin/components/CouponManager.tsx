'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/app/utils/supabase/client'

// ── Kupon Tipi ─────────────────────────────────────────────────────
interface Coupon {
  id: number
  code: string
  discount_type: 'PERCENTAGE' | 'FIXED'
  discount_value: number
  is_active: boolean
  created_at: string
  usage_count?: number
}

// ── Boş form ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  code: '',
  discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  discount_value: '',
  is_active: true,
}

export default function CouponManager() {
  const supabase = createClient()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ── Kuponları yükle ───────────────────────────────────────────────
  const loadCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCoupons((data as Coupon[]) || [])
    } catch (err) {
      console.error('Kupon yükleme hatası:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadCoupons() }, [loadCoupons])

  // ── Toast temizleyici ─────────────────────────────────────────────
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => { setSuccess(null); setError(null) }, 3500)
      return () => clearTimeout(t)
    }
  }, [success, error])

  // ── Kupon Ekle ────────────────────────────────────────────────────
  async function handleAddCoupon(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.code.trim()) return setError('Kupon kodu boş olamaz.')
    const val = parseFloat(form.discount_value)
    if (isNaN(val) || val <= 0) return setError('Geçerli bir indirim miktarı girin.')
    if (form.discount_type === 'PERCENTAGE' && val > 100) return setError('Yüzde indirim 100\'den fazla olamaz.')

    setSaving(true)
    try {
      const { error: insertErr } = await supabase.from('coupons').insert({
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: val,
        is_active: form.is_active,
      })
      if (insertErr) throw insertErr
      setSuccess(`✅ "${form.code.toUpperCase()}" kuponu başarıyla oluşturuldu!`)
      setForm(EMPTY_FORM)
      await loadCoupons()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // Duplicate code hatası
      if (msg.includes('duplicate') || msg.includes('unique')) {
        setError('Bu kupon kodu zaten mevcut. Farklı bir kod deneyin.')
      } else {
        setError(`Hata: ${msg}`)
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Kupon Aktif/Pasif Toggle ──────────────────────────────────────
  async function handleToggleActive(coupon: Coupon) {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id)
    if (!error) {
      setCoupons((prev) =>
        prev.map((c) => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c)
      )
    }
  }

  // ── Kupon Sil ─────────────────────────────────────────────────────
  async function handleDelete(id: number, code: string) {
    if (!confirm(`"${code}" kuponunu silmek istediğinize emin misiniz?`)) return
    setDeletingId(id)
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id)
      if (error) throw error
      setCoupons((prev) => prev.filter((c) => c.id !== id))
      setSuccess(`🗑️ "${code}" kuponu silindi.`)
    } catch (err) {
      setError(`Silme hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">🎟️ Kupon Yönetimi</h2>
        <div className="text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
          <span className="font-semibold text-violet-400">{coupons.filter((c) => c.is_active).length}</span> aktif kupon
        </div>
      </div>

      {/* Toast */}
      {(success || error) && (
        <div className={`mb-6 px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
          success
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {success || error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Yeni Kupon Formu ─────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-7 h-7 bg-violet-500/20 border border-violet-500/30 rounded-lg flex items-center justify-center text-sm">➕</span>
              Yeni Kupon Oluştur
            </h3>
            <form onSubmit={handleAddCoupon} className="space-y-4">
              {/* Kupon Kodu */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  Kupon Kodu *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="TAHA20, SUMMER30..."
                  maxLength={20}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition"
                />
              </div>

              {/* İndirim Tipi */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  İndirim Tipi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'PERCENTAGE' as const, label: '% Yüzde', icon: '%' },
                    { value: 'FIXED' as const, label: '₺ Sabit Tutar', icon: '₺' },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, discount_type: opt.value })}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition ${
                        form.discount_type === opt.value
                          ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                          : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* İndirim Miktarı */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  {form.discount_type === 'PERCENTAGE' ? 'İndirim Yüzdesi (%)' : 'İndirim Tutarı (₺)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === 'PERCENTAGE' ? '20' : '50'}
                    min="0"
                    max={form.discount_type === 'PERCENTAGE' ? '100' : undefined}
                    step={form.discount_type === 'PERCENTAGE' ? '1' : '0.01'}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">
                    {form.discount_type === 'PERCENTAGE' ? '%' : '₺'}
                  </span>
                </div>
              </div>

              {/* Aktif/Pasif */}
              <div className="flex items-center justify-between bg-zinc-950 border border-zinc-700 rounded-xl p-4">
                <div>
                  <p className="text-sm font-semibold text-white">Kupon Aktif</p>
                  <p className="text-xs text-zinc-500">Kullanıcılar bu kuponu kullanabilsin</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500" />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-violet-500/10"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Kaydediliyor...
                  </span>
                ) : '🎟️ Kuponu Oluştur'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Kupon Listesi ──────────────────────────────── */}
        <div className="lg:col-span-2">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-sm">📋</span>
            Mevcut Kuponlar
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <p className="text-4xl mb-3">🎟️</p>
              <p className="text-zinc-400">Henüz kupon oluşturulmamış</p>
              <p className="text-xs text-zinc-600 mt-1">Sol taraftaki formu kullanarak ilk kuponunuzu oluşturun</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`bg-zinc-900 border rounded-xl p-4 transition ${
                    coupon.is_active
                      ? 'border-violet-500/30 hover:border-violet-500/60'
                      : 'border-zinc-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Sol: Kupon Bilgileri */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        coupon.is_active ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-zinc-800 border border-zinc-700'
                      }`}>
                        <span className="text-lg">{coupon.discount_type === 'PERCENTAGE' ? '%' : '₺'}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-black font-mono text-white">{coupon.code}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                            coupon.is_active
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                          }`}>
                            {coupon.is_active ? '● Aktif' : '○ Pasif'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-0.5">
                          {coupon.discount_type === 'PERCENTAGE'
                            ? `%${coupon.discount_value} indirim`
                            : `${coupon.discount_value.toFixed(2)} ₺ indirim`}
                        </p>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          Oluşturuldu: {new Date(coupon.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>

                    {/* Sağ: Aksiyonlar */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Toggle Aktif */}
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        title={coupon.is_active ? 'Pasife Al' : 'Aktife Al'}
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                          coupon.is_active
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {coupon.is_active ? '⏸ Pasif' : '▶ Aktif'}
                      </button>

                      {/* Sil */}
                      <button
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        disabled={deletingId === coupon.id}
                        title="Kuponu Sil"
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-400 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        {deletingId === coupon.id ? (
                          <span className="w-3 h-3 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin inline-block" />
                        ) : '🗑️ Sil'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
