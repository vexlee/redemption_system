import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

// PUT /api/admin/stores/[id] — update a store
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const { name, location } = await request.json()

    if (!name?.trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
        .from("stores")
        .update({ name: name.trim(), location: location?.trim() || null })
        .eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
}

// DELETE /api/admin/stores/[id] — delete a store
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const supabase = createServiceClient()
    const { error } = await supabase.from("stores").delete().eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
}
