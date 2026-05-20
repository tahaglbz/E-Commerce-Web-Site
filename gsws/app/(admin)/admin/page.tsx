'use client'

import { useState, useEffect } from 'react'
// Klasör yapısına tam uyan 2 adımlı yukarı çıkış (Hata 1 Çözümü)
import { createClient } from '../../utils/supabase/client'

// Date.now() işlevini render dışına çıkartarak saf (pure) hale getiriyoruz (Hata 2 Çözümü)
function generateUniqueFileName(orderId: number, fileExt: string): string {
  const timestamp = Date.now()
  return `order-${orderId}-${timestamp}.${fileExt}`
}

interface Product {
  id: number
  title: string
  price: number
  type: 'PHYSICAL' | 'DIGITAL'
  description: string
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
  
  // Ürün States
  const [products, setProducts] = useState<Product[]>([])
  const [productLoading, setProductLoading] = useState(true)
  const [productSubmitLoading, setProductSubmitLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [type, setType] = useState<'PHYSICAL' | 'DIGITAL'>('PHYSICAL')

  // Sipariş States
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [uploadingOrderId, setUploadingOrderId] = useState<number | null>(null)

  // İlk render anında verileri çekmek için bağımsız asenkron useEffect yapısı
  useEffect(() => {
    async function loadInitialData() {
      setProductLoading(true)
      setOrdersLoading(true)
      try {
        // 1. Ürünleri Çek
        const { data: pData, error: pError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        if (!pError && pData) setProducts(pData as Product[])

        // 2. Siparişleri Çek
        const { data: oData, error: oError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        if (!oError && oData) setOrders(oData as Order[])

      } catch (err) {
        console.error('Veri yükleme hatası:', err)
      } finally {
        setProductLoading(false)
        setOrdersLoading(false)
      }
    }

    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ekleme/Silme işlemlerinden sonra listeyi tazelemek için yardımcı fonksiyon
  async function refreshDashboardData() {
    try {
      const { data: pData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (pData) setProducts(pData as Product[])

      const { data: oData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (oData) setOrders(oData as Order[])
    } catch (err) {
      console.error('Veri tazeleme hatası:', err)
    }
  }

  // Yeni Ürün Kaydetme
  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !price) return alert('Lütfen gerekli alanları doldurun!')

    setProductSubmitLoading(true)
    try {
      const { error } = await supabase.from('products').insert([
        { title, description, price: parseFloat(price), type }
      ])

      if (error) {
        alert('Hata: ' + error.message)
      } else {
        alert('Ürün başarıyla eklendi! 🎉')
        setTitle('')
        setDescription('')
        setPrice('')
        await refreshDashboardData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProductSubmitLoading(false)
    }
  }

  // Ürün Silme
  async function handleProductDelete(id: number) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (!error) await refreshDashboardData()
    } catch (err) {
      console.error(err)
    }
  }

  // WhatsApp'tan Gelen Resmi Siparişe Yükleme ve Siparişi Onaylama Fonksiyonu
  async function handleImageUploadAndApprove(orderId: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingOrderId(orderId)
    try {
      const fileExt = file.name.split('.').pop() || 'png'
      // Dışarıdaki saf fonksiyonu çağırarak ESLint hatasını geçiyoruz
      const fileName = generateUniqueFileName(orderId, fileExt)

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Yüklenen resmin genel (public) internet linkini alalım
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      // Siparişi güncelle: Durumunu COMPLETED yap ve resim linkini approved_images dizisine ekle
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'COMPLETED',
          approved_images: [publicUrl]
        })
        .eq('id', orderId)

      if (updateError) throw updateError

      alert('Görsel başarıyla sisteme yüklendi ve sipariş onaylandı! 🚀')
      await refreshDashboardData()

    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Yükleme hatası: ' + err.message)
      } else {
        alert('Beklenmedik bir yükleme hatası oluştu.')
      }
    } finally {
      setUploadingOrderId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-zinc-100">
      <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
        🏢 TC Gift Shop - Merkezi Kontrol Paneli
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* SÜTUN 1: YENİ ÜRÜN EKLEME */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4 text-pink-500 border-b border-zinc-800 pb-2">📦 Yeni Ürün Ekle</h3>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Ürün Adı *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Sevgiliye Özel Pixel Oyun"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detaylar..."
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Fiyat (TL) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="299.90"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Ürün Tipi</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'PHYSICAL' | 'DIGITAL')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 h-[38px]"
                >
                  <option value="PHYSICAL">👕 Fiziksel</option>
                  <option value="DIGITAL">🎮 Dijital</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={productSubmitLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-medium text-sm py-2.5 rounded-lg transition"
            >
              {productSubmitLoading ? 'Ekleniyor...' : 'Ürünü Mağazaya Ekle'}
            </button>
          </form>

          {/* MEVCUT ÜRÜNLER LİSTESİ */}
          <h3 className="text-lg font-semibold mt-8 mb-4 text-violet-400 border-b border-zinc-800 pb-2">Mağazadaki Ürünler ({products.length})</h3>
          {productLoading ? (
            <p className="text-zinc-500 text-xs">Yükleniyor...</p>
          ) : (
            <div className="divide-y divide-zinc-800 max-h-[300px] overflow-y-auto pr-2 space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2 group">
                  <div>
                    <h4 className="font-medium text-sm text-zinc-200">{p.title}</h4>
                    <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{p.price} TL</span>
                  </div>
                  <button onClick={() => handleProductDelete(p.id)} className="text-zinc-600 hover:text-red-400 text-xs">🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SÜTUN 2 & 3: GELEN SİPARİŞLER VE ONAY MERKEZİ */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-emerald-400 border-b border-zinc-800 pb-2">📥 Müşteri Siparişleri & Onay Havuzu</h3>
          
          {ordersLoading ? (
            <p className="text-zinc-500 text-sm">Siparişler yükleniyor...</p>
          ) : orders.length === 0 ? (
            <p className="text-zinc-500 text-sm">Henüz sipariş gelmedi kral. Ön yüz tamamlanınca siparişler buraya düşecek!</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">#{order.id}</span>
                      <h4 className="font-semibold text-zinc-200 text-base">{order.customer_name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {order.status === 'COMPLETED' ? '✅ HAZIR / AKTİF' : '⏳ RESİM BEKLENİYOR'}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">🎁 <span className="text-zinc-200 font-medium">{order.product_title}</span> - {order.price} TL</p>
                    <p className="text-xs text-zinc-500">📞 İletişim: {order.customer_phone || 'Belirtilmemiş'}</p>
                    
                    {/* Görsel yüklendiyse önizlemesini göster */}
                    {order.approved_images && order.approved_images.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[11px] block text-zinc-500 mb-1">Onaylanan Sistem Görseli:</span>
                        <a href={order.approved_images[0]} target="_blank" rel="noreferrer" className="inline-block border border-zinc-800 rounded overflow-hidden hover:border-emerald-500 transition">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={order.approved_images[0]} alt="Onaylı" className="w-16 h-16 object-cover" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* SAĞ TARAF: DÜZENLENMİŞ GÖRSELİ SİSTEME YÜKLEME ALANI */}
                  <div className="flex flex-col justify-center items-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-zinc-800">
                    <span className="text-xs text-zinc-400 text-right">WhatsApp&apos;tan Aldığın Görseli Yükle</span>
                    <label className={`cursor-pointer text-xs font-medium px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition ${uploadingOrderId === order.id ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploadingOrderId === order.id ? 'Görsel İşleniyor...' : '📁 Düzenlenmiş Resmi Seç'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUploadAndApprove(order.id, e)}
                        disabled={uploadingOrderId !== null}
                      />
                    </label>
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