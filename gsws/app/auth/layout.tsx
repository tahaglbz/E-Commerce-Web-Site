// Auth rotaları için dynamic layout
// Supabase client'ı runtime ortam değişkenlerine ihtiyaç duyar
export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
