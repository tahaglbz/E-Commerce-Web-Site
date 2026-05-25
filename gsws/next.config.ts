import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tüm sayfaları dinamik render et
  // Supabase client env var'lar runtime'da gereklidir
  experimental: {
    // Force-dynamic bu proje için gerekli (Supabase SSR kullanımı)
  },
};

export default nextConfig;
