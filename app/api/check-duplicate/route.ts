import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

// Simple rate limiter: 15 checks / minute per IP (fail-open to avoid blocking real users)
const _checks = new Map<string, { count: number; resetAt: number }>()
const MAX = 15
const WINDOW_MS = 60_000

export async function GET(request: NextRequest) {
    // x-real-ip is set by Vercel/nginx to the actual client IP and cannot be
    // spoofed. x-forwarded-for is user-controlled at the left side; we take
    // the rightmost value (appended by the trusted proxy) as a fallback.
    const ip =
        request.headers.get("x-real-ip") ??
        request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
        "unknown"

    const now = Date.now()
    if (_checks.size > 500) {
        for (const [key, val] of _checks) {
            if (now > val.resetAt) _checks.delete(key)
        }
    }
    const entry = _checks.get(ip)
    if (entry && now <= entry.resetAt) {
        if (entry.count >= MAX) return NextResponse.json({ duplicate: false })
        entry.count++
    } else {
        _checks.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")?.trim().toLowerCase()
    const phone = searchParams.get("phone")?.trim()
    const programId = searchParams.get("program_id")?.trim()

    if (!email || !phone) return NextResponse.json({ duplicate: false })

    try {
        const db = createServiceClient()
        let query = db
            .from("redemptions")
            .select("id")
            .eq("email", email)
            .eq("phone", phone)

        if (programId) {
            query = query.eq("program_id", programId)
        }

        const { data } = await query.limit(1).maybeSingle()

        return NextResponse.json({ duplicate: !!data })
    } catch {
        return NextResponse.json({ duplicate: false })
    }
}
