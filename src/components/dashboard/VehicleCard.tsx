"use client"

import { useState } from "react"
import { Vehicle } from "@/types/database"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Gauge, MapPin, Settings, Trash2, ChevronDown, Check, Loader2, User, Fuel } from "lucide-react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface VehicleCardProps {
    vehicle: Vehicle
    onDelete: (id: string) => void
    onManage?: (vehicle: Vehicle) => void
    onUpdate?: (vehicle: Vehicle) => void
}

export function VehicleCard({ vehicle, onDelete, onManage, onUpdate }: VehicleCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const generatePlaceholderImage = (make: string, model: string) => {
        const carName = `${make} ${model}`.replace(/\s+/g, '+')
        return `https://source.unsplash.com/800x600/?${carName},car`
    }

    const handleStatusUpdate = async (newStatus: Vehicle["status"]) => {
        if (newStatus === vehicle.status) return

        setIsUpdating(true)
        try {
            const { error } = await supabase
                .from("vehicles")
                .update({ status: newStatus })
                .eq("id", vehicle.id)

            if (error) throw error

            const updatedVehicle = { ...vehicle, status: newStatus }
            if (onUpdate) onUpdate(updatedVehicle)

            toast.success(`Estado actualizado a ${newStatus.toUpperCase()}`)
            router.refresh()
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Error al actualizar el estado")
        } finally {
            setIsUpdating(false)
        }
    }

    const statuses: { value: Vehicle["status"]; label: string; className: string }[] = [
        { value: "available", label: "DISPONIBLE", className: "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/10" },
        { value: "rented", label: "ALQUILADO", className: "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/10" },
        { value: "maintenance", label: "SERVICE", className: "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/10" },
        { value: "inactive", label: "INACTIVO", className: "bg-slate-700 hover:bg-slate-800 shadow-lg shadow-slate-500/10" },
    ]

    const currentStatus = statuses.find(s => s.value === vehicle.status) || statuses[0]

    return (
        <div className="glass-card group overflow-hidden border-border/30 hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 shadow-2xl hover:shadow-primary/10 rounded-[2.5rem]">
            <div className="aspect-[16/10] relative overflow-hidden rounded-t-[2.5rem]">
                <ImageWithFallback
                    src={vehicle.image_url || generatePlaceholderImage(vehicle.make, vehicle.model)}
                    fallbackSrc={generatePlaceholderImage(vehicle.make, vehicle.model)}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

                {/* Status Badge Over Image - Now Interactive */}
                <div className="absolute top-6 right-6 scale-110 z-20">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                disabled={isUpdating}
                                className={`h-auto p-0 rounded-full border-0 backdrop-blur-md overflow-hidden hover:scale-105 transition-transform ${currentStatus.className}`}
                            >
                                <Badge className="bg-transparent hover:bg-transparent text-white px-4 py-1.5 text-xs font-black tracking-[0.2em] flex items-center gap-2 border-0">
                                    {isUpdating ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <>
                                            {currentStatus.label}
                                            <ChevronDown className="h-3 w-3 opacity-50" />
                                        </>
                                    )}
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="bg-popover/90 backdrop-blur-2xl border-border rounded-[1.5rem] p-3 min-w-[180px] shadow-2xl animate-in zoom-in-95 duration-200"
                        >
                            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] px-3 pb-2 mb-2 border-b border-border">Cambiar Disponibilidad</p>
                            {statuses.map((s) => (
                                <DropdownMenuItem
                                    key={s.value}
                                    onClick={() => handleStatusUpdate(s.value)}
                                    className={`rounded-xl px-4 py-3.5 text-xs font-black tracking-widest uppercase cursor-pointer mb-1 last:mb-0 transition-all duration-300
                                        ${vehicle.status === s.value
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                            : 'hover:bg-primary/10 hover:translate-x-1'}`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-2.5 w-2.5 rounded-full border border-white/20 ${s.className.split(' ')[0]}`} />
                                            {s.label}
                                        </div>
                                        {vehicle.status === s.value && <Check className="h-4 w-4 text-white" />}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Hero Info */}
                <div className="absolute bottom-6 left-6 sm:left-8 flex flex-col gap-1">
                    <span className="text-primary text-xs sm:text-xs font-black uppercase tracking-[0.3em]">
                        {vehicle.year} MODEL • {vehicle.license_plate || "SN"}
                    </span>
                    <h3 className="text-white text-2xl sm:text-3xl font-black italic tracking-tighter uppercase leading-none">
                        {vehicle.make} <span className="text-white/80">{vehicle.model}</span>
                    </h3>
                </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                            <Settings className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60 italic leading-none">Transmisión</span>
                            <span className="text-sm font-black uppercase tracking-tight capitalize mt-1 text-foreground">{vehicle.transmission || "N/A"}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                            <Gauge className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60 italic leading-none">Recorrido</span>
                            <span className="text-sm font-black uppercase tracking-tight mt-1 text-foreground">{vehicle.mileage?.toLocaleString() || 0} MI</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60 italic leading-none">Asientos</span>
                            <span className="text-sm font-black uppercase tracking-tight mt-1 text-foreground">{vehicle.seats || "N/A"}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                            <Fuel className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60 italic leading-none">Combustible</span>
                            <span className="text-sm font-black uppercase tracking-tight capitalize mt-1 text-foreground">{vehicle.fuel_type || "N/A"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest opacity-80 text-foreground">{vehicle.location || "Ubicación No Definida"}</span>
                </div>

                {vehicle.assigned_investor && (
                    <div className="p-5 rounded-2xl bg-primary/[0.03] border border-primary/10 flex flex-col gap-2 relative overflow-hidden group/investor">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
                        <p className="text-xs font-black uppercase tracking-widest text-primary italic relative z-10">Inversor Socio</p>
                        <p className="text-sm font-black uppercase tracking-tighter truncate text-foreground relative z-10">
                            {vehicle.assigned_investor.full_name || vehicle.assigned_investor.email}
                        </p>
                    </div>
                )}
            </div>

            <div className="px-5 sm:px-6 pb-8 flex gap-2 sm:gap-3">
                <Button
                    onClick={() => onManage?.(vehicle)}
                    className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                    <Settings className="h-4 w-4 mr-2" />
                    Administrar Vehículo
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => onDelete(vehicle.id)}
                    className="w-14 h-14 rounded-2xl text-red-500 hover:bg-red-500/10 hover:text-red-600 border border-transparent hover:border-red-500/10 transition-all"
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
}
