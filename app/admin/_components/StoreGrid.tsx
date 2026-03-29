"use client"

import { useState } from "react"
import {
    Plus,
    QrCode,
    Pencil,
    Trash2,
    X,
    Check,
    Download,
    Store,
    Loader2,
    AlertCircle,
    Database,
} from "lucide-react"
import QRCode from "qrcode"
import { Modal } from "./Modal"
import type { StoreData } from "@/lib/types"

interface StoreGridProps {
    stores: StoreData[]
    onRefresh: () => void
    programId: string
}

export function StoreGrid({ stores, onRefresh, programId }: StoreGridProps) {
    // ── Add Store ─────────────────────────────────────────────────────────────
    const [addOpen, setAddOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [addError, setAddError] = useState("")
    const [adding, setAdding] = useState(false)

    const handleAddStore = async () => {
        if (!newName.trim()) return
        setAdding(true)
        setAddError("")
        const slug = newName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
        const res = await fetch("/api/admin/stores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim(), slug, program_id: programId }),
        })
        if (!res.ok) {
            const data = await res.json()
            setAddError(data.error || "Failed to add store")
        } else {
            setAddOpen(false)
            setNewName("")
            onRefresh()
        }
        setAdding(false)
    }

    // ── Edit Store ────────────────────────────────────────────────────────────
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editLocation, setEditLocation] = useState("")

    const startEdit = (store: StoreData) => {
        setEditingId(store.id)
        setEditName(store.name)
        setEditLocation(store.location || "")
    }

    const saveEdit = async () => {
        if (!editingId || !editName.trim()) return
        await fetch(`/api/admin/stores/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: editName.trim(), location: editLocation.trim() || null }),
        })
        setEditingId(null)
        onRefresh()
    }

    // ── Delete Store ──────────────────────────────────────────────────────────
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async () => {
        if (!deletingId) return
        await fetch(`/api/admin/stores/${deletingId}`, { method: "DELETE" })
        setDeletingId(null)
        onRefresh()
    }

    // ── QR Code ───────────────────────────────────────────────────────────────
    const [qrStore, setQrStore] = useState<StoreData | null>(null)
    const [qrDataUrl, setQrDataUrl] = useState("")

    const openQr = async (store: StoreData) => {
        setQrStore(store)
        setQrDataUrl("")
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
        const url = `${baseUrl}/redeem?store_id=${store.id}`
        const dataUrl = await QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            color: { dark: "#0f0a2e", light: "#f8fafc" },
        })
        setQrDataUrl(dataUrl)
    }

    const downloadQr = () => {
        if (!qrDataUrl || !qrStore) return
        const a = document.createElement("a")
        a.href = qrDataUrl
        a.download = `qr-${qrStore.slug || qrStore.name.toLowerCase().replace(/\s/g, "-")}.png`
        a.click()
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between bg-[#242427] p-6 rounded-3xl border border-[#333]">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Store Management</h2>
                    <p className="text-[13px] text-[#a1a1aa]">Manage branches and generate QR codes</p>
                </div>
                <button
                    onClick={() => {
                        setAddOpen(true)
                        setAddError("")
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[14px] font-medium transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                    <Plus className="w-[18px] h-[18px]" />
                    Add Store
                </button>
            </div>

            {/* Store Grid */}
            {stores.length === 0 ? (
                <div className="bg-[#242427] border border-[#333] rounded-3xl p-16 text-center">
                    <Database className="w-12 h-12 mx-auto opacity-20 mb-4 text-white" />
                    <h3 className="text-lg font-semibold text-white mb-1">No Stores Found</h3>
                    <p className="text-[14px] text-[#a1a1aa]">Add your first store to get started.</p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {stores.map((store) => (
                        <div
                            key={store.id}
                            className="bg-[#242427] border border-[#333] hover:border-[#444] rounded-2xl p-6 transition-all group"
                        >
                            {editingId === store.id ? (
                                /* Edit form */
                                <div className="space-y-4">
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors"
                                        placeholder="Store name"
                                        autoFocus
                                    />
                                    <input
                                        value={editLocation}
                                        onChange={(e) => setEditLocation(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors"
                                        placeholder="Location (optional)"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={saveEdit}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[13px] font-medium transition-colors"
                                        >
                                            <Check className="w-4 h-4" /> Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#333] text-[#d4d4d8] hover:bg-[#2a2a2c] text-[13px] font-medium transition-colors"
                                        >
                                            <X className="w-4 h-4" /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Display */
                                <>
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-[#18181b] border border-[#333] flex items-center justify-center flex-shrink-0 group-hover:border-orange-500/30 transition-colors shadow-inner">
                                            <Store className="w-5 h-5 text-[#d4d4d8] group-hover:text-orange-500 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <p className="font-semibold text-white text-[16px] truncate">
                                                {store.name}
                                            </p>
                                            {store.location && (
                                                <p className="text-[13px] text-[#a1a1aa] truncate mt-0.5">
                                                    {store.location}
                                                </p>
                                            )}
                                            <p className="text-[11px] text-[#52525b] font-mono mt-1 bg-[#18181b] inline-block px-2 py-0.5 rounded border border-[#333]">
                                                /{store.slug}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => openQr(store)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#333] hover:border-orange-500/50 hover:text-orange-400 text-[#d4d4d8] text-[13px] font-medium transition-colors"
                                        >
                                            <QrCode className="w-[18px] h-[18px]" /> QR Code
                                        </button>
                                        <button
                                            onClick={() => startEdit(store)}
                                            className="p-2.5 rounded-xl bg-[#18181b] border border-[#333] hover:border-[#52525b] hover:bg-[#2a2a2c] text-[#a1a1aa] hover:text-white transition-colors"
                                            title="Edit store"
                                        >
                                            <Pencil className="w-[18px] h-[18px]" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(store.id)}
                                            className="p-2.5 rounded-xl bg-[#18181b] border border-[#333] hover:border-red-500/30 hover:bg-red-500/10 text-[#a1a1aa] hover:text-red-400 transition-colors"
                                            title="Delete store"
                                        >
                                            <Trash2 className="w-[18px] h-[18px]" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Add Store Modal ─────────────────────────────────────────────── */}
            <Modal open={addOpen} onClose={() => setAddOpen(false)}>
                <div className="bg-[#242427] border border-[#333] p-8 rounded-3xl space-y-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                <Store className="w-5 h-5 text-orange-500" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Add New Store</h2>
                        </div>
                        <button
                            onClick={() => setAddOpen(false)}
                            className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#333] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-[13px] font-medium text-[#d4d4d8] ml-1">
                                Store Name *
                            </label>
                            <input
                                value={newName}
                                onChange={(e) => {
                                    setNewName(e.target.value)
                                    setAddError("")
                                }}
                                placeholder="e.g. KLCC Outlet"
                                className="w-full px-4 py-3 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
                            />
                        </div>
                        {addError && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <span className="text-[13px] text-red-400">{addError}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={() => setAddOpen(false)}
                            className="flex-1 px-4 py-3 rounded-xl border border-[#333] bg-[#18181b] text-[#d4d4d8] text-[14px] font-medium hover:bg-[#2a2a2c] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddStore}
                            disabled={adding || !newName.trim()}
                            className="flex-1 px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-medium transition-all flex items-center justify-center gap-2"
                        >
                            {adding ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-[18px] h-[18px]" /> Add Store
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── QR Code Modal ───────────────────────────────────────────────── */}
            <Modal
                open={!!qrStore}
                onClose={() => {
                    setQrStore(null)
                    setQrDataUrl("")
                }}
            >
                <div className="bg-[#242427] border border-[#333] p-8 rounded-3xl space-y-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                                <QrCode className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-[16px] font-bold text-white">{qrStore?.name}</h2>
                                <p className="text-[12px] text-[#a1a1aa]">Scan to redeem</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setQrStore(null)
                                setQrDataUrl("")
                            }}
                            className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#333] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {qrDataUrl ? (
                        <div className="flex flex-col items-center gap-6 pt-2">
                            <div className="p-5 rounded-[24px] bg-white inline-block shadow-2xl">
                                <img src={qrDataUrl} alt="QR Code" width={220} height={220} className="rounded-lg" />
                            </div>
                            <div className="w-full px-5 py-4 rounded-xl bg-[#18181b] border border-[#333]">
                                <p className="text-[12px] text-[#a1a1aa] font-mono break-all leading-relaxed">
                                    {process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "")}/redeem?store_id={qrStore?.id}
                                </p>
                            </div>
                            <button
                                onClick={downloadQr}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-gray-100 text-black text-[14px] font-bold transition-all"
                            >
                                <Download className="w-[18px] h-[18px]" />
                                Download PNG
                            </button>
                        </div>
                    ) : (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        </div>
                    )}
                </div>
            </Modal>

            {/* ── Delete Store Confirm ─────────────────────────────────────────── */}
            <Modal open={!!deletingId} onClose={() => setDeletingId(null)}>
                <div className="bg-[#242427] border border-[#333] p-8 rounded-3xl space-y-6 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-bold text-white">Delete Store?</h2>
                            <p className="text-[13px] text-[#a1a1aa] mt-0.5">This action cannot be undone.</p>
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
