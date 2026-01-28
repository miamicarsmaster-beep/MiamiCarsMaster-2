import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    console.log('[Middleware]', {
        pathname,
        hasUser: !!user,
        userEmail: user?.email,
        timestamp: new Date().toISOString()
    })

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard') && !user) {
        console.log('[Middleware] Redirecting to login - no user found for:', pathname)
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect logged-in users away from login
    if (pathname === '/login' && user) {
        // Get user role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        console.log('[Middleware] User logged in, redirecting from login to dashboard. Role:', profile?.role)

        if (profile?.role === 'admin') {
            return NextResponse.redirect(new URL('/dashboard/admin', request.url))
        } else {
            return NextResponse.redirect(new URL('/dashboard/investor', request.url))
        }
    }

    return supabaseResponse
}

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
