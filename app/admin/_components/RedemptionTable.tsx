"use client"

import { useState } from "react"
import { Store, Trash2, Download } from "lucide-react"
import { Modal } from "./Modal"
import { exportRedemptionsCSV } from "@/lib/export"
import type { RedemptionRow } from "@/lib/types"

interface RedemptionTableProps {
    redemptions: RedemptionRow[]
    onRefresh: () => void
}

export function RedemptionTable({ redemptions, onRefresh }: RedemptionTableProps) {
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const handleDelete = async () => {
        if (deletingId === null) return
        await fetch(`/api/admin/redemptions/${deletingId}`, { method: "DELETE" })
        setDeletingId(null)
        onRefresh()
    }

    return (
        <>
            <div className="bg-[#242427] rounded-3xl p-7 border border-[#333]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white text-lg font-semibold">Recent Redemptions</h3>
                    <button
                        onClick={() => exportRedemptionsCSV(redemptions)}
                        disabled={redemptions.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181b] border border-[#333] hover:border-orange-500/50 hover:text-orange-400 text-[#a1a1aa] text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>

                {/* Mobile card layout */}
                <div className="md:hidden space-y-3">
                    {redemptions.slice(0, 10).map((r) => {
                        const d = new Date(r.created_at)
                        return (
                            <div key={r.id} className="bg-[#18181b] rounded-2xl p-4 border border-[#333] group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#27272a] border border-[#333] flex items-center justify-center shrink-0">
                                            <Store className="w-3.5 h-3.5 text-[#a1a1aa]" />
                                        </div>
                                        <span className="text-[13px] font-semibold text-white truncate max-w-[180px]">{r.store_name}</span>
                                    </div>
                                    <button
                                        onClick={() => setDeletingId(r.id)}
                                        className="text-[#52525b] hover:text-red-400 p-1.5 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="pl-10 space-y-0.5">
                                    <p className="text-[13px] text-[#d4d4d8]">{r.name || "—"}</p>
                                    <p className="text-[12px] text-[#a1a1aa]">{r.email}</p>
                                    <p className="text-[11px] text-[#71717a] font-mono">
                                        {d.toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                    {redemptions.length === 0 && (
                        <div className="py-10 text-center text-[#52525b] text-[15px]">No redemptions yet.</div>
                    )}
                    {redemptions.length > 10 && (
                        <p className="text-center text-[#52525b] text-[13px] pt-2">
                            Showing 10 of {redemptions.length} — export CSV to see all
                        </p>
                    )}
                </div>

                {/* Desktop table layout */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                        <thead>
                            <tr className="text-[#a1a1aa] text-[13px] border-b border-[#333]">
                                <th className="font-normal pb-4 pl-4 w-[28%]">Store</th>
                                <th className="font-normal pb-4 w-[20%]">Name</th>
                                <th className="font-normal pb-4 w-[25%]">Email</th>
                                <th className="font-normal pb-4 w-[18%] text-center">Date</th>
                                <th className="pb-4 w-[9%]" />
                            </tr>
                        </thead>
                        <tbody>
                            {redemptions.slice(0, 10).map((r) => {
                                const d = new Date(r.created_at)
                                return (
                                    <tr
                                        key={r.id}
                                        className="border-b border-[#333]/30 hover:bg-[#333]/20 transition-colors group"
                                    >
                                        <td className="py-4 pl-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#18181b] border border-[#333] flex items-center justify-center shrink-0 group-hover:border-orange-500/30 transition-colors">
                                                    <Store className="w-4 h-4 text-[#a1a1aa]" />
                                                </div>
                                                <span
                                                    className="text-[14px] font-medium text-[#d4d4d8] truncate max-w-[140px]"
                                                    title={r.store_name}
                                                >
                                                    {r.store_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-[14px] text-[#a1a1aa] truncate max-w-[120px]">
                                            {r.name || "—"}
                                        </td>
                                        <td className="py-4 text-[13px] text-[#a1a1aa] truncate max-w-[160px]">
                                            {r.email}
                                        </td>
                                        <td className="py-4 text-[13px] text-[#a1a1aa] text-center font-mono">
                                            {d.toLocaleDateString("en-MY", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="py-4 text-right pr-2">
                                            <button
                                                onClick={() => setDeletingId(r.id)}
                                                className="text-[#52525b] hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-[18px] h-[18px]" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {redemptions.length === 0 && (
                        <div className="py-12 text-center text-[#52525b] text-[15px]">
                            No redemptions yet.
                        </div>
                    )}

                    {redemptions.length > 10 && (
                        <p className="text-center text-[#52525b] text-[13px] pt-4 pb-2">
                            Showing 10 of {redemptions.length} — export CSV to see all
                        </p>
                    )}
                </div>
            </div>

            {/* Delete Confirm Modal */}
            <Modal open={deletingId !== null} onClose={() => setDeletingId(null)}>
                <div className="bg-[#242427] border border-[#333] p-8 rounded-3xl space-y-6 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-bold text-white">Delete Redemption?</h2>
                            <p className="text-[13px] text-[#a1a1aa] mt-0.5">
                                This will permanently remove this entry.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={() => setDeletingId(null)}
                            className="flex-1 px-4 py-3 rounded-xl border border-[#333] bg-[#18181b] text-[#d4d4d8] text-[14px] font-medium hover:bg-[#2a2a2c] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[14px] font-medium transition-all"
                        >
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
