import { createClient } from "@/lib/supabase/server"
import { getVehiclesByInvestor } from "@/lib/data/vehicles"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown, Calendar, FileText } from "lucide-react"
import { redirect } from "next/navigation"

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

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Mis Finanzas</h2>
                <p className="text-muted-foreground">
                    Resumen financiero de tus vehículos
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ingresos Totales
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Histórico total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Gastos Totales
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Histórico total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Balance Neto
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ganancia/Pérdida total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Este Mes
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-violet-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${monthlyNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${monthlyNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Balance mensual
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            Ingresos del Mes
                        </CardTitle>
                        <CardDescription>
                            ${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(incomeByCategory).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No hay ingresos registrados
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(incomeByCategory)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([category, amount]) => (
                                        <div key={category} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span className="text-sm font-medium">{category}</span>
                                            </div>
                                            <span className="text-sm text-emerald-600 font-semibold">
                                                ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            Gastos del Mes
                        </CardTitle>
                        <CardDescription>
                            ${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(expenseByCategory).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No hay gastos registrados
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(expenseByCategory)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([category, amount]) => (
                                        <div key={category} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                                <span className="text-sm font-medium">{category}</span>
                                            </div>
                                            <span className="text-sm text-red-600 font-semibold">
                                                ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Transacciones Recientes
                    </CardTitle>
                    <CardDescription>
                        Últimas {Math.min(records.length, 20)} transacciones
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {records.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No hay transacciones registradas</p>
                            <p className="text-sm mt-1">
                                Las transacciones aparecerán aquí cuando se registren ingresos o gastos
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-sm text-muted-foreground">
                                            <th className="text-left py-3 px-2">Fecha</th>
                                            <th className="text-left py-3 px-2">Vehículo</th>
                                            <th className="text-left py-3 px-2">Categoría</th>
                                            <th className="text-left py-3 px-2">Descripción</th>
                                            <th className="text-left py-3 px-2">Tipo</th>
                                            <th className="text-right py-3 px-2">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.slice(0, 20).map((record) => (
                                            <tr key={record.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-2 text-sm">
                                                    {new Date(record.date).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                                <td className="py-3 px-2 text-sm font-medium">
                                                    {record.vehicle ? (
                                                        <div>
                                                            <div>{record.vehicle.make} {record.vehicle.model}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {record.vehicle.license_plate}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2 text-sm">
                                                    {record.category}
                                                </td>
                                                <td className="py-3 px-2 text-sm text-muted-foreground max-w-xs truncate">
                                                    {record.description || '—'}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <Badge
                                                        variant={record.type === 'income' ? 'default' : 'secondary'}
                                                        className={record.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}
                                                    >
                                                        {record.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                    </Badge>
                                                </td>
                                                <td className={`py-3 px-2 text-sm font-semibold text-right ${record.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                                                    }`}>
                                                    {record.type === 'income' ? '+' : '-'}${Number(record.amount).toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {records.length > 20 && (
                                <p className="text-sm text-muted-foreground text-center pt-4">
                                    Mostrando las 20 transacciones más recientes de {records.length} totales
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
