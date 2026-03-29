"use client"

import { RefreshCw, User } from "lucide-react"

type NavKey = "dashboard" | "stores" | "analytics" | "settings" | "programs"

interface HeaderProps {
    activeNav: NavKey
    realtimeConnected: boolean
    onRefresh: () => void
    programName?: string
}

const NAV_LABELS: Record<NavKey, string> = {
    dashboard: "Dashboard",
    stores: "Databases",
    analytics: "Analytics",
    settings: "Settings",
    programs: "Programs",
}

export function Header({ activeNav, realtimeConnected, onRefresh, programName }: HeaderProps) {
    const label = NAV_LABELS[activeNav]

    return (
        <header className="h-[88px] px-8 flex items-center justify-between border-b border-[#27272a] bg-[#18181b] z-10 shrink-0">
            <div>
                <div className="flex items-center gap-2 text-[13px] text-[#a1a1aa] font-medium mb-1.5">
                    <span>Pages</span>
                    <span className="text-[#52525b]">/</span>
                    {programName && activeNav !== "programs" && (
                        <>
                            <span className="text-[#a1a1aa]">{programName}</span>
                            <span className="text-[#52525b]">/</span>
                        </>
                    )}
                    <span className="text-white">{label}</span>
                </div>
                <h2 className="text-[28px] font-bold tracking-tight text-white">
                    Main {label}
                </h2>
            </div>

            <div className="flex items-center gap-5">
                <div
                    className={`hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold tracking-wide border ${
                        realtimeConnected
                            ? "border-green-500/20 bg-green-500/10 text-green-400"
                            : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                    }`}
                >
                    <span
                        className={`w-2 h-2 rounded-full ${
                            realtimeConnected ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                        }`}
                    />
                    {realtimeConnected ? "LIVE" : "CONNECTING..."}
                </div>

                <button
                    onClick={onRefresh}
                    className="p-2.5 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-white transition-all"
                >
                    <RefreshCw className="w-[18px] h-[18px]" />
                </button>

                <div className="w-11 h-11 rounded-full bg-gradient-to-b from-[#27272a] to-[#18181b] border border-[#3f3f46] flex items-center justify-center overflow-hidden p-0.5">
                    <div className="w-full h-full rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                        <User className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </header>
    )
}
