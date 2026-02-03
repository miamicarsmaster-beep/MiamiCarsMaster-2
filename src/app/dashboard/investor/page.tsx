import { createClient } from "@/lib/supabase/server"
import { getVehiclesByInvestor } from "@/lib/data/vehicles"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, MapPin, Gauge, TrendingUp, ShieldCheck, Clock, Plus, ArrowUpRight, Zap, Car as CarIcon, FileText, BadgeDollarSign } from "lucide-react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { redirect } from "next/navigation"
import Link from "next/link"
import { VehicleCarousel } from "@/components/dashboard/VehicleCarousel"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { cn } from "@/lib/utils"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export default async function InvestorDashboardPage() {
    const supabase = await createClient()

    // Auth is already handled by middleware - if we're here, user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get investor profile (user is guaranteed to exist by middleware)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Initial fallback if profile is missing (race condition or trigger failure)
    const displayName = profile?.full_name || user.email || "Inversor"

    // Optional: redirect to correct dashboard if wrong role
    if (profile?.role === 'admin') {
        redirect('/dashboard/admin')
    }

    // Get investor's vehicles
    const vehicles = await getVehiclesByInvestor(user.id)

    // Calculate stats
    const totalVehicles = vehicles.length
    const rentedVehicles = vehicles.filter(v => v.status === 'rented').length
    const occupancyRate = totalVehicles > 0 ? (rentedVehicles / totalVehicles) * 100 : 0

    // Get financial data for this month
    const { data: financialRecords } = await supabase
        .from('financial_records')
        .select('*')
        .in('vehicle_id', vehicles.map(v => v.id))
        .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    const monthlyIncome = financialRecords
        ?.filter(r => r.type === 'income')
        .reduce((sum, r) => sum + Number(r.amount), 0) || 0

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            available: { label: "Disponible", className: "bg-blue-500" },
            rented: { label: "Alquilado", className: "bg-emerald-500" },
            maintenance: { label: "Mantenimiento", className: "bg-orange-500" },
            inactive: { label: "Inactivo", className: "bg-gray-500" },
        }
        const variant = variants[status] || variants.available
        return <Badge className={variant.className}>{variant.label}</Badge>
    }

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-700">
            {/* Header & Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                        Operativa <span className="text-primary">{displayName.split(' ')[0]}</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Estado global de tu inversión y activos en tiempo real</p>
                </div>

                <div className="flex items-center gap-4 bg-sidebar-accent/30 p-2 rounded-2xl border border-border/50">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Zap className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="pr-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Versión Sistema</p>
                        <p className="text-[10px] font-bold uppercase tracking-tight">v2.0 Premium Ops</p>
                    </div>
                </div>
            </div>

            {/* Hero Carousel */}
            {vehicles.length > 0 && (
                <div className="relative">
                    <VehicleCarousel vehicles={vehicles} />
                </div>
            )}

            {/* KPI Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-emerald-500/30 transition-all shadow-xl hover:shadow-emerald-500/5 overflow-hidden relative">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 -mr-12 -mt-12 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="flex flex-col gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:rotate-6 transition-all">
                            <TrendingUp className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Ingresos de este Mes</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-black italic tracking-tighter">${monthlyIncome.toLocaleString()}</h3>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">+12%</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-blue-500/30 transition-all shadow-xl hover:shadow-blue-500/5 overflow-hidden relative">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 -mr-12 -mt-12 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                    <div className="flex flex-col gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                            <Calendar className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Ocupación Operativa</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-black italic tracking-tighter">{occupancyRate.toFixed(0)}%</h3>
                                <p className="text-[10px] font-bold text-muted-foreground">{rentedVehicles} de {totalVehicles} unidades</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-orange-500/30 transition-all shadow-xl hover:shadow-orange-500/5 overflow-hidden relative">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-orange-500/5 -mr-12 -mt-12 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors" />
                    <div className="flex flex-col gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:rotate-6 transition-all">
                            <ShieldCheck className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Status de Disponibilidad</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-black italic tracking-tighter uppercase text-orange-500">
                                    {totalVehicles - rentedVehicles > 0 ? 'Activo' : 'En Renta'}
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground">{totalVehicles - rentedVehicles} libres</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Operativa / Reservas", sub: "Calendario Global", icon: Calendar, color: "bg-emerald-500", href: "/dashboard/investor/rentals", accent: "group-hover:text-emerald-500" },
                    { label: "Mis Finanzas", sub: "Flujo de Caja", icon: BadgeDollarSign, color: "bg-orange-500", href: "/dashboard/investor/finance", accent: "group-hover:text-orange-500" },
                    { label: "Documentación", sub: "Vault de Inversor", icon: FileText, color: "bg-blue-500", href: "/dashboard/investor/documents", accent: "group-hover:text-blue-500" },
                    { label: "Soporte Premium", sub: "Asesoría 24/7", icon: Zap, color: "bg-primary", href: "https://wa.me/17868241042", accent: "group-hover:text-primary" },
                ].map((action, i) => (
                    <Link key={i} href={action.href}>
                        <Card className="relative overflow-hidden group h-full bg-white dark:bg-slate-900/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all cursor-pointer p-4 hover:scale-[1.02] hover:shadow-2xl">
                            <div className={cn("absolute top-0 right-0 h-20 w-20 opacity-[0.03] rounded-full -mr-10 -mt-10 transition-all duration-700 group-hover:scale-[3] group-hover:opacity-[0.08]", action.color)} />
                            <div className="flex items-center gap-4">
                                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:rotate-12", action.color)}>
                                    <action.icon className="h-6 w-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-tighter leading-none">{action.label}</p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{action.sub}</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Main Content: Vehicle List */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <CarIcon className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Mi Flota <span className="text-primary">Asignada</span></h3>
                        </div>
                        <Badge variant="outline" className="rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border-border/50">
                            {vehicles.length} Autos
                        </Badge>
                    </div>

                    {vehicles.length === 0 ? (
                        <Card className="bg-muted/30 border-dashed border-border/50 rounded-[2.5rem] py-20 text-center">
                            <CarIcon className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-20" />
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Sin Vehículos Asignados</h4>
                            <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-2">Próximamente verás tus activos aquí</p>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {vehicles.map((vehicle) => (
                                <Card key={vehicle.id} className="group relative overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-sm border-border/50 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01]">
                                    <div className="aspect-[16/10] relative overflow-hidden">
                                        <ImageWithFallback
                                            src={vehicle.image_url || "/placeholder-car.jpg"}
                                            fallbackSrc="/placeholder-car.jpg"
                                            alt={`${vehicle.make} ${vehicle.model}`}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        <div className="absolute top-6 right-6">
                                            <Badge className={cn(
                                                "border-none px-4 py-1.5 rounded-full font-black uppercase text-[9px] tracking-widest shadow-lg",
                                                vehicle.status === 'rented' ? "bg-emerald-500 text-white" :
                                                    vehicle.status === 'maintenance' ? "bg-orange-500 text-white" :
                                                        "bg-blue-500 text-white"
                                            )}>
                                                {getStatusBadge(vehicle.status).props.children}
                                            </Badge>
                                        </div>

                                        <div className="absolute bottom-6 left-6 text-white space-y-1">
                                            <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                                                {vehicle.make} <span className="text-primary">{vehicle.model.split(' ')[0]}</span>
                                            </h4>
                                            <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-60">MODELO {vehicle.year}</p>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ubicación</p>
                                                <p className="text-xs font-bold uppercase truncate flex items-center gap-1.5 italic tracking-tighter">
                                                    <MapPin className="h-3 w-3 text-primary" /> {vehicle.location || "Miami Base"}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Millaje Actual</p>
                                                <p className="text-xs font-bold uppercase flex items-center gap-1.5 italic tracking-tighter">
                                                    <Gauge className="h-3 w-3 text-primary" /> {vehicle.mileage?.toLocaleString() || 0} mi
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-border/30 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Matrícula</p>
                                                <p className="text-sm font-black font-mono tracking-tight text-foreground/80">{vehicle.license_plate || "N/A"}</p>
                                            </div>
                                            <Link href={`/dashboard/investor/vehicles/${vehicle.id}`}>
                                                <Button size="sm" className="rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 bg-primary hover:scale-105 active:scale-95 transition-all">
                                                    Ver Activo <ArrowUpRight className="h-3.5 w-3.5 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Content: Activity Feed (Últimas Novedades) */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Clock className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Últimas <span className="text-primary">Novedades</span></h3>
                    </div>

                    <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl" />
                        <ActivityFeed investorId={user.id} />
                    </Card>

                    <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 rounded-[2.5rem] p-8 group overflow-hidden relative">
                        <div className="absolute bottom-0 right-0 h-40 w-40 bg-primary/10 -mr-20 -mb-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        <h4 className="text-lg font-black uppercase italic tracking-tighter mb-2 text-primary">Inversión Optimizada</h4>
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed mb-6 opacity-70">
                            Tu portafolio está rindiendo un <span className="text-emerald-500 font-bold">14.2% APY</span> estimado este trimestre.
                        </p>
                        <Button variant="outline" className="w-full rounded-2xl h-12 font-black uppercase text-[10px] tracking-widest border-primary/20 text-primary hover:bg-primary/5 transition-all">
                            Descargar Reporte Pro
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    )
}
