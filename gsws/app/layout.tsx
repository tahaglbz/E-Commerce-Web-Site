import type { Metadata } from "next";
import "./globals.css";

// Tüm sayfaları dynamic render et
// (Supabase client build sırasında env var'lara erişemiyor)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "TC Gift Shop — Özel Hediyelik Ürünler",
  description: "TC Gift Shop'ta giyim, hediyelik ve dekorasyon ürünlerini keşfedin. Özel tasarımlar, en iyi kalite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
