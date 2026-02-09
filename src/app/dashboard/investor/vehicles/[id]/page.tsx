"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Car, DollarSign, Gauge, Calendar as CalendarIcon, Wrench, FileText, Eye, MapPin, TrendingUp, ShieldCheck, Clock, CheckCircle2, AlertCircle, BadgeDollarSign, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { isWithinInterval, parseISO, startOfDay } from "date-fns"
import { es } from "date-fns/locale"

interface Vehicle {
    id: string
    make: string
    model: string
    year: number
    license_plate: string | null
    vin: string | null
    mileage: number | null
    location: string | null
    status: string
    daily_rental_price: number | null
    purchase_price: number | null
    image_url: string | null
    assigned_investor_id: string | null
    expected_occupancy_days: number | null
    management_fee_percent: number | null
    management_fee_type: 'percentage' | 'fixed' | null
    management_fee_fixed_amount: number | null
    apply_management_fee: boolean | null
}

interface VehiclePhoto {
    id: string
    vehicle_id: string
    image_url: string
    category: string | null
    created_at: string
}

interface MaintenanceRecord {
    id: string
    vehicle_id: string
    service_type: string
    cost: number | null
    date: string
    notes: string | null
    receipt_images: string[] | null
    status: 'pending' | 'completed'
    created_at: string
}

interface RentalRecord {
    id: string
    vehicle_id: string
    start_date: string
    end_date: string
    customer_name: string
    daily_rate: number
    total_amount: number
    status: 'confirmed' | 'completed' | 'cancelled'
    platform: string
}

interface DocumentRecord {
    id: string
    vehicle_id: string
    title: string
    file_url: string
    type: string
    category: string | null
    expiry_date: string | null
    created_at: string
}

export default function InvestorVehicleDetailPage() {
    const params = useParams()
    const router = useRouter()
    const vehicleId = params.id as string

    const [vehicle, setVehicle] = useState<Vehicle | null>(null)
    const [photos, setPhotos] = useState<VehiclePhoto[]>([])
    const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
    const [rentalHistory, setRentalHistory] = useState<RentalRecord[]>([])
    const [documents, setDocuments] = useState<DocumentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        loadVehicleData()
    }, [vehicleId])

    useEffect(() => {
        if (activeTab === "photos") loadPhotos()
        if (activeTab === "maintenance") loadMaintenance()
        if (activeTab === "rentals") loadRentals()
        if (activeTab === "documents") loadDocuments()
    }, [activeTab])

    const loadVehicleData = async () => {
        try {
            const { data, error } = await supabase
                .from("vehicles")
                .select("*")
                .eq("id", vehicleId)
                .single()

            if (error) throw error
            setVehicle(data)
        } catch (error) {
            console.error("Error loading vehicle:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadPhotos = async () => {
        const { data } = await supabase
            .from("vehicle_photos")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("created_at", { ascending: false })
        setPhotos(data || [])
    }

    const loadMaintenance = async () => {
        const { data } = await supabase
            .from("maintenances")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("date", { ascending: false })
        setMaintenanceHistory(data || [])
    }

    const loadRentals = async () => {
        const { data } = await supabase
            .from("rentals")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("start_date", { ascending: false })
        setRentalHistory(data || [])
    }

    const loadDocuments = async () => {
        const { data } = await supabase
            .from("documents")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("created_at", { ascending: false })
        setDocuments(data || [])
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, { bg: string; text: string; label: string; dot: string }> = {
            available: {
                bg: "bg-emerald-500/10 border-emerald-500/20",
                text: "text-emerald-500",
                label: "Disponible",
                dot: "bg-emerald-500"
            },
            rented: {
                bg: "bg-blue-500/10 border-blue-500/20",
                text: "text-blue-500",
                label: "En Alquiler",
                dot: "bg-blue-500"
            },
            maintenance: {
                bg: "bg-orange-500/10 border-orange-500/20",
                text: "text-orange-500",
                label: "Mantenimiento",
                dot: "bg-orange-500"
            },
            unavailable: {
                bg: "bg-slate-500/10 border-slate-500/20",
                text: "text-slate-500",
                label: "No Disponible",
                dot: "bg-slate-500"
            },
        }
        return colors[status] || colors.unavailable
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando detalles...</p>
                </div>
            </div>
        )
    }

    if (!vehicle) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Vehículo no encontrado</h2>
                    <Button onClick={() => router.push("/dashboard/investor")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/investor")}
                    className="mb-6 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] group hover:bg-primary/10 hover:text-primary transition-all p-0 px-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Volver al Dashboard
                </Button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                                {vehicle.make} <span className="text-primary">{vehicle.model}</span>
                            </h1>
                            <Badge className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 flex items-center gap-2", getStatusColor(vehicle.status).bg, getStatusColor(vehicle.status).text)}>
                                <div className={cn("h-2 w-2 rounded-full animate-pulse", getStatusColor(vehicle.status).dot)} />
                                {getStatusColor(vehicle.status).label}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-primary/50" />
                                Modelo {vehicle.year}
                            </span>
                            <span className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-primary/50" />
                                {vehicle.location || "Miami, FL"}
                            </span>
                            <span className="font-mono bg-sidebar-accent/50 px-3 py-1 rounded-lg border border-border/50 text-foreground">
                                {vehicle.license_plate || "SIN MATRÍCULA"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Valor Estimado</p>
                            <p className="text-2xl font-black italic tracking-tighter">${vehicle.purchase_price?.toLocaleString() || "0"}</p>
                        </div>
                        <div className="h-12 w-[1px] bg-border/50 mx-2" />
                        <Button className="rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            Reportar Incidencia
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-transparent border-b border-border/50 rounded-none w-full justify-start h-14 p-0 gap-8 mb-8">
                    {["overview", "photos", "maintenance", "rentals", "documents"].map((tab) => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 px-0 font-bold uppercase text-[10px] tracking-[0.2em] transition-all"
                        >
                            {tab === "overview" && "Resumen Ejecutivo"}
                            {tab === "photos" && "Galería HD"}
                            {tab === "maintenance" && "Mantenimiento"}
                            {tab === "rentals" && "Operativa / Calendario"}
                            {tab === "documents" && "Documentación"}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Hero Image */}
                        <div className="lg:col-span-2 relative aspect-video md:aspect-auto md:h-[500px] rounded-[2.5rem] overflow-hidden group shadow-2xl border border-white/10 group bg-slate-900">
                            <ImageWithFallback
                                src={vehicle.image_url || ""}
                                fallbackSrc="/placeholder-car.jpg"
                                alt={`${vehicle.make} ${vehicle.model}`}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-10 left-10 text-white">
                                <Badge className="mb-4 bg-primary text-white border-0 font-black uppercase text-[10px] tracking-widest px-4 py-1.5">Destacado de Flota</Badge>
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">
                                    {vehicle.make} <span className="text-primary">{vehicle.model.split(' ')[0]}</span>
                                </h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Ficha Técnica Verificada {vehicle.year}</p>
                            </div>
                        </div>

                        {/* Specs & Info */}
                        <div className="space-y-6">
                            {/* KPI Grid in Overview */}
                            <div className="grid grid-cols-1 gap-4">
                                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-primary/30 transition-all shadow-xl hover:shadow-primary/5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:rotate-6 transition-all">
                                            <TrendingUp className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Tarifa Sugerida</p>
                                            <p className="text-3xl font-black italic tracking-tighter">${vehicle.daily_rental_price || 0}<span className="text-sm font-bold text-muted-foreground not-italic ml-1">/ día</span></p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-blue-500/30 transition-all shadow-xl hover:shadow-blue-500/5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                                            <Gauge className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Uso Acumulado</p>
                                            <p className="text-3xl font-black italic tracking-tighter">{vehicle.mileage?.toLocaleString() || 0}<span className="text-sm font-bold text-muted-foreground not-italic ml-1">mi</span></p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-gradient-to-br from-emerald-500/20 to-transparent backdrop-blur-3xl border-emerald-500/20 rounded-[2.5rem] p-8 group shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/20 -mr-16 -mt-16 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-500 text-black flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-emerald-500/20">
                                            <TrendingUp className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Rentabilidad Proyectada (ROI)</p>
                                            <p className="text-4xl font-black italic tracking-tighter text-emerald-500">
                                                {(() => {
                                                    const gross = (vehicle.daily_rental_price || 0) * (vehicle.expected_occupancy_days || 240);
                                                    let feeAmount = 0;

                                                    if (vehicle.apply_management_fee) {
                                                        if (vehicle.management_fee_type === 'fixed') {
                                                            feeAmount = vehicle.management_fee_fixed_amount || 0;
                                                        } else {
                                                            feeAmount = gross * (vehicle.management_fee_percent || 20) / 100;
                                                        }
                                                    }

                                                    if (vehicle.purchase_price && vehicle.purchase_price > 0) {
                                                        const net = gross - feeAmount;
                                                        return ((net / vehicle.purchase_price) * 100).toFixed(1);
                                                    }
                                                    return "0";
                                                })()}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-emerald-500/10 grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Ocupación</p>
                                            <p className="text-[11px] font-bold uppercase tracking-tight">{vehicle.expected_occupancy_days || 240} días/año</p>
                                        </div>
                                        <div className="space-y-1 text-center">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Fee Gestión</p>
                                            <p className={cn("text-[11px] font-bold uppercase tracking-tight", !vehicle.apply_management_fee && "line-through text-red-500/50")}>
                                                {vehicle.apply_management_fee ? (
                                                    vehicle.management_fee_type === 'fixed'
                                                        ? `$${vehicle.management_fee_fixed_amount?.toLocaleString()}`
                                                        : `${vehicle.management_fee_percent || 20}%`
                                                ) : 'OFF'}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Cálculo</p>
                                            <p className="text-[11px] font-bold uppercase tracking-tight text-emerald-500">
                                                {vehicle.management_fee_type === 'fixed' ? 'Fijo' : 'Variable'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-8 overflow-hidden relative">
                                <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    Detalles Técnicos
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { label: "Número de VIN", value: vehicle.vin || "No registrado", mono: true },
                                        { label: "Matrícula", value: vehicle.license_plate || "Sin placa", mono: true },
                                        { label: "Ubicación Actual", value: vehicle.location || "Miami Base" },
                                        { label: "Año Fab.", value: vehicle.year },
                                    ].map((spec, i) => (
                                        <div key={i} className="flex justify-between items-center py-3 border-b border-border/30 last:border-0 group">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{spec.label}</span>
                                            <span className={cn("text-xs font-black uppercase tracking-tight group-hover:text-primary transition-colors", spec.mono && "font-mono tracking-normal")}>
                                                {spec.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Photos Tab */}
                <TabsContent value="photos" className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border/50">
                        <h3 className="font-bold text-lg mb-4">Galería de Fotos ({photos.length})</h3>
                        {photos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {photos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        className="aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary cursor-pointer group relative"
                                        onClick={() => setPreviewImage(photo.image_url)}
                                    >
                                        <ImageWithFallback
                                            src={photo.image_url}
                                            fallbackSrc="https://source.unsplash.com/400x400/?car"
                                            alt="Vehicle photo"
                                            fill
                                            className="object-cover transition-transform group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No hay fotos disponibles
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Maintenance Tab */}
                <TabsContent value="maintenance" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-border/50 p-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 mb-2">
                                    <Wrench className="h-7 w-7 text-orange-500" />
                                    Expediente de <span className="text-primary">Mantenimiento</span>
                                </h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Historial técnico completo y registros de servicio</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-sidebar-accent/30 rounded-2xl border border-border/50">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Inversión Total</p>
                                    <p className="text-2xl font-black italic tracking-tighter text-orange-500">
                                        ${maintenanceHistory.reduce((sum, h) => sum + (h.cost || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <BadgeDollarSign className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        {maintenanceHistory.length > 0 ? (
                            <div className="relative space-y-0 before:absolute before:inset-0 before:ml-[31px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
                                {maintenanceHistory.map((service, i) => (
                                    <div key={service.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group py-8">
                                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-950 shadow-xl z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                            {service.status === 'completed' ? <CheckCircle2 className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                                        </div>

                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-8 rounded-[2rem] bg-white dark:bg-slate-800/50 border border-border/50 shadow-xl group-hover:border-primary/30 transition-all">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Badge className={cn("rounded-lg px-3 py-1 text-[8px] font-black uppercase tracking-widest border-0", service.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500")}>
                                                            {service.status === 'completed' ? 'Completado' : 'Pendiente'}
                                                        </Badge>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                            {new Date(service.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-lg font-black uppercase italic tracking-tighter group-hover:text-primary transition-colors">{service.service_type}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black italic tracking-tighter text-foreground">${service.cost?.toLocaleString() || "0"}</p>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Costo Total</p>
                                                </div>
                                            </div>

                                            {service.notes && <p className="text-xs font-medium text-muted-foreground leading-relaxed mb-6">{service.notes}</p>}

                                            {service.receipt_images && service.receipt_images.length > 0 && (
                                                <div className="grid grid-cols-4 gap-3 pt-6 border-t border-border/30">
                                                    {service.receipt_images.map((img, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="aspect-square rounded-xl overflow-hidden border border-border/50 cursor-pointer hover:border-primary transition-all group/img relative"
                                                            onClick={() => setPreviewImage(img)}
                                                        >
                                                            <ImageWithFallback src={img} fallbackSrc="" alt="Recibo" fill className="object-cover" />
                                                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all">
                                                                <Eye className="h-4 w-4 text-white" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                                    <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Sin Historial Técnico</h4>
                                <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mt-2">No se han registrado servicios para esta unidad aún.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Rentals Tab */}
                <TabsContent value="rentals" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Calendar Card */}
                        <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 -mr-20 -mt-20 rounded-full blur-3xl" />
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 mb-8">
                                <CalendarIcon className="h-7 w-7 text-primary" />
                                Calendario <span className="text-primary">Operativo</span>
                            </h3>

                            <div className="flex flex-col gap-6">
                                <Calendar
                                    mode="single"
                                    locale={es}
                                    className="rounded-3xl border border-border/50 bg-slate-50/50 dark:bg-slate-900/20 p-6 shadow-inner mx-auto w-full max-w-[340px]"
                                    modifiers={{
                                        rented: (date) => rentalHistory.some(rental =>
                                            isWithinInterval(startOfDay(date), {
                                                start: startOfDay(parseISO(rental.start_date)),
                                                end: startOfDay(parseISO(rental.end_date))
                                            })
                                        )
                                    }}
                                    modifiersClassNames={{
                                        rented: "bg-emerald-500 text-white font-black rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105"
                                    }}
                                />

                                <div className="flex items-center gap-6 p-6 bg-muted/40 rounded-2xl border border-border/50">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Alquilado</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-slate-700" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Disponible</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Rental List Card */}
                        <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-10 shadow-2xl">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 mb-8">
                                <Clock className="h-7 w-7 text-blue-500" />
                                Últimos <span className="text-primary">Alquileres</span>
                            </h3>

                            {rentalHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {rentalHistory.map((rental) => (
                                        <div key={rental.id} className="p-6 bg-slate-50/50 dark:bg-slate-800/40 border border-border/50 rounded-2xl hover:border-primary/30 transition-all group">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Cliente</p>
                                                    <h4 className="text-lg font-black uppercase italic tracking-tighter group-hover:text-primary transition-colors">{rental.customer_name}</h4>
                                                </div>
                                                <Badge className="rounded-lg px-3 py-1 text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-0">
                                                    {rental.status === 'completed' ? 'Finalizado' : 'En Curso'}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Período</p>
                                                    <p className="text-xs font-black uppercase tracking-tight text-foreground">
                                                        {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Ingreso Total</p>
                                                    <p className="text-xl font-black italic tracking-tighter text-emerald-500">${rental.total_amount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                                                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Plataforma: {rental.platform}</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">Ver Contrato</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 opacity-40">
                                    <Car className="h-16 w-16 mx-auto mb-6" />
                                    <p className="text-xs font-black uppercase tracking-[0.3em]">Sin Actividad Reciente</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border/50">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            Documentos ({documents.length})
                        </h3>
                        {documents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {documents.map((doc) => (
                                    <Card key={doc.id} className="group relative overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-sm border-border/50 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]">
                                        <div className="p-5 pb-2">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-lg",
                                                    doc.type.includes('pdf') ? "bg-red-500" : "bg-blue-500"
                                                )}>
                                                    {doc.type.includes('pdf') ? <FileText className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </div>
                                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-border/50 bg-muted/30">
                                                    {doc.category || 'General'}
                                                </Badge>
                                            </div>
                                            <h4 className="text-xs font-black uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors">
                                                {doc.title}
                                            </h4>
                                        </div>

                                        <CardContent className="p-5 pt-2 space-y-4">
                                            <div
                                                className="flex items-center justify-center h-32 bg-slate-900/40 rounded-[1.25rem] border border-white/5 text-muted-foreground group-hover:bg-slate-900/60 transition-all cursor-pointer relative overflow-hidden"
                                                onClick={() => window.open(doc.file_url, '_blank')}
                                            >
                                                {doc.type.startsWith('image/') ? (
                                                    <ImageWithFallback
                                                        src={doc.file_url}
                                                        fallbackSrc=""
                                                        alt={doc.title}
                                                        fill
                                                        className="object-cover opacity-60 group-hover:opacity-100 transition-all"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FileText className="h-8 w-8 opacity-20" />
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30">PREVIEW</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center">
                                                    <div className="h-10 w-10 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                                        <Eye className="h-5 w-5 text-primary" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 rounded-xl font-black uppercase text-[9px] tracking-widest h-9 border-border/50 hover:bg-primary hover:text-white transition-all shadow-lg"
                                                    onClick={() => window.open(doc.file_url, '_blank')}
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-2" />
                                                    Abrir
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No hay documentos disponibles
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
            {/* Image Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                <DialogContent className="max-w-4xl bg-transparent border-0 p-0 shadow-none">
                    <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden">
                        {previewImage && (
                            <ImageWithFallback
                                src={previewImage}
                                fallbackSrc=""
                                alt="Preview"
                                fill
                                className="object-contain"
                            />
                        )}
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-6 right-6 h-12 w-12 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
