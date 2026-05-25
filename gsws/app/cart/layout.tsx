import Navbar from '@/app/components/Navbar'

// Sepet sayfası için dynamic layout — runtime Supabase env var gerektirir
export const dynamic = 'force-dynamic'

export default function CartLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
