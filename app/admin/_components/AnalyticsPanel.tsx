"use client"

import { useState, useMemo } from "react"
import { Calendar, Download, Store } from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
} from "recharts"
import { exportRedemptionsCSV } from "@/lib/export"
import type { StoreData, RedemptionRow } from "@/lib/types"

interface AnalyticsPanelProps {
    stores: StoreData[]
    redemptions: RedemptionRow[]
}

type Preset = "7d" | "30d" | "90d" | "custom"

const COLORS = ["#ea580c", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f43f5e"]

function toDateStr(d: Date) {
    return d.toISOString().split("T")[0]
}

function subtractDays(d: Date, n: number) {
    const copy = new Date(d)
    copy.setDate(copy.getDate() - n)
    return copy
}

export function AnalyticsPanel({ stores, redemptions }: AnalyticsPanelProps) {
    const today = new Date()
    const [preset, setPreset] = useState<Preset>("30d")
    const [customStart, setCustomStart] = useState(toDateStr(subtractDays(today, 30)))
    const [customEnd, setCustomEnd] = useState(toDateStr(today))

    // Resolve effective date range
    const { startDate, endDate } = useMemo(() => {
        if (preset === "custom") {
            return { startDate: customStart, endDate: customEnd }
        }
        const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90
        return {
            startDate: toDateStr(subtractDays(today, days - 1)),
            endDate: toDateStr(today),
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset, customStart, customEnd])

    // Filter redemptions to range
    const filtered = useMemo(
        () =>
            redemptions.filter((r) => {
                const d = r.created_at.split("T")[0]
                return d >= startDate && d <= endDate
            }),
        [redemptions, startDate, endDate]
    )

    // Build line chart data: one point per day in range
    const lineData = useMemo(() => {
        const points: { name: string; date: string; total: number }[] = []
        const start = new Date(startDate + "T00:00:00")
        const end = new Date(endDate + "T00:00:00")
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dStr = toDateStr(d)
            points.push({
                date: dStr,
                name: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                total: filtered.filter((r) => r.created_at.startsWith(dStr)).length,
            })
        }
        // Thin out labels if range > 30 days to avoid crowding
        if (points.length > 30) {
            return points.map((p, i) => ({
                ...p,
                name: i % Math.ceil(points.length / 20) === 0 ? p.name : "",
            }))
        }
        return points
    }, [filtered, startDate, endDate])

    // Store breakdown
    const storeData = useMemo(
        () =>
            stores
                .map((s) => ({
                    name: s.name,
                    count: filtered.filter((r) => r.store_id === s.id).length,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 8),
        [stores, filtered]
    )

    const totalInRange = filtered.length

    const presetBtn = (p: Preset, label: string) => (
        <button
            onClick={() => setPreset(p)}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                preset === p
                    ? "bg-orange-600 text-white"
                    : "bg-[#18181b] border border-[#333] text-[#a1a1aa] hover:text-white hover:border-[#555]"
            }`}
        >
            {label}
        </button>
    )

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto animate-fade-in-up">
            {/* Controls */}
            <div className="bg-[#242427] rounded-3xl p-6 border border-[#333]">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-[#a1a1aa] text-[13px] mr-2">
                        <Calendar className="w-4 h-4" /> Date Range
                    </div>
                    {presetBtn("7d", "Last 7 days")}
                    {presetBtn("30d", "Last 30 days")}
                    {presetBtn("90d", "Last 90 days")}
                    {presetBtn("custom", "Custom")}

                    {preset === "custom" && (
                        <div className="flex items-center gap-2 ml-2">
                            <input
                                type="date"
                                value={customStart}
                                max={customEnd}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="px-3 py-2 rounded-xl bg-[#18181b] border border-[#333] text-white text-[13px] focus:outline-none focus:border-orange-500 transition-colors [color-scheme:dark]"
                            />
                            <span className="text-[#52525b] text-[13px]">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                min={customStart}
                                max={toDateStr(today)}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="px-3 py-2 rounded-xl bg-[#18181b] border border-[#333] text-white text-[13px] focus:outline-none focus:border-orange-500 transition-colors [color-scheme:dark]"
                            />
                        </div>
                    )}

                    <button
                        onClick={() => exportRedemptionsCSV(filtered)}
                        disabled={filtered.length === 0}
                        className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181b] border border-[#333] hover:border-orange-500/50 hover:text-orange-400 text-[#a1a1aa] text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" /> Export filtered CSV
                    </button>
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: "Redemptions in range", value: totalInRange },
                    { label: "Active stores", value: storeData.filter((s) => s.count > 0).length },
                    {
                        label: "Daily average",
                        value: lineData.length > 0
                            ? (totalInRange / lineData.length).toFixed(1)
                            : "0",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-[#242427] rounded-2xl p-6 border border-[#333]"
                    >
                        <p className="text-[12px] text-[#52525b] uppercase tracking-wider mb-2">
                            {stat.label}
                        </p>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Line chart */}
            <div className="bg-[#242427] rounded-3xl p-7 border border-[#333]">
                <h3 className="text-white text-[15px] font-semibold mb-6">Redemptions Over Time</h3>
                {lineData.every((d) => d.total === 0) ? (
                    <div className="h-[240px] flex items-center justify-center text-[#52525b] text-sm">
                        No redemptions in this period
                    </div>
                ) : (
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#52525b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: "#18181b",
                                        border: "1px solid #333",
                                        borderRadius: "12px",
                                        padding: "12px",
                                    }}
                                    labelStyle={{ color: "#a1a1aa", fontSize: 12 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#ea580c"
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 5, fill: "#ea580c", stroke: "#fff", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Bar chart by store */}
            <div className="bg-[#242427] rounded-3xl p-7 border border-[#333]">
                <div className="flex items-center gap-2 mb-6">
                    <Store className="w-4 h-4 text-[#52525b]" />
                    <h3 className="text-white text-[15px] font-semibold">By Store</h3>
                </div>
                {storeData.every((s) => s.count === 0) ? (
                    <div className="h-[180px] flex items-center justify-center text-[#52525b] text-sm">
                        No redemptions in this period
                    </div>
                ) : (
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={storeData}
                                margin={{ top: 4, right: 10, left: -20, bottom: 0 }}
                                barSize={28}
                            >
                                <XAxis
                                    dataKey="name"
                                    stroke="#52525b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={8}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: "#18181b",
                                        border: "1px solid #333",
                                        borderRadius: "12px",
                                        padding: "12px",
                                    }}
                                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {storeData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
