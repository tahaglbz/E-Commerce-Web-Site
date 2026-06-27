'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { Product, ProductVariant, Category } from '@/app/types'

// ─────────────────────────────────────────────────────────────────
// TIPLER
// ─────────────────────────────────────────────────────────────────
interface ProductWithVariants extends Product {
  variants: ProductVariant[]
  categoryName?: string
}

interface NewVariantRow {
  localId: string
  color: string
  color_image_url: string
  size_or_dimension: string
  stock: number
  additional_price: number
  cost_price: number
}

interface NewProductForm {
  title: string
  description: string
  price: string
  discount_price: string
  stock: string
  category_id: string
  image_url: string
  type: 'PHYSICAL' | 'DIGITAL'
}

const EMPTY_PRODUCT_FORM: NewProductForm = {
  title: '',
  description: '',
  price: '',
  discount_price: '',
  stock: '',
  category_id: '',
  image_url: '',
  type: 'PHYSICAL',
}

function newVariantRow(): NewVariantRow {
  return {
    localId: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    color: '',
    color_image_url: '',
    size_or_dimension: '',
    stock: 0,
    additional_price: 0,
    cost_price: 0,
  }
}

// ─────────────────────────────────────────────────────────────────
// ANA BİLEŞEN
// ─────────────────────────────────────────────────────────────────
export default function ProductListManager() {
  const supabase = createClient()

  // ── Veri ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductWithVariants[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // ── Genişletilmiş satırlar ────────────────────────────────────────
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // ── Inline güncelleme ─────────────────────────────────────────────
  // product inline: { [productId]: { price, stock } }
  const [inlineProduct, setInlineProduct] = useState<Record<number, { price: string; stock: string }>>({})
  // variant inline: { [variantId]: { stock, additional_price, cost_price } }
  const [inlineVariant, setInlineVariant] = useState<Record<number, { stock: string; additional_price: string; cost_price: string }>>({})
  const [savingProduct, setSavingProduct] = useState<Record<number, boolean>>({})
  const [savingVariant, setSavingVariant] = useState<Record<number, boolean>>({})

  // ── Yeni Ürün Modal ───────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState<NewProductForm>(EMPTY_PRODUCT_FORM)
  const [addVariants, setAddVariants] = useState<NewVariantRow[]>([newVariantRow()])
  const [addingProduct, setAddingProduct] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // ── Arama / Filtre ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCat, setFilterCat] = useState('')

  // ── Kategori Yönetimi ─────────────────────────────────────────────
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [deletingCatId, setDeletingCatId] = useState<number | null>(null)

  // ── Toast ─────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Veri Yükle ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: prodData },
        { data: varData },
        { data: catData },
      ] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('product_variants').select('*').order('id'),
        supabase.from('categories').select('*').order('name'),
      ])

      const cats = (catData as Category[]) || []
      setCategories(cats)

      const variants = (varData as ProductVariant[]) || []
      const merged: ProductWithVariants[] = ((prodData as Product[]) || []).map((p) => ({
        ...p,
        variants: variants.filter((v) => v.product_id === p.id),
        categoryName: cats.find((c) => c.id === p.category_id)?.name,
      }))
      setProducts(merged)
    } catch (err) {
      console.error('Veri yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // ─────────────────────────────────────────────────────────────────
  // SATIR GENİŞLETME
  // ─────────────────────────────────────────────────────────────────
  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ─────────────────────────────────────────────────────────────────
  // INLINE ÜRÜN GÜNCELLEME
  // ─────────────────────────────────────────────────────────────────
  function getInlineProduct(p: ProductWithVariants) {
    return inlineProduct[p.id] ?? { price: String(p.price), stock: String(p.stock) }
  }

  function setInlineProductField(id: number, field: 'price' | 'stock', val: string) {
    setInlineProduct((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: val },
    }))
  }

  async function saveProductInline(p: ProductWithVariants) {
    const vals = getInlineProduct(p)
    const price = parseFloat(vals.price)
    const stock = parseInt(vals.stock)
    if (isNaN(price) || isNaN(stock)) return showToast('Geçersiz değer', false)
    setSavingProduct((prev) => ({ ...prev, [p.id]: true }))
    const { error } = await supabase.from('products').update({ price, stock }).eq('id', p.id)
    setSavingProduct((prev) => ({ ...prev, [p.id]: false }))
    if (error) return showToast(`Hata: ${error.message}`, false)
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, price, stock } : x))
    showToast('✅ Ürün güncellendi')
  }

  // ─────────────────────────────────────────────────────────────────
  // INLINE VARYANT GÜNCELLEME
  // ─────────────────────────────────────────────────────────────────
  function getInlineVariant(v: ProductVariant) {
    return inlineVariant[v.id] ?? { stock: String(v.stock), additional_price: String(v.additional_price), cost_price: String(v.cost_price ?? 0) }
  }

  function setInlineVariantField(id: number, field: 'stock' | 'additional_price' | 'cost_price', val: string) {
    setInlineVariant((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: val },
    }))
  }

  async function saveVariantInline(v: ProductVariant, productId: number) {
    const vals = getInlineVariant(v)
    const stock = parseInt(vals.stock)
    const additional_price = parseFloat(vals.additional_price)
    const cost_price = parseFloat(vals.cost_price) || 0
    if (isNaN(stock) || isNaN(additional_price)) return showToast('Geçersiz değer', false)
    setSavingVariant((prev) => ({ ...prev, [v.id]: true }))
    const { error } = await supabase.from('product_variants').update({ stock, additional_price, cost_price }).eq('id', v.id)
    setSavingVariant((prev) => ({ ...prev, [v.id]: false }))
    if (error) return showToast(`Hata: ${error.message}`, false)
    setProducts((prev) => prev.map((p) =>
      p.id === productId
        ? { ...p, variants: p.variants.map((x) => x.id === v.id ? { ...x, stock, additional_price, cost_price } : x) }
        : p
    ))
    showToast('✅ Varyant güncellendi')
  }

  // ─────────────────────────────────────────────────────────────────
  // ÜRÜN SİL
  // ─────────────────────────────────────────────────────────────────
  async function deleteProduct(id: number, title: string) {
    if (!confirm(`"${title}" ürününü ve tüm varyantlarını silmek istediğinize emin misiniz?`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return showToast(`Silme hatası: ${error.message}`, false)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    showToast('🗑️ Ürün silindi')
  }

  // ─────────────────────────────────────────────────────────────────
  // YENİ ÜRÜN EKLE (Modal)
  // ─────────────────────────────────────────────────────────────────
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    if (!addForm.title.trim() || !addForm.price) {
      setAddError('Ürün adı ve fiyat zorunludur.'); return
    }
    const price = parseFloat(addForm.price)
    if (isNaN(price) || price <= 0) { setAddError('Geçerli bir fiyat girin.'); return }

    setAddingProduct(true)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('products')
        .insert({
          title: addForm.title.trim(),
          description: addForm.description.trim(),
          price,
          discount_price: addForm.discount_price ? parseFloat(addForm.discount_price) : null,
          stock: parseInt(addForm.stock) || 0,
          category_id: addForm.category_id ? parseInt(addForm.category_id) : null,
          image_url: addForm.image_url.trim() || null,
          type: addForm.type,
          is_discount_active: false,
        })
        .select('*')
        .single()

      if (insertErr || !inserted) throw new Error(insertErr?.message ?? 'Ürün eklenemedi')

      // Varyantlar
      const validVariants = addVariants.filter((v) => v.color.trim() || v.size_or_dimension.trim())
      if (validVariants.length > 0) {
        const variantRows = validVariants.map((v) => ({
          product_id: inserted.id,
          color: v.color.trim() || null,
          color_image_url: v.color_image_url.trim() || null,
          size_or_dimension: v.size_or_dimension.trim() || null,
          stock: Math.max(0, v.stock),
          additional_price: Math.max(0, v.additional_price),
          cost_price: Math.max(0, v.cost_price) || 0,
        }))
        const { error: varErr } = await supabase.from('product_variants').insert(variantRows)
        if (varErr) console.warn('Varyant ekleme kısmen başarısız:', varErr.message)
      }

      showToast(`✅ "${inserted.title}" başarıyla eklendi!`)
      setShowAddModal(false)
      setAddForm(EMPTY_PRODUCT_FORM)
      setAddVariants([newVariantRow()])
      await loadData()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Bilinmeyen hata')
    } finally {
      setAddingProduct(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // KATEGORİ EKLE / SİL
  // ─────────────────────────────────────────────────────────────────
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) return
    setAddingCat(true)
    const { error } = await supabase.from('categories').insert({ name: newCatName.trim() })
    setAddingCat(false)
    if (error) return showToast(`Kategori eklenemedi: ${error.message}`, false)
    setNewCatName('')
    showToast('✅ Kategori eklendi')
    await loadData()
  }

  async function handleDeleteCategory(id: number, name: string) {
    if (!confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return
    setDeletingCatId(id)
    const { error } = await supabase.from('categories').delete().eq('id', id)
    setDeletingCatId(null)
    if (error) return showToast(`Kategori silinemedi: ${error.message}`, false)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    showToast('🗑️ Kategori silindi')
  }

  // ─────────────────────────────────────────────────────────────────
  // FİLTRELİ ÜRÜNLER
  // ─────────────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = !filterCat || String(p.category_id) === filterCat
    return matchSearch && matchCat
  })

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all ${
          toast.ok
            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950 border-red-500/40 text-red-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── BAŞLIK + AKSİYONLAR ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">📦 Ürün & Kategori Yönetimi</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{products.length} ürün · {categories.length} kategori</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setAddError(null) }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-bold rounded-xl transition shadow-lg shadow-pink-500/10 text-sm whitespace-nowrap"
        >
          <span className="text-base">➕</span> Yeni Ürün Ekle
        </button>
      </div>

      {/* ── ARAMA / FİLTRE ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Ürün adında ara..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* ── ÜRÜN TABLOSU ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-zinc-400">Ürün bulunamadı</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Tablo Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            <div className="col-span-1" />
            <div className="col-span-4">Ürün</div>
            <div className="col-span-2">Kategori</div>
            <div className="col-span-2">Fiyat (₺)</div>
            <div className="col-span-1">Stok</div>
            <div className="col-span-2 text-right">İşlemler</div>
          </div>

          {/* Satırlar */}
          <div className="divide-y divide-zinc-800">
            {filtered.map((product) => {
              const isExpanded = expandedIds.has(product.id)
              const inline = getInlineProduct(product)
              const totalVariantStock = product.variants.reduce((s, v) => s + v.stock, 0)
              const effectiveStock = product.variants.length > 0 ? totalVariantStock : product.stock

              return (
                <div key={product.id}>
                  {/* Ana Satır */}
                  <div className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-zinc-800/30 transition group">

                    {/* Genişlet + Resim */}
                    <div className="col-span-1 flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(product.id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs transition flex-shrink-0 ${
                          isExpanded
                            ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                            : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                        } ${product.variants.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        disabled={product.variants.length === 0}
                        title={product.variants.length > 0 ? 'Varyantları göster' : 'Varyant yok'}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>

                    {/* Ürün Bilgisi */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🖼️</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 line-clamp-2">{product.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            product.type === 'DIGITAL'
                              ? 'bg-violet-500/15 text-violet-400'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {product.type === 'DIGITAL' ? '🎮 Dijital' : '📦 Fiziksel'}
                          </span>
                          {product.variants.length > 0 && (
                            <span className="text-xs text-zinc-600">{product.variants.length} varyant</span>
                          )}
                          {product.is_discount_active && (
                            <span className="text-xs bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">İndirimli</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Kategori */}
                    <div className="col-span-2">
                      <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg">
                        {product.categoryName ?? '—'}
                      </span>
                    </div>

                    {/* Fiyat Inline */}
                    <div className="col-span-2 flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={inline.price}
                        onChange={(e) => setInlineProductField(product.id, 'price', e.target.value)}
                        className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                      />
                      <span className="text-xs text-zinc-500">₺</span>
                    </div>

                    {/* Stok Inline */}
                    <div className="col-span-1 flex items-center gap-1.5">
                      {product.variants.length === 0 ? (
                        <input
                          type="number"
                          value={inline.stock}
                          onChange={(e) => setInlineProductField(product.id, 'stock', e.target.value)}
                          className={`w-16 bg-zinc-950 border rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition ${
                            effectiveStock <= 5 ? 'border-amber-500/60 text-amber-400' : 'border-zinc-700'
                          }`}
                        />
                      ) : (
                        <span className={`text-sm font-bold ${
                          effectiveStock === 0 ? 'text-red-400' : effectiveStock <= 5 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {effectiveStock}
                        </span>
                      )}
                    </div>

                    {/* Aksiyonlar */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => saveProductInline(product)}
                        disabled={savingProduct[product.id]}
                        className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        {savingProduct[product.id] ? (
                          <span className="w-3 h-3 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin inline-block" />
                        ) : '💾'}
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id, product.title)}
                        className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-400 text-xs font-semibold rounded-lg transition"
                        title="Ürünü sil"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* ── VARYANLAR (Genişletilmiş) ── */}
                  {isExpanded && product.variants.length > 0 && (
                    <div className="bg-zinc-950/60 border-t border-zinc-800 px-6 py-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                        Varyantlar ({product.variants.length})
                      </p>
                      <div className="space-y-2">
                        {/* Varyant Header */}
                        <div className="grid grid-cols-14 gap-2 text-xs font-semibold text-zinc-600 uppercase px-2 mb-1" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                          <div className="col-span-1">Resim</div>
                          <div className="col-span-2">Renk</div>
                          <div className="col-span-2">Beden/Boyut</div>
                          <div className="col-span-2">Stok</div>
                          <div className="col-span-2">+Fiyat (₺)</div>
                          <div className="col-span-2">Maliyet (₺)</div>
                          <div className="col-span-3 text-right">Kaydet</div>
                        </div>

                        {product.variants.map((v) => {
                          const vInline = getInlineVariant(v)
                          return (
                            <div key={v.id} className="grid gap-2 items-center bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-2.5 transition" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                              {/* Varyant Resim */}
                              <div className="col-span-1">
                                {v.color_image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={v.color_image_url} alt={v.color ?? ''} className="w-9 h-9 rounded-lg object-cover border border-zinc-700" />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-sm border border-zinc-700">🎨</div>
                                )}
                              </div>

                              {/* Renk */}
                              <div className="col-span-2">
                                {v.color ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 px-2 py-1 rounded-lg">
                                    <span className="w-2 h-2 rounded-full bg-zinc-500" />
                                    {v.color}
                                  </span>
                                ) : <span className="text-xs text-zinc-600">—</span>}
                              </div>

                              {/* Beden */}
                              <div className="col-span-2">
                                {v.size_or_dimension
                                  ? <span className="text-xs font-bold text-zinc-300 bg-zinc-800 px-2 py-1 rounded-lg">{v.size_or_dimension}</span>
                                  : <span className="text-xs text-zinc-600">—</span>}
                              </div>

                              {/* Stok Inline */}
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  value={vInline.stock}
                                  onChange={(e) => setInlineVariantField(v.id, 'stock', e.target.value)}
                                  min="0"
                                  className={`w-16 bg-zinc-950 border rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition ${
                                    parseInt(vInline.stock) <= 5 ? 'border-amber-500/60' : 'border-zinc-700'
                                  }`}
                                />
                              </div>

                              {/* Fiyat Farkı Inline */}
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={vInline.additional_price}
                                  onChange={(e) => setInlineVariantField(v.id, 'additional_price', e.target.value)}
                                  min="0"
                                  className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                                />
                              </div>

                              {/* Maliyet (Geliş Fiyatı) Inline */}
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={vInline.cost_price}
                                  onChange={(e) => setInlineVariantField(v.id, 'cost_price', e.target.value)}
                                  min="0"
                                  placeholder="0.00"
                                  className="w-20 bg-zinc-950 border border-amber-600/40 rounded-lg px-2 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 transition placeholder-zinc-700"
                                />
                              </div>

                              {/* Kaydet */}
                              <div className="col-span-3 flex justify-end">
                                <button
                                  onClick={() => saveVariantInline(v, product.id)}
                                  disabled={savingVariant[v.id]}
                                  className="px-3 py-1.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-400 text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {savingVariant[v.id] ? (
                                    <span className="w-3 h-3 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
                                  ) : '💾'}
                                  <span>Kaydet</span>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── KATEGORİ YÖNETİMİ ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
          <span className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-sm">🏷️</span>
          Kategori Yönetimi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ekle */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase mb-3">Yeni Kategori Ekle</p>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Örn: Aksesuarlar"
                maxLength={60}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
              />
              <button
                type="submit"
                disabled={addingCat || !newCatName.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition"
              >
                {addingCat ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                ) : '+ Ekle'}
              </button>
            </form>
          </div>

          {/* Liste */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase mb-3">Mevcut Kategoriler ({categories.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {categories.length === 0 ? (
                <p className="text-xs text-zinc-600 py-2">Henüz kategori yok</p>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 group hover:border-zinc-700 transition">
                    <span className="text-sm text-zinc-300 font-medium">{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      disabled={deletingCatId === cat.id}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition px-2 py-1 rounded-lg hover:bg-red-500/10 disabled:opacity-30"
                      title="Kategoriyi sil"
                    >
                      {deletingCatId === cat.id ? (
                        <span className="w-3 h-3 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin inline-block" />
                      ) : '🗑️'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── YENİ ÜRÜN MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-5 flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-pink-400">➕ Yeni Ürün Ekle</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200 text-2xl font-bold transition leading-none">✕</button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-5">
              {/* Hata */}
              {addError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                  ❌ {addError}
                </div>
              )}

              {/* Temel Bilgiler */}
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">📋 Temel Bilgiler</h4>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Ürün Adı *</label>
                  <input
                    type="text"
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                    placeholder="Örn: Siyah Anime Tişört"
                    required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Açıklama</label>
                  <textarea
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    placeholder="Ürün hakkında kısa bir açıklama..."
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Kategori</label>
                    <select
                      value={addForm.category_id}
                      onChange={(e) => setAddForm({ ...addForm, category_id: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                    >
                      <option value="">Seçiniz</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Ürün Tipi</label>
                    <select
                      value={addForm.type}
                      onChange={(e) => setAddForm({ ...addForm, type: e.target.value as 'PHYSICAL' | 'DIGITAL' })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                    >
                      <option value="PHYSICAL">📦 Fiziksel</option>
                      <option value="DIGITAL">🎮 Dijital</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Fiyat (₺) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={addForm.price}
                      onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                      placeholder="99.90"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">İndirimli Fiyat</label>
                    <input
                      type="number"
                      step="0.01"
                      value={addForm.discount_price}
                      onChange={(e) => setAddForm({ ...addForm, discount_price: e.target.value })}
                      placeholder="74.90"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Genel Stok</label>
                    <input
                      type="number"
                      value={addForm.stock}
                      onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })}
                      placeholder="0"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Ana Görsel URL</label>
                  <input
                    type="text"
                    value={addForm.image_url}
                    onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
                  />
                </div>
              </div>

              {/* Varyantlar */}
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">🎨 Varyantlar ({addVariants.length})</h4>
                  <button
                    type="button"
                    onClick={() => setAddVariants((prev) => [...prev, newVariantRow()])}
                    className="text-xs text-violet-400 hover:text-violet-300 font-semibold border border-violet-500/30 hover:border-violet-500 px-3 py-1.5 rounded-lg transition"
                  >
                    + Varyant Ekle
                  </button>
                </div>

                {/* Varyant Header */}
                <div className="grid gap-2 text-xs font-semibold text-zinc-600 uppercase px-1" style={{ gridTemplateColumns: '2fr 2.5fr 1.5fr 1.2fr 1.2fr 1.2fr 0.5fr' }}>
                  <div>Renk</div>
                  <div>Renk Resim URL</div>
                  <div>Beden/Boyut</div>
                  <div>Stok</div>
                  <div>+Fiyat</div>
                  <div>Maliyet</div>
                  <div />
                </div>

                <div className="space-y-2">
                  {addVariants.map((v, idx) => (
                    <div key={v.localId} className="grid gap-2 items-center bg-zinc-900 border border-zinc-700 rounded-xl p-2.5" style={{ gridTemplateColumns: '2fr 2.5fr 1.5fr 1.2fr 1.2fr 1.2fr 0.5fr' }}>
                      <div>
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => setAddVariants((prev) => prev.map((x, i) => i === idx ? { ...x, color: e.target.value } : x))}
                          placeholder="Siyah"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={v.color_image_url}
                          onChange={(e) => setAddVariants((prev) => prev.map((x, i) => i === idx ? { ...x, color_image_url: e.target.value } : x))}
                          placeholder="https://..."
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={v.size_or_dimension}
                          onChange={(e) => setAddVariants((prev) => prev.map((x, i) => i === idx ? { ...x, size_or_dimension: e.target.value } : x))}
                          placeholder="XL / A3"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => setAddVariants((prev) => prev.map((x, i) => i === idx ? { ...x, stock: parseInt(e.target.value) || 0 } : x))}
                          min="0"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={v.additional_price}
                          onChange={(e) => setAddVariants((prev) => prev.map((x, i) => i === idx ? { ...x, additional_price: parseFloat(e.target.value) || 0 } : x))}
                          min="0"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={v.cost_price}
                          onChange={(e) => setAddVariants((prev) => prev.map((x, i) => i === idx ? { ...x, cost_price: parseFloat(e.target.value) || 0 } : x))}
                          min="0"
                          placeholder="0.00"
                          className="w-full bg-zinc-950 border border-amber-600/40 rounded-lg px-2 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 transition placeholder-zinc-700"
                        />
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setAddVariants((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={addVariants.length <= 1}
                          className="text-red-400 hover:text-red-300 disabled:opacity-20 text-base transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-600">Renk veya Beden/Boyut alanlarından en az biri dolu olan satırlar kaydedilir. Her ikisi de boş satırlar atlanır.</p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 sticky bottom-0 bg-zinc-900 pt-4 pb-1 border-t border-zinc-800 -mx-6 px-6 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={addingProduct}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
                >
                  {addingProduct ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Ekleniyor...
                    </span>
                  ) : '➕ Ürünü Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
