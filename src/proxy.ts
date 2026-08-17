import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Domain detection:
  // - Warga domain: bazeni.vercel.app, warga.*, publik.* (atau ?mode=warga)
  // - Admin domain: zenkeba.vercel.app, admin.*, dashboard.* (atau ?mode=admin)

  const isWargaDomain =
    hostname.includes('kebazeni') ||
    hostname.startsWith('warga.') ||
    hostname.startsWith('publik.') ||
    url.searchParams.get('mode') === 'warga';

  const isAdminDomain =
    hostname.includes('zenkeba') ||
    hostname.startsWith('admin.') ||
    hostname.startsWith('dashboard.') ||
    url.searchParams.get('mode') === 'admin';

  // Ketika diakses dari Domain Warga (bazeni.vercel.app):
  if (isWargaDomain) {
    // Rewrite halaman utama "/" langsung menuju ke Portal Warga "/guest"
    if (url.pathname === '/') {
      url.pathname = '/guest';
      return NextResponse.rewrite(url);
    }
  }

  // Ketika diakses dari Domain Admin (zenkeba.vercel.app):
  if (isAdminDomain) {
    // Jika mencoba akses "/guest", kembalikan ke Admin root "/"
    if (url.pathname === '/guest') {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
