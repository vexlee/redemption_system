import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

// Rate limiter: 30 requests per minute per IP
const _hits = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    if (_hits.size > 500) {
        for (const [key, val] of _hits) {
            if (now > val.resetAt) _hits.delete(key)
        }
    }
    const entry = _hits.get(ip)
    if (!entry || now > entry.resetAt) {
        _hits.set(ip, { count: 1, resetAt: now + 60_000 })
        return true
    }
    if (entry.count >= 30) return false
    entry.count++
    return true
}

const DEFAULTS = {
    mokin: {
        url: "https://www.instagram.com/aukey.malaysia?igsh=eDY5ZWZ1M2ZhcHV5",
        label: "Mokin Malaysia",
    },
    gajeto: {
        url: "https://www.instagram.com/gajetomalaysia?igsh=MWVyYm9ldWppbm5raA==",
        label: "Gajeto Malaysia",
    },
}

export async function GET(request: NextRequest) {
    const ip =
        request.headers.get("x-real-ip") ??
        request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
        "unknown"
    if (!checkRateLimit(ip)) {
        return NextResponse.json({ error: "Too many requests." }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const programId = searchParams.get("program_id")?.trim()

    try {
        const db = createServiceClient()

        if (programId) {
            const { data } = await db
                .from("programs")
                .select(
                    "instagram_mokin_url, instagram_mokin_label, instagram_gajeto_url, instagram_gajeto_label, icon_url"
                )
                .eq("id", programId)
                .single()

            if (!data) return NextResponse.json(DEFAULTS)

            return NextResponse.json({
                mokin: {
                    url: data.instagram_mokin_url || DEFAULTS.mokin.url,
                    label: data.instagram_mokin_label || DEFAULTS.mokin.label,
                },
                gajeto: {
                    url: data.instagram_gajeto_url || DEFAULTS.gajeto.url,
                    label: data.instagram_gajeto_label || DEFAULTS.gajeto.label,
                },
                icon_url: data.icon_url || null,
            })
        }

        // Fallback: read from app_settings (legacy path)
        const { data } = await db
            .from("app_settings")
            .select("key, value")
            .in("key", [
                "instagram_mokin_url",
                "instagram_mokin_label",
                "instagram_gajeto_url",
                "instagram_gajeto_label",
            ])

        if (!data || data.length === 0) return NextResponse.json(DEFAULTS)

        const cfg: Record<string, string> = {}
        for (const row of data) cfg[row.key] = row.value

        return NextResponse.json({
            mokin: {
                url: cfg.instagram_mokin_url || DEFAULTS.mokin.url,
                label: cfg.instagram_mokin_label || DEFAULTS.mokin.label,
            },
            gajeto: {
                url: cfg.instagram_gajeto_url || DEFAULTS.gajeto.url,
                label: cfg.instagram_gajeto_label || DEFAULTS.gajeto.label,
            },
        })
    } catch {
        return NextResponse.json(DEFAULTS)
    }
}
