'use client'

import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────
// RPC DÖNÜŞ TİPLERİ (get_financial_and_stock_metrics çıktısı)
// ─────────────────────────────────────────────────────────────────
interface DailyStat {
  day: string            // "DD Mon" formatı (Örn: "15 Jun")
  revenue: number
  gross_profit: number
}

interface VelocityStat {
  variant_name: string   // "Ürün Adı (Renk Beden)" formatı
  current_stock: number
  sales_velocity: number // adet/gün (son 30 gün ortalaması)
  days_remaining: number // tahmini tükenme (9999 = satış yok)
}

interface DeadStockStat {
  variant_name: string
  current_stock: number
  selling_price: number
  capital_tied: number   // stok * maliyet (bağlı sermaye)
}

interface FinancialMetrics {
  total_revenue: number
  total_cogs: number
  total_orders: number
  low_stock_count: number
  daily_stats: DailyStat[] | null
  velocity_stats: VelocityStat[] | null
  dead_stock_stats: DeadStockStat[] | null
}

// ─────────────────────────────────────────────────────────────────
// YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────────────────────────
function formatCurrency(val: number): string {
  return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function profitColor(margin: number): string {
  if (margin >= 20) return 'text-emerald-400'
  if (margin >= 10) return 'text-amber-400'
  return 'text-red-400'
}

function profitBgColor(margin: number): string {
  if (margin >= 20) return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30'
  if (margin >= 10) return 'from-amber-500/20 to-amber-500/5 border-amber-500/30'
  return 'from-red-500/20 to-red-500/5 border-red-500/30'
}

// ─────────────────────────────────────────────────────────────────
// SVG BAR CHART BİLEŞENİ
// ─────────────────────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number }[]
  title: string
  color: string
  accentColor: string
}

function BarChart({ data, title, color, accentColor }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const chartWidth = 500
  const chartHeight = 200
  const barWidth = Math.max(12, (chartWidth - 40) / data.length - 4)
  const startX = 40

  return (
    <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5">
      <h4 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        {title}
      </h4>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full min-w-[400px]" style={{ maxHeight: 260 }}>
          {/* Y ekseni çizgileri */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight - chartHeight * ratio + 10
            return (
              <g key={ratio}>
                <line x1={startX - 5} y1={y} x2={chartWidth} y2={y} stroke="#27272a" strokeWidth="1" />
                <text x={startX - 10} y={y + 4} textAnchor="end" fill="#71717a" fontSize="9" fontFamily="monospace">
                  {formatCurrency(maxValue * ratio)}
                </text>
              </g>
            )
          })}

          {/* Barlar */}
          {data.map((d, i) => {
            const barHeight = (d.value / maxValue) * chartHeight
            const x = startX + i * (barWidth + 4)
            const y = chartHeight - barHeight + 10

            return (
              <g key={i}>
                <defs>
                  <linearGradient id={`grad-${title.replace(/\s/g, '')}-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} />
                    <stop offset="100%" stopColor={color} />
                  </linearGradient>
                </defs>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 1)}
                  rx={3}
                  fill={`url(#grad-${title.replace(/\s/g, '')}-${i})`}
                  className="transition-all duration-300"
                  opacity={0.85}
                />
                {/* X ekseni label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 25}
                  textAnchor="middle"
                  fill="#71717a"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {d.label}
                </text>
                {/* Değer üstte */}
                {d.value > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fill="#a1a1aa"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : d.value.toFixed(0)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// KPI KART BİLEŞENİ
// ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: string
  label: string
  value: string
  subtext?: string
  colorClass?: string
  bgClass?: string
}

function KpiCard({ icon, label, value, subtext, colorClass = 'text-white', bgClass = 'from-zinc-800/60 to-zinc-900/60 border-zinc-700/50' }: KpiCardProps) {
  return (
    <div className={`bg-gradient-to-br ${bgClass} border rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-black ${colorClass} tracking-tight`}>{value}</p>
      {subtext && <p className="text-xs text-zinc-500 mt-1.5">{subtext}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ANA BİLEŞEN
// ─────────────────────────────────────────────────────────────────
export default function AccountingAnalytics() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Simülatör State ───────────────────────────────────────────
  const [simPaytrRate, setSimPaytrRate] = useState(2.5)
  const [simExtraCost, setSimExtraCost] = useState(0)

  // ── Veri Yükle ────────────────────────────────────────────────
  const loadMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/accounting')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || 'API hatası')
      }
      const data: FinancialMetrics = await res.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMetrics() }, [loadMetrics])

  // ── Hesaplamalar ──────────────────────────────────────────────
  const totalRevenue = metrics?.total_revenue ?? 0
  const totalCogs = metrics?.total_cogs ?? 0
  const totalOrders = metrics?.total_orders ?? 0
  const lowStockCount = metrics?.low_stock_count ?? 0

  // PayTR komisyonu
  const paytrCommissionPercent = totalRevenue * (simPaytrRate / 100)
  const paytrCommissionFixed = totalOrders * 0.25
  const paytrCommission = paytrCommissionPercent + paytrCommissionFixed

  // Net kâr
  const netProfit = totalRevenue - totalCogs - paytrCommission - simExtraCost
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // ── Grafik Verisi (daily_stats) ───────────────────────────────
  const dailyStats = metrics?.daily_stats ?? []
  const revenueChartData = dailyStats.map((d) => ({
    label: d.day,
    value: d.revenue,
  }))
  const profitChartData = dailyStats.map((d) => ({
    label: d.day,
    value: d.gross_profit,
  }))

  // ── Stok Hızı Verisi (velocity_stats) ─────────────────────────
  const velocityStats = metrics?.velocity_stats ?? []

  // ── Ölü Stok Verisi (dead_stock_stats) ────────────────────────
  const deadStockStats = metrics?.dead_stock_stats ?? []

  // ── LOADING STATE ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <p className="text-zinc-400 text-sm">Finansal metrikler hesaplanıyor...</p>
        </div>
      </div>
    )
  }

  // ── ERROR STATE ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-400 font-semibold text-lg mb-2">Veri Yüklenemedi</p>
          <p className="text-red-400/70 text-sm mb-6">{error}</p>
          <button
            onClick={loadMetrics}
            className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-sm font-semibold rounded-xl transition"
          >
            🔄 Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── BAŞLIK ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📊 Muhasebe & Stok Analizi
          </h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Tüm veriler Supabase RPC üzerinden gerçek zamanlı hesaplanmaktadır.
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold rounded-xl transition text-sm"
        >
          🔄 Yenile
        </button>
      </div>

      {/* ── KPI KARTLARI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          icon="💰"
          label="Brüt Ciro"
          value={`${formatCurrency(totalRevenue)} ₺`}
          subtext={`${totalOrders} sipariş`}
          colorClass="text-white"
          bgClass="from-zinc-800/60 to-zinc-900/60 border-zinc-700/50"
        />
        <KpiCard
          icon="📦"
          label="Toplam COGS"
          value={`${formatCurrency(totalCogs)} ₺`}
          subtext="Satılan ürün maliyeti"
          colorClass="text-orange-400"
          bgClass="from-orange-500/15 to-orange-500/5 border-orange-500/30"
        />
        <KpiCard
          icon="🏦"
          label="PayTR Komisyonu"
          value={`${formatCurrency(paytrCommission)} ₺`}
          subtext={`%${simPaytrRate.toFixed(1)} + ${totalOrders}×0.25₺`}
          colorClass="text-violet-400"
          bgClass="from-violet-500/15 to-violet-500/5 border-violet-500/30"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          icon="📊"
          label="Net Kâr"
          value={`${formatCurrency(netProfit)} ₺`}
          subtext={simExtraCost > 0 ? `${formatCurrency(simExtraCost)} ₺ ekstra gider dahil` : 'Ciro - COGS - PayTR'}
          colorClass={profitColor(netMargin)}
          bgClass={profitBgColor(netMargin)}
        />
        <KpiCard
          icon="📈"
          label="Net Kâr Marjı"
          value={`%${netMargin.toFixed(1)}`}
          subtext={netMargin >= 20 ? 'Sağlıklı' : netMargin >= 10 ? 'Orta' : 'Düşük'}
          colorClass={profitColor(netMargin)}
          bgClass={profitBgColor(netMargin)}
        />
        <KpiCard
          icon="⚠️"
          label="Kritik Stok"
          value={`${lowStockCount} varyant`}
          subtext="Stok ≤ 5 olan varyantlar"
          colorClass={lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}
          bgClass={lowStockCount > 0 ? 'from-amber-500/15 to-amber-500/5 border-amber-500/30' : 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/30'}
        />
      </div>

      {/* ── İNTERAKTİF SİMÜLATÖR ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
          <span className="w-7 h-7 bg-pink-500/10 border border-pink-500/30 rounded-lg flex items-center justify-center text-sm">🎛️</span>
          Kârlılık Simülatörü
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PayTR Oran Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Simüle Edilen PayTR Oranı
              </label>
              <span className="text-sm font-bold text-violet-400 bg-violet-500/15 px-3 py-1 rounded-lg">
                %{simPaytrRate.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={simPaytrRate}
              onChange={(e) => setSimPaytrRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-violet-500"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((simPaytrRate - 1) / 4) * 100}%, #27272a ${((simPaytrRate - 1) / 4) * 100}%, #27272a 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-zinc-600">
              <span>%1</span>
              <span>%2.5 (varsayılan)</span>
              <span>%5</span>
            </div>
          </div>

          {/* Ekstra Gider Input */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block">
              Simüle Edilen Ekstra Gider (₺)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={simExtraCost || ''}
              onChange={(e) => setSimExtraCost(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
            />
            <p className="text-xs text-zinc-600">
              Kargo, ambalaj, reklam vb. ek maliyetleri simüle edin.
            </p>
          </div>
        </div>

        {/* Simülasyon Sonuçları */}
        <div className="mt-6 p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Komisyon</p>
              <p className="text-sm font-bold text-violet-400">{formatCurrency(paytrCommission)} ₺</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Ekstra Gider</p>
              <p className="text-sm font-bold text-zinc-300">{formatCurrency(simExtraCost)} ₺</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Net Kâr</p>
              <p className={`text-sm font-bold ${profitColor(netMargin)}`}>{formatCurrency(netProfit)} ₺</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Kâr Marjı</p>
              <p className={`text-sm font-bold ${profitColor(netMargin)}`}>%{netMargin.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRAFİKLER (daily_stats) ── */}
      {dailyStats.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-sm">📈</span>
            Son {dailyStats.length} Gün — Günlük Trendler
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChart
              data={revenueChartData}
              title="Günlük Ciro (₺)"
              color="#ec4899"
              accentColor="#f472b6"
            />
            <BarChart
              data={profitChartData}
              title="Günlük Brüt Kâr (₺)"
              color="#10b981"
              accentColor="#34d399"
            />
          </div>
        </div>
      )}

      {/* ── SATIŞ HIZI & TÜKENME ANALİZİ (velocity_stats) ── */}
      {velocityStats.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-sm">🚀</span>
              Satış Hızı & Tükenme Analizi
            </h3>
            <span className="text-xs text-zinc-500">En hızlı {velocityStats.length} varyant</span>
          </div>

          {/* Tablo Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-3 bg-zinc-950/60 text-xs font-semibold text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
            <div className="col-span-4">Ürün / Varyant</div>
            <div className="col-span-2 text-right">Satış Hızı</div>
            <div className="col-span-2 text-right">Mevcut Stok</div>
            <div className="col-span-2 text-right">Kalan Gün</div>
            <div className="col-span-2 text-right">Durum</div>
          </div>

          {/* Tablo Satırları */}
          <div className="divide-y divide-zinc-800">
            {velocityStats.map((item, idx) => {
              const days = item.days_remaining
              let statusLabel = ''
              let statusClass = ''

              if (days < 15) {
                statusLabel = '🔴 Kritik Acil Tedarik'
                statusClass = 'bg-red-500/15 text-red-400 border-red-500/30'
              } else if (days >= 9999) {
                statusLabel = '⏸️ Satış Yok'
                statusClass = 'bg-zinc-800 text-zinc-600 border-zinc-700'
              } else if (days > 100) {
                statusLabel = '⚪ Ölü Stok Riski'
                statusClass = 'bg-zinc-800 text-zinc-500 border-zinc-700'
              } else {
                statusLabel = '🟢 Normal'
                statusClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }

              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 px-6 py-3.5 items-center hover:bg-zinc-800/30 transition"
                >
                  {/* Ürün */}
                  <div className="col-span-4">
                    <p className="text-sm font-semibold text-zinc-100 line-clamp-1">{item.variant_name}</p>
                  </div>

                  {/* Satış Hızı */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-bold text-zinc-300">
                      {item.sales_velocity.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-600 ml-1">adet/gün</span>
                  </div>

                  {/* Mevcut Stok */}
                  <div className="col-span-2 text-right">
                    <span className={`text-sm font-bold ${
                      item.current_stock <= 5 ? 'text-amber-400' : 'text-zinc-300'
                    }`}>
                      {item.current_stock}
                    </span>
                  </div>

                  {/* Kalan Gün */}
                  <div className="col-span-2 text-right">
                    <span className={`text-sm font-bold ${
                      days < 15 ? 'text-red-400' :
                      days >= 9999 ? 'text-zinc-600' :
                      days > 100 ? 'text-zinc-500' :
                      'text-zinc-300'
                    }`}>
                      {days >= 9999 ? '—' : `${Math.round(days)} gün`}
                    </span>
                  </div>

                  {/* Durum */}
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ÖLÜ STOK RİSKİ TABLOSU (dead_stock_stats) ── */}
      {deadStockStats.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center text-sm">💀</span>
              Ölü Stok Riski (45+ gündür satılmayan)
            </h3>
            <span className="text-xs text-zinc-500">{deadStockStats.length} varyant</span>
          </div>

          {/* Tablo Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-3 bg-zinc-950/60 text-xs font-semibold text-zinc-500 uppercase tracking-wide border-b border-zinc-800">
            <div className="col-span-4">Ürün / Varyant</div>
            <div className="col-span-2 text-right">Mevcut Stok</div>
            <div className="col-span-3 text-right">Satış Fiyatı</div>
            <div className="col-span-3 text-right">Bağlı Sermaye</div>
          </div>

          {/* Tablo Satırları */}
          <div className="divide-y divide-zinc-800">
            {deadStockStats.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 px-6 py-3.5 items-center hover:bg-zinc-800/30 transition"
              >
                {/* Ürün */}
                <div className="col-span-4">
                  <p className="text-sm font-semibold text-zinc-100 line-clamp-1">{item.variant_name}</p>
                </div>

                {/* Mevcut Stok */}
                <div className="col-span-2 text-right">
                  <span className="text-sm font-bold text-zinc-400">{item.current_stock}</span>
                </div>

                {/* Satış Fiyatı */}
                <div className="col-span-3 text-right">
                  <span className="text-sm font-bold text-zinc-300">{formatCurrency(item.selling_price)} ₺</span>
                </div>

                {/* Bağlı Sermaye */}
                <div className="col-span-3 text-right">
                  <span className={`text-sm font-bold ${item.capital_tied > 500 ? 'text-red-400' : item.capital_tied > 100 ? 'text-amber-400' : 'text-zinc-400'}`}>
                    {formatCurrency(item.capital_tied)} ₺
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Toplam Bağlı Sermaye */}
          <div className="px-6 py-4 bg-zinc-950/60 border-t border-zinc-800">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-9 text-right">
                <span className="text-xs font-semibold text-zinc-400 uppercase">Toplam Bağlı Sermaye</span>
              </div>
              <div className="col-span-3 text-right">
                <span className="text-sm font-black text-red-400">
                  {formatCurrency(deadStockStats.reduce((sum, item) => sum + item.capital_tied, 0))} ₺
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VERİ YOK DURUMU ── */}
      {velocityStats.length === 0 && deadStockStats.length === 0 && dailyStats.length === 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-10 text-center">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-zinc-400 font-semibold">Henüz yeterli sipariş verisi yok</p>
          <p className="text-xs text-zinc-600 mt-1">
            Grafikler ve stok analizleri sipariş alındıkça otomatik olarak oluşturulacaktır.
          </p>
        </div>
      )}

      {/* ── BİLGİ NOTU ── */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">ℹ️</span>
        <div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            <strong className="text-zinc-300">Hesaplama Yöntemi:</strong> Brüt ciro, iptal edilmemiş siparişlerin toplamıdır.
            COGS, sipariş anındaki maliyet fiyatı (<code className="text-pink-400">cost_price_at_sale</code>) üzerinden hesaplanır.
            PayTR komisyonu, Ciro × %Oran + Sipariş Sayısı × 0.25₺ formülüyle dinamik hesaplanır.
            Ölü stok riski, son 45 gündür hiç satılmayan stoklu varyantları gösterir.
          </p>
        </div>
      </div>
    </div>
  )
}
