"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Car, DollarSign, Gauge, Calendar, Wrench, FileText, Eye, MapPin } from "lucide-react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

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
        const colors: Record<string, string> = {
            available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
            rented: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
            maintenance: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
            unavailable: "bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400",
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
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/investor")}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-mono bg-muted px-2 py-1 rounded">
                                {vehicle.license_plate || "Sin Placa"}
                            </span>
                            {vehicle.location && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {vehicle.location}
                                </span>
                            )}
                        </div>
                    </div>
                    <Badge className={`${getStatusColor(vehicle.status)} px-4 py-2 text-sm font-semibold`}>
                        {vehicle.status}
                    </Badge>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto">
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="photos">Fotos</TabsTrigger>
                    <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
                    <TabsTrigger value="rentals">Alquileres</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Hero Image */}
                    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-border/50">
                        <ImageWithFallback
                            src={vehicle.image_url || ""}
                            fallbackSrc="https://source.unsplash.com/1200x800/?car,luxury"
                            alt={`${vehicle.make} ${vehicle.model}`}
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-emerald-600" />
                                </div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Tarifa Diaria</p>
                            </div>
                            <p className="text-2xl font-bold font-mono">${vehicle.daily_rental_price || 0}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                    <Gauge className="h-5 w-5 text-blue-600" />
                                </div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Millaje</p>
                            </div>
                            <p className="text-2xl font-bold font-mono">{vehicle.mileage?.toLocaleString() || 0} mi</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-purple-600" />
                                </div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Año</p>
                            </div>
                            <p className="text-2xl font-bold font-mono">{vehicle.year}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-orange-600" />
                                </div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Precio Compra</p>
                            </div>
                            <p className="text-2xl font-bold font-mono">${vehicle.purchase_price?.toLocaleString() || 0}</p>
                        </div>
                    </div>

                    {/* Technical Specs */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border/50">
                        <h3 className="font-bold text-lg mb-4">Especificaciones Técnicas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex justify-between py-2 border-b border-border/30">
                                <span className="text-muted-foreground">VIN</span>
                                <span className="font-mono font-semibold">{vehicle.vin || "N/A"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border/30">
                                <span className="text-muted-foreground">Placa</span>
                                <span className="font-mono font-semibold">{vehicle.license_plate || "N/A"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border/30">
                                <span className="text-muted-foreground">Ubicación</span>
                                <span className="font-semibold">{vehicle.location || "N/A"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border/30">
                                <span className="text-muted-foreground">Estado</span>
                                <Badge className={getStatusColor(vehicle.status)}>{vehicle.status}</Badge>
                            </div>
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
                                        onClick={() => window.open(photo.image_url, '_blank')}
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
                <TabsContent value="maintenance" className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border/50">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-orange-500" />
                            Historial de Mantenimiento ({maintenanceHistory.length})
                        </h3>
                        {maintenanceHistory.length > 0 ? (
                            <div className="space-y-4">
                                {maintenanceHistory.map((service) => (
                                    <div key={service.id} className="p-4 border border-border/30 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold">{service.service_type}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(service.date).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {service.cost && (
                                                    <p className="font-bold font-mono">${service.cost.toLocaleString()}</p>
                                                )}
                                                <Badge variant={service.status === 'completed' ? 'default' : 'secondary'}>
                                                    {service.status === 'completed' ? 'Completado' : 'Pendiente'}
                                                </Badge>
                                            </div>
                                        </div>
                                        {service.notes && (
                                            <p className="text-sm text-muted-foreground mt-2">{service.notes}</p>
                                        )}
                                        {service.receipt_images && service.receipt_images.length > 0 && (
                                            <div className="mt-3 grid grid-cols-4 gap-2">
                                                {service.receipt_images.map((img, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="aspect-square rounded overflow-hidden border cursor-pointer"
                                                        onClick={() => window.open(img, '_blank')}
                                                    >
                                                        <ImageWithFallback
                                                            src={img}
                                                            fallbackSrc="https://source.unsplash.com/200x200/?receipt"
                                                            alt={`Receipt ${idx + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No hay registros de mantenimiento
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Rentals Tab */}
                <TabsContent value="rentals" className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border/50">
                        <h3 className="font-bold text-lg mb-4">Historial de Alquileres ({rentalHistory.length})</h3>
                        {rentalHistory.length > 0 ? (
                            <div className="space-y-3">
                                {rentalHistory.map((rental) => (
                                    <div key={rental.id} className="p-4 border border-border/30 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{rental.customer_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">Plataforma: {rental.platform}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold font-mono text-lg">${rental.total_amount.toLocaleString()}</p>
                                            <Badge variant="secondary" className="mt-1">
                                                {rental.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No hay alquileres registrados
                            </div>
                        )}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-4 border border-border/30 rounded-lg hover:border-primary cursor-pointer transition-colors"
                                        onClick={() => window.open(doc.file_url, '_blank')}
                                    >
                                        <div className="flex items-start gap-3">
                                            <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{doc.title}</p>
                                                <p className="text-xs text-muted-foreground">{doc.type}</p>
                                                {doc.expiry_date && (
                                                    <p className="text-xs text-orange-600 mt-1">
                                                        Vence: {new Date(doc.expiry_date).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
        </div>
    )
}
