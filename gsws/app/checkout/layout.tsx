import Navbar from '@/app/components/Navbar'

export const dynamic = 'force-dynamic'

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
