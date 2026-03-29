"use client"

import { Calendar, Store, MoreVertical } from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import type { StoreData, RedemptionRow } from "@/lib/types"

interface DashboardChartsProps {
    stores: StoreData[]
    redemptions: RedemptionRow[]
}

const COLORS = ["#ea580c", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f43f5e"]

export function DashboardCharts({ stores, redemptions }: DashboardChartsProps) {
    const lineData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        const dStr = d.toISOString().split("T")[0]
        return {
            name: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            total: redemptions.filter((r) => r.created_at.startsWith(dStr)).length,
        }
    })

    const storeRedemptionCounts = stores
        .map((store) => ({
            ...store,
            count: redemptions.filter((r) => r.store_id === store.id).length,
        }))
        .sort((a, b) => b.count - a.count)

    const maxRedemptions = Math.max(...storeRedemptionCounts.map((s) => s.count), 1)

    const pieData = storeRedemptionCounts.slice(0, 5).map((s, i) => ({
        name: s.name,
        value: s.count,
        fill: COLORS[i % COLORS.length],
    }))

    return (
        <div className="space-y-6">
            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart */}
                <div className="bg-[#242427] rounded-3xl p-7 border border-[#333]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#18181b] border border-[#333] rounded-md text-xs font-medium text-[#a1a1aa] w-fit mb-3">
                                <Calendar className="w-3.5 h-3.5" /> Last 7 Days
                            </div>
                            <div className="flex items-end gap-3">
                                <h3 className="text-3xl font-bold text-white">{redemptions.length}</h3>
                                <span className="text-sm text-green-400 mb-1 font-medium">Total</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                            <div className="w-2 h-2 rounded-full bg-[#ea580c]" /> This week
                        </div>
                    </div>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: "#18181b",
                                        border: "1px solid #333",
                                        borderRadius: "12px",
                                        padding: "12px",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#ea580c"
                                    strokeWidth={3}
                                    dot={{ fill: "#ea580c", strokeWidth: 2, r: 4, stroke: "#18181b" }}
                                    activeDot={{ r: 6, fill: "#ea580c", stroke: "#fff", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Store progress bars */}
                <div className="bg-[#242427] rounded-3xl p-7 border border-[#333]">
                    <h3 className="text-[#a1a1aa] text-sm font-semibold mb-6 uppercase tracking-wider">
                        Redemptions by Store
                    </h3>
                    <div className="space-y-6">
                        {storeRedemptionCounts.slice(0, 5).map((store, i) => (
                            <div key={store.id}>
                                <div className="flex justify-between text-[13px] mb-2 font-medium">
                                    <span className="text-white">{store.name}</span>
                                    <span className="text-[#a1a1aa]">{store.count}</span>
                                </div>
                                <div className="w-full bg-[#18181b] h-3 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${i % 2 === 0 ? "bg-orange-500" : "bg-orange-600"}`}
                                        style={{ width: `${(store.count / maxRedemptions) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {storeRedemptionCounts.length === 0 && (
                            <p className="text-[#52525b] text-sm text-center py-4">No stores yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stores list */}
                <div className="bg-[#242427] rounded-3xl p-7 border border-[#333]">
                    <h3 className="text-white text-base font-semibold mb-6">Stores</h3>
                    <div className="space-y-5">
                        {stores.slice(0, 3).map((store) => (
                            <div key={store.id} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full bg-[#18181b] border border-[#333] flex items-center justify-center relative overflow-hidden">
                                    <Store className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                    <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-semibold text-white truncate group-hover:text-orange-500 transition-colors">
                                        {store.name}
                                    </p>
                                    <p className="text-[13px] text-[#a1a1aa] truncate">
                                        {store.location || "No location set"}
                                    </p>
                                </div>
                                <button className="text-[#52525b] hover:text-white transition-colors p-2">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {stores.length === 0 && (
                            <p className="text-[#52525b] text-sm text-center py-4">No stores yet</p>
                        )}
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-[#242427] rounded-3xl p-7 border border-[#333] flex flex-col lg:col-span-2">
                    <h3 className="text-white text-base font-semibold mb-2">Store Distribution</h3>
                    <div className="flex flex-col lg:flex-row items-center gap-6 flex-1 pt-4">
                        <div className="h-[180px] w-full lg:w-[220px] shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={2}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0)" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: "#18181b",
                                            border: "1px solid #333",
                                            borderRadius: "12px",
                                        }}
                                        itemStyle={{ color: "#fff" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-3 w-full">
                            {pieData.map((entry) => (
                                <div key={entry.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.fill }} />
                                        <span className="text-[13px] text-[#a1a1aa] truncate max-w-[160px]">
                                            {entry.name}
                                        </span>
                                    </div>
                                    <span className="text-[13px] text-white font-medium">{entry.value}</span>
                                </div>
                            ))}
                            {pieData.length === 0 && (
                                <p className="text-[#52525b] text-sm text-center py-2">No redemptions yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
