import Navbar from '@/app/components/Navbar'

export const dynamic = 'force-dynamic'

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
