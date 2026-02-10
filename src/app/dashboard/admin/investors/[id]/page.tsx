import { getInvestorFinancialSummary } from "@/lib/data/investor-financials"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Car,
    ArrowLeft,
    Download,
    Calendar,
    FileText,
    BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { redirect } from "next/navigation"
import { InvestorPDFExport } from "@/components/dashboard/InvestorPDFExport"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
// Revalidate every 60 seconds
export const revalidate = 60

interface PageProps {
    params: {
        id: string
    }
}

export default async function InvestorDetailPage({ params }: PageProps) {
    // Await params for Next.js 15 compatibility
    const { id } = await params

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

    // Get investor financial summary
    const investorSummaries = await getInvestorFinancialSummary(id)

    if (investorSummaries.length === 0) {
        redirect('/dashboard/admin/investors')
    }

    const investor = investorSummaries[0]

    // Get detailed financial records for this investor
    const vehicleIds = investor.vehicles.map(v => v.vehicleId)

    let transactions: any[] = []
    if (vehicleIds.length > 0) {
        const { data: records } = await supabase
            .from('financial_records')
            .select(`
                *,
                vehicle:vehicles(make, model, license_plate)
            `)
            .in('vehicle_id', vehicleIds)
            .order('date', { ascending: false })

        transactions = records || []
    }

    // Calculate monthly breakdown
    const monthlyData: Record<string, { income: number; expenses: number }> = {}
    transactions.forEach(record => {
        const date = new Date(record.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 }
        }

        if (record.type === 'income') {
            monthlyData[monthKey].income += Number(record.amount)
        } else {
            monthlyData[monthKey].expenses += Number(record.amount)
        }
    })

    const monthlyBreakdown = Object.entries(monthlyData)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, data]) => ({
            month,
            income: data.income,
            expenses: data.expenses,
            net: data.income - data.expenses
        }))

    return (
        <div className="space-y-6 p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/investors">
                        <Button variant="ghost" size="icon" className="rounded-lg">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase italic">
                            {investor.investorName || 'Sin nombre'}
                        </h2>
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-1">
                            {investor.investorEmail}
                        </p>
                    </div>
                </div>
                <InvestorPDFExport investor={investor} transactions={transactions} monthlyBreakdown={monthlyBreakdown} />
            </div>

            {/* Summary KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Vehículos Asignados
                        </CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Car className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tighter">{investor.vehicleCount}</div>
                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">
                            Unidades activas
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Ingresos Totales
                        </CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tighter text-emerald-500">
                            ${investor.totalIncome.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">
                            Histórico completo
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Gastos Totales
                        </CardTitle>
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tighter text-red-500">
                            ${investor.totalExpenses.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">
                            Histórico completo
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card group border-l-4 border-l-primary/40">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">
                            Balance Neto
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-black tracking-tighter",
                            investor.netBalance >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                            ${investor.netBalance.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">
                            Caja actual
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Vehicles Breakdown */}
            <Card className="glass-card border-l-4 border-l-blue-500/40">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-blue-500" />
                        </div>
                        <CardTitle className="text-lg md:text-xl font-black uppercase tracking-widest">
                            Desglose por Vehículo
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {investor.vehicles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 opacity-20">
                            <Car className="h-12 w-12 mb-2" />
                            <p className="text-xs font-black uppercase tracking-widest">Sin vehículos asignados</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {investor.vehicles.map((vehicle) => (
                                <Card key={vehicle.vehicleId} className="bg-muted/20 border-border/50">
                                    <div className="relative aspect-video w-full overflow-hidden">
                                        <ImageWithFallback
                                            src={vehicle.imageUrl || "/placeholder-car.jpg"}
                                            fallbackSrc="/placeholder-car.jpg"
                                            alt={`${vehicle.make} ${vehicle.model}`}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-3 left-3">
                                            <h4 className="text-sm font-black uppercase tracking-tight text-white leading-none">
                                                {vehicle.make} {vehicle.model}
                                            </h4>
                                            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mt-1">
                                                {vehicle.licensePlate || 'Sin matrícula'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                Ingresos
                                            </span>
                                            <span className="text-sm font-black italic text-emerald-500">
                                                +${vehicle.totalIncome.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                Gastos
                                            </span>
                                            <span className="text-sm font-black italic text-red-500">
                                                -${vehicle.totalExpenses.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-border/50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                    Balance
                                                </span>
                                                <span className={cn(
                                                    "text-base font-black italic",
                                                    vehicle.netBalance >= 0 ? "text-emerald-500" : "text-red-500"
                                                )}>
                                                    ${vehicle.netBalance.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="w-full justify-center text-[8px] font-black uppercase">
                                            {vehicle.transactionCount} Transacciones
                                        </Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Monthly Breakdown */}
            {monthlyBreakdown.length > 0 && (
                <Card className="glass-card border-l-4 border-l-purple-500/40">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-purple-500" />
                            </div>
                            <CardTitle className="text-lg md:text-xl font-black uppercase tracking-widest">
                                Evolución Mensual
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted/40 border-b border-border/50">
                                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">
                                            Mes
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell">
                                            Ingresos
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell">
                                            Gastos
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyBreakdown.map((month, i) => (
                                        <tr
                                            key={month.month}
                                            className={cn(
                                                "border-b border-border/10 last:border-0 hover:bg-primary/5 transition-all",
                                                i % 2 === 0 ? "bg-white/5" : "bg-transparent"
                                            )}
                                        >
                                            <td className="py-3 px-4">
                                                <span className="text-xs font-black uppercase tracking-tight">
                                                    {new Date(month.month + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right hidden sm:table-cell">
                                                <span className="text-sm font-black italic text-emerald-500">
                                                    +${month.income.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right hidden sm:table-cell">
                                                <span className="text-sm font-black italic text-red-500">
                                                    -${month.expenses.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className={cn(
                                                    "text-sm font-black italic",
                                                    month.net >= 0 ? "text-emerald-500" : "text-red-500"
                                                )}>
                                                    ${month.net.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Transactions List */}
            <Card className="glass-card border-l-4 border-l-primary/40">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg md:text-xl font-black uppercase tracking-widest">
                            Historial de Transacciones
                        </CardTitle>
                        <Badge variant="outline" className="ml-auto font-black text-xs">
                            {transactions.length} Registros
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 opacity-20">
                            <FileText className="h-12 w-12 mb-2" />
                            <p className="text-xs font-black uppercase tracking-widest">Sin transacciones</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted/40 border-b border-border/50">
                                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">
                                            Fecha
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">
                                            Vehículo
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                                            Categoría
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">
                                            Descripción
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell">
                                            Tipo
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">
                                            Monto
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((transaction, i) => (
                                        <tr
                                            key={transaction.id}
                                            className={cn(
                                                "border-b border-border/10 last:border-0 hover:bg-primary/5 transition-all",
                                                i % 2 === 0 ? "bg-white/5" : "bg-transparent"
                                            )}
                                        >
                                            <td className="py-3 px-4">
                                                <span className="text-xs font-black uppercase tracking-tight whitespace-nowrap">
                                                    {new Date(transaction.date).toLocaleDateString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-black uppercase tracking-tight">
                                                        {transaction.vehicle?.make} {transaction.vehicle?.model}
                                                    </p>
                                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                                        {transaction.vehicle?.license_plate}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                <Badge variant="outline" className="text-[8px] font-black uppercase">
                                                    {transaction.category}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 hidden lg:table-cell">
                                                <span className="text-xs text-muted-foreground">
                                                    {transaction.description || '—'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center hidden sm:table-cell">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                    transaction.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                                )}>
                                                    <div className={cn(
                                                        "h-1 w-1 rounded-full",
                                                        transaction.type === 'income' ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                                                    )} />
                                                    {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className={cn(
                                                    "text-sm font-black italic tracking-tighter",
                                                    transaction.type === 'income' ? "text-emerald-500" : "text-red-500"
                                                )}>
                                                    {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
                                                </span>
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
