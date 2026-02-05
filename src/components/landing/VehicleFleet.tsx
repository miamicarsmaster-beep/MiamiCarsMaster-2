"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Vehicle } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import {
    Car,
    CalendarDays,
    Plane,
    Phone,
    Mail,
    User,
    ChevronRight,
    Loader2,
    CheckCircle2,
    DollarSign,
    Gauge,
    MapPin,
    Zap,
    Settings,
    Fuel
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { motion, AnimatePresence } from "framer-motion"

export function VehicleFleet() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [needsAirport, setNeedsAirport] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        async function fetchVehicles() {
            try {
                const { data, error } = await supabase
                    .from("vehicles")
                    .select("*")
                    .eq("status", "available")
                    .order("created_at", { ascending: false })

                if (error) throw error
                setVehicles(data || [])
            } catch (error) {
                console.error("Error fetching available vehicles:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchVehicles()
    }, [supabase])

    const calculateTotal = () => {
        if (!dateRange?.from || !dateRange?.to || !selectedVehicle?.daily_rental_price) return 0
        const days = differenceInDays(dateRange.to, dateRange.from) + 1
        let total = days * selectedVehicle.daily_rental_price
        if (needsAirport) total += 50
        return total
    }

    const handleWhatsAppSubmit = () => {
        if (!selectedVehicle || !name || !phone || !dateRange?.from || !dateRange?.to || !paymentMethod) {
            alert("Por favor completa todos los campos requeridos, incluyendo el método de pago.")
            return
        }

        const total = calculateTotal()
        const startStr = format(dateRange.from, "PPP", { locale: es })
        const endStr = format(dateRange.to, "PPP", { locale: es })

        const message = `Hola! Me interesa este auto ${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.year}) para alquilar.

*DATOS DEL CLIENTE:*
• Nombre: ${name}
• Email: ${email || 'No proporcionado'}
• Teléfono: ${phone}

*DATOS DE ALQUILER:*
• Servicio Aeropuerto: ${needsAirport ? 'SÍ (+$50)' : 'NO'}
• Fechas: del ${startStr} al ${endStr}
• Método de Pago: ${paymentMethod}

*COTIZACIÓN:*
• Valor total: $${total.toLocaleString()} USD`

        const encodedMessage = encodeURIComponent(message)
        window.open(`https://wa.me/17868241042?text=${encodedMessage}`, "_blank")
    }

    const openRentalDialog = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle)
        setIsDialogOpen(true)
    }

    if (isLoading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Cargando flota disponible...</p>
            </div>
        )
    }

    return (
        <section id="fleet" className="py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-24 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-primary/5 rounded-full blur-[120px] -ml-48 -mb-24 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center mb-20 text-center">
                    <Badge variant="outline" className="mb-4 py-1.5 px-4 rounded-full border-primary/30 text-primary font-black tracking-[0.3em] uppercase text-[10px] bg-primary/5">
                        Nuestra Flota
                    </Badge>
                    <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-6 leading-none">
                        Autos <span className="text-primary italic">Disponibles</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl text-lg font-medium">
                        Selecciona el vehículo que mejor se adapte a tus necesidades y solicita tu alquiler en segundos.
                        Calidad premium garantizada.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {vehicles.length > 0 ? (
                        vehicles.map((vehicle) => (
                            <motion.div
                                key={vehicle.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="group rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 border border-border/40 hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/10"
                            >
                                <div className="aspect-[16/10] relative overflow-hidden">
                                    <ImageWithFallback
                                        src={vehicle.image_url || ""}
                                        fallbackSrc={`https://placehold.co/800x600/000000/FFFFFF?text=${vehicle.make}+${vehicle.model}`}
                                        alt={`${vehicle.make} ${vehicle.model}`}
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                    <div className="absolute bottom-6 left-8 flex flex-col gap-0.5">
                                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">{vehicle.year} MODEL</span>
                                        <h3 className="text-white text-3xl font-black italic tracking-tighter uppercase leading-none">
                                            {vehicle.make} <span className="text-white/70">{vehicle.model}</span>
                                        </h3>
                                    </div>
                                    <div className="absolute top-6 right-6">
                                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col items-center min-w-[80px]">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Día desde</span>
                                            <span className="text-xl font-black italic tracking-tighter text-white">
                                                ${vehicle.daily_rental_price?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Asientos */}
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Asientos</span>
                                                <span className="text-xs font-black italic tracking-tight uppercase">
                                                    {vehicle.seats || 'No disponible'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Transmisión */}
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                                                <Settings className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Transmisión</span>
                                                <span className="text-xs font-black italic tracking-tight uppercase">
                                                    {vehicle.transmission || 'No disponible'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Combustible */}
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                                                <Fuel className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Combustible</span>
                                                <span className="text-xs font-black italic tracking-tight uppercase">
                                                    {vehicle.fuel_type || 'No disponible'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Autonomía */}
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                                                <Gauge className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Autonomía</span>
                                                <span className="text-xs font-black italic tracking-tight uppercase">
                                                    {vehicle.range ? `${vehicle.range} km` : 'No disponible'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Disponible</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => openRentalDialog(vehicle)}
                                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group/btn"
                                    >
                                        Solicitar Alquiler
                                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 border-2 border-dashed border-primary/10 rounded-[3rem] bg-primary/[0.02]">
                            <Car className="h-16 w-16 mx-auto mb-6 text-primary/20" />
                            <h3 className="text-2xl font-black uppercase tracking-widest mb-2">No hay unidades disponibles</h3>
                            <p className="text-muted-foreground font-medium">Vuelve más tarde o contáctanos por WhatsApp para más información.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RENTAL DIALOG - ULTRA WIDESCREEN EDITION */}
            {/* RENTAL DIALOG - ULTRA WIDESCREEN LUXURY CONSOLE */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[98vw] sm:max-w-[95vw] lg:max-w-[1500px] p-0 overflow-hidden border-none rounded-2xl sm:rounded-[3rem] bg-white dark:bg-slate-950 shadow-[0_0_100px_rgba(0,0,0,0.4)] flex flex-col max-h-[98vh] sm:max-h-[95vh]">

                    {/* 1. HEADER - MODERN & RESPONSIVE */}
                    <div className="px-5 sm:px-10 py-6 sm:py-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-white via-slate-50/50 to-white dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.05),transparent_50%)]" />
                        <div className="relative z-10 space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-1 sm:h-1.5 w-12 sm:w-16 bg-gradient-to-r from-primary to-primary/40 rounded-full" />
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none">
                                    Checkout <span className="text-primary italic">Premium</span>
                                </h2>
                            </div>
                            <p className="text-[9px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] sm:tracking-[0.5em] pl-14 sm:pl-20 opacity-60">
                                Miami Luxury Experience • Reserva Final
                            </p>
                        </div>
                    </div>


                    {/* 2. BODY - FULLY RESPONSIVE GRID SYSTEM */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/80 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start max-w-[1400px] mx-auto">

                            {/* LEFT COLUMN: VEHICLE SUMMARY (4/12) */}
                            <div className="lg:col-span-4 space-y-4 sm:space-y-5">
                                <div className="bg-white dark:bg-slate-900/80 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
                                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-primary mb-4 sm:mb-5 flex items-center gap-2">
                                        <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Vehículo Seleccionado
                                    </h3>
                                    <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden mb-5 sm:mb-6 group ring-1 ring-slate-200/50 dark:ring-white/5">
                                        <img
                                            src={selectedVehicle?.image_url || ""}
                                            alt={selectedVehicle?.model}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                        <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-5">
                                            <p className="text-white font-black text-lg sm:text-xl uppercase tracking-tight italic leading-tight">
                                                {selectedVehicle?.make} {selectedVehicle?.model}
                                            </p>
                                            <p className="text-primary/90 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest mt-0.5 sm:mt-1">{selectedVehicle?.year}</p>
                                        </div>
                                    </div>

                                    {/* Tech Specs Summary in Dialog */}
                                    <div className="grid grid-cols-2 gap-2 mb-6">
                                        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                            <User className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-tighter truncate">{selectedVehicle?.seats} Asientos</span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                            <Settings className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-tighter truncate capitalize">{selectedVehicle?.transmission === 'automatic' ? 'Auto' : 'Manual'}</span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                            <Fuel className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-tighter truncate capitalize">{selectedVehicle?.fuel_type}</span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                            <Gauge className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-tighter truncate">{selectedVehicle?.range || 0} mi/km</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 sm:space-y-3.5 py-4 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex justify-between items-center text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                                            <span>Tarifa diaria</span>
                                            <span className="text-foreground font-black text-sm sm:text-base">${selectedVehicle?.daily_rental_price}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                                            <span>Período</span>
                                            <span className="text-foreground font-black text-sm sm:text-base">{dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) + 1 : 0} días</span>
                                        </div>
                                        {needsAirport && (
                                            <div className="flex justify-between items-center text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-primary">
                                                <span className="flex items-center gap-1.5 sm:gap-2">
                                                    <Plane className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    Servicio Aeropuerto
                                                </span>
                                                <span className="font-black text-sm sm:text-base">+$50</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 sm:pt-5 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                                        <div>
                                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em] mb-1.5 sm:mb-2">Total Final</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-primary">
                                                    ${calculateTotal().toLocaleString()}
                                                </span>
                                                <span className="text-[11px] sm:text-[12px] font-black text-muted-foreground uppercase tracking-widest">USD</span>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20 text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            Disponible
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900/80 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
                                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-primary mb-4 sm:mb-5 flex items-center gap-2">
                                        <Plane className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Servicios VIP
                                    </h3>
                                    <button
                                        onClick={() => setNeedsAirport(!needsAirport)}
                                        className={`w-full flex items-center justify-between p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all ${needsAirport ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20 shadow-sm' : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200/50 dark:border-white/5 hover:border-primary/20'}`}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-all ${needsAirport ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white dark:bg-slate-900 text-muted-foreground shadow-sm border border-slate-200/50 dark:border-white/5'}`}>
                                                <Plane className="h-5 w-5 sm:h-6 sm:w-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[11px] sm:text-[12px] font-black uppercase tracking-tight leading-tight">Servicio Aeropuerto</p>
                                                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Entrega en Terminal</p>
                                            </div>
                                        </div>
                                        <div className={`w-12 h-6 sm:w-14 sm:h-7 rounded-full relative flex items-center px-0.5 transition-colors ${needsAirport ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                            <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white shadow transition-transform ${needsAirport ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* CENTER COLUMN: INFORMATION (4/12) */}
                            <div className="lg:col-span-4 space-y-4 sm:space-y-5">
                                <div className="bg-white dark:bg-slate-900/80 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/50 dark:border-white/5 backdrop-blur-sm space-y-4 sm:space-y-5">
                                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Información Personal
                                    </h3>
                                    <div className="space-y-4 sm:space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Completo</Label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="TU NOMBRE"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value.toUpperCase())}
                                                    className="h-12 sm:h-14 pl-12 sm:pl-14 rounded-xl sm:rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200/50 dark:border-white/5 font-bold text-sm sm:text-base focus:ring-primary/20 focus:border-primary/30"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp</Label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="+1 (786) 000-0000"
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="h-12 sm:h-14 pl-12 sm:pl-14 rounded-xl sm:rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200/50 dark:border-white/5 font-bold text-sm sm:text-base focus:ring-primary/20 focus:border-primary/30"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email (Opcional)</Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="CLIENTE@EMAIL.COM"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value.toUpperCase())}
                                                    className="h-12 sm:h-14 pl-12 sm:pl-14 rounded-xl sm:rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border-slate-200/50 dark:border-white/5 font-bold text-sm sm:text-base focus:ring-primary/20 focus:border-primary/30"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900/80 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/50 dark:border-white/5 backdrop-blur-sm space-y-4 sm:space-y-5">
                                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                                        <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Método de Pago
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                                        {[
                                            { id: 'crypto', label: 'Criptomoneda', sub: 'Transfer USDT/BTC', icon: Zap },
                                            { id: 'ars', label: 'Pesos Argentinos', sub: 'M. Pago / Transf.', icon: DollarSign },
                                            { id: 'usd', label: 'Dólares', sub: 'Efectivo / Zelle / Wire', icon: MapPin },
                                        ].map((method) => (
                                            <button
                                                key={method.id}
                                                onClick={() => setPaymentMethod(method.label)}
                                                className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-left group ${paymentMethod === method.label ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20 shadow-sm' : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200/50 dark:border-white/5 hover:border-primary/20'}`}
                                            >
                                                <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all ${paymentMethod === method.label ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-muted-foreground border border-slate-200/50 dark:border-white/5'}`}>
                                                    <method.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black uppercase tracking-tight text-[10px] sm:text-[11px] leading-tight mb-1">{method.label}</p>
                                                    <p className="text-[8px] sm:text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{method.sub}</p>
                                                </div>
                                                {paymentMethod === method.label && (
                                                    <CheckCircle2 className="h-5 w-5 sm:h-5 sm:w-5 text-primary" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: CALENDAR (4/12) */}
                            <div className="lg:col-span-4 space-y-4 sm:space-y-5">
                                <div className="bg-white dark:bg-slate-900/80 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/50 dark:border-white/5 backdrop-blur-sm flex flex-col items-center">
                                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-primary mb-5 sm:mb-6 w-full text-center flex items-center justify-center gap-2">
                                        <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Calendario de Reserva
                                    </h3>
                                    <Calendar
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={1}
                                        locale={es}
                                        className="pointer-events-auto scale-95 sm:scale-100"
                                    />

                                    <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 w-full border-t border-slate-100 dark:border-white/5 space-y-3 sm:space-y-4">
                                        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Inicio</span>
                                                <span className="text-[10px] sm:text-[11px] font-black uppercase italic tracking-tighter">
                                                    {dateRange?.from ? format(dateRange.from, "dd MMM yyyy", { locale: es }) : "SELECCIONE"}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                                            <div className="flex flex-col text-right">
                                                <span className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Entrega</span>
                                                <span className="text-[10px] sm:text-[11px] font-black uppercase italic tracking-tighter">
                                                    {dateRange?.to ? format(dateRange.to, "dd MMM yyyy", { locale: es }) : "SELECCIONE"}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center opacity-60">
                                            Selecciona el rango de fechas en el calendario
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. FOOTER - FULLY RESPONSIVE ACTION BAR */}
                    <div className="px-4 sm:px-8 py-5 sm:py-6 border-t border-slate-200/50 dark:border-white/5 bg-gradient-to-r from-white via-slate-50/50 to-white dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                            className="w-full sm:w-fit px-6 sm:px-8 h-12 sm:h-12 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-muted-foreground border border-slate-200/50 dark:border-white/5"
                        >
                            ← Cancelar
                        </Button>
                        <Button
                            onClick={handleWhatsAppSubmit}
                            className="w-full sm:w-[420px] h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#25D366] to-[#20ba5a] hover:from-[#20ba5a] hover:to-[#1da851] text-white font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30 flex items-center justify-center gap-3 sm:gap-4 border border-emerald-600/20"
                        >
                            <span>Confirmar por WhatsApp</span>
                            <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="" className="h-5 w-5 sm:h-6 sm:w-6 invert brightness-0" />
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    )
}
