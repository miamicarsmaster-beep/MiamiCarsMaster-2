import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Security: Auth state check proceeds without logging sensitive info

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Update request cookies for the current operation
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })

                    // Create a new response with the updated request cookies
                    supabaseResponse = NextResponse.next({
                        request,
                    })

                    // Set the cookies on the response for the browser with production-safe options
                    cookiesToSet.forEach(({ name, value, options }) => {
                        supabaseResponse.cookies.set(name, value, {
                            ...options,
                            path: '/',
                            sameSite: 'lax',
                            secure: process.env.NODE_ENV === 'production',
                            httpOnly: true, // Security best practice
                        })
                    })
                },
            },
        }
    )

    // IMPORTANT: calling getUser() triggers the setAll if the token needs refresh
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Non-sensitive path logging for development
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Middleware] ${user ? '✅' : '❌'} - ${pathname}`)
    }

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard') && !user) {
        console.log('[Middleware] Redirecting to login - no user found for:', pathname)
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect logged-in users away from login
    if (pathname === '/login' && user) {
        // Get user role to redirect correctly
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        console.log('[Middleware] User logged in, redirecting from login to dashboard. Role:', profile?.role)

        if (profile?.role === 'admin') {
            return NextResponse.redirect(new URL('/dashboard/admin', request.url))
        } else {
            // Default to investor if no role or investor
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
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
