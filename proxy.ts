import { NextRequest, NextResponse } from "next/server"
import { verifyCookieValue, COOKIE_NAME } from "@/lib/auth"

const PUBLIC_PATHS = [
    "/admin/login",
    "/api/admin/login",
    "/api/admin/logout",
]

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow public paths through
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.next()
    }

    // Protect /admin/* and /api/admin/*
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        const cookieSecret = process.env.ADMIN_COOKIE_SECRET
        const cookieValue = request.cookies.get(COOKIE_NAME)?.value

        const isValid =
            cookieSecret &&
            cookieValue &&
            (await verifyCookieValue(cookieValue, cookieSecret))

        if (!isValid) {
            // For API routes return 401, for pages redirect to login
            if (pathname.startsWith("/api/")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
            }
            const loginUrl = new URL("/admin/login", request.url)
            return NextResponse.redirect(loginUrl)
        }

        // CSRF protection: for state-changing API requests, verify the Origin
        // header matches this app. Browsers always send Origin on non-GET/HEAD
        // requests, so a missing or mismatched Origin means a cross-site attempt.
        if (pathname.startsWith("/api/admin") && !SAFE_METHODS.has(request.method)) {
            const origin = request.headers.get("origin")
            const expectedOrigin = request.nextUrl.origin
            if (!origin || origin !== expectedOrigin) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
}
