import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Admin',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* SOL MENÜ (SIDEBAR) */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              TCGIFTSHOP WS
            </h1>
            <p className="text-xs text-zinc-500 mt-1">Yönetim Paneli</p>
          </div>
          
          <nav className="space-y-2">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-800 text-pink-400 font-medium transition">
              📦 Ürün Yönetimi
            </Link>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition">
              🛒 Siparişler
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition">
              📊 Analizler
            </a>
          </nav>
        </div>

        <div className="border-t border-zinc-800 pt-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition">
            ← Mağazaya Dön
          </Link>
        </div>
      </aside>

      {/* SAĞ İÇERİK ALANI */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}