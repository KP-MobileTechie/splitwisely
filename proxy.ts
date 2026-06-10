import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Without env there is no session to refresh; let the request through.
  if (!isSupabaseConfigured()) return response;

  // Magic-link fallback: if Supabase redirects the auth code to any path other
  // than the confirm route (e.g. the Site URL root "/?code=..."), forward it to
  // /auth/confirm so the session is actually exchanged instead of being dropped.
  const url = request.nextUrl;
  const hasAuthParam =
    url.searchParams.has("code") || url.searchParams.has("token_hash");
  if (hasAuthParam && url.pathname !== "/auth/confirm") {
    const confirmUrl = url.clone();
    confirmUrl.pathname = "/auth/confirm";
    return NextResponse.redirect(confirmUrl);
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session so server components see a valid user.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
