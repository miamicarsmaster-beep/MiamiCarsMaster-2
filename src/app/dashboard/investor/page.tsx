import { createClient } from "@/lib/supabase/server"
import { getVehiclesByInvestor } from "@/lib/data/vehicles"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, MapPin, Gauge } from "lucide-react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function InvestorDashboardPage() {
    const supabase = await createClient()

    // Auth is already handled by middleware - if we're here, user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Get investor profile (user is guaranteed to exist by middleware)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

    // Optional: redirect to correct dashboard if wrong role
    if (profile?.role === 'admin') {
        redirect('/dashboard/admin')
    }

    // Get investor's vehicles
    const vehicles = await getVehiclesByInvestor(user!.id)

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
        <div className="space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        Bienvenido, {profile.full_name || profile.email}
                    </h2>
                    <p className="text-muted-foreground">Aquí está el estado actual de tu flota.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ganancia Estimada (Mes)
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${monthlyIncome.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Ingresos del mes actual
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ocupación de Flota
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{occupancyRate.toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {rentedVehicles} de {totalVehicles} autos alquilados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Vehículos
                        </CardTitle>
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVehicles}</div>
                        <p className="text-xs text-muted-foreground">
                            En tu flota
                        </p>
                    </CardContent>
                </Card>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4">Mis Vehículos</h3>

            {vehicles.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <p>No tienes vehículos asignados aún.</p>
                        <p className="text-sm mt-2">Contacta al administrador para que te asigne un vehículo.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {vehicles.map((vehicle) => (
                        <Card key={vehicle.id} className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative">
                                <ImageWithFallback
                                    src={vehicle.image_url || `https://source.unsplash.com/800x600/?${vehicle.make}+${vehicle.model},car`}
                                    fallbackSrc={`https://source.unsplash.com/800x600/?car`}
                                    alt={`${vehicle.make} ${vehicle.model}`}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute top-2 right-2">
                                    {getStatusBadge(vehicle.status)}
                                </div>
                            </div>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>{vehicle.make} {vehicle.model}</span>
                                    <span className="text-sm font-normal text-muted-foreground">{vehicle.year}</span>
                                </CardTitle>
                                <CardDescription>Placa: {vehicle.license_plate || vehicle.vin || "—"}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                {vehicle.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> {vehicle.location}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Gauge className="h-4 w-4" /> {vehicle.mileage?.toLocaleString() || 0} millas
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/50 p-4 border-t flex justify-between items-center">
                                <div className="text-sm font-medium">
                                    {vehicle.status === 'maintenance' ? (
                                        <span className="text-orange-600">En mantenimiento</span>
                                    ) : vehicle.status === 'rented' ? (
                                        <span className="text-emerald-600">Generando ingresos</span>
                                    ) : (
                                        <span className="text-blue-600">Disponible</span>
                                    )}
                                </div>
                                <Link href={`/dashboard/investor/vehicles/${vehicle.id}`}>
                                    <Button variant="outline" size="sm">Ver Detalles</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
