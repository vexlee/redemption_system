import { BarChart3, CircleDollarSign, FileText, Store } from "lucide-react"

interface StatsCardsProps {
    total: number
    thisMonth: number
    today: number
    stores: number
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value: number
}) {
    return (
        <div className="bg-[#242427] p-5 rounded-2xl border border-[#333] hover:border-[#444] transition-colors group">
            <div className="flex items-center gap-3 mb-3 text-[#a1a1aa]">
                <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-[#333] flex items-center justify-center group-hover:border-orange-500/50 group-hover:text-orange-500 transition-colors">
                    {icon}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    )
}

export function StatsCards({ total, thisMonth, today, stores }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Total Redemptions" value={total} />
            <StatCard icon={<CircleDollarSign className="w-4 h-4" />} label="This Month" value={thisMonth} />
            <StatCard icon={<FileText className="w-4 h-4" />} label="Today" value={today} />
            <StatCard icon={<Store className="w-4 h-4" />} label="Total Stores" value={stores} />
        </div>
    )
}
