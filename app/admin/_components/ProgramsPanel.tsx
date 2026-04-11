"use client"

import { useState, useRef } from "react"
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Check,
    Loader2,
    AlertCircle,
    Layers,
    ArrowRight,
    Upload,
    ImageOff,
} from "lucide-react"
import { Modal } from "./Modal"
import type { Program, StoreData, RedemptionRow } from "@/lib/types"

type NavKey = "dashboard" | "stores" | "analytics" | "settings" | "programs"

interface ProgramsPanelProps {
    programs: Program[]
    stores: StoreData[]
    redemptions: RedemptionRow[]
    selectedProgramId: string | null
    onProgramChange: (id: string) => void
    onRefresh: () => void
    onNavChange: (nav: NavKey) => void
}

export function ProgramsPanel({
    programs,
    stores,
    redemptions,
    selectedProgramId,
    onProgramChange,
    onRefresh,
    onNavChange,
}: ProgramsPanelProps) {
    // ── Add Program ────────────────────────────────────────────────────────────
    const [addOpen, setAddOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDescription, setNewDescription] = useState("")
    const [addError, setAddError] = useState("")
    const [adding, setAdding] = useState(false)

    const handleAddProgram = async () => {
        if (!newName.trim()) return
        setAdding(true)
        setAddError("")
        const res = await fetch("/api/admin/programs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() || undefined }),
        })
        if (!res.ok) {
            const data = await res.json()
            setAddError(data.error || "Failed to create program")
        } else {
            const data = await res.json()
            setAddOpen(false)
            setNewName("")
            setNewDescription("")
            await onRefresh()
            onProgramChange(data.id)
            onNavChange("dashboard")
        }
        setAdding(false)
    }

    // ── Edit Program ───────────────────────────────────────────────────────────
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editError, setEditError] = useState("")
    const [editSaving, setEditSaving] = useState(false)

    // Icon upload state
    const [iconPreview, setIconPreview] = useState<string | null>(null)
    const [iconFile, setIconFile] = useState<File | null>(null)
    const [iconUploading, setIconUploading] = useState(false)
    const [iconError, setIconError] = useState("")
    const [removingIcon, setRemovingIcon] = useState(false)
    const iconInputRef = useRef<HTMLInputElement>(null)

    const startEdit = (p: Program) => {
        setEditingId(p.id)
        setEditName(p.name)
        setEditDescription(p.description || "")
        setEditError("")
        setIconPreview(p.icon_url || null)
        setIconFile(null)
        setIconError("")
    }

    const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            setIconError("File exceeds 2 MB limit.")
            return
        }
        setIconError("")
        setIconFile(file)
        setIconPreview(URL.createObjectURL(file))
    }

    const uploadIcon = async (programId: string): Promise<string | null> => {
        if (!iconFile) return null
        setIconUploading(true)
        const fd = new FormData()
        fd.append("icon", iconFile)
        const res = await fetch(`/api/admin/programs/${programId}/icon`, {
            method: "POST",
            body: fd,
        })
        setIconUploading(false)
        if (!res.ok) {
            const data = await res.json()
            setIconError(data.error || "Icon upload failed.")
            return null
        }
        const data = await res.json()
        return data.icon_url as string
    }

    const removeIcon = async (programId: string) => {
        setRemovingIcon(true)
        await fetch(`/api/admin/programs/${programId}/icon`, { method: "DELETE" })
        setRemovingIcon(false)
        setIconPreview(null)
        setIconFile(null)
        onRefresh()
    }

    const saveEdit = async () => {
        if (!editingId || !editName.trim()) return
        setEditSaving(true)
        setEditError("")
        setIconError("")

        // Upload icon first if a new file was chosen
        if (iconFile) {
            const url = await uploadIcon(editingId)
            if (!url) {
                setEditSaving(false)
                return
            }
        }

        const res = await fetch(`/api/admin/programs/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || null }),
        })
        if (!res.ok) {
            const data = await res.json()
            setEditError(data.error || "Failed to save")
        } else {
            setEditingId(null)
            setIconFile(null)
            onRefresh()
        }
        setEditSaving(false)
    }

    // ── Delete Program ─────────────────────────────────────────────────────────
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [deleteError, setDeleteError] = useState("")
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        if (!deletingId) return
        setDeleting(true)
        setDeleteError("")
        const res = await fetch(`/api/admin/programs/${deletingId}`, { method: "DELETE" })
        if (!res.ok) {
            const data = await res.json()
            setDeleteError(data.error || "Failed to delete")
            setDeleting(false)
            return
        }
        setDeletingId(null)
        setDeleteError("")
        setDeleting(false)
        onRefresh()
    }

    // Store/redemption counts per program (from currently loaded data for selected program)
    // For other programs, we show totals only if they're loaded
    const getStoreCount = (programId: string) => {
        if (programId === selectedProgramId) return stores.length
        return null
    }

    const getRedemptionCount = (programId: string) => {
        if (programId === selectedProgramId) return redemptions.length
        return null
    }

    const deletingProgram = programs.find((p) => p.id === deletingId)
    const deletingHasStores = deletingId === selectedProgramId && stores.length > 0

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between bg-[#242427] p-6 rounded-3xl border border-[#333] mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Programs</h2>
                    <p className="text-[13px] text-[#a1a1aa]">Create and manage independent redemption programs</p>
                </div>
                <button
                    onClick={() => { setAddOpen(true); setAddError("") }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[14px] font-medium transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                    <Plus className="w-[18px] h-[18px]" />
                    New Program
                </button>
            </div>

            {/* Program Grid */}
            {programs.length === 0 ? (
                <div className="bg-[#242427] border border-[#333] rounded-3xl p-16 text-center">
                    <Layers className="w-12 h-12 mx-auto opacity-20 mb-4 text-white" />
                    <h3 className="text-lg font-semibold text-white mb-1">No Programs Yet</h3>
                    <p className="text-[14px] text-[#a1a1aa]">Create your first program to get started.</p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-[1200px]">
                    {programs.map((program) => {
                        const isActive = program.id === selectedProgramId
                        const storeCount = getStoreCount(program.id)
                        const redemptionCount = getRedemptionCount(program.id)

                        return (
                            <div
                                key={program.id}
                                className={`bg-[#242427] border rounded-2xl p-6 transition-all group ${isActive ? "border-orange-500/40" : "border-[#333] hover:border-[#444]"}`}
                            >
                                {editingId === program.id ? (
                                    <div className="space-y-3">
                                        <input
                                            value={editName}
                                            onChange={(e) => { setEditName(e.target.value); setEditError("") }}
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors"
                                            placeholder="Program name"
                                            autoFocus
                                        />
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors resize-none"
                                            placeholder="Description (optional)"
                                            rows={2}
                                        />

                                        {/* Icon upload */}
                                        <div className="space-y-2">
                                            <p className="text-[12px] text-[#71717a] font-medium">Program Icon</p>
                                            <div className="flex items-center gap-3">
                                                {/* Preview */}
                                                <div className="w-14 h-14 rounded-xl bg-[#18181b] border border-[#333] flex items-center justify-center overflow-hidden shrink-0">
                                                    {iconPreview ? (
                                                        <img src={iconPreview} alt="icon preview" className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        <ImageOff className="w-5 h-5 text-[#52525b]" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                                    <input
                                                        ref={iconInputRef}
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                                                        className="hidden"
                                                        onChange={handleIconSelect}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => iconInputRef.current?.click()}
                                                        disabled={iconUploading}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#333] hover:border-orange-500/50 text-[#d4d4d8] text-[12px] font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        <Upload className="w-3.5 h-3.5" />
                                                        {iconPreview ? "Change Icon" : "Upload Icon"}
                                                    </button>
                                                    {iconPreview && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeIcon(program.id)}
                                                            disabled={removingIcon}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 text-red-400 text-[12px] font-medium transition-colors disabled:opacity-50"
                                                        >
                                                            {removingIcon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-[#52525b]">PNG, JPEG, WebP, GIF or SVG · max 2 MB</p>
                                            {iconError && <p className="text-[12px] text-red-400">{iconError}</p>}
                                        </div>

                                        {editError && (
                                            <p className="text-[12px] text-red-400">{editError}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={saveEdit}
                                                disabled={editSaving || iconUploading}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[13px] font-medium transition-colors disabled:opacity-50"
                                            >
                                                {(editSaving || iconUploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                Save
                                            </button>
                                            <button
                                                onClick={() => { setEditingId(null); setIconFile(null); setIconPreview(null) }}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#333] text-[#d4d4d8] hover:bg-[#2a2a2c] text-[13px] font-medium transition-colors"
                                            >
                                                <X className="w-4 h-4" /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start gap-4 mb-5">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors overflow-hidden ${isActive ? "bg-orange-500/15 border-orange-500/30" : "bg-[#18181b] border-[#333] group-hover:border-orange-500/20"}`}>
                                                {program.icon_url ? (
                                                    <img src={program.icon_url} alt={program.name} className="w-full h-full object-contain p-1.5" />
                                                ) : (
                                                    <Layers className={`w-5 h-5 transition-colors ${isActive ? "text-orange-400" : "text-[#d4d4d8] group-hover:text-orange-400"}`} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-white text-[15px] truncate">{program.name}</p>
                                                    {isActive && (
                                                        <span className="shrink-0 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                                                            ACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                {program.description && (
                                                    <p className="text-[12px] text-[#71717a] mt-0.5 line-clamp-2">{program.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {isActive && (
                                            <div className="grid grid-cols-2 gap-3 mb-5">
                                                <div className="p-3 rounded-xl bg-[#18181b] border border-[#333]">
                                                    <p className="text-[11px] text-[#52525b] uppercase tracking-wider">Stores</p>
                                                    <p className="text-[18px] font-bold text-white mt-0.5">{storeCount ?? "—"}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-[#18181b] border border-[#333]">
                                                    <p className="text-[11px] text-[#52525b] uppercase tracking-wider">Redemptions</p>
                                                    <p className="text-[18px] font-bold text-white mt-0.5">{redemptionCount ?? "—"}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            {!isActive && (
                                                <button
                                                    onClick={() => {
                                                        onProgramChange(program.id)
                                                        onNavChange("dashboard")
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#333] hover:border-orange-500/50 hover:text-orange-400 text-[#d4d4d8] text-[13px] font-medium transition-colors"
                                                >
                                                    Switch <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {isActive && (
                                                <button
                                                    onClick={() => onNavChange("dashboard")}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600/10 border border-orange-500/20 hover:bg-orange-500/20 text-orange-400 text-[13px] font-medium transition-colors"
                                                >
                                                    View Dashboard <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => startEdit(program)}
                                                className="p-2.5 rounded-xl bg-[#18181b] border border-[#333] hover:border-[#52525b] hover:bg-[#2a2a2c] text-[#a1a1aa] hover:text-white transition-colors"
                                                title="Edit program"
                                            >
                                                <Pencil className="w-[18px] h-[18px]" />
                                            </button>
                                            <button
                                                onClick={() => { setDeletingId(program.id); setDeleteError("") }}
                                                disabled={programs.length === 1}
                                                className="p-2.5 rounded-xl bg-[#18181b] border border-[#333] hover:border-red-500/30 hover:bg-red-500/10 text-[#a1a1aa] hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={programs.length === 1 ? "Cannot delete the only program" : "Delete program"}
                                            >
                                                <Trash2 className="w-[18px] h-[18px]" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Add Program Modal ──────────────────────────────────────────────── */}
            <Modal open={addOpen} onClose={() => setAddOpen(false)}>
                <div className="bg-[#242427] border border-[#333] p-8 rounded-3xl space-y-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-orange-500" />
                            </div>
                            <h2 className="text-lg font-bold text-white">New Program</h2>
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
                            <label className="block text-[13px] font-medium text-[#d4d4d8] ml-1">Program Name *</label>
                            <input
                                value={newName}
                                onChange={(e) => { setNewName(e.target.value); setAddError("") }}
                                placeholder="e.g. Hari Raya 2025 Campaign"
                                className="w-full px-4 py-3 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleAddProgram()}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[13px] font-medium text-[#d4d4d8] ml-1">Description</label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="Optional description"
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors resize-none"
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
                            onClick={handleAddProgram}
                            disabled={adding || !newName.trim()}
                            className="flex-1 px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-medium transition-all flex items-center justify-center gap-2"
                        >
                            {adding ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                            ) : (
                                <><Plus className="w-[18px] h-[18px]" /> Create Program</>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
            <Modal open={!!deletingId} onClose={() => { setDeletingId(null); setDeleteError("") }}>
                <div className="bg-[#242427] border border-[#333] p-8 rounded-3xl space-y-6 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-bold text-white">Delete Program?</h2>
                            <p className="text-[13px] text-[#a1a1aa] mt-0.5">
                                &quot;{deletingProgram?.name}&quot; will be permanently deleted.
                            </p>
                        </div>
                    </div>

                    {deletingHasStores && (
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                            <p className="text-[13px] text-yellow-400">
                                This program has {stores.length} store{stores.length !== 1 ? "s" : ""}. Remove all stores before deleting.
                            </p>
                        </div>
                    )}

                    {deleteError && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-[13px] text-red-400">{deleteError}</span>
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={() => { setDeletingId(null); setDeleteError("") }}
                            className="flex-1 px-4 py-3 rounded-xl border border-[#333] bg-[#18181b] text-[#d4d4d8] text-[14px] font-medium hover:bg-[#2a2a2c] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting || deletingHasStores}
                            className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-medium transition-all flex items-center justify-center gap-2"
                        >
                            {deleting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
                            ) : (
                                "Yes, Delete"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
