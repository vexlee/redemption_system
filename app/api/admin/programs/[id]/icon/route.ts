import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

// POST /api/admin/programs/[id]/icon — upload a custom icon for a program
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const formData = await request.formData()
    const file = formData.get("icon") as File | null

    if (!file) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
            { error: "Invalid file type. Allowed: PNG, JPEG, WebP, GIF, SVG." },
            { status: 400 }
        )
    }

    if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "File exceeds 2 MB limit." }, { status: 400 })
    }

    // Fixed path per program — no extension, content-type carries the format.
    // upsert:true overwrites in place so no list/delete dance is needed.
    const storagePath = `${id}/icon`

    const buffer = Buffer.from(await file.arrayBuffer())
    const supabase = createServiceClient()

    const { error: uploadError } = await supabase.storage
        .from("program-icons")
        .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
        })

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
        .from("program-icons")
        .getPublicUrl(storagePath)

    // Append a cache-bust timestamp so CDN always serves the new image
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    // Persist URL in the programs table
    const { error: dbError } = await supabase
        .from("programs")
        .update({ icon_url: publicUrl })
        .eq("id", id)

    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    console.log(`[audit] program icon updated id=${id} url=${publicUrl}`)
    return NextResponse.json({ icon_url: publicUrl })
}

// DELETE /api/admin/programs/[id]/icon — remove the custom icon
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createServiceClient()

    // Remove by known fixed path — no need to list first
    await supabase.storage
        .from("program-icons")
        .remove([`${id}/icon`])

    await supabase.from("programs").update({ icon_url: null }).eq("id", id)

    console.log(`[audit] program icon removed id=${id}`)
    return NextResponse.json({ success: true })
}
