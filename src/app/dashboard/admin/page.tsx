import { createClient } from "@/lib/supabase/server"
import { getVehicles } from "@/lib/data/vehicles"
import { getInvestors } from "@/lib/data/profiles"
import { getFinancialRecords } from "@/lib/data/financial"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Car, DollarSign, Activity, Wrench, Zap, PlusCircle, Receipt, TrendingUp, UserPlus, ArrowRight, ShieldCheck, BarChart3, Calculator } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DownloadReportButton } from "@/components/dashboard/DownloadReportButton"
import { VehicleCarousel } from "@/components/dashboard/VehicleCarousel"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'
// Revalidate every 60 seconds for better performance
export const revalidate = 60

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
        <div className="space-y-10 p-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/20 pb-8 gap-4">
                <div className="flex flex-col space-y-2">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent uppercase italic">
                        Panel <span className="text-primary">General</span>
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground font-bold uppercase tracking-widest opacity-80">Centro de Inteligencia Operativa • MiamiCars</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end mr-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Estado del Sistema</span>
                        <span className="text-xs font-bold flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Operativo 100%
                        </span>
                    </div>
                    <DownloadReportButton data={monthlyRecords} />
                </div>
            </div>

            {/* Carrusel de Fotos */}
            <VehicleCarousel vehicles={vehicles} />

            {/* Accesos Rápidos - Rediseñados como Botones */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Nueva Unidad", icon: PlusCircle, href: "/dashboard/admin/vehicles", desc: "Registro técnico", color: "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-500", iconBg: "bg-emerald-500/10", shadow: "shadow-emerald-500/10" },
                    { label: "Subir Gasto", icon: Receipt, href: "/dashboard/admin/finance", desc: "Mantenimiento/Otros", color: "bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/20 text-orange-500", iconBg: "bg-orange-500/10", shadow: "shadow-orange-500/10" },
                    { label: "Registrar Renta", icon: TrendingUp, href: "/dashboard/admin/finance", desc: "Ingreso de caja", color: "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 text-blue-500", iconBg: "bg-blue-500/10", shadow: "shadow-blue-500/10" },
                    { label: "Nuevo Socio", icon: UserPlus, href: "/dashboard/admin/investors", desc: "Alta Inversor", color: "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20 text-purple-500", iconBg: "bg-purple-500/10", shadow: "shadow-purple-500/10" }
                ].map((action, i) => (
                    <Link key={i} href={action.href} className="group flex-1">
                        <div className={cn(
                            "relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 transition-all duration-300",
                            "hover:scale-[1.05] active:scale-[0.98] cursor-pointer",
                            "shadow-xl hover:shadow-2xl",
                            action.color,
                            "group-hover:border-current"
                        )}>
                            <div className={cn(
                                "h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                                "group-hover:rotate-12 group-hover:scale-110",
                                action.iconBg
                            )}>
                                <action.icon className="h-8 w-8" />
                            </div>
                            <h3 className="text-base font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                                {action.label}
                            </h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                                {action.desc}
                            </p>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                            Ingresos (Mes)
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Zap className="h-4 w-4 text-primary fill-current" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-glow tracking-tighter">${monthlyIncome.toLocaleString()}</div>
                        <div className="flex flex-col mt-3 space-y-1">
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[75%]" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">
                                Gastos: <span className="text-red-500">${monthlyExpenses.toLocaleString()}</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                            Inversores
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter">{investors.length}</div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-2">
                            Socios Activos
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                            Flota Total
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Car className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter">{totalVehicles}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] text-muted-foreground font-bold uppercase">{availableVehicles} Listos</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                            Taller/Mantenimiento
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Activity className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter">{maintenanceVehicles}</div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-2 italic">
                            En proceso técnico
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 glass-card border-l-4 border-l-emerald-500/40">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base md:text-lg font-black uppercase tracking-widest flex items-center gap-3">
                            <Zap className="h-5 w-5 text-emerald-500" />
                            Rendimiento Financiero
                        </CardTitle>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 italic">Últimos 30 días</span>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 group hover:bg-emerald-500/5 transition-colors">
                                    <p className="text-xs font-black uppercase text-emerald-500 mb-1 tracking-widest">Ingresos Brutos</p>
                                    <p className="text-3xl font-black italic tracking-tighter transition-transform group-hover:translate-x-1 duration-300">+${monthlyIncome.toLocaleString()}</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 group hover:bg-red-500/5 transition-colors">
                                    <p className="text-xs font-black uppercase text-red-500 mb-1 tracking-widest">Egresos Totales</p>
                                    <p className="text-3xl font-black italic tracking-tighter transition-transform group-hover:translate-x-1 duration-300">-${monthlyExpenses.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="p-8 rounded-[2rem] bg-slate-950 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[80px] -mr-24 -mt-24 animate-pulse" />
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Balance Operativo Neto</p>
                                        </div>
                                        <p className="text-5xl font-black tracking-tighter italic drop-shadow-[0_0_20px_rgba(var(--primary),0.4)]">
                                            ${(monthlyIncome - monthlyExpenses).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="h-20 w-20 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:rotate-6 transition-transform duration-500">
                                            <BarChart3 className="h-10 w-10 text-primary" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 glass-card border-l-4 border-l-primary/40">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base md:text-lg font-black uppercase tracking-widest">Actividad Crítica</CardTitle>
                        <Link href="/dashboard/admin/finance" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline italic">Ver Todo</Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentRecords.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                        <Activity className="h-6 w-6 text-muted-foreground/40" />
                                    </div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest italic">
                                        Sin movimientos recientes
                                    </p>
                                </div>
                            ) : (
                                recentRecords.map((record) => (
                                    <div key={record.id} className="flex items-center group transition-all p-3 rounded-2xl hover:bg-primary/[0.03] border border-transparent hover:border-primary/10">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center mr-4 shadow-sm transition-transform group-hover:scale-110 ${record.type === 'income' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-primary/10 border border-primary/20'
                                            }`}>
                                            {record.type === 'income' ? (
                                                <DollarSign className="h-6 w-6 text-emerald-500" />
                                            ) : (
                                                <Wrench className="h-6 w-6 text-primary" />
                                            )}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <p className="text-xs font-black uppercase tracking-widest leading-none group-hover:text-primary transition-colors italic">
                                                {record.category}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tighter opacity-70">
                                                {record.vehicle?.make} {record.vehicle?.model}
                                            </p>
                                        </div>
                                        <div className={`ml-auto font-black italic text-xl tracking-tighter ${record.type === 'income' ? 'text-emerald-500' : 'text-primary'
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
