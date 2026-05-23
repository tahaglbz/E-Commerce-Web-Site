'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { Product, Category, SubCategory, Order, OrderItem, CartItem, CartWithProduct } from '@/app/types'
import Link from 'next/link'

// ============ MODAL COMPONENT ============
interface ProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedProduct: Partial<Product>) => void
  categories: Category[]
  subCategories: SubCategory[]
  isLoading: boolean
}

function ProductModal({ product, isOpen, onClose, onSave, categories, subCategories, isLoading }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>({})

  useEffect(() => {
    if (product) {
      // Delay state update to avoid cascading renders
      const timer = setTimeout(() => {
        setFormData({ ...product })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [product])

  if (!isOpen || !product) return null

  const handleSave = () => {
    onSave(formData)
  }

  const categorySubCategories = subCategories.filter((sc) => sc.category_id === formData.category_id)

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-pink-500">✏️ Ürünü Düzenle</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Ürün Adı</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Açıklama</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition resize-none"
            />
          </div>

          {/* Category & Sub-Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Kategori</label>
              <select
                value={formData.category_id || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category_id: e.target.value ? parseInt(e.target.value) : null,
                    sub_category_id: null,
                  })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition h-[40px]"
              >
                <option value="">Seçiniz</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Alt Kategori</label>
              <select
                value={formData.sub_category_id || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sub_category_id: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                disabled={!formData.category_id}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition h-[40px] disabled:opacity-50"
              >
                <option value="">Seçiniz</option>
                {categorySubCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Normal Fiyat (₺)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">İndirimli Fiyat (₺)</label>
              <input
                type="number"
                step="0.01"
                value={formData.discount_price || ''}
                onChange={(e) => setFormData({ ...formData, discount_price: parseFloat(e.target.value) || null })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
              />
            </div>
          </div>

          {/* Stock & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Stok</label>
              <input
                type="number"
                value={formData.stock || 0}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Ürün Tipi</label>
              <select
                value={formData.type || 'PHYSICAL'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PHYSICAL' | 'DIGITAL' })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition h-[40px]"
              >
                <option value="PHYSICAL">👕 Fiziksel Ürün</option>
                <option value="DIGITAL">🎮 Dijital Ürün</option>
              </select>
            </div>
          </div>

          {/* Discount Toggle */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white mb-1">🎉 İndirim Başlat/Durdur</p>
              <p className="text-xs text-zinc-400">Ürünü indirimli olarak işaretle</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_discount_active || false}
                onChange={(e) => setFormData({ ...formData, is_discount_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Resim URL</label>
            <input
              type="text"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
            />
            {formData.image_url && (
              <div className="mt-3 w-24 h-24 rounded-lg overflow-hidden border border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.image_url} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 border-t border-zinc-800 p-6 flex gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 rounded-lg transition"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
          >
            {isLoading ? '💾 Kaydediliyor...' : '💾 Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ MAIN DASHBOARD COMPONENT ============
export default function AdminDashboard() {
  const supabase = createClient()

  // States
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  // Product Form States
  const [newProductTitle, setNewProductTitle] = useState('')
  const [newProductDescription, setNewProductDescription] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductDiscountPrice, setNewProductDiscountPrice] = useState('')
  const [newProductStock, setNewProductStock] = useState('')
  const [newProductType, setNewProductType] = useState('PHYSICAL')
  const [newProductCategory, setNewProductCategory] = useState('')
  const [newProductSubCategory, setNewProductSubCategory] = useState('')
  const [newProductImage, setNewProductImage] = useState<File | null>(null)
  const [addingProduct, setAddingProduct] = useState(false)

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // Modal States
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingModal, setSavingModal] = useState(false)

  // Active Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'abandoned-carts' | 'products' | 'add-product'>('orders')

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [{ data: productsData }, { data: categoriesData }, { data: subCategoriesData }, { data: ordersData }, { data: orderItemsData }, { data: cartItemsData }] = await Promise.all([
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
        if (ordersData) setOrders(ordersData as Order[])
        if (orderItemsData) setOrderItems(orderItemsData as OrderItem[])
        if (cartItemsData) setCartItems(cartItemsData as CartItem[])
      } catch (err) {
        console.error('Veri yükleme hatası:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  // Add Product
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!newProductTitle || !newProductPrice || !newProductImage) {
      alert('Lütfen gerekli alanları doldurunuz')
      return
    }

    setAddingProduct(true)
    try {
      // Upload image to Storage
      const fileExt = newProductImage.name.split('.').pop() || 'webp'
      const fileName = `product-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, newProductImage)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)

      // Insert product
      const { error: insertError } = await supabase.from('products').insert([
        {
          title: newProductTitle,
          description: newProductDescription,
          price: parseFloat(newProductPrice),
          discount_price: newProductDiscountPrice ? parseFloat(newProductDiscountPrice) : null,
          is_discount_active: false,
          type: newProductType,
          category_id: newProductCategory ? parseInt(newProductCategory) : null,
          sub_category_id: newProductSubCategory ? parseInt(newProductSubCategory) : null,
          image_url: publicUrl,
          stock: parseInt(newProductStock) || 0,
        },
      ])

      if (insertError) throw insertError

      alert('✅ Ürün başarıyla eklendi!')
      setNewProductTitle('')
      setNewProductDescription('')
      setNewProductPrice('')
      setNewProductDiscountPrice('')
      setNewProductStock('')
      setNewProductImage(null)
      setNewProductCategory('')
      setNewProductSubCategory('')
      setNewProductType('PHYSICAL')

      // Refresh products
      const { data: updatedProducts } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (updatedProducts) setProducts(updatedProducts as Product[])
      setActiveTab('products')
    } catch (err) {
      console.error(err)
      alert('Ürün eklenirken hata oluştu')
    } finally {
      setAddingProduct(false)
    }
  }

  // Update Product
  async function handleUpdateProduct(updatedProduct: Partial<Product>) {
    if (!selectedProductForEdit) return

    setSavingModal(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: updatedProduct.title,
          description: updatedProduct.description,
          price: updatedProduct.price,
          discount_price: updatedProduct.discount_price,
          is_discount_active: updatedProduct.is_discount_active,
          type: updatedProduct.type,
          category_id: updatedProduct.category_id,
          sub_category_id: updatedProduct.sub_category_id,
          stock: updatedProduct.stock,
          image_url: updatedProduct.image_url,
        })
        .eq('id', selectedProductForEdit.id)

      if (error) throw error

      setProducts(products.map((p) => (p.id === selectedProductForEdit.id ? { ...p, ...updatedProduct } : p)))
      setIsModalOpen(false)
      alert('✅ Ürün güncellendi!')
    } catch (err) {
      console.error(err)
      alert('Ürün güncellenirken hata oluştu')
    } finally {
      setSavingModal(false)
    }
  }

  // Approve Order
  async function handleApproveOrder(orderId: number) {
    try {
      const { error } = await supabase.from('orders').update({ status: 'APPROVED' }).eq('id', orderId)

      if (error) throw error

      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: 'APPROVED' } : o)))
      alert('✅ Sipariş onaylandı!')
    } catch (err) {
      console.error(err)
      alert('Sipariş onaylanırken hata oluştu')
    }
  }

  // Delete Product
  async function handleDeleteProduct(productId: number) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId)
      if (error) throw error

      setProducts(products.filter((p) => p.id !== productId))
      alert('✅ Ürün silindi!')
    } catch (err) {
      console.error(err)
      alert('Ürün silinirken hata oluştu')
    }
  }

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || p.category_id?.toString() === filterCategory
    return matchesSearch && matchesCategory
  })

  // Get abandoned carts with users
  const abandonedCartsMap = new Map<string, { userId: string; items: CartWithProduct[]; totalValue: number }>()
  cartItems.forEach((item) => {
    if (!abandonedCartsMap.has(item.user_id)) {
      abandonedCartsMap.set(item.user_id, { userId: item.user_id, items: [], totalValue: 0 })
    }
    const cart = abandonedCartsMap.get(item.user_id)!
    const product = products.find((p) => p.id === item.product_id)
    if (product && cart) {
      const price = product.is_discount_active && product.discount_price ? product.discount_price : product.price
      cart.items.push({ ...item, product })
      cart.totalValue += price * item.quantity
    }
  })

  // Get pending orders
  const pendingOrders = orders.filter((o) => o.status === 'PENDING')

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900/50 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-pink-500 hover:text-pink-400 text-sm font-medium">
            ← Ana Sayfa
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            🏢 TC Gift Shop Admin
          </h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/auth/login'
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
          >
            🚪 Çıkış
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 flex gap-2 overflow-x-auto">
          {[
            { id: 'orders' as const, label: '📥 Sipariş Onayı', count: pendingOrders.length },
            { id: 'abandoned-carts' as const, label: '🛒 Terkedilmiş Sepet', count: abandonedCartsMap.size },
            { id: 'products' as const, label: '📦 Ürün Yönetimi', count: filteredProducts.length },
            { id: 'add-product' as const, label: '➕ Ürün Ekle', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-500'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && <span className="ml-2 bg-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-zinc-400 text-center py-12">Yükleniyor...</p>
        ) : (
          <>
            {/* TAB 1: ORDERS APPROVAL */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">📥 Sipariş Onay Havuzu</h2>
                {pendingOrders.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">✅ Onay bekleme listesi boş</p>
                ) : (
                  <div className="space-y-4">
                    {pendingOrders.map((order) => {
                      const items = orderItems.filter((oi) => oi.order_id === order.id)
                      return (
                        <div key={order.id} className="bg-zinc-900 border-2 border-amber-500/30 rounded-xl p-6 hover:border-amber-500 transition">
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-white">{order.customer_name}</h3>
                                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">
                                  ⏳ ONAY BEKLİYOR
                                </span>
                              </div>
                              <p className="text-sm text-zinc-400">📞 {order.customer_phone}</p>
                              {order.customer_email && <p className="text-sm text-zinc-400">📧 {order.customer_email}</p>}

                              {/* Order Items */}
                              <div className="bg-zinc-950 rounded-lg p-3 mt-3">
                                <p className="text-xs font-semibold text-zinc-300 mb-2">Sipariş Öğeleri:</p>
                                {items.length > 0 ? (
                                  <ul className="space-y-1">
                                    {items.map((item, idx) => (
                                      <li key={idx} className="text-xs text-zinc-400">
                                        • {products.find((p) => p.id === item.product_id)?.title} (x{item.quantity})
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-zinc-500">Ürün bulunamadı</p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-between md:items-end gap-3">
                              <div className="text-right">
                                <p className="text-xs text-zinc-400">Toplam Tutar</p>
                                <p className="text-2xl font-bold text-emerald-400">{order.total_price.toFixed(2)} ₺</p>
                              </div>
                              <button
                                onClick={() => handleApproveOrder(order.id)}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition"
                              >
                                ✅ Siparişi Onayla
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ABANDONED CARTS */}
            {activeTab === 'abandoned-carts' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">🛒 Terkedilmiş Sepetler Analizi</h2>
                {abandonedCartsMap.size === 0 ? (
                  <p className="text-zinc-400 text-center py-8">✅ Terkedilmiş sepet bulunmuyor</p>
                ) : (
                  <div className="space-y-4">
                    {Array.from(abandonedCartsMap.values()).map((cart) => (
                      <div key={cart.userId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-orange-500 transition">
                        <div className="flex flex-col md:flex-row justify-between gap-6 md:items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-3">👤 Kullanıcı ID: {cart.userId}</h3>
                            <div className="space-y-2 mb-4">
                              {cart.items.map((item: CartWithProduct, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 bg-zinc-950 p-3 rounded-lg">
                                  {item.product?.image_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.product.image_url}
                                      alt={item.product?.title}
                                      className="w-12 h-12 rounded object-cover"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-white">{item.product?.title}</p>
                                    <p className="text-xs text-zinc-400">
                                      {item.quantity} adet × {item.product?.is_discount_active && item.product?.discount_price ? item.product.discount_price : item.product?.price} ₺
                                    </p>
                                  </div>
                                  <p className="text-sm font-bold text-pink-400">
                                    {(
                                      item.quantity *
                                      (item.product?.is_discount_active && item.product?.discount_price
                                        ? item.product.discount_price
                                        : item.product?.price || 0)
                                    ).toFixed(2)}{' '}
                                    ₺
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="text-right md:text-left">
                            <p className="text-xs text-zinc-400 mb-1">Sepet Toplam</p>
                            <p className="text-3xl font-bold text-orange-400">{cart.totalValue.toFixed(2)} ₺</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PRODUCTS MANAGEMENT */}
            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold">📦 Mağaza Vitrin Yönetimi</h2>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="🔍 Ürün adı ara..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
                    />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-pink-500 transition"
                    >
                      <option value="">Tüm Kategoriler</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">❌ Ürün bulunamadı</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-pink-500 transition group cursor-pointer"
                      >
                        {/* Image */}
                        <div className="relative w-full aspect-square bg-zinc-950 overflow-hidden">
                          {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl bg-zinc-800">
                              🖼️
                            </div>
                          )}
                          {product.is_discount_active && (
                            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded">
                              🎉 İndirim
                            </div>
                          )}
                          {product.stock <= 5 && product.stock > 0 && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                              ⚠️ {product.stock} kaldı
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-sm line-clamp-2 mb-2">{product.title}</h3>

                          <div className="flex items-baseline gap-2 mb-3">
                            {product.is_discount_active && product.discount_price ? (
                              <>
                                <p className="text-lg font-bold text-emerald-400">{product.discount_price.toFixed(2)} ₺</p>
                                <p className="text-xs text-zinc-500 line-through">{product.price.toFixed(2)} ₺</p>
                              </>
                            ) : (
                              <p className="text-lg font-bold text-white">{product.price.toFixed(2)} ₺</p>
                            )}
                          </div>

                          <div className="text-xs text-zinc-400 mb-4">
                            📦 Stok: <span className={product.stock > 5 ? 'text-emerald-400' : 'text-amber-400'}>{product.stock}</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedProductForEdit(product)
                                setIsModalOpen(true)
                              }}
                              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2 rounded transition"
                            >
                              ✏️ Düzenle
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 rounded transition"
                            >
                              🗑️ Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ADD NEW PRODUCT */}
            {activeTab === 'add-product' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">➕ Yeni Ürün Ekle</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-4xl">
                  <form onSubmit={handleAddProduct} className="space-y-6">
                    {/* Title & Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Ürün Adı *</label>
                        <input
                          type="text"
                          value={newProductTitle}
                          onChange={(e) => setNewProductTitle(e.target.value)}
                          placeholder="Örn: Siyah Anime Figür"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Ürün Tipi</label>
                        <select
                          value={newProductType}
                          onChange={(e) => setNewProductType(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition h-[38px]"
                        >
                          <option value="PHYSICAL">👕 Fiziksel Ürün</option>
                          <option value="DIGITAL">🎮 Dijital Ürün</option>
                        </select>
                      </div>
                    </div>

                    {/* Category & Sub-Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Kategori</label>
                        <select
                          value={newProductCategory}
                          onChange={(e) => {
                            setNewProductCategory(e.target.value)
                            setNewProductSubCategory('')
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition h-[38px]"
                        >
                          <option value="">Seçiniz</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Alt Kategori</label>
                        <select
                          value={newProductSubCategory}
                          onChange={(e) => setNewProductSubCategory(e.target.value)}
                          disabled={!newProductCategory}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition h-[38px] disabled:opacity-50"
                        >
                          <option value="">Seçiniz</option>
                          {subCategories
                            .filter((sub) => sub.category_id === parseInt(newProductCategory))
                            .map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Price & Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Normal Fiyat (₺) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProductPrice}
                          onChange={(e) => setNewProductPrice(e.target.value)}
                          placeholder="99.99"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">İndirimli Fiyat (₺)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProductDiscountPrice}
                          onChange={(e) => setNewProductDiscountPrice(e.target.value)}
                          placeholder="74.99"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Stok *</label>
                        <input
                          type="number"
                          value={newProductStock}
                          onChange={(e) => setNewProductStock(e.target.value)}
                          placeholder="10"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition"
                          required
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Açıklama</label>
                      <textarea
                        value={newProductDescription}
                        onChange={(e) => setNewProductDescription(e.target.value)}
                        placeholder="Ürün özellikleri ve açıklaması..."
                        rows={4}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition resize-none"
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Ürün Resmi (1:1 Kare) *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewProductImage(e.target.files?.[0] || null)}
                        className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                        required
                      />
                      {newProductImage && <p className="text-xs text-emerald-400 mt-2">✅ {newProductImage.name} seçildi</p>}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={addingProduct}
                      className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
                    >
                      {addingProduct ? '⏳ Ürün Ekleniyor...' : '➕ Ürünü Mağazaya Ekle'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Product Edit Modal */}
      <ProductModal
        product={selectedProductForEdit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpdateProduct}
        categories={categories}
        subCategories={subCategories}
        isLoading={savingModal}
      />
    </div>
  )
}
