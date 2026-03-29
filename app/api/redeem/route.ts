import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

// In-memory rate limiter: 3 submissions per 10 minutes per IP
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX = 3
const WINDOW_MS = 10 * 60 * 1000

function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    // Sweep expired entries when map grows large to prevent memory leak
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Requires valid local-part, domain, and TLD of ≥2 chars
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

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
            { error: "Too many submissions. Please try again later." },
            { status: 429 }
        )
    }

    const body = await request.json()
    const { store_id, name, email, phone } = body

    if (!store_id || typeof store_id !== "string" || !UUID_RE.test(store_id)) {
        return NextResponse.json({ error: "Invalid store link." }, { status: 400 })
    }

    const trimmedName = name?.trim()
    const trimmedEmail = email?.trim().toLowerCase()
    const trimmedPhone = phone?.trim()

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
        return NextResponse.json(
            { error: "Name, email, and phone number are required." },
            { status: 400 }
        )
    }

    // Input length limits (RFC 5321 for email; generous but bounded for others)
    if (trimmedName.length > 100) {
        return NextResponse.json({ error: "Name is too long." }, { status: 400 })
    }
    if (trimmedEmail.length > 254) {
        return NextResponse.json({ error: "Email address is too long." }, { status: 400 })
    }
    if (trimmedPhone.length > 20) {
        return NextResponse.json({ error: "Phone number is too long." }, { status: 400 })
    }

    if (!EMAIL_RE.test(trimmedEmail)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify store exists and get its program_id
    const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("id, program_id")
        .eq("id", store_id)
        .single()

    if (storeError || !store) {
        return NextResponse.json({ error: "Invalid store link." }, { status: 400 })
    }

    const { error: insertError } = await supabase.from("redemptions").insert({
        store_id,
        program_id: store.program_id,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
    })

    if (insertError) {
        if (insertError.code === "23505") {
            return NextResponse.json(
                { error: "This email or phone number has already been used for this program's redemption." },
                { status: 409 }
            )
        }
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
}
