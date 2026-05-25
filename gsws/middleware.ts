import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ── Admin yetkili e-posta listesi (lowercase) ─────────────────────
const ADMIN_EMAILS = ['tahagulbaz@gmail.com']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  // ── 1) ADMIN GÜVENLIK DUVARI ─────────────────────────────────────
  // /admin rotasına erişim → sadece yetkili email adresleri
  if (pathname.startsWith('/admin')) {
    if (!user) {
      // Giriş yapılmamış → login sayfasına yönlendir
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const email = user.email?.toLowerCase() ?? ''
    if (!ADMIN_EMAILS.includes(email)) {
      // Yetkisiz kullanıcı → ana sayfaya gönder, 403 statüsü yok (güvenlik için)
      console.warn(`[ADMIN GUARD] Yetkisiz erişim denemesi: ${email} → /admin`)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── 2) CHECKOUT GÜVENLIK DUVARI ──────────────────────────────────
  // /checkout rotasına erişim → giriş zorunlu
  if (pathname.startsWith('/checkout')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnTo', '/checkout')
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    // static dosyalar ve api rotaları hariç her şey
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
