'use client'

import { useState } from 'react'
import Navbar from '@/app/components/Navbar'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    senderName: '',
    senderEmail: '',
    subject: 'Genel Soru',
    message: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('✅ Mesajınız başarıyla gönderildi! Size en kısa sürede dönüş yapacağız.')
        setFormData({
          senderName: '',
          senderEmail: '',
          subject: 'Genel Soru',
          message: '',
        })
      } else {
        setErrorMessage(`❌ Hata: ${data.error || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.'}`)
      }
    } catch (error) {
      setErrorMessage(`❌ Sunucu hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      <Navbar />

      {/* Hero */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-pink-500/20 flex items-center justify-center">
            <span className="text-4xl">📞</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Bizimle İletişime Geçin</h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Her türlü soru, öneri ve siparişleriniz hakkında bize ulaşabilirsiniz.
            Size en kısa sürede dönüş yapacağız.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ── İletişim Bilgileri ── */}
          <div className="space-y-6">
            {/* E-posta */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-pink-500/30 transition group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500/20 transition">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">E-posta Adresimiz</h3>
                  <a href="mailto:info@tcgiftshop.com" className="text-pink-400 hover:text-pink-300 font-medium transition">
                    info@tcgiftshop.com
                  </a>
                  <p className="text-xs text-zinc-500 mt-1">Genel sorular ve sipariş destek</p>
                </div>
              </div>
            </div>

            {/* Telefon */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-violet-500/30 transition group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Telefon Numaramız</h3>
                  <a href="tel:+905551234567" className="text-violet-400 hover:text-violet-300 font-medium transition">
                    +90 (555) 123 45 67
                  </a>
                  <p className="text-xs text-zinc-500 mt-1">WhatsApp üzerinden de ulaşabilirsiniz</p>
                </div>
              </div>
            </div>

            {/* Çalışma Saatleri */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition">
                  <span className="text-2xl">🕐</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Çalışma Saatlerimiz</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center gap-6">
                      <span className="text-sm text-zinc-400">Pazartesi – Cuma</span>
                      <span className="text-sm text-emerald-400 font-semibold">09:00 – 18:00</span>
                    </div>
                    <div className="flex justify-between items-center gap-6">
                      <span className="text-sm text-zinc-400">Cumartesi</span>
                      <span className="text-sm text-emerald-400 font-semibold">10:00 – 15:00</span>
                    </div>
                    <div className="flex justify-between items-center gap-6">
                      <span className="text-sm text-zinc-400">Pazar</span>
                      <span className="text-sm text-red-400 font-semibold">Kapalı</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Adres */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/30 transition group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Adresimiz</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Atatürk Caddesi No: 123<br />
                    Kadıköy / İstanbul, 34710
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── İletişim Formu ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>✉️</span> Mesaj Gönderin
            </h2>

            {/* Durum Mesajları */}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-sm">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm">
                {errorMessage}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                  Ad Soyad <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  name="senderName"
                  required
                  placeholder="Adınız Soyadınız"
                  value={formData.senderName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                  E-posta <span className="text-pink-500">*</span>
                </label>
                <input
                  type="email"
                  name="senderEmail"
                  required
                  placeholder="ornek@mail.com"
                  value={formData.senderEmail}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                  Konu
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-pink-500 transition disabled:opacity-50"
                >
                  <option>Genel Soru</option>
                  <option>Sipariş Hakkında</option>
                  <option>İade / Değişim</option>
                  <option>İş Birliği Teklifi</option>
                  <option>Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                  Mesajınız <span className="text-pink-500">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Mesajınızı buraya yazın..."
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition resize-none disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/15 hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Gönderiliyor...' : '📨 Mesajı Gönder'}
              </button>
            </form>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="mt-12 text-center">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 inline-block">
            <p className="text-sm text-zinc-400">
              Genellikle <span className="text-emerald-400 font-semibold">24 saat</span> içinde yanıt veriyoruz.
              Acil durumlar için lütfen telefon ile iletişime geçin.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
