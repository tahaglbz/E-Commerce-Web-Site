'use client'

import { useState, useEffect } from 'react'
// Klasör yapına tam uygun göreceli (relative) import yolu
import { createClient } from '../../../utils/supabase/client'

interface Product {
  id: number
  title: string
  price: number
  type: 'PHYSICAL' | 'DIGITAL'
  description: string
}

export default function AdminDashboard() {
  // İstemciyi doğrudan burada başlatıyoruz. Supabase'in kendi tip yapısını otomatik kazanır.
  const supabase = createClient()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Form State'leri
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [type, setType] = useState<'PHYSICAL' | 'DIGITAL'>('PHYSICAL')

  // Ürünleri Veritabanından Çekme Fonksiyonu
  async function fetchProducts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, type, description')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Veri çekme hatası:', error.message)
      } else if (data) {
        setProducts(data as Product[])
      }
    } catch (err) {
      console.error('Beklenmedik bir hata oluştu:', err)
    } finally {
      setLoading(false)
    }
  }

  // İlk render anında ürünleri çekiyoruz
  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Yeni Ürün Kaydetme Fonksiyonu
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !price) {
      alert('Lütfen gerekli alanları doldurun!')
      return
    }

    setSubmitLoading(true)
    try {
      const { error } = await supabase.from('products').insert([
        {
          title,
          description,
          price: parseFloat(price),
          type,
        },
      ])

      if (error) {
        alert('Ürün eklenirken hata oluştu: ' + error.message)
      } else {
        alert('Ürün başarıyla eklendi! 🎉')
        // Formu temizle
        setTitle('')
        setDescription('')
        setPrice('')
        // Listeyi yenile
        fetchProducts()
      }
    } catch (err) {
      console.error('Kayıt esnasında hata oluştu:', err)
    } finally {
      setSubmitLoading(false)
    }
  }

  // Ürün Silme Fonksiyonu
  async function handleDelete(id: number) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Ürün silinirken bir hata oluştu: ' + error.message)
      } else {
        alert('Ürün başarıyla silindi.')
        fetchProducts()
      }
    } catch (err) {
      console.error('Silme esnasında hata oluştu:', err)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">📦 Ürün Yönetim Merkezi</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SOL TARAF: YENİ ÜRÜN EKLEME FORMU */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4 text-pink-500">Yeni Ürün Ekle</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Ürün Adı *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Sevgiliye Özel Pixel Macera Oyunu"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ürün detaylarını buraya yaz..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Fiyat (TL) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="299.90"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Ürün Tipi</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'PHYSICAL' | 'DIGITAL')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition h-[42px]"
                >
                  <option value="PHYSICAL">👕 Fiziksel</option>
                  <option value="DIGITAL">🎮 Dijital Deneyim</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white font-medium text-sm py-3 rounded-lg transition mt-2 shadow-lg shadow-pink-500/10 disabled:opacity-50"
            >
              {submitLoading ? 'Ekleniyor...' : 'Ürün Ekle'}
            </button>
          </form>
        </div>

        {/* SAĞ TARAF: MEVCUT ÜRÜNLERİN LİSTESİ */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-violet-400">Mağazadaki Ürünler ({products.length})</h3>
          
          {loading ? (
            <p className="text-zinc-500 text-sm">Ürünler yükleniyor...</p>
          ) : products.length === 0 ? (
            <p className="text-zinc-500 text-sm">Henüz ürün eklenmemiş. Soldaki formdan ilk ürünü ekle kral!</p>
          ) : (
            <div className="divide-y divide-zinc-800 max-h-[500px] overflow-y-auto pr-2">
              {products.map((product) => (
                <div key={product.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0 group">
                  <div>
                    <h4 className="font-medium text-zinc-200">{product.title}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5 max-w-md line-clamp-1">{product.description || 'Açıklama yok'}</p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-2 ${
                      product.type === 'DIGITAL' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {product.type === 'DIGITAL' ? '💻 DİJİTAL OYUN' : '📦 FİZİKSEL ÜRÜN'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-zinc-100">{product.price.toFixed(2)} TL</span>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-zinc-600 hover:text-red-400 text-sm p-1 transition opacity-0 group-hover:opacity-100"
                      title="Ürünü Sil"
                    >
                      🗑️
                    </button>
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