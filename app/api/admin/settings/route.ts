import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

const ALLOWED_KEYS = [
    "instagram_mokin_url",
    "instagram_mokin_label",
    "instagram_gajeto_url",
    "instagram_gajeto_label",
]

export async function GET() {
    try {
        const db = createServiceClient()
        const { data, error } = await db
            .from("app_settings")
            .select("key, value")
            .in("key", ALLOWED_KEYS)

        if (error) throw error

        const settings: Record<string, string> = {}
        for (const row of data ?? []) settings[row.key] = row.value

        return NextResponse.json(settings)
    } catch {
        return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const db = createServiceClient()

        for (const key of ALLOWED_KEYS) {
            if (!(key in body)) continue
            const value = String(body[key]).trim()

            // Validate URL fields: must be https:// instagram.com links
            if (key.endsWith("_url") && value !== "") {
                let parsed: URL
                try {
                    parsed = new URL(value)
                } catch {
                    return NextResponse.json(
                        { error: `Invalid URL for ${key}.` },
                        { status: 400 }
                    )
                }
                if (parsed.protocol !== "https:") {
                    return NextResponse.json(
                        { error: `URL for ${key} must use HTTPS.` },
                        { status: 400 }
                    )
                }
                if (!parsed.hostname.endsWith("instagram.com")) {
                    return NextResponse.json(
                        { error: `URL for ${key} must be an Instagram link.` },
                        { status: 400 }
                    )
                }
            }

            const { error } = await db
                .from("app_settings")
                .upsert({ key, value }, { onConflict: "key" })
            if (error) throw error
        }

        console.log(`[audit] settings updated: keys=${Object.keys(body).filter(k => ALLOWED_KEYS.includes(k)).join(",")}`)
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }
}
