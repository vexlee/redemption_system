import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

// POST /api/admin/stores — create a new store
export async function POST(request: NextRequest) {
    const { name, slug, location, program_id } = await request.json()

    if (!name?.trim() || !slug?.trim()) {
        return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    if (!program_id) {
        return NextResponse.json({ error: "program_id is required" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
        .from("stores")
        .insert({ name: name.trim(), slug: slug.trim(), location: location?.trim() || null, program_id })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log(`[audit] store created id=${data.id} name=${data.name}`)
    return NextResponse.json(data, { status: 201 })
}
