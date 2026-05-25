// Ürünler bölümü için dynamic layout — runtime Supabase env var gerektirir
export const dynamic = 'force-dynamic'

export default function ProductsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
