import { getInvestorFinancialSummary } from "@/lib/data/investor-financials"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Users,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Car,
    Calculator,
    ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateInvestorDialog } from "@/components/dashboard/CreateInvestorDialog"
import { DeleteInvestorButton } from "@/components/dashboard/DeleteInvestorButton"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
// Revalidate every 60 seconds
export const revalidate = 60

export default async function InvestorsFinancePage() {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/dashboard/investor')
    }

    // Get investor financial summaries
    const investorSummaries = await getInvestorFinancialSummary()

    // Calculate overall stats
    const totalInvestors = investorSummaries.length
    const totalVehicles = investorSummaries.reduce((sum, inv) => sum + inv.vehicleCount, 0)
    const totalIncome = investorSummaries.reduce((sum, inv) => sum + inv.totalIncome, 0)
    const totalExpenses = investorSummaries.reduce((sum, inv) => sum + inv.totalExpenses, 0)
    const totalNetBalance = totalIncome - totalExpenses

    const investorsWithPositiveBalance = investorSummaries.filter(inv => inv.netBalance > 0).length
    const investorsWithNegativeBalance = investorSummaries.filter(inv => inv.netBalance < 0).length

    return (
        <div className="space-y-8 p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/20 pb-6 gap-4">
                <div className="flex flex-col space-y-2">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent uppercase italic">
                        Resumen <span className="text-primary">Financiero</span>
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground font-bold uppercase tracking-widest opacity-80">
                        Estado de Caja por Inversor • MiamiCars
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <CreateInvestorDialog />
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="glass-card group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Total Inversores
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tighter">{totalInvestors}</div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">
                            Socios activos
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Vehículos Asignados
                        </CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Car className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tighter">{totalVehicles}</div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">
                            Unidades totales
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Ingresos Totales
                        </CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tighter text-emerald-500">
                            ${totalIncome.toLocaleString()}
                        </div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">
                            Todos los inversores
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Gastos Totales
                        </CardTitle>
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tighter text-red-500">
                            ${totalExpenses.toLocaleString()}
                        </div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">
                            Todos los inversores
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card group border-l-4 border-l-primary/40">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">
                            Balance Neto Total
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Calculator className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-black tracking-tighter",
                            totalNetBalance >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                            ${totalNetBalance.toLocaleString()}
                        </div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">
                            Caja consolidada
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Investors Table */}
            <Card className="glass-card border-l-4 border-l-primary/40">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-lg md:text-xl font-black uppercase tracking-widest">
                                Estado de Caja por Inversor
                            </CardTitle>
                        </div>
                        <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest">
                            {investorsWithPositiveBalance} Positivos • {investorsWithNegativeBalance} Negativos
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {investorSummaries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                            <Users className="h-16 w-16 mb-4" />
                            <h4 className="text-sm font-black uppercase tracking-widest">Sin Inversores</h4>
                            <p className="text-xs font-medium uppercase tracking-wide mt-2">
                                No hay inversores registrados aún
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted/40 border-b border-border/50">
                                        <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Inversor
                                        </th>
                                        <th className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                                            Vehículos
                                        </th>
                                        <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">
                                            Ingresos
                                        </th>
                                        <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">
                                            Gastos
                                        </th>
                                        <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Balance
                                        </th>
                                        <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Acción
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {investorSummaries.map((investor, i) => (
                                        <tr
                                            key={investor.investorId}
                                            className={cn(
                                                "group border-b border-border/10 last:border-0 hover:bg-primary/5 transition-all",
                                                i % 2 === 0 ? "bg-white/5" : "bg-transparent"
                                            )}
                                        >
                                            <td className="py-4 px-4">
                                                <Link href={`/dashboard/admin/investors/${investor.investorId}`} className="block">
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-black uppercase tracking-tight leading-none group-hover:text-primary transition-colors">
                                                            {investor.investorName || 'Sin nombre'}
                                                        </p>
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                                            {investor.investorEmail}
                                                        </p>
                                                        {investor.vehicleCount > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {investor.vehicles.map(v => (
                                                                    <span key={v.vehicleId} className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                                                        {v.make} {v.model}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="py-4 px-4 text-center hidden md:table-cell">
                                                <Badge variant="outline" className="font-black text-[10px]">
                                                    {investor.vehicleCount}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-right hidden lg:table-cell">
                                                <p className="text-sm font-black italic tracking-tighter text-emerald-500">
                                                    +${investor.totalIncome.toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4 text-right hidden lg:table-cell">
                                                <p className="text-sm font-black italic tracking-tighter text-red-500">
                                                    -${investor.totalExpenses.toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
                                                    investor.netBalance >= 0
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-red-500/10 text-red-500"
                                                )}>
                                                    <div className={cn(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        investor.netBalance >= 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                                                    )} />
                                                    <span className="text-sm font-black italic tracking-tighter">
                                                        ${Math.abs(investor.netBalance).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                    <Link href={`/dashboard/admin/investors/${investor.investorId}`}>
                                                        <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 rounded-lg font-black uppercase text-[8px] sm:text-[9px] tracking-widest border-primary/20 hover:bg-primary hover:text-white transition-all group-hover:border-primary">
                                                            <span className="hidden sm:inline">Ver informe</span>
                                                            <ChevronRight className="sm:ml-1.5 h-3 w-3" />
                                                        </Button>
                                                    </Link>
                                                    <DeleteInvestorButton
                                                        investorId={investor.investorId}
                                                        investorName={investor.investorName || investor.investorEmail}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
