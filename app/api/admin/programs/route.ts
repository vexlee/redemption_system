import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

// GET /api/admin/programs — list all programs
export async function GET() {
    const supabase = createServiceClient()
    const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

// POST /api/admin/programs — create a new program
export async function POST(request: NextRequest) {
    const { name, description } = await request.json()

    if (!name?.trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

    const supabase = createServiceClient()
    const { data, error } = await supabase
        .from("programs")
        .insert({ name: name.trim(), slug, description: description?.trim() || null })
        .select()
        .single()

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "A program with this name already exists." }, { status: 400 })
        }
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log(`[audit] program created id=${data.id} name=${data.name}`)
    return NextResponse.json(data, { status: 201 })
}
