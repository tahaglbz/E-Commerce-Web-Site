'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import { Order } from '@/app/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [savingAddress, setSavingAddress] = useState(false)

  // Form state
  const [address, setAddress] = useState('')
  const [addressSaved, setAddressSaved] = useState(false)

  useEffect(() => {
    async function loadUserData() {
      try {
        // Kullanıcı kontrolü
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login?returnTo=/profile')
          return
        }

        setUser(user)

        // Siparişleri yükle (sadece bu kullanıcının)
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (ordersData) {
          setOrders(ordersData as Order[])
        }

        // LocalStorage'dan adresi yükle (örnek)
        const savedAddress = localStorage.getItem('user_address')
        if (savedAddress) {
          setAddress(savedAddress)
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [supabase, router])

  // Adresi kaydet
  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault()
    setSavingAddress(true)

    try {
      if (address.trim()) {
        localStorage.setItem('user_address', address)
        setAddressSaved(true)
        setTimeout(() => setAddressSaved(false), 3000)
      }
    } catch (error) {
      console.error('Adres kaydedilirken hata:', error)
    } finally {
      setSavingAddress(false)
    }
  }

  // Çıkış yap
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
            <p className="text-zinc-400 text-sm">Profil yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Giriş yapmalısınız</p>
          <Link href="/auth/login" className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg transition">
            Giriş Yap
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100 flex flex-col">
      <Navbar />
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-pink-500/30">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Profil Sayfası</h1>
              <p className="text-zinc-400 text-sm">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── 1. GENEL BİLGİLER ── */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">👤</span>
              <h2 className="text-xl font-bold">Genel Bilgiler</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <label className="text-xs font-semibold text-zinc-400 uppercase">E-posta Adresi</label>
                <p className="text-lg font-semibold text-white mt-2">{user.email}</p>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Hesap Oluşturma Tarihi</label>
                <p className="text-lg font-semibold text-white mt-2">
                  {new Date(user.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Kullanıcı ID</label>
                <p className="text-sm font-mono text-zinc-300 mt-2 truncate">{user.id}</p>
              </div>
            </div>
          </div>

          {/* ── 2. ADRES BİLGİLERİ ── */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🏠</span>
              <h2 className="text-xl font-bold">Adres Bilgilerim</h2>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Teslimat Adresi</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Şehir, sokak, bina no... vb."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition resize-none"
                  rows={4}
                />
              </div>

              {addressSaved && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                  <span>✅</span>
                  <p className="text-sm text-emerald-400">Adres başarıyla kaydedildi!</p>
                </div>
              )}

              <button
                type="submit"
                disabled={savingAddress}
                className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {savingAddress ? 'Kaydediliyor...' : '💾 Adresi Kaydet'}
              </button>
            </form>
          </div>

          {/* ── 3. SİPARİŞLERİM ── */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📦</span>
              <h2 className="text-xl font-bold">Siparişlerim</h2>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-zinc-400 mb-4">Henüz sipariş vermemişsiniz</p>
                <Link href="/products" className="inline-block px-6 py-2.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold rounded-xl hover:opacity-90 transition">
                  🛍️ Alışverişe Başla
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-pink-500/30 transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-lg font-bold text-white">Sipariş #{order.id}</p>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            order.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {order.status === 'APPROVED' ? '✅ Onaylandı' : '⏳ Beklemede'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3">
                          📅 {new Date(order.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm"><span className="text-zinc-400">Müşteri:</span> <span className="font-semibold">{order.customer_name}</span></p>
                          {order.customer_phone && <p className="text-sm"><span className="text-zinc-400">Telefon:</span> <span className="font-semibold">{order.customer_phone}</span></p>}
                          {order.customer_email && <p className="text-sm"><span className="text-zinc-400">E-posta:</span> <span className="font-semibold">{order.customer_email}</span></p>}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Toplam Tutar</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
                          {order.total_price.toFixed(2)} ₺
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 4. ÇIKIŞ YAP ── */}
          <div className="md:col-span-2">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 font-bold py-4 rounded-xl transition duration-200 text-lg flex items-center justify-center gap-2"
            >
              <span>🚪</span> Çıkış Yap
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
