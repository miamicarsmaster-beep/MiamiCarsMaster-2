import { createClient } from "@/lib/supabase/server"
import { InvestorPDFExport } from "@/components/dashboard/InvestorPDFExport"
import { getVehiclesByInvestor } from "@/lib/data/vehicles"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown, Calendar, FileText, Download, PieChart, ArrowUpRight, BadgeDollarSign, Car as CarIcon } from "lucide-react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FinancialRecord {
    id: string
    vehicle_id: string
    type: 'income' | 'expense'
    category: string
    amount: number
    date: string
    description: string | null
    vehicle?: {
        make: string
        model: string
        license_plate: string
    }
}

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export default async function InvestorFinancePage() {
    const supabase = await createClient()

    // Auth is already handled by middleware
    const { data: { user } } = await supabase.auth.getUser()

    // Get investor profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

    // Redirect admin to correct dashboard
    if (profile?.role === 'admin') {
        redirect('/dashboard/admin/finance')
    }

    // Safety check for missing profile
    if (!profile) {
        // Just continue, but user might see empty data. 
        // We could redirect to main dashboard to show the "Welcome" fallback, 
        // but it's better to just let them see empty finances.
    }

    // Get investor's vehicles
    const vehicles = await getVehiclesByInvestor(user!.id)
    const vehicleIds = vehicles.map(v => v.id)

    // Get financial records for investor's vehicles
    const { data: financialRecords, error } = await supabase
        .from('financial_records')
        .select(`
            *,
            vehicle:vehicles(make, model, license_plate)
        `)
        .in('vehicle_id', vehicleIds.length > 0 ? vehicleIds : ['00000000-0000-0000-0000-000000000000']) // Avoid empty array error
        .order('date', { ascending: false })

    if (error) {
        console.error('Error loading financial records:', error)
    }

    const records = (financialRecords || []) as unknown as FinancialRecord[]

    // Calculate stats
    const totalIncome = records
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + Number(r.amount), 0)

    const totalExpenses = records
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + Number(r.amount), 0)

    const netBalance = totalIncome - totalExpenses

    // Monthly stats (current month)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const monthlyRecords = records.filter(r => new Date(r.date) >= startOfMonth)

    const monthlyIncome = monthlyRecords
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + Number(r.amount), 0)

    const monthlyExpenses = monthlyRecords
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + Number(r.amount), 0)

    const monthlyNet = monthlyIncome - monthlyExpenses

    // Group by category for insights
    const incomeByCategory = records
        .filter(r => r.type === 'income')
        .reduce((acc, r) => {
            acc[r.category] = (acc[r.category] || 0) + Number(r.amount)
            return acc
        }, {} as Record<string, number>)

    const expenseByCategory = records
        .filter(r => r.type === 'expense')
        .reduce((acc, r) => {
            acc[r.category] = (acc[r.category] || 0) + Number(r.amount)
            return acc
        }, {} as Record<string, number>)

    // Calculate full monthly breakdown
    const monthlyData: Record<string, { income: number; expenses: number }> = {}
    records.forEach(record => {
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

    // Build the summary object for the PDF export component
    const investorSummary = {
        investorId: user!.id,
        investorName: profile?.full_name || 'Inversor',
        investorEmail: user!.email || '',
        vehicleCount: vehicles.length,
        totalIncome,
        totalExpenses,
        netBalance,
        vehicles: vehicles.map(v => {
            const vRecords = records.filter(r => r.vehicle_id === v.id)
            const vIncome = vRecords.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
            const vExpenses = vRecords.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
            return {
                vehicleId: v.id,
                make: v.make,
                model: v.model,
                licensePlate: v.license_plate,
                imageUrl: v.image_url,
                totalIncome: vIncome,
                totalExpenses: vExpenses,
                netBalance: vIncome - vExpenses,
                transactionCount: vRecords.length
            }
        }),
        lastTransactionDate: records.length > 0 ? records[0].date : null
    }

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                        Gestión <span className="text-primary">Financiera</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Control de rentabilidad y flujo de caja de activos</p>
                </div>

                <div className="flex items-center gap-3">
                    <InvestorPDFExport
                        investor={investorSummary}
                        transactions={records}
                        monthlyBreakdown={monthlyBreakdown}
                    />
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-emerald-500/30 transition-all shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 -mr-12 -mt-12 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="flex flex-col gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Ingresos Totales</p>
                            <h3 className="text-2xl font-black italic tracking-tighter text-emerald-500">
                                ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-red-500/30 transition-all shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-red-500/5 -mr-12 -mt-12 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors" />
                    <div className="flex flex-col gap-4">
                        <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Gastos Totales</p>
                            <h3 className="text-2xl font-black italic tracking-tighter text-red-500">
                                ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-blue-500/30 transition-all shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 -mr-12 -mt-12 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                    <div className="flex flex-col gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Balance Neto</p>
                            <h3 className={cn("text-2xl font-black italic tracking-tighter", netBalance >= 0 ? "text-blue-500" : "text-red-500")}>
                                ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-primary/30 transition-all shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 -mr-12 -mt-12 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                    <div className="flex flex-col gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Balance del Mes</p>
                            <h3 className={cn("text-2xl font-black italic tracking-tighter", monthlyNet >= 0 ? "text-emerald-500" : "text-red-500")}>
                                ${monthlyNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Monthly Insights Breakdowns */}
            <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-black uppercase italic tracking-tighter">Principales <span className="text-emerald-500">Ingresos</span></h3>
                        </div>
                        <p className="text-xl font-black italic tracking-tighter text-emerald-500">${monthlyIncome.toLocaleString()}</p>
                    </div>

                    {Object.keys(incomeByCategory).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-20">
                            <PieChart className="h-12 w-12 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Sin datos este mes</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {Object.entries(incomeByCategory)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([category, amount]) => (
                                    <div key={category} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-900/20 border border-white/5 hover:bg-slate-900/40 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-xs font-bold uppercase tracking-widest leading-none">{category}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black italic tracking-tighter text-emerald-500">${amount.toLocaleString()}</span>
                                            <div className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </Card>

                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-black uppercase italic tracking-tighter">Distribución de <span className="text-red-500">Gastos</span></h3>
                        </div>
                        <p className="text-xl font-black italic tracking-tighter text-red-500">${monthlyExpenses.toLocaleString()}</p>
                    </div>

                    {Object.keys(expenseByCategory).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-20">
                            <PieChart className="h-12 w-12 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Sin datos este mes</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {Object.entries(expenseByCategory)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([category, amount]) => (
                                    <div key={category} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-900/20 border border-white/5 hover:bg-slate-900/40 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                            <span className="text-xs font-bold uppercase tracking-widest leading-none">{category}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black italic tracking-tighter text-red-500">${amount.toLocaleString()}</span>
                                            <div className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Vehicles Breakdown */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <CarIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Desglose por <span className="text-primary">Vehículo</span></h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {investorSummary.vehicles.map((vehicle) => (
                        <Card key={vehicle.vehicleId} className="group overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]">
                            <div className="relative aspect-video w-full overflow-hidden">
                                <ImageWithFallback
                                    src={vehicle.imageUrl || "/placeholder-car.jpg"}
                                    fallbackSrc="/placeholder-car.jpg"
                                    alt={`${vehicle.make} ${vehicle.model}`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-3 left-4">
                                    <h4 className="text-sm font-black uppercase tracking-tight text-white leading-none">
                                        {vehicle.make} {vehicle.model}
                                    </h4>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mt-1">
                                        {vehicle.licensePlate || 'Sin matrícula'}
                                    </p>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                        Ingresos Totales
                                    </span>
                                    <span className="text-sm font-black italic text-emerald-500">
                                        +${vehicle.totalIncome.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                        Gastos Totales
                                    </span>
                                    <span className="text-sm font-black italic text-red-500">
                                        -${vehicle.totalExpenses.toLocaleString()}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-border/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Balance Neto
                                        </span>
                                        <span className={cn(
                                            "text-base font-black italic",
                                            vehicle.netBalance >= 0 ? "text-emerald-500" : "text-red-500"
                                        )}>
                                            ${vehicle.netBalance.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center pt-2">
                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-muted/30">
                                        {vehicle.transactionCount} Transacciones
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Transactions Table Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Registro de <span className="text-primary">Transacciones</span></h3>
                </div>

                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden">
                    {records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 opacity-20 text-center">
                            <BadgeDollarSign className="h-16 w-16 mb-4" />
                            <h4 className="text-sm font-black uppercase tracking-widest">Sin Movimientos</h4>
                            <p className="text-xs font-medium uppercase tracking-wide mt-2">No hay transacciones procesadas aún</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted/40 border-b border-border/50">
                                        <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Activo</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoría</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalles</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo</th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.slice(0, 20).map((record, i) => (
                                        <tr key={record.id} className={cn(
                                            "group border-b border-border/10 last:border-0 hover:bg-primary/5 transition-all duration-300",
                                            i % 2 === 0 ? "bg-white/5" : "bg-transparent"
                                        )}>
                                            <td className="py-6 px-8">
                                                <p className="text-xs font-black italic tracking-tighter uppercase whitespace-nowrap">
                                                    {new Date(record.date).toLocaleDateString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </td>
                                            <td className="py-6 px-8">
                                                {record.vehicle ? (
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-black uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">
                                                            {record.vehicle.make} {record.vehicle.model}
                                                        </p>
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                                            {record.vehicle.license_plate}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-20">—</span>
                                                )}
                                            </td>
                                            <td className="py-6 px-8">
                                                <Badge variant="outline" className="rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border-border/50 bg-muted/30">
                                                    {record.category}
                                                </Badge>
                                            </td>
                                            <td className="py-6 px-8">
                                                <p className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
                                                    {record.description || '—'}
                                                </p>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                    record.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                                )}>
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", record.type === 'income' ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                                                    {record.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <p className={cn(
                                                    "text-sm font-black italic tracking-tighter",
                                                    record.type === 'income' ? "text-emerald-500" : "text-red-500"
                                                )}>
                                                    {record.type === 'income' ? '+' : '-'}${Number(record.amount).toLocaleString('en-US', {
                                                        minimumFractionDigits: 2
                                                    })}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {records.length > 20 && (
                    <div className="flex justify-center">
                        <Button variant="ghost" className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground hover:text-primary hover:bg-primary/5">
                            Cargar más transacciones <ArrowUpRight className="h-3 w-3 ml-2" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
