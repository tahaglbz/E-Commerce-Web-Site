'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'

// Benzersiz dosya adları üretmek için render dışı yardımcı fonksiyon
function generateUniqueFileName(prefix: string, fileExt: string): string {
  const timestamp = Date.now()
  return `${prefix}-${timestamp}.${fileExt}`
}

interface Category {
  id: number
  name: string
}

interface Product {
  id: number
  title: string
  price: number
  type: string
  description: string
  category_id: number | null
  image_url: string | null
}

interface Order {
  id: number
  customer_name: string
  customer_phone: string
  product_title: string
  price: number
  status: 'PENDING' | 'COMPLETED'
  approved_images: string[]
}

export default function AdminDashboard() {
  const supabase = createClient()
  
  // Veri States
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  
  // Yüklenme States
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false)
  const [uploadingOrderId, setUploadingOrderId] = useState<number | null>(null)

  // Yeni Ürün Form States
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [type, setType] = useState('PHYSICAL')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [productFile, setProductFile] = useState<File | null>(null)

  // Yeni Kategori State
  const [newCategoryName, setNewCategoryName] = useState('')

  // Filtreleme ve Arama States (Kolay Bulma İçin)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')

  // İlk açılışta tüm verileri çek
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true)
      try {
        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        const { data: cData } = await supabase.from('categories').select('*').order('name', { ascending: true })
        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false })

        if (pData) setProducts(pData as Product[])
        if (cData) setCategories(cData as Category[])
        if (oData) setOrders(oData as Order[])
      } catch (err) {
        console.error('Veri yükleme hatası:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Yardımcı Veri Yenileme Fonksiyonu
  async function refreshData() {
    const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    const { data: cData } = await supabase.from('categories').select('*').order('name', { ascending: true })
    const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (pData) setProducts(pData as Product[])
    if (cData) setCategories(cData as Category[])
    if (oData) setOrders(oData as Order[])
  }

  // YENİ KATEGORİ EKLEME
  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }])
      if (error) {
        alert('Bu kategori zaten var veya bir hata oluştu!')
      } else {
        setNewCategoryName('')
        await refreshData()
        alert('Yeni kategori başarıyla eklendi! 🏷️')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // YENİ ÜRÜN EKLEME (RESİMLİ)
  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !price || !productFile) return alert('Lütfen Ürün Adı, Fiyat ve Ürün Resmi alanlarını doldurun!')

    setIsSubmittingProduct(true)
    try {
      // 1. Önce resmi Storage'a yükle
      const fileExt = productFile.name.split('.').pop() || 'webp'
      const fileName = generateUniqueFileName('product', fileExt)
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, productFile)

      if (uploadError) throw uploadError

      // 2. Resmin Public URL'ini al
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)

      // 3. Ürünü veritabanına kaydet
      const { error: insertError } = await supabase.from('products').insert([
        {
          title,
          description,
          price: parseFloat(price),
          type,
          category_id: selectedCategoryId ? parseInt(selectedCategoryId) : null,
          image_url: publicUrl
        }
      ])

      if (insertError) throw insertError

      alert('Ürün resimli ve kategorili olarak başarıyla eklendi! 🎉')
      setTitle('')
      setDescription('')
      setPrice('')
      setProductFile(null)
      await refreshData()

    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Ürün eklenirken hata: ' + err.message)
      } else {
        alert('Ürün eklenirken beklenmedik bir hata oluştu.')
      }
    } finally {
      setIsSubmittingProduct(false)
    }
  }

  // ÜRÜN SİLME
  async function handleProductDelete(id: number) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (!error) await refreshData()
    } catch (err) {
      console.error(err)
    }
  }

  // SİPARİŞ ONAYLAMA VE WHATSAPP RESMİ YÜKLEME
  async function handleOrderImageUpload(orderId: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingOrderId(orderId)
    try {
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = generateUniqueFileName(`order-${orderId}`, fileExt)

      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'COMPLETED', approved_images: [publicUrl] })
        .eq('id', orderId)

      if (updateError) throw updateError

      alert('Müşteri görseli yüklendi ve sipariş onaylandı! 🚀')
      await refreshData()
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Hata: ' + err.message)
      } else {
        alert('Beklenmedik bir hata oluştu.')
      }
    } finally {
      setUploadingOrderId(null)
    }
  }

  // Arama ve Kategori Filtreleme Mantığı (Kolay Bulma Mekanizması)
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'ALL' || p.category_id?.toString() === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-zinc-100">
      <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
        🏢 TC Gift Shop - Gelişmiş Yönetim Merkezi
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* SOL SÜTUN: FORM YÖNETİMLERİ */}
        <div className="space-y-6">
          
          {/* DINAMIK KATEGORI EKLEME FORMU */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3 text-amber-400 uppercase tracking-wider">🏷️ Yeni Kategori Türü Ekle</h3>
            <form onSubmit={handleCategorySubmit} className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Örn: Tişört, Anahtarlık, Figür"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs px-4 rounded-lg transition">
                Ekle
              </button>
            </form>
          </div>

          {/* RESİMLİ ÜRÜN EKLEME FORMU */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-md font-semibold mb-4 text-pink-500 border-b border-zinc-800 pb-2">📦 Mağazaya Resimli Ürün Ekle</h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Ürün Adı *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Siyah Anime Figür Tişört"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Kategori Seçimi</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 h-[38px]"
                >
                  <option value="">Kategorisiz / Genel</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Fiyat *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="349.90"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Ürün Tipi</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 h-[38px]"
                  >
                    <option value="PHYSICAL">👕 Fiziksel Ürün</option>
                    <option value="DIGITAL">🎮 Dijital Ürün</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Açıklama</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ürün özellikleri..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Ürün Vitrin Resmi (1:1 Kare) *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingProduct}
                className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-medium text-sm py-2.5 rounded-lg transition"
              >
                {isSubmittingProduct ? 'Ürün ve Resim Yüklüyor...' : 'Ürünü Mağazaya Ekle'}
              </button>
            </form>
          </div>
        </div>

        {/* ORTA VE SAĞ SÜTUNLAR: KOLAY BULUNABİLİR ÜRÜN LİSTESİ VE SİPARİŞ HAVUZU */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* GEİŞMİŞ ÜRÜN LİSTESİ (ARAMA VE FİLTRELEMELİ) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-violet-400">🛒 Mağaza Vitrin Yönetimi ({filteredProducts.length})</h3>
              
              {/* Kolay Bulma Araçları */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Ürün ismi ile ara..."
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-violet-500 w-full sm:w-48"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-violet-500 h-[32px]"
                >
                  <option value="ALL">Tüm Kategoriler</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <p className="text-zinc-500 text-sm">Yükleniyor...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-zinc-500 text-xs py-4 text-center">Aranan kriterlere uygun ürün bulunamadı kral.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-2">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center justify-between group hover:border-zinc-700 transition">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt={p.title} className="w-12 h-12 rounded object-cover border border-zinc-800" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs text-zinc-600">🖼️</div>
                      )}
                      <div>
                        <h4 className="font-medium text-xs text-zinc-200 line-clamp-1">{p.title}</h4>
                        <p className="text-[10px] text-zinc-400 font-semibold">{p.price} TL <span className="text-zinc-600 ml-1">| {p.type === 'PHYSICAL' ? '👕' : '🎮'}</span></p>
                        <span className="text-[9px] text-violet-400 bg-violet-500/5 px-1 py-0.2 rounded border border-violet-500/10">
                          {categories.find(c => c.id === p.category_id)?.name || 'Genel'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleProductDelete(p.id)} className="text-zinc-600 hover:text-red-400 text-xs p-1">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SİPARİŞ HAVUZU */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-emerald-400 border-b border-zinc-800 pb-2">📥 Sipariş Onay Havuzu</h3>
            {isLoading ? (
              <p className="text-zinc-500 text-sm">Yükleniyor...</p>
            ) : orders.length === 0 ? (
              <p className="text-zinc-500 text-xs">Henüz sipariş bulunmuyor kral.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-zinc-200 text-sm">{order.customer_name}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {order.status === 'COMPLETED' ? '✅ AKTİF' : '⏳ RESİM BEKLENİYOR'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">🎁 {order.product_title} - {order.price} TL</p>
                      <p className="text-[10px] text-zinc-500">📞 {order.customer_phone}</p>
                    </div>
                    <div className="flex items-center">
                      <label className={`cursor-pointer text-[10px] font-medium px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition ${uploadingOrderId === order.id ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingOrderId === order.id ? 'Yükleniyor...' : '📁 Resmi Yükle & Onayla'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleOrderImageUpload(order.id, e)} disabled={uploadingOrderId !== null} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}