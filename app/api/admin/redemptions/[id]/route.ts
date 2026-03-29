import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"

// DELETE /api/admin/redemptions/[id] — delete a redemption entry
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const numericId = Number(id)
    if (!id || isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
        return NextResponse.json({ error: "Invalid id." }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
        .from("redemptions")
        .delete()
        .eq("id", numericId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log(`[audit] redemption deleted id=${numericId}`)
    return NextResponse.json({ success: true })
}
