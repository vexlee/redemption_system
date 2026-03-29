"use client"

import { useState } from "react"
import Link from "next/link"
import {
    LayoutDashboard,
    BarChart3,
    Database,
    Settings,
    User,
    HelpCircle,
    LogOut,
    ShieldCheck,
    Layers,
    ChevronDown,
    Plus,
} from "lucide-react"
import type { Program } from "@/lib/types"

type NavKey = "dashboard" | "stores" | "analytics" | "settings" | "programs"

interface SidebarProps {
    activeNav: NavKey
    onNavChange: (nav: NavKey) => void
    onLogout: () => void
    programs: Program[]
    selectedProgramId: string | null
    onProgramChange: (id: string) => void
}

export function Sidebar({ activeNav, onNavChange, onLogout, programs, selectedProgramId, onProgramChange }: SidebarProps) {
    const [programDropdownOpen, setProgramDropdownOpen] = useState(false)

    const selectedProgram = programs.find((p) => p.id === selectedProgramId) ?? programs[0] ?? null

    const NavButton = ({
        id,
        icon,
        label,
    }: {
        id: NavKey
        icon: React.ReactNode
        label: string
    }) => (
        <button
            onClick={() => onNavChange(id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${activeNav === id
                ? "bg-[#333336] text-white shadow-sm"
                : "text-[#a1a1aa] hover:text-white hover:bg-[#2a2a2c]"
                }`}
        >
            <span className={activeNav === id ? "text-orange-500" : ""}>{icon}</span>
            {label}
        </button>
    )

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="w-[280px] bg-[#232325] border-r border-[#333] flex-col hidden md:flex">
                <div className="p-6">
                    <h1 className="text-xl font-bold flex items-center gap-3 tracking-tight">
                        <Link href="/">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                        </Link>
                        UNIPRO REDEMPTION
                    </h1>
                </div>

                {/* Program Switcher */}
                <div className="px-4 pb-3 relative">
                    <p className="text-[10px] font-semibold text-[#626268] uppercase tracking-wider px-1 mb-2">Program</p>
                    <button
                        onClick={() => setProgramDropdownOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-[#2a2a2c] hover:bg-[#333336] border border-[#3f3f46] transition-all"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center shrink-0">
                                <Layers className="w-3.5 h-3.5 text-orange-400" />
                            </div>
                            <span className="text-sm font-medium text-white truncate">
                                {selectedProgram?.name ?? "No Program"}
                            </span>
                        </div>
                        <ChevronDown
                            className={`w-4 h-4 text-[#71717a] shrink-0 transition-transform ${programDropdownOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    {programDropdownOpen && (
                        <div className="absolute left-4 right-4 top-full mt-1 bg-[#2a2a2c] border border-[#3f3f46] rounded-xl shadow-xl z-50 overflow-hidden">
                            <div className="max-h-48 overflow-y-auto py-1">
                                {programs.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            onProgramChange(p.id)
                                            setProgramDropdownOpen(false)
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${p.id === selectedProgramId
                                            ? "bg-orange-500/10 text-orange-400"
                                            : "text-[#a1a1aa] hover:text-white hover:bg-[#333336]"
                                            }`}
                                    >
                                        <Layers className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="border-t border-[#3f3f46] p-1">
                                <button
                                    onClick={() => {
                                        onNavChange("programs")
                                        setProgramDropdownOpen(false)
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#333336] rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Manage Programs
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    <NavButton id="dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
                    <NavButton id="analytics" icon={<BarChart3 className="w-5 h-5" />} label="Analytics" />
                    <NavButton id="stores" icon={<Database className="w-5 h-5" />} label="Store" />
                    <NavButton id="programs" icon={<Layers className="w-5 h-5" />} label="Programs" />

                    <div className="pt-6 pb-2 px-4 text-xs font-semibold text-[#626268] uppercase tracking-wider">
                        Account
                    </div>

                    <NavButton id="settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-[#a1a1aa] hover:text-white hover:bg-[#2a2a2c] transition-all duration-200">
                        <User className="w-5 h-5" /> Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-[#a1a1aa] hover:text-white hover:bg-[#2a2a2c] transition-all duration-200">
                        <HelpCircle className="w-5 h-5" /> Help
                    </button>
                </nav>

                <div className="p-4 border-t border-[#333]">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-[#a1a1aa] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" /> Log Out
                    </button>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#232325] border-t border-[#333] flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
                {(
                    [
                        { id: "dashboard" as NavKey, icon: <LayoutDashboard className="w-5 h-5" />, label: "Home" },
                        { id: "analytics" as NavKey, icon: <BarChart3 className="w-5 h-5" />, label: "Analytics" },
                        { id: "stores" as NavKey, icon: <Database className="w-5 h-5" />, label: "Stores" },
                        { id: "programs" as NavKey, icon: <Layers className="w-5 h-5" />, label: "Programs" },
                        { id: "settings" as NavKey, icon: <Settings className="w-5 h-5" />, label: "Settings" },
                    ] as { id: NavKey; icon: React.ReactNode; label: string }[]
                ).map(({ id, icon, label }) => (
                    <button
                        key={id}
                        onClick={() => onNavChange(id)}
                        className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${activeNav === id ? "text-orange-500" : "text-[#71717a] hover:text-white"
                            }`}
                    >
                        {icon}
                        <span className="text-[10px] font-medium">{label}</span>
                    </button>
                ))}
                <button
                    onClick={onLogout}
                    className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[#71717a] hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Logout</span>
                </button>
            </nav>
        </>
    )
}
