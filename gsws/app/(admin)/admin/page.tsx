'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/app/utils/supabase/client'
import {
  Product,
  Category,
  SubCategory,
  Order,
  OrderItem,
  CartItem,
  CartWithProduct,
  ProductVariant,
  ClothingColorGroup,
  DimensionVariantRow,
  SizeStockRow,
} from '@/app/types'

// ── Alt Bileşenler ─────────────────────────────────────────────────
import OrderManagement from './components/OrderManagement'
import AbandonedCarts from './components/AbandonedCarts'
import CouponManager from './components/CouponManager'
import ProductListManager from './components/ProductListManager'

// ─────────────────────────────────────────────────────────────────
// KATEGORİ SINIFLANDIRMA
// ─────────────────────────────────────────────────────────────────
function categoryType(name: string): 'clothing' | 'decoration' | 'none' {
  const n = name.toLowerCase()
  if (n.includes('giyim') || n.includes('clothing')) return 'clothing'
  if (n.includes('dekorasyon') || n.includes('decoration') || n.includes('ev')) return 'decoration'
  return 'none'
}

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL']

// ─────────────────────────────────────────────────────────────────
// PRODUCT EDIT MODAL
// ─────────────────────────────────────────────────────────────────
interface ProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedProduct: Partial<Product>, variants: ProductVariant[], deletedVariantIds: number[]) => void
  categories: Category[]
  subCategories: SubCategory[]
  isLoading: boolean
}

function ProductModal({ product, isOpen, onClose, onSave, categories, subCategories, isLoading }: ProductModalProps) {
  const supabase = createClient()
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([])
  const [loadingVariants, setLoadingVariants] = useState(false)

  const loadVariants = useCallback(async (productId: number) => {
    setLoadingVariants(true)
    try {
      const { data } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('id')
      setVariants((data as ProductVariant[]) || [])
    } finally {
      setLoadingVariants(false)
    }
  }, [supabase])

  useEffect(() => {
    if (product && isOpen) {
      Promise.resolve().then(() => {
        setFormData({ ...product })
        setDeletedVariantIds([])
        loadVariants(product.id)
      })
    }
  }, [product, isOpen, loadVariants])

  if (!isOpen || !product) return null

  const catSubList = subCategories.filter((sc) => sc.category_id === formData.category_id)

  function addVariantRow() {
    setVariants([...variants, {
      id: -(Date.now()),
      product_id: product!.id,
      color: '',
      color_image_url: null,
      size_or_dimension: '',
      stock: 0,
      additional_price: 0,
      created_at: '',
    }])
  }

  function updateVariant(index: number, field: keyof ProductVariant, value: string | number | null) {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  function removeVariant(index: number) {
    const v = variants[index]
    if (v.id > 0) setDeletedVariantIds([...deletedVariantIds, v.id])
    setVariants(variants.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-5 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-pink-500">✏️ Ürünü Düzenle</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 text-2xl font-bold transition">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">📋 Temel Bilgiler</h3>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Ürün Adı</label>
              <input type="text" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Açıklama</label>
              <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Kategori</label>
                <select value={formData.category_id || ''} onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : null, sub_category_id: null })} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition">
                  <option value="">Seçiniz</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Alt Kategori</label>
                <select value={formData.sub_category_id || ''} onChange={(e) => setFormData({ ...formData, sub_category_id: e.target.value ? parseInt(e.target.value) : null })} disabled={!formData.category_id} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition disabled:opacity-50">
                  <option value="">Seçiniz</option>
                  {catSubList.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Fiyat (₺)</label>
                <input type="number" step="0.01" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">İndirimli Fiyat</label>
                <input type="number" step="0.01" value={formData.discount_price || ''} onChange={(e) => setFormData({ ...formData, discount_price: parseFloat(e.target.value) || null })} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Genel Stok</label>
                <input type="number" value={formData.stock || 0} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" />
              </div>
            </div>
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-700 rounded-lg p-4">
              <div>
                <p className="font-semibold text-white text-sm">🎉 İndirim Durumu</p>
                <p className="text-xs text-zinc-400">Ürünü indirimli olarak işaretle</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.is_discount_active || false} onChange={(e) => setFormData({ ...formData, is_discount_active: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500" />
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Resim URL</label>
              <input type="text" value={formData.image_url || ''} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" />
            </div>
          </div>

          <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">🎨 Varyant & Stok</h3>
              {loadingVariants && <span className="text-xs text-zinc-500">Yükleniyor...</span>}
            </div>
            {variants.length > 0 && (
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-500 uppercase px-1">
                <div className="col-span-2">Renk</div>
                <div className="col-span-3">Renk Resim URL</div>
                <div className="col-span-2">Beden/Boyut</div>
                <div className="col-span-2">Stok</div>
                <div className="col-span-2">Fiyat +₺</div>
                <div className="col-span-1" />
              </div>
            )}
            <div className="space-y-2">
              {variants.map((variant, index) => (
                <div key={variant.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-xl border ${variant.id < 0 ? 'bg-violet-500/5 border-violet-500/30' : 'bg-zinc-900 border-zinc-700'}`}>
                  <div className="col-span-2"><input type="text" value={variant.color || ''} onChange={(e) => updateVariant(index, 'color', e.target.value)} placeholder="Siyah" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition" /></div>
                  <div className="col-span-3"><input type="text" value={variant.color_image_url || ''} onChange={(e) => updateVariant(index, 'color_image_url', e.target.value || null)} placeholder="https://..." className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition" /></div>
                  <div className="col-span-2"><input type="text" value={variant.size_or_dimension || ''} onChange={(e) => updateVariant(index, 'size_or_dimension', e.target.value)} placeholder="XL / A3" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition" /></div>
                  <div className="col-span-2"><input type="number" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)} min="0" className={`w-full bg-zinc-950 border rounded-lg px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition ${variant.stock <= 5 ? 'border-amber-500/50' : 'border-zinc-700'}`} /></div>
                  <div className="col-span-2"><input type="number" step="0.01" value={variant.additional_price} onChange={(e) => updateVariant(index, 'additional_price', parseFloat(e.target.value) || 0)} min="0" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 transition" /></div>
                  <div className="col-span-1 flex justify-center"><button onClick={() => removeVariant(index)} className="text-red-400 hover:text-red-300 text-lg transition">✕</button></div>
                </div>
              ))}
            </div>
            {variants.length === 0 && !loadingVariants && (
              <p className="text-xs text-zinc-500 text-center py-3">Henüz varyant eklenmemiş.</p>
            )}
            <button onClick={addVariantRow} className="w-full border-2 border-dashed border-zinc-700 hover:border-violet-500 text-zinc-400 hover:text-violet-400 text-sm font-medium py-3 rounded-xl transition">
              + Yeni Varyant Satırı Ekle
            </button>
          </div>
        </div>

        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-5 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl transition">İptal</button>
          <button onClick={() => onSave(formData, variants, deletedVariantIds)} disabled={isLoading} className="flex-1 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition">
            {isLoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Kaydediliyor...</span> : '💾 Değişiklikleri Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// GİYİM VARYANT FORMU
// ─────────────────────────────────────────────────────────────────
interface ClothingVariantFormProps {
  colorGroups: ClothingColorGroup[]
  onChange: (groups: ClothingColorGroup[]) => void
}

function ClothingVariantForm({ colorGroups, onChange }: ClothingVariantFormProps) {
  function addColorGroup() {
    onChange([...colorGroups, { localId: `color-${Date.now()}`, color: '', colorImageFile: null, colorImagePreview: null, sizes: [{ size: 'M', stock: 0, additional_price: 0 }] }])
  }
  function removeColorGroup(localId: string) { onChange(colorGroups.filter((g) => g.localId !== localId)) }
  function updateColorGroup(localId: string, field: 'color', value: string) { onChange(colorGroups.map((g) => g.localId === localId ? { ...g, [field]: value } : g)) }
  function setColorImage(localId: string, file: File | null) {
    onChange(colorGroups.map((g) => {
      if (g.localId !== localId) return g
      const preview = file ? URL.createObjectURL(file) : null
      return { ...g, colorImageFile: file, colorImagePreview: preview }
    }))
  }
  function addSizeToGroup(localId: string) {
    onChange(colorGroups.map((g) => {
      if (g.localId !== localId) return g
      const usedSizes = g.sizes.map((s) => s.size)
      const nextSize = DEFAULT_SIZES.find((s) => !usedSizes.includes(s)) || ''
      return { ...g, sizes: [...g.sizes, { size: nextSize, stock: 0, additional_price: 0 }] }
    }))
  }
  function removeSizeFromGroup(localId: string, sizeIndex: number) {
    onChange(colorGroups.map((g) => {
      if (g.localId !== localId) return g
      return { ...g, sizes: g.sizes.filter((_, i) => i !== sizeIndex) }
    }))
  }
  function updateSize(localId: string, sizeIndex: number, field: keyof SizeStockRow, value: string | number) {
    onChange(colorGroups.map((g) => {
      if (g.localId !== localId) return g
      const updatedSizes = g.sizes.map((s, i) => i === sizeIndex ? { ...s, [field]: value } : s)
      return { ...g, sizes: updatedSizes }
    }))
  }

  return (
    <div className="space-y-4">
      {colorGroups.map((group, groupIdx) => (
        <div key={group.localId} className="bg-zinc-950 border-2 border-violet-500/20 hover:border-violet-500/40 rounded-2xl p-5 space-y-4 transition">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-400 text-xs font-bold">{groupIdx + 1}</span>
            </div>
            <input type="text" value={group.color} onChange={(e) => updateColorGroup(group.localId, 'color', e.target.value)} placeholder="Renk adı (Siyah, Beyaz, Kırmızı...)" className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-pink-500 transition" />
            <button type="button" onClick={() => removeColorGroup(group.localId)} disabled={colorGroups.length <= 1} className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed text-xl p-1 transition">🗑️</button>
          </div>
          <div className="flex gap-4 items-center">
            <label className="flex-1 flex items-center gap-3 border-2 border-dashed border-zinc-700 hover:border-pink-500/60 rounded-xl p-4 cursor-pointer transition group">
              <input type="file" accept="image/*" onChange={(e) => setColorImage(group.localId, e.target.files?.[0] || null)} className="hidden" />
              <div className="text-2xl group-hover:scale-110 transition">📷</div>
              <div>
                <p className="text-sm font-semibold text-zinc-300 group-hover:text-pink-400 transition">
                  {group.colorImageFile ? <span className="text-emerald-400">✅ {group.colorImageFile.name}</span> : `${group.color || 'Bu renk'} için fotoğraf yükle`}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Kare oran önerilir (1:1)</p>
              </div>
            </label>
            {group.colorImagePreview && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-pink-500/40 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={group.colorImagePreview} alt={group.color} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-500 uppercase px-1">
              <div className="col-span-3">Beden</div>
              <div className="col-span-4">Stok</div>
              <div className="col-span-4">Fiyat Farkı (₺)</div>
              <div className="col-span-1" />
            </div>
            {group.sizes.map((sizeRow, sizeIdx) => (
              <div key={sizeIdx} className="grid grid-cols-12 gap-2 items-center bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-800">
                <div className="col-span-3">
                  <select value={sizeRow.size} onChange={(e) => updateSize(group.localId, sizeIdx, 'size', e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-sm font-bold text-white focus:outline-none focus:border-pink-500 transition">
                    {DEFAULT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="custom">Özel</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <input type="number" value={sizeRow.stock} onChange={(e) => updateSize(group.localId, sizeIdx, 'stock', parseInt(e.target.value) || 0)} min="0" className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition ${sizeRow.stock <= 5 && sizeRow.stock > 0 ? 'border-amber-500/60 text-amber-400' : 'border-zinc-700'}`} />
                </div>
                <div className="col-span-4">
                  <input type="number" step="0.01" value={sizeRow.additional_price} onChange={(e) => updateSize(group.localId, sizeIdx, 'additional_price', parseFloat(e.target.value) || 0)} min="0" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button type="button" onClick={() => removeSizeFromGroup(group.localId, sizeIdx)} disabled={group.sizes.length <= 1} className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition">✕</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addSizeToGroup(group.localId)} className="w-full border border-dashed border-zinc-700 hover:border-violet-500 text-zinc-500 hover:text-violet-400 text-xs font-medium py-2 rounded-xl transition">
            + Bu Renge Beden Ekle
          </button>
        </div>
      ))}
      <button type="button" onClick={addColorGroup} className="w-full border-2 border-dashed border-violet-500/40 hover:border-violet-500 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 hover:text-violet-300 text-sm font-semibold py-4 rounded-2xl transition flex items-center justify-center gap-2">
        <span className="text-lg">🎨</span> Yeni Renk Grubu Ekle
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// DEKORASYON BOYUT FORMU
// ─────────────────────────────────────────────────────────────────
interface DimensionVariantFormProps {
  rows: DimensionVariantRow[]
  onChange: (rows: DimensionVariantRow[]) => void
}

function DimensionVariantForm({ rows, onChange }: DimensionVariantFormProps) {
  function addRow() { onChange([...rows, { size_or_dimension: '', stock: 0, additional_price: 0 }]) }
  function removeRow(index: number) { if (rows.length <= 1) return; onChange(rows.filter((_, i) => i !== index)) }
  function updateRow(index: number, field: keyof DimensionVariantRow, value: string | number) { onChange(rows.map((r, i) => i === index ? { ...r, [field]: value } : r)) }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-500 uppercase px-1">
        <div className="col-span-4">Boyut / Ebat</div>
        <div className="col-span-4">Stok</div>
        <div className="col-span-3">Fiyat Farkı (₺)</div>
        <div className="col-span-1" />
      </div>
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <div className="col-span-4"><input type="text" value={row.size_or_dimension} onChange={(e) => updateRow(index, 'size_or_dimension', e.target.value)} placeholder="A3, A4, 30x40cm..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" /></div>
          <div className="col-span-4"><input type="number" value={row.stock} onChange={(e) => updateRow(index, 'stock', parseInt(e.target.value) || 0)} min="0" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" /></div>
          <div className="col-span-3"><input type="number" step="0.01" value={row.additional_price} onChange={(e) => updateRow(index, 'additional_price', parseFloat(e.target.value) || 0)} min="0" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" /></div>
          <div className="col-span-1 flex justify-center"><button type="button" onClick={() => removeRow(index)} disabled={rows.length <= 1} className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed text-lg transition">✕</button></div>
        </div>
      ))}
      <button type="button" onClick={addRow} className="w-full border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 text-emerald-500/60 hover:text-emerald-400 text-sm font-medium py-3 rounded-xl transition">
        + Yeni Boyut Satırı Ekle
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// MAIN ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────
type MainTab = 'orders' | 'abandoned-carts' | 'coupons' | 'product-manager' | 'products' | 'add-product'
// GUNCELLENDI: 'shipped' eklendi
type OrderSubTab = 'pending' | 'approved' | 'cancel-requests' | 'shipped'

export default function AdminDashboard() {
  const supabase = createClient()

  // ── Veri State ────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  // ── Urun Form State ───────────────────────────────────────────────
  const [newProductTitle, setNewProductTitle] = useState('')
  const [newProductDescription, setNewProductDescription] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductDiscountPrice, setNewProductDiscountPrice] = useState('')
  const [newProductStock, setNewProductStock] = useState('')
  const [newProductType, setNewProductType] = useState('PHYSICAL')
  const [newProductCategory, setNewProductCategory] = useState('')
  const [newProductSubCategory, setNewProductSubCategory] = useState('')
  const [newProductImage, setNewProductImage] = useState<File | null>(null)
  const [newProductImagePreview, setNewProductImagePreview] = useState<string | null>(null)
  const [addingProduct, setAddingProduct] = useState(false)

  // ── Varyant State ─────────────────────────────────────────────────
  const [clothingColorGroups, setClothingColorGroups] = useState<ClothingColorGroup[]>([{
    localId: 'color-initial', color: '', colorImageFile: null, colorImagePreview: null,
    sizes: [{ size: 'M', stock: 0, additional_price: 0 }],
  }])
  const [dimensionRows, setDimensionRows] = useState<DimensionVariantRow[]>([
    { size_or_dimension: '', stock: 0, additional_price: 0 },
  ])

  // ── Tab & Modal State ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<MainTab>('orders')
  const [orderSubTab, setOrderSubTab] = useState<OrderSubTab>('pending')
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingModal, setSavingModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [trackingCodes, setTrackingCodes] = useState<Record<number, string>>({})
  const [savingTracking, setSavingTracking] = useState<Record<number, boolean>>({})
  const [shippingCarriers, setShippingCarriers] = useState<Record<number, string>>({})
  const [shippingOrder, setShippingOrder] = useState<Record<number, boolean>>({})
  const [sendingReminder, setSendingReminder] = useState<Record<string, boolean>>({})
  const [reminderSent, setReminderSent] = useState<Record<string, boolean>>({})

  const selectedCatName = categories.find((c) => c.id === parseInt(newProductCategory))?.name || ''
  const variantMode = categoryType(selectedCatName)

  // ── Veri Yukleme ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: productsData },
        { data: categoriesData },
        { data: subCategoriesData },
        { data: ordersData },
        { data: orderItemsData },
        { data: cartItemsData },
      ] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('sub_categories').select('*').order('name'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('order_items').select('*'),
        supabase.from('cart_items').select('*'),
      ])
      if (productsData) setProducts(productsData as Product[])
      if (categoriesData) setCategories(categoriesData as Category[])
      if (subCategoriesData) setSubCategories(subCategoriesData as SubCategory[])
      if (ordersData) {
        setOrders(ordersData as Order[])
        const codes: Record<number, string> = {}
        const carriers: Record<number, string> = {}
        ordersData.forEach((order: Order) => {
          if (order.tracking_code) codes[order.id] = order.tracking_code
          if (order.shipping_carrier) carriers[order.id] = order.shipping_carrier
        })
        setTrackingCodes(codes)
        setShippingCarriers(carriers)
      }
      if (orderItemsData) setOrderItems(orderItemsData as OrderItem[])
      if (cartItemsData) setCartItems(cartItemsData as CartItem[])
    } catch (err) {
      console.error('Veri yukleme hatasi:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { Promise.resolve().then(() => loadData()) }, [loadData])

  // ── Resim Yukleme ──────────────────────────────────────────────────
  function handleImageSelect(file: File | null) {
    setNewProductImage(file)
    setNewProductImagePreview(file ? URL.createObjectURL(file) : null)
  }

  async function uploadImage(file: File, prefix = 'product', productId: number | string = 'new', colorSlug = '', index = 0): Promise<string> {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const safeColor = colorSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'nocolor'
    const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const fileName = `${prefix}-${productId}-${safeColor}-${index}-${uniquePart}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (error) throw new Error(`Resim yuklenemedi: ${fileName} - ${error.message}`)
    return supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl
  }

  // ── Yeni Urun Ekle ────────────────────────────────────────────────
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!newProductTitle || !newProductPrice || !newProductImage) {
      alert('Lutfen zorunlu alanlari doldurunuz (Ad, Fiyat, Ana Resim)'); return
    }
    setAddingProduct(true)
    try {
      const mainImageUrl = await uploadImage(newProductImage, 'main', 'new', '', 0)
      const { data: insertedProduct, error: insertError } = await supabase.from('products').insert({
        title: newProductTitle.trim(), description: newProductDescription.trim(),
        price: parseFloat(newProductPrice), discount_price: newProductDiscountPrice ? parseFloat(newProductDiscountPrice) : null,
        is_discount_active: false, type: newProductType,
        category_id: newProductCategory ? parseInt(newProductCategory) : null,
        sub_category_id: newProductSubCategory ? parseInt(newProductSubCategory) : null,
        image_url: mainImageUrl, stock: parseInt(newProductStock) || 0,
      }).select('id, title').single()
      if (insertError || !insertedProduct) throw new Error(`Urun DB insert hatasi: ${insertError?.message ?? 'Bilinmeyen hata'}`)

      const productId: number = insertedProduct.id
      let totalVariants = 0
      const variantErrors: string[] = []

      if (variantMode === 'clothing') {
        const validGroups = clothingColorGroups.filter((g) => g.color.trim())
        for (let groupIdx = 0; groupIdx < validGroups.length; groupIdx++) {
          const group = validGroups[groupIdx]
          let colorImageUrl: string | null = null
          if (group.colorImageFile) {
            try { colorImageUrl = await uploadImage(group.colorImageFile, 'color', productId, group.color, groupIdx) }
            catch (uploadErr) { variantErrors.push(`"${group.color}" rengi icin resim yuklenemedi.`); console.warn(uploadErr) }
          }
          const validSizes = group.sizes.filter((s) => s.size.trim())
          if (validSizes.length === 0) continue
          const variantRows = validSizes.map((sizeRow) => ({
            product_id: productId, color: group.color.trim(), color_image_url: colorImageUrl,
            size_or_dimension: sizeRow.size.trim(), stock: Math.max(0, sizeRow.stock), additional_price: Math.max(0, sizeRow.additional_price),
          }))
          const { data: insertedRows, error: variantInsertError } = await supabase.from('product_variants').insert(variantRows).select('id')
          if (variantInsertError) variantErrors.push(`"${group.color}" rengi varyantlari eklenemedi: ${variantInsertError.message}`)
          else totalVariants += insertedRows?.length ?? validSizes.length
        }
      } else if (variantMode === 'decoration') {
        const validRows = dimensionRows.filter((r) => r.size_or_dimension.trim())
        if (validRows.length > 0) {
          const decoVariantRows = validRows.map((row) => ({
            product_id: productId, color: null, color_image_url: null,
            size_or_dimension: row.size_or_dimension.trim(), stock: Math.max(0, row.stock), additional_price: Math.max(0, row.additional_price),
          }))
          const { data: insertedDecoRows, error: decoInsertError } = await supabase.from('product_variants').insert(decoVariantRows).select('id')
          if (decoInsertError) variantErrors.push(`Boyut varyantlari eklenemedi: ${decoInsertError.message}`)
          else totalVariants += insertedDecoRows?.length ?? validRows.length
        }
      }

      if (variantErrors.length > 0) {
        alert(`⚠️ Urun eklendi ancak bazi varyantlarda sorun:\n\n${variantErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\nBasarili varyant: ${totalVariants}`)
      } else {
        alert(`✅ Urun basariyla eklendi!${totalVariants > 0 ? ` ${totalVariants} varyant eklendi.` : ''}`)
      }

      setNewProductTitle(''); setNewProductDescription(''); setNewProductPrice(''); setNewProductDiscountPrice('')
      setNewProductStock(''); setNewProductImage(null); setNewProductImagePreview(null)
      setNewProductCategory(''); setNewProductSubCategory(''); setNewProductType('PHYSICAL')
      setClothingColorGroups([{ localId: `color-${Date.now()}`, color: '', colorImageFile: null, colorImagePreview: null, sizes: [{ size: 'M', stock: 0, additional_price: 0 }] }])
      setDimensionRows([{ size_or_dimension: '', stock: 0, additional_price: 0 }])
      await loadData()
      setActiveTab('products')
    } catch (err) {
      console.error('[handleAddProduct FATAL]', err)
      alert(`❌ Kritik hata:\n\n${err instanceof Error ? err.message : 'Bilinmeyen hata'}`)
    } finally {
      setAddingProduct(false)
    }
  }

  // ── Urun Guncelle ─────────────────────────────────────────────────
  async function handleUpdateProduct(updatedProduct: Partial<Product>, variants: ProductVariant[], deletedVariantIds: number[]) {
    if (!selectedProductForEdit) return
    setSavingModal(true)
    try {
      const { error: updateError } = await supabase.from('products').update({
        title: updatedProduct.title, description: updatedProduct.description,
        price: updatedProduct.price, discount_price: updatedProduct.discount_price,
        is_discount_active: updatedProduct.is_discount_active, type: updatedProduct.type,
        category_id: updatedProduct.category_id, sub_category_id: updatedProduct.sub_category_id,
        stock: updatedProduct.stock, image_url: updatedProduct.image_url,
      }).eq('id', selectedProductForEdit.id)
      if (updateError) throw updateError
      if (deletedVariantIds.length > 0) await supabase.from('product_variants').delete().in('id', deletedVariantIds)
      for (const v of variants) {
        if (v.id < 0) {
          await supabase.from('product_variants').insert({ product_id: selectedProductForEdit.id, color: v.color || null, color_image_url: v.color_image_url || null, size_or_dimension: v.size_or_dimension || null, stock: v.stock, additional_price: v.additional_price })
        } else {
          await supabase.from('product_variants').update({ color: v.color || null, color_image_url: v.color_image_url || null, size_or_dimension: v.size_or_dimension || null, stock: v.stock, additional_price: v.additional_price }).eq('id', v.id)
        }
      }
      setProducts(products.map((p) => p.id === selectedProductForEdit.id ? { ...p, ...updatedProduct } : p))
      setIsModalOpen(false)
      alert('✅ Urun ve varyantlar guncellendi!')
    } catch (err) { console.error(err); alert('Guncellenirken hata olustu') }
    finally { setSavingModal(false) }
  }

  // ── Siparis Islemleri ─────────────────────────────────────────────
  async function handleApproveOrder(orderId: number) {
    try {
      const { error } = await supabase.from('orders').update({ status: 'APPROVED' }).eq('id', orderId)
      if (!error) {
        setOrders(orders.map((o) => o.id === orderId ? { ...o, status: 'APPROVED' } : o))
        try { await fetch('/api/order/notify-approved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) }) }
        catch (emailError) { console.warn('Mail gonderme hatasi (onay)', emailError) }
        alert('✅ Siparis onaylandi!')
      } else { alert(`❌ Hata: ${error.message}`) }
    } catch (err) { alert(`❌ Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`) }
  }

  async function handleCancelOrder(orderId: number) {
    if (!confirm('Bu siparisi tamamen iptal etmek istediginize emin misiniz?')) return
    try {
      const { error } = await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', orderId)
      if (!error) {
        setOrders(orders.map((o) => o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o))
        try { await fetch('/api/order/notify-cancellation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) }) }
        catch (emailError) { console.warn('Mail gonderme hatasi (iptal)', emailError) }
        alert('🚫 Siparis iptal edildi!')
      } else { alert(`❌ Iptal hatasi: ${error.message}`) }
    } catch (err) { alert(`❌ Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`) }
  }

  async function handleApproveCancelRequest(orderId: number) {
    const { error } = await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', orderId)
    if (!error) { setOrders(orders.map((o) => o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o)); alert('✅ Iptal talebi onaylandi!') }
  }

  async function handleRejectCancelRequest(orderId: number) {
    const { error } = await supabase.from('orders').update({ status: 'APPROVED' }).eq('id', orderId)
    if (!error) { setOrders(orders.map((o) => o.id === orderId ? { ...o, status: 'APPROVED' as const } : o)); alert('❌ Iptal talebi reddedildi!') }
  }

  // GUNCELLENDI: Kargo kaydedildiginde otomatik SHIPPED yap
  async function handleSaveTrackingCode(orderId: number) {
    setSavingTracking((prev) => ({ ...prev, [orderId]: true }))
    try {
      const { error } = await supabase.from('orders').update({
        tracking_code: trackingCodes[orderId] || null,
        shipping_carrier: shippingCarriers[orderId] || null,
        status: 'SHIPPED'
      }).eq('id', orderId)
      if (!error) {
        setOrders(orders.map((o) => o.id === orderId ? {
          ...o,
          tracking_code: trackingCodes[orderId],
          shipping_carrier: shippingCarriers[orderId],
          status: 'SHIPPED' as const
        } : o))
        alert('✅ Kargo bilgileri kaydedildi ve siparis kargoya verildi olarak isaretlendi!')
      }
      else alert(`❌ Hata: ${error.message}`)
    } finally { setSavingTracking((prev) => ({ ...prev, [orderId]: false })) }
  }

  async function handleShipOrder(orderId: number) {
    const carrier = shippingCarriers[orderId]
    const trackingCode = trackingCodes[orderId]

    if (!carrier || !trackingCode) {
      alert('Lutfen kargo firmasini ve takip kodunu giriniz.')
      return
    }

    if (!confirm('Siparisi kargoya verildi olarak isaretlemek ve musteriye e-posta gondermek istediginize emin misiniz?')) {
      return
    }

    setShippingOrder((prev) => ({ ...prev, [orderId]: true }))
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'SHIPPED', shipping_carrier: carrier, tracking_code: trackingCode })
        .eq('id', orderId)

      if (!error) {
        setOrders(orders.map((o) => o.id === orderId ? { ...o, status: 'SHIPPED', shipping_carrier: carrier, tracking_code: trackingCode } : o))

        try {
          await fetch('/api/order/notify-shipped', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          })
        }
        catch (emailError) { console.warn('Mail gonderme hatasi (kargoya verildi)', emailError) }

        alert('✅ Siparis kargoya verildi ve musteriye bildirim gonderildi!')
      } else { alert(`❌ Hata: ${error.message}`) }
    } catch (err) { alert(`❌ Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`) }
    finally { setShippingOrder((prev) => ({ ...prev, [orderId]: false })) }
  }

  async function handleSendCartReminder(userId: string) {
    setSendingReminder((prev) => ({ ...prev, [userId]: true }))
    try {
      const response = await fetch('/api/remind-cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
      const data = await response.json()
      if (response.ok) {
        setReminderSent((prev) => ({ ...prev, [userId]: true }))
        alert(`✅ Sepet hatirlatici maili gonderildi! (${data.itemCount} urun)`)
      } else { alert(`❌ Hata: ${data.error || 'Mail gonderilemedi'}`) }
    } catch (error) { alert(`❌ Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`) }
    finally { setSendingReminder((prev) => ({ ...prev, [userId]: false })) }
  }

  async function handleDeleteProduct(productId: number) {
    if (!confirm('Bu urunu silmek istediginize emin misiniz? Tum varyantlar da silinecek.')) return
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (!error) { setProducts(products.filter((p) => p.id !== productId)); alert('✅ Urun silindi!') }
  }

  // ── Turetilmis Veriler ────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || p.category_id?.toString() === filterCategory
    return matchesSearch && matchesCategory
  })

  const abandonedCartsMap = new Map<string, { userId: string; items: CartWithProduct[]; totalValue: number }>()
  cartItems.forEach((item) => {
    if (!abandonedCartsMap.has(item.user_id)) {
      abandonedCartsMap.set(item.user_id, { userId: item.user_id, items: [], totalValue: 0 })
    }
    const cart = abandonedCartsMap.get(item.user_id)!
    const product = products.find((p) => p.id === item.product_id)
    if (product) {
      const price = product.is_discount_active && product.discount_price ? product.discount_price : product.price
      cart.items.push({ ...item, product })
      cart.totalValue += price * item.quantity
    }
  })

  const pendingOrders = orders.filter((o) => o.status === 'PENDING')
  const approvedOrders = orders.filter((o) => o.status === 'APPROVED')
  const cancelRequestedOrders = orders.filter((o) => o.status === 'CANCEL_REQUESTED')
  // YENI: shippedOrders filtresi eklendi
  const shippedOrders = orders.filter((o) => o.status === 'SHIPPED')
  const newProductCategorySubList = subCategories.filter((sub) => sub.category_id === parseInt(newProductCategory))
  const abandonedCartsList = Array.from(abandonedCartsMap.values())

  const mainTabs = [
    // GUNCELLENDI: shippedOrders count eklendi
    { id: 'orders' as const, label: '📋 Siparisler', count: pendingOrders.length + cancelRequestedOrders.length + shippedOrders.length },
    { id: 'abandoned-carts' as const, label: '🛒 Sepette Kalanlar', count: abandonedCartsMap.size },
    { id: 'coupons' as const, label: '🎟️ Kuponlar', count: 0 },
    { id: 'product-manager' as const, label: '📦 Urun / Kategori Yonetimi', count: products.length },
    { id: 'products' as const, label: '🖼️ Vitrin (Grid)', count: 0 },
    { id: 'add-product' as const, label: '➕ Urun Ekle (Dosya)', count: 0 },
  ]

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-pink-500 hover:text-pink-400 text-sm font-medium transition">← Ana Sayfa</Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">🏢 TC Gift Shop Admin</h1>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/auth/login' }} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition">🚪 Cikis</button>
        </div>
      </header>

      {/* Ana Sekmeler */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {mainTabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-4 font-medium text-sm border-b-2 transition whitespace-nowrap ${activeTab === tab.id ? 'border-pink-500 text-pink-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}>
              {tab.label}
              {tab.count > 0 && <span className="ml-2 bg-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
              <p className="text-zinc-400 text-sm">Yukleniyor...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── SIPARISLER ── */}
            {activeTab === 'orders' && (
              <OrderManagement
                pendingOrders={pendingOrders}
                approvedOrders={approvedOrders}
                cancelRequestedOrders={cancelRequestedOrders}
                shippedOrders={shippedOrders}
                orderItems={orderItems}
                products={products}
                trackingCodes={trackingCodes}
                savingTracking={savingTracking}
                onApprove={handleApproveOrder}
                onCancel={handleCancelOrder}
                onApproveCancelRequest={handleApproveCancelRequest}
                onRejectCancelRequest={handleRejectCancelRequest}
                onSaveTrackingCode={handleSaveTrackingCode}
                onTrackingCodeChange={(orderId, value) => setTrackingCodes((prev) => ({ ...prev, [orderId]: value }))}
                shippingCarriers={shippingCarriers}
                shippingOrder={shippingOrder}
                onShippingCarrierChange={(orderId, value) => setShippingCarriers((prev) => ({ ...prev, [orderId]: value }))}
                onShipOrder={handleShipOrder}
                activeSubTab={orderSubTab}
                onSubTabChange={setOrderSubTab}
              />
            )}

            {/* ── TERKEDILMIS SEPETLER ── */}
            {activeTab === 'abandoned-carts' && (
              <AbandonedCarts
                abandonedCarts={abandonedCartsList}
                sendingReminder={sendingReminder}
                reminderSent={reminderSent}
                onSendReminder={handleSendCartReminder}
              />
            )}

            {/* ── KUPON YONETIMI ── */}
            {activeTab === 'coupons' && <CouponManager />}

            {/* ── URUN / KATEGORI YONETIMI ── */}
            {activeTab === 'product-manager' && <ProductListManager />}

            {/* ── URUN YONETIMI ── */}
            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold">📦 Magaza Vitrin Yonetimi</h2>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="🔍 Urun ara..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-pink-500 transition" />
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-pink-500 transition">
                      <option value="">Tum Kategoriler</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>
                {filteredProducts.length === 0 ? (
                  <p className="text-zinc-400 text-center py-12">❌ Urun bulunamadi</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-pink-500/50 transition group">
                        <div className="relative w-full aspect-square bg-zinc-950 overflow-hidden">
                          {product.image_url
                            ? <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                            : <div className="w-full h-full flex items-center justify-center text-4xl bg-zinc-800">🖼️</div>}
                          {product.is_discount_active && <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg">🎉 Indirim</div>}
                          {product.stock > 0 && product.stock <= 5 && <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg animate-pulse">⚠️ {product.stock} kaldi</div>}
                          {product.stock === 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><p className="text-white font-bold text-lg">Tukendi</p></div>}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-sm line-clamp-2 mb-2 text-zinc-100">{product.title}</h3>
                          <div className="flex items-baseline gap-2 mb-3">
                            {product.is_discount_active && product.discount_price
                              ? <><p className="text-base font-bold text-emerald-400">{product.discount_price.toFixed(2)} ₺</p><p className="text-xs text-zinc-500 line-through">{product.price.toFixed(2)} ₺</p></>
                              : <p className="text-base font-bold text-white">{product.price.toFixed(2)} ₺</p>}
                          </div>
                          <p className="text-xs text-zinc-400 mb-4">📦 Stok: <span className={product.stock > 5 ? 'text-emerald-400' : 'text-amber-400'}>{product.stock}</span></p>
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedProductForEdit(product); setIsModalOpen(true) }} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2.5 rounded-lg transition">✏️ Duzenle</button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2.5 rounded-lg transition">🗑️ Sil</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── YENI URUN EKLE ── */}
            {activeTab === 'add-product' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">➕ Yeni Urun Ekle</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-4xl">
                  <form onSubmit={handleAddProduct} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Urun Adi *</label>
                        <input type="text" value={newProductTitle} onChange={(e) => setNewProductTitle(e.target.value)} placeholder="Orn: Siyah Anime Tisort" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Urun Tipi</label>
                        <select value={newProductType} onChange={(e) => setNewProductType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition h-[42px]">
                          <option value="PHYSICAL">👕 Fiziksel Urun</option>
                          <option value="DIGITAL">🎮 Dijital Urun</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Kategori</label>
                        <select value={newProductCategory} onChange={(e) => { setNewProductCategory(e.target.value); setNewProductSubCategory('') }} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition h-[42px]">
                          <option value="">Seciniz</option>
                          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Alt Kategori</label>
                        <select value={newProductSubCategory} onChange={(e) => setNewProductSubCategory(e.target.value)} disabled={!newProductCategory} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition h-[42px] disabled:opacity-50">
                          <option value="">Seciniz</option>
                          {newProductCategorySubList.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Normal Fiyat (₺) *</label>
                        <input type="number" step="0.01" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} placeholder="99.99" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Indirimli Fiyat (₺)</label>
                        <input type="number" step="0.01" value={newProductDiscountPrice} onChange={(e) => setNewProductDiscountPrice(e.target.value)} placeholder="74.99" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">{variantMode === 'none' ? 'Genel Stok *' : 'Genel Stok (Yedek)'}</label>
                        <input type="number" value={newProductStock} onChange={(e) => setNewProductStock(e.target.value)} placeholder="10" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Aciklama</label>
                      <textarea value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} placeholder="Urun ozellikleri..." rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Ana Urun Resmi *</label>
                      <div className="flex gap-4 items-start">
                        <label className="flex-1 border-2 border-dashed border-zinc-700 hover:border-pink-500 rounded-xl p-6 cursor-pointer transition group text-center">
                          <input type="file" accept="image/*" onChange={(e) => handleImageSelect(e.target.files?.[0] || null)} className="hidden" />
                          <div className="text-3xl mb-2 group-hover:scale-110 transition">📷</div>
                          <p className="text-sm text-zinc-400 group-hover:text-pink-400 transition">
                            {newProductImage ? <span className="text-emerald-400 font-semibold">✅ {newProductImage.name}</span> : 'Tiklayarak ana urun resmini secin'}
                          </p>
                        </label>
                        {newProductImagePreview && (
                          <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-zinc-700 flex-shrink-0">
                            <img src={newProductImagePreview} alt="preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    {variantMode === 'clothing' && (
                      <div className="border-2 border-pink-500/20 rounded-2xl p-6 space-y-5">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-pink-500/10 rounded-xl"><span className="text-2xl">👕</span></div>
                          <div>
                            <h3 className="text-base font-bold text-pink-400">Giyim Varyant Yonetimi</h3>
                            <p className="text-xs text-zinc-400 mt-0.5">Her renk icin ayri fotograf yukleyin, bedenleri ve stoklarini girin.</p>
                          </div>
                        </div>
                        <ClothingVariantForm colorGroups={clothingColorGroups} onChange={setClothingColorGroups} />
                      </div>
                    )}

                    {variantMode === 'decoration' && (
                      <div className="border-2 border-emerald-500/20 rounded-2xl p-6 space-y-5">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-xl"><span className="text-2xl">🖼️</span></div>
                          <div>
                            <h3 className="text-base font-bold text-emerald-400">Boyut Varyant Yonetimi</h3>
                            <p className="text-xs text-zinc-400 mt-0.5">Urunun mevcut boyutlarini ve stok/fiyat farkini girin.</p>
                          </div>
                        </div>
                        <DimensionVariantForm rows={dimensionRows} onChange={setDimensionRows} />
                      </div>
                    )}

                    {newProductCategory && variantMode === 'none' && (
                      <div className="border border-zinc-700 rounded-2xl p-5 bg-zinc-950/50 flex items-center gap-4">
                        <span className="text-3xl">ℹ️</span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-300">Bu kategori icin varyant eklenmez</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Hediyelik ve Dijital urunler icin &quot;Genel Stok&quot; alanini kullanin.</p>
                        </div>
                      </div>
                    )}

                    {!newProductCategory && (
                      <div className="border border-zinc-700/50 rounded-2xl p-5 bg-zinc-950/30 flex items-center gap-4">
                        <span className="text-2xl opacity-50">🏷️</span>
                        <p className="text-sm text-zinc-500">Varyant seceneklerini gormek icin bir <span className="text-zinc-300 font-semibold">kategori</span> secin.</p>
                      </div>
                    )}

                    <button type="submit" disabled={addingProduct} className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition shadow-lg text-base">
                      {addingProduct ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Urun ekleniyor, lutfen bekleyin...
                        </span>
                      ) : '➕ Urunu Magazaya Ekle'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <ProductModal
        product={selectedProductForEdit}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProductForEdit(null) }}
        onSave={handleUpdateProduct}
        categories={categories}
        subCategories={subCategories}
        isLoading={savingModal}
      />
    </div>
  )
}