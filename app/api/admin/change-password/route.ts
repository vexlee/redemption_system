import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
    try {
        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Both fields are required." }, { status: 400 })
        }

        // Require ≥8 chars with at least one uppercase, one lowercase, one digit
        const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
        if (!PASSWORD_RE.test(newPassword)) {
            return NextResponse.json(
                {
                    error: "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.",
                },
                { status: 400 }
            )
        }

        const db = createServiceClient()

        // Resolve active password: app_settings override takes precedence over env var
        const { data: setting } = await db
            .from("app_settings")
            .select("value")
            .eq("key", "admin_password")
            .maybeSingle()

        const activePassword =
            setting?.value && setting.value !== ""
                ? setting.value
                : process.env.ADMIN_PASSWORD

        if (currentPassword !== activePassword) {
            return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 })
        }

        const { error } = await db
            .from("app_settings")
            .upsert({ key: "admin_password", value: newPassword }, { onConflict: "key" })

        if (error) throw error

        console.log(`[audit] admin password changed`)
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: "Failed to change password." }, { status: 500 })
    }
}
