import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

// PUT /api/admin/programs/[id] — update program details and Instagram settings
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const body = await request.json()
    const {
        name,
        description,
        instagram_mokin_url,
        instagram_mokin_label,
        instagram_gajeto_url,
        instagram_gajeto_label,
    } = body

    const instagramFields = [instagram_mokin_url, instagram_gajeto_url].filter(Boolean)
    for (const url of instagramFields) {
        if (!/^https:\/\/(www\.)?instagram\.com/.test(url)) {
            return NextResponse.json(
                { error: `URL "${url}" must be an Instagram link starting with https://instagram.com` },
                { status: 400 }
            )
        }
    }

    const updates: Record<string, string | null> = {}
    if (name !== undefined) updates.name = name?.trim() || null
    if (description !== undefined) updates.description = description?.trim() || null
    if (instagram_mokin_url !== undefined) updates.instagram_mokin_url = instagram_mokin_url?.trim() || null
    if (instagram_mokin_label !== undefined) updates.instagram_mokin_label = instagram_mokin_label?.trim() || null
    if (instagram_gajeto_url !== undefined) updates.instagram_gajeto_url = instagram_gajeto_url?.trim() || null
    if (instagram_gajeto_label !== undefined) updates.instagram_gajeto_label = instagram_gajeto_label?.trim() || null

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase.from("programs").update(updates).eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
}

// DELETE /api/admin/programs/[id] — delete a program (only if it has no stores)
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createServiceClient()

    const { count } = await supabase
        .from("stores")
        .select("id", { count: "exact", head: true })
        .eq("program_id", id)

    if ((count ?? 0) > 0) {
        return NextResponse.json(
            { error: "Remove all stores from this program before deleting it." },
            { status: 409 }
        )
    }

    const { error } = await supabase.from("programs").delete().eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log(`[audit] program deleted id=${id}`)
    return NextResponse.json({ success: true })
}
