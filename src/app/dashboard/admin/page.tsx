import { createClient } from "@/lib/supabase/server"
import { getVehicles } from "@/lib/data/vehicles"
import { getInvestors } from "@/lib/data/profiles"
import { getFinancialRecords } from "@/lib/data/financial"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Car, DollarSign, Activity, Wrench } from "lucide-react"
import { redirect } from "next/navigation"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // Auth is already handled by middleware - if we're here, user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Get admin profile (user is guaranteed to exist by middleware)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

    // Optional: redirect to correct dashboard if wrong role
    if (profile?.role !== 'admin') {
        redirect('/dashboard/investor')
    }

    // Fetch all data
    const [vehicles, investors, financialRecords] = await Promise.all([
        getVehicles(),
        getInvestors(),
        getFinancialRecords()
    ])

    // Calculate stats
    const totalVehicles = vehicles.length
    const availableVehicles = vehicles.filter(v => v.status === 'available').length
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length

    // Calculate this month's income
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const monthlyRecords = financialRecords.filter(r => new Date(r.date) >= startOfMonth)
    const monthlyIncome = monthlyRecords
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + Number(r.amount), 0)
    const monthlyExpenses = monthlyRecords
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + Number(r.amount), 0)

    // Get recent activity
    const recentRecords = financialRecords.slice(0, 3)

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Panel General</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ingresos Totales (Mes)
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${monthlyIncome.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Gastos: ${monthlyExpenses.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Inversores Activos
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{investors.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Total de inversores
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Autos en Flota
                        </CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVehicles}</div>
                        <p className="text-xs text-muted-foreground">
                            {availableVehicles} Disponibles
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Mantenimientos Activos
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{maintenanceVehicles}</div>
                        <p className="text-xs text-muted-foreground">
                            Autos en taller
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Resumen de Rendimiento</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                                    <p className="text-2xl font-bold text-emerald-600">${monthlyIncome.toLocaleString()}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-emerald-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Gastos del Mes</p>
                                    <p className="text-2xl font-bold text-red-600">${monthlyExpenses.toLocaleString()}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Balance Neto</p>
                                    <p className="text-2xl font-bold text-blue-600">${(monthlyIncome - monthlyExpenses).toLocaleString()}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentRecords.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay actividad reciente
                                </p>
                            ) : (
                                recentRecords.map((record) => (
                                    <div key={record.id} className="flex items-center">
                                        <div className={`h-9 w-9 rounded-full flex items-center justify-center mr-4 ${record.type === 'income' ? 'bg-green-100' : 'bg-orange-100'
                                            }`}>
                                            {record.type === 'income' ? (
                                                <DollarSign className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <Wrench className="h-5 w-5 text-orange-600" />
                                            )}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <p className="text-sm font-medium leading-none">
                                                {record.category}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {record.vehicle?.make} {record.vehicle?.model}
                                            </p>
                                        </div>
                                        <div className={`ml-auto font-medium text-sm ${record.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {record.type === 'income' ? '+' : '-'}${Number(record.amount).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
