import { NextRequest, NextResponse } from "next/server"
import { signCookieValue, COOKIE_NAME } from "@/lib/auth"
import { createServiceClient } from "@/lib/supabase-server"

// In-memory rate limiter: 5 attempts per 15 minutes per IP
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX = 50
const WINDOW_MS = 15 * 60 * 1000

function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    if (attempts.size > 500) {
        for (const [key, val] of attempts) {
            if (now > val.resetAt) attempts.delete(key)
        }
    }
    const entry = attempts.get(ip)
    if (!entry || now > entry.resetAt) {
        attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
        return true
    }
    if (entry.count >= MAX) return false
    entry.count++
    return true
}

export async function POST(request: NextRequest) {
    // x-real-ip is set by Vercel/nginx to the actual client IP and cannot be
    // spoofed. x-forwarded-for is user-controlled at the left side; we take
    // the rightmost value (appended by the trusted proxy) as a fallback.
    const ip =
        request.headers.get("x-real-ip") ??
        request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
        "unknown"

    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: "Too many attempts. Try again in 15 minutes." },
            { status: 429 }
        )
    }

    const { password } = await request.json()
    const adminPassword = process.env.ADMIN_PASSWORD
    const cookieSecret = process.env.ADMIN_COOKIE_SECRET

    if (!adminPassword || !cookieSecret) {
        return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    // Allow password override stored in app_settings (set via Settings tab)
    let activePassword = adminPassword
    try {
        const db = createServiceClient()
        const { data } = await db
            .from("app_settings")
            .select("value")
            .eq("key", "admin_password")
            .maybeSingle()
        if (data?.value && data.value !== "") {
            activePassword = data.value
        }
    } catch {
        // table may not exist yet — fall back to env var
    }

    if (password !== activePassword) {
        console.log(`[audit] failed login attempt from ip=${ip}`)
        return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    console.log(`[audit] successful admin login from ip=${ip}`)
    const signedValue = await signCookieValue(cookieSecret)

    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, signedValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    })

    return response
}
