"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "./_components/Sidebar"
import { Header } from "./_components/Header"
import { StatsCards } from "./_components/StatsCards"
import { DashboardCharts } from "./_components/DashboardCharts"
import { RedemptionTable } from "./_components/RedemptionTable"
import { StoreGrid } from "./_components/StoreGrid"
import { AnalyticsPanel } from "./_components/AnalyticsPanel"
import { SettingsPanel } from "./_components/SettingsPanel"
import { ProgramsPanel } from "./_components/ProgramsPanel"
import type { StoreData, RedemptionRow, Program } from "@/lib/types"

type NavKey = "dashboard" | "stores" | "analytics" | "settings" | "programs"

function AdminPageInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [programs, setPrograms] = useState<Program[]>([])
    const [stores, setStores] = useState<StoreData[]>([])
    const [redemptions, setRedemptions] = useState<RedemptionRow[]>([])
    const [loading, setLoading] = useState(true)
    const [realtimeConnected, setRealtimeConnected] = useState(false)
    const [activeNav, setActiveNav] = useState<NavKey>("dashboard")
    const [toast, setToast] = useState<string | null>(null)

    const programIdParam = searchParams.get("program")
    const selectedProgramIdRef = useRef<string | null>(null)

    const selectedProgram = programs.find((p) => p.id === programIdParam) ?? programs[0] ?? null

    useEffect(() => {
        selectedProgramIdRef.current = selectedProgram?.id ?? null
    }, [selectedProgram])

    const fetchData = useCallback(async (programId: string) => {
        const [storesRes, redemptionsRes] = await Promise.all([
            supabase.from("stores").select("*").eq("program_id", programId).order("name"),
            supabase.from("redemptions").select("*").eq("program_id", programId).order("created_at", { ascending: false }),
        ])
        const storeList: StoreData[] = storesRes.data || []
        setStores(storeList)
        if (redemptionsRes.data) {
            const storeMap = new Map(storeList.map((s) => [s.id, s.name]))
            setRedemptions(
                redemptionsRes.data.map((r: RedemptionRow) => ({
                    ...r,
                    store_name: storeMap.get(r.store_id) || "Unknown",
                }))
            )
        }
        setLoading(false)
    }, [])

    const fetchPrograms = useCallback(async () => {
        const res = await fetch("/api/admin/programs")
        if (res.ok) {
            const data: Program[] = await res.json()
            setPrograms(data)
            return data
        }
        return []
    }, [])

    useEffect(() => {
        fetchPrograms().then((data) => {
            const target = data.find((p) => p.id === programIdParam) ?? data[0]
            if (target) fetchData(target.id)
            else setLoading(false)
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!selectedProgram) return
        setLoading(true)
        fetchData(selectedProgram.id)
    }, [selectedProgram?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const channel = supabase
            .channel("redemptions-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "redemptions" },
                async (payload: { new: Record<string, unknown> }) => {
                    const rec = payload.new as unknown as RedemptionRow
                    // Only update if this redemption belongs to the active program
                    if (rec.program_id !== selectedProgramIdRef.current) return
                    const { data } = await supabase
                        .from("stores")
                        .select("name")
                        .eq("id", rec.store_id)
                        .single()
                    const storeName = data?.name || "Unknown"
                    setRedemptions((prev) => [
                        { ...rec, store_name: storeName },
                        ...prev,
                    ])
                    setToast(`New redemption at ${storeName}`)
                }
            )
            .subscribe((status) => setRealtimeConnected(status === "SUBSCRIBED"))
        return () => { supabase.removeChannel(channel) }
    }, [])

    useEffect(() => {
        if (!toast) return
        const t = setTimeout(() => setToast(null), 4000)
        return () => clearTimeout(t)
    }, [toast])

    const handleLogout = async () => {
        const res = await fetch("/api/admin/logout", { method: "POST" })
        if (res.ok) router.push("/admin/login")
    }

    const handleProgramChange = (id: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("program", id)
        router.push(`/admin?${params.toString()}`)
    }

    const handleProgramsRefresh = async () => {
        const data = await fetchPrograms()
        const target = data.find((p) => p.id === selectedProgram?.id) ?? data[0]
        if (target) fetchData(target.id)
    }

    const today = new Date().toISOString().split("T")[0]
    const thisMonth = new Date().toISOString().slice(0, 7)
    const stats = {
        total: redemptions.length,
        thisMonth: redemptions.filter((r) => r.created_at.startsWith(thisMonth)).length,
        today: redemptions.filter((r) => r.created_at.startsWith(today)).length,
        stores: stores.length,
    }

    const handleRefresh = () => {
        if (selectedProgram) fetchData(selectedProgram.id)
    }

    if (loading && programs.length === 0) {
        return (
            <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#ea580c] animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-[#1c1c1e] text-white font-sans overflow-hidden">
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#242427] border border-green-500/30 px-4 py-3 rounded-2xl shadow-xl animate-fade-in-up pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                    <p className="text-[14px] text-white font-medium">{toast}</p>
                </div>
            )}
            <Sidebar
                activeNav={activeNav}
                onNavChange={setActiveNav}
                onLogout={handleLogout}
                programs={programs}
                selectedProgramId={selectedProgram?.id ?? null}
                onProgramChange={handleProgramChange}
            />

            <main className="flex-1 flex flex-col overflow-hidden bg-[#18181b]">
                <Header
                    activeNav={activeNav}
                    realtimeConnected={realtimeConnected}
                    onRefresh={handleRefresh}
                    programName={selectedProgram?.name}
                />

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin" />
                        </div>
                    ) : (
                        <>
                            {activeNav === "dashboard" && (
                                <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in-up">
                                    <StatsCards {...stats} />
                                    <DashboardCharts stores={stores} redemptions={redemptions} />
                                    <RedemptionTable redemptions={redemptions} onRefresh={handleRefresh} />
                                </div>
                            )}

                            {activeNav === "stores" && (
                                <div className="space-y-6 max-w-[1200px] mx-auto animate-fade-in-up">
                                    <StoreGrid
                                        stores={stores}
                                        onRefresh={handleRefresh}
                                        programId={selectedProgram?.id ?? ""}
                                    />
                                </div>
                            )}

                            {activeNav === "analytics" && (
                                <AnalyticsPanel stores={stores} redemptions={redemptions} />
                            )}

                            {activeNav === "settings" && (
                                <SettingsPanel
                                    redemptions={redemptions}
                                    onLogout={handleLogout}
                                    program={selectedProgram}
                                    onProgramUpdate={handleProgramsRefresh}
                                />
                            )}

                            {activeNav === "programs" && (
                                <ProgramsPanel
                                    programs={programs}
                                    stores={stores}
                                    redemptions={redemptions}
                                    selectedProgramId={selectedProgram?.id ?? null}
                                    onProgramChange={handleProgramChange}
                                    onRefresh={handleProgramsRefresh}
                                    onNavChange={setActiveNav}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}

export default function AdminPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#ea580c] animate-spin" />
            </div>
        }>
            <AdminPageInner />
        </Suspense>
    )
}
