export interface RedemptionExportRow {
    id: number
    store_name?: string
    store_id: string
    name?: string
    email: string
    phone: string
    created_at: string
}

/** Triggers a CSV download of all redemption rows in the browser. */
export function exportRedemptionsCSV(redemptions: RedemptionExportRow[]): void {
    const headers = ["ID", "Store", "Name", "Email", "Phone", "Date", "Time"]

    const rows = redemptions.map((r) => {
        const d = new Date(r.created_at)
        return [
            r.id,
            r.store_name || r.store_id,
            r.name || "",
            r.email,
            r.phone,
            d.toLocaleDateString("en-MY"),
            d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" }),
        ]
    })

    const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `redemptions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}
