import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from '@/utils/supabase/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 1. Run Supabase session refresh first — this sets auth cookies
  const supabaseResponse = await updateSession(request);

  // 2. Run intl middleware for locale routing
  const intlResponse = intlMiddleware(request);

  // 3. Copy each Supabase cookie individually onto the intl response.
  //    The old approach used headers.get('set-cookie') which collapses
  //    all cookies into one string and can corrupt or lose cookies.
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      // Spread all cookie attributes (httpOnly, sameSite, path, etc.)
      // so security settings are preserved exactly as Supabase set them
      ...cookie,
    });
  });

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};