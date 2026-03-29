"use client"

import { useState, useEffect } from "react"
import {
    LogOut,
    Lock,
    Download,
    Instagram,
    Eye,
    EyeOff,
    Check,
    Loader2,
    AlertCircle,
    Save,
    Layers,
} from "lucide-react"
import { exportRedemptionsCSV } from "@/lib/export"
import type { RedemptionRow, Program } from "@/lib/types"

interface SettingsPanelProps {
    redemptions: RedemptionRow[]
    onLogout: () => void
    program: Program | null
    onProgramUpdate: () => void
}

type SectionStatus = "idle" | "saving" | "success" | "error"

// ── Change Password ────────────────────────────────────────────────────────────
function ChangePasswordSection() {
    const [current, setCurrent] = useState("")
    const [next, setNext] = useState("")
    const [confirm, setConfirm] = useState("")
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNext, setShowNext] = useState(false)
    const [status, setStatus] = useState<SectionStatus>("idle")
    const [error, setError] = useState("")

    const canSubmit = current && next && confirm && next === confirm && next.length >= 8

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return
        if (next !== confirm) {
            setError("Passwords do not match.")
            return
        }
        setStatus("saving")
        setError("")
        try {
            const res = await fetch("/api/admin/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: current, newPassword: next }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Failed to change password.")
                setStatus("error")
            } else {
                setStatus("success")
                setCurrent("")
                setNext("")
                setConfirm("")
                setTimeout(() => setStatus("idle"), 3000)
            }
        } catch {
            setError("Network error. Please try again.")
            setStatus("error")
        }
    }

    return (
        <div className="bg-[#242427] rounded-3xl p-8 border border-[#333] space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                    <h2 className="text-white text-[15px] font-semibold">Change Admin Password</h2>
                    <p className="text-[12px] text-[#52525b] mt-0.5">
                        New password is stored securely in your database.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current password */}
                <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#a1a1aa]">Current Password</label>
                    <div className="relative">
                        <input
                            type={showCurrent ? "text" : "password"}
                            value={current}
                            onChange={(e) => { setCurrent(e.target.value); setStatus("idle"); setError("") }}
                            placeholder="Enter current password"
                            className="w-full px-4 py-3 pr-11 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                        >
                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#a1a1aa]">New Password</label>
                    <div className="relative">
                        <input
                            type={showNext ? "text" : "password"}
                            value={next}
                            onChange={(e) => { setNext(e.target.value); setStatus("idle"); setError("") }}
                            placeholder="At least 8 characters"
                            className="w-full px-4 py-3 pr-11 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNext((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                        >
                            {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Confirm */}
                <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#a1a1aa]">Confirm New Password</label>
                    <input
                        type="password"
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setStatus("idle"); setError("") }}
                        placeholder="Repeat new password"
                        className={`w-full px-4 py-3 rounded-xl bg-[#18181b] border text-white text-[14px] focus:outline-none transition-colors ${
                            confirm && next !== confirm
                                ? "border-red-500/50 focus:border-red-500"
                                : "border-[#333] focus:border-orange-500"
                        }`}
                    />
                    {confirm && next !== confirm && (
                        <p className="text-[12px] text-red-400 mt-1">Passwords do not match</p>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="text-[13px] text-red-400">{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!canSubmit || status === "saving"}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-medium transition-all"
                >
                    {status === "saving" ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : status === "success" ? (
                        <><Check className="w-4 h-4" /> Password updated</>
                    ) : (
                        <>Update Password</>
                    )}
                </button>
            </form>
        </div>
    )
}

// ── Export Data ────────────────────────────────────────────────────────────────
function ExportSection({ redemptions }: { redemptions: RedemptionRow[] }) {
    const [exporting, setExporting] = useState(false)

    const handleExport = () => {
        setExporting(true)
        exportRedemptionsCSV(redemptions)
        setTimeout(() => setExporting(false), 800)
    }

    return (
        <div className="bg-[#242427] rounded-3xl p-8 border border-[#333] space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Download className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-white text-[15px] font-semibold">Export Redemption Data</h2>
                    <p className="text-[12px] text-[#52525b] mt-0.5">
                        Download all {redemptions.length} redemptions as a CSV file.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#18181b] border border-[#333]">
                <div>
                    <p className="text-[14px] text-white font-medium">All Redemptions</p>
                    <p className="text-[12px] text-[#52525b] mt-0.5">
                        {redemptions.length} records · CSV format
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={redemptions.length === 0 || exporting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-medium transition-all"
                >
                    {exporting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Exporting…</>
                    ) : (
                        <><Download className="w-4 h-4" /> Download CSV</>
                    )}
                </button>
            </div>
        </div>
    )
}

// ── Program Details ────────────────────────────────────────────────────────────
function ProgramDetailsSection({ program, onProgramUpdate }: { program: Program; onProgramUpdate: () => void }) {
    const [name, setName] = useState(program.name)
    const [description, setDescription] = useState(program.description || "")
    const [status, setStatus] = useState<SectionStatus>("idle")
    const [error, setError] = useState("")

    useEffect(() => {
        setName(program.name)
        setDescription(program.description || "")
    }, [program.id])

    const handleSave = async () => {
        if (!name.trim()) return
        setStatus("saving")
        setError("")
        try {
            const res = await fetch(`/api/admin/programs/${program.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Failed to save.")
                setStatus("error")
            } else {
                setStatus("success")
                onProgramUpdate()
                setTimeout(() => setStatus("idle"), 3000)
            }
        } catch {
            setError("Network error.")
            setStatus("error")
        }
    }

    return (
        <div className="bg-[#242427] rounded-3xl p-8 border border-[#333] space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-white text-[15px] font-semibold">Program Details</h2>
                    <p className="text-[12px] text-[#52525b] mt-0.5">Edit the current program&apos;s name and description.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#a1a1aa]">Program Name *</label>
                    <input
                        value={name}
                        onChange={(e) => { setName(e.target.value); setStatus("idle"); setError("") }}
                        placeholder="e.g. Hari Raya 2025 Campaign"
                        className="w-full px-4 py-3 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#a1a1aa]">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => { setDescription(e.target.value); setStatus("idle") }}
                        placeholder="Optional description of this program"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors resize-none"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="text-[13px] text-red-400">{error}</span>
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={!name.trim() || status === "saving"}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-medium transition-all"
                >
                    {status === "saving" ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : status === "success" ? (
                        <><Check className="w-4 h-4" /> Saved</>
                    ) : (
                        <><Save className="w-4 h-4" /> Save Details</>
                    )}
                </button>
            </div>
        </div>
    )
}

// ── Instagram Links ────────────────────────────────────────────────────────────
function InstagramSection({ program, onProgramUpdate }: { program: Program; onProgramUpdate: () => void }) {
    const [mokinUrl, setMokinUrl] = useState(program.instagram_mokin_url || "")
    const [mokinLabel, setMokinLabel] = useState(program.instagram_mokin_label || "")
    const [gajetoUrl, setGajetoUrl] = useState(program.instagram_gajeto_url || "")
    const [gajetoLabel, setGajetoLabel] = useState(program.instagram_gajeto_label || "")
    const [status, setStatus] = useState<SectionStatus>("idle")
    const [error, setError] = useState("")

    useEffect(() => {
        setMokinUrl(program.instagram_mokin_url || "")
        setMokinLabel(program.instagram_mokin_label || "")
        setGajetoUrl(program.instagram_gajeto_url || "")
        setGajetoLabel(program.instagram_gajeto_label || "")
    }, [program.id])

    const handleSave = async () => {
        setStatus("saving")
        setError("")
        try {
            const res = await fetch(`/api/admin/programs/${program.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instagram_mokin_url: mokinUrl,
                    instagram_mokin_label: mokinLabel,
                    instagram_gajeto_url: gajetoUrl,
                    instagram_gajeto_label: gajetoLabel,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Failed to save.")
                setStatus("error")
            } else {
                setStatus("success")
                onProgramUpdate()
                setTimeout(() => setStatus("idle"), 3000)
            }
        } catch {
            setError("Network error.")
            setStatus("error")
        }
    }

    const inputCls =
        "w-full px-4 py-3 rounded-xl bg-[#18181b] border border-[#333] text-white text-[14px] focus:outline-none focus:border-orange-500 transition-colors placeholder:text-[#52525b]"

    return (
        <div className="bg-[#242427] rounded-3xl p-8 border border-[#333] space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                    <Instagram className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                    <h2 className="text-white text-[15px] font-semibold">Instagram Links</h2>
                    <p className="text-[12px] text-[#52525b] mt-0.5">
                        Shown on the customer redemption form for this program.
                    </p>
                </div>
            </div>

            <div className="space-y-5">
                {/* Account 1 */}
                <div className="p-5 rounded-2xl bg-[#18181b] border border-[#333] space-y-3">
                    <p className="text-[13px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Account 1</p>
                    <div className="space-y-2">
                        <label className="block text-[12px] text-[#52525b]">Display Name</label>
                        <input
                            value={mokinLabel}
                            onChange={(e) => setMokinLabel(e.target.value)}
                            placeholder="e.g. Mokin Malaysia"
                            className={inputCls}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[12px] text-[#52525b]">Instagram URL</label>
                        <input
                            value={mokinUrl}
                            onChange={(e) => setMokinUrl(e.target.value)}
                            placeholder="https://www.instagram.com/..."
                            className={inputCls}
                        />
                    </div>
                </div>

                {/* Account 2 */}
                <div className="p-5 rounded-2xl bg-[#18181b] border border-[#333] space-y-3">
                    <p className="text-[13px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Account 2</p>
                    <div className="space-y-2">
                        <label className="block text-[12px] text-[#52525b]">Display Name</label>
                        <input
                            value={gajetoLabel}
                            onChange={(e) => setGajetoLabel(e.target.value)}
                            placeholder="e.g. Gajeto Malaysia"
                            className={inputCls}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[12px] text-[#52525b]">Instagram URL</label>
                        <input
                            value={gajetoUrl}
                            onChange={(e) => setGajetoUrl(e.target.value)}
                            placeholder="https://www.instagram.com/..."
                            className={inputCls}
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="text-[13px] text-red-400">{error}</span>
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={status === "saving"}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-medium transition-all"
                >
                    {status === "saving" ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : status === "success" ? (
                        <><Check className="w-4 h-4" /> Saved</>
                    ) : (
                        <><Save className="w-4 h-4" /> Save Links</>
                    )}
                </button>
            </div>
        </div>
    )
}

// ── Session ────────────────────────────────────────────────────────────────────
function SessionSection({ onLogout }: { onLogout: () => void }) {
    return (
        <div className="bg-[#242427] rounded-3xl p-8 border border-[#333] space-y-5">
            <h2 className="text-[#a1a1aa] text-[13px] font-semibold uppercase tracking-wider">Session</h2>
            <button
                onClick={onLogout}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
            >
                <LogOut className="w-4 h-4" />
                Log Out
            </button>
        </div>
    )
}

// ── Main export ────────────────────────────────────────────────────────────────
export function SettingsPanel({ redemptions, onLogout, program, onProgramUpdate }: SettingsPanelProps) {
    return (
        <div className="space-y-6 max-w-[800px] mx-auto animate-fade-in-up">
            {program && <ProgramDetailsSection program={program} onProgramUpdate={onProgramUpdate} />}
            <ChangePasswordSection />
            <ExportSection redemptions={redemptions} />
            {program && <InstagramSection program={program} onProgramUpdate={onProgramUpdate} />}
            <SessionSection onLogout={onLogout} />
        </div>
    )
}
