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
    MapPin
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
        return days * selectedVehicle.daily_rental_price
    }

    const handleWhatsAppSubmit = () => {
        if (!selectedVehicle || !name || !phone || !dateRange?.from || !dateRange?.to) {
            alert("Por favor completa todos los campos requeridos.")
            return
        }

        const total = calculateTotal()
        const startStr = format(dateRange.from, "PPP", { locale: es })
        const endStr = format(dateRange.to, "PPP", { locale: es })

        const message = `Hola Me interesa este auto ${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.year}) para alquilar.

*DATOS DEL CLIENTE:*
• Nombre: ${name}
• Email: ${email || 'No proporcionado'}
• Teléfono: ${phone}

*DATOS DE ALQUILER:*
• Servicio Aeropuerto: ${needsAirport ? 'SÍ' : 'NO'}
• Fechas: del ${startStr} al ${endStr}

*COTIZACIÓN:*
• Valor estimado: $${total.toLocaleString()}`

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
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                                                <Gauge className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-sm font-black italic tracking-tight uppercase opacity-70">
                                                {vehicle.mileage?.toLocaleString()} MI
                                            </span>
                                        </div>
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
                <DialogContent className="max-w-[96vw] lg:max-w-[1450px] p-0 overflow-hidden border-none rounded-[4rem] bg-white dark:bg-slate-950 shadow-[0_0_150px_rgba(0,0,0,0.6)] flex flex-col max-h-[96vh]">

                    {/* 1. HEADER - CLEAN & WIDE */}
                    <div className="px-16 py-12 border-b border-slate-100 dark:border-primary/10 flex justify-between items-center bg-white dark:bg-slate-950 relative z-30">
                        <div className="space-y-2">
                            <div className="flex items-center gap-6">
                                <div className="h-2.5 w-24 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary),0.6)]" />
                                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none">
                                    Checkout <span className="text-primary italic">Premium</span>
                                </h2>
                            </div>
                            <p className="text-[13px] font-black text-muted-foreground uppercase tracking-[0.7em] pl-32">
                                Miami Luxury Experience • Reserva Final
                            </p>
                        </div>
                    </div>

                    {/* 2. BODY - 3 DISTINCT COLUMNS (NO OVERLAPS) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-16 lg:p-20 bg-slate-50/30 dark:bg-slate-900/10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-20 items-start">

                            {/* COL 1: VEHICLE & TOTAL (3/12) */}
                            <div className="lg:col-span-3 space-y-12">
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-8 w-1.5 bg-primary rounded-full" />
                                            <h3 className="text-xl font-black uppercase tracking-tight">Vehículo <span className="text-primary italic">Activo</span></h3>
                                        </div>
                                        <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-primary/20">
                                            <img
                                                src={selectedVehicle?.image_url || ""}
                                                alt={selectedVehicle?.model}
                                                className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                                            <div className="absolute bottom-6 left-6">
                                                <p className="text-white font-black italic text-xl uppercase tracking-tighter leading-none">
                                                    {selectedVehicle?.make} {selectedVehicle?.model}
                                                </p>
                                                <p className="text-primary/80 font-bold text-[10px] uppercase tracking-widest mt-1">Modelo {selectedVehicle?.year}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-10 rounded-[3rem] bg-slate-950 text-white relative overflow-hidden shadow-2xl border border-primary/20">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                                        <div className="relative z-10 space-y-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Inversión Total</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-5xl font-black italic tracking-tighter text-glow-primary">
                                                        ${calculateTotal().toLocaleString()}
                                                    </span>
                                                    <span className="text-xs font-black text-white/30 uppercase tracking-widest">USD</span>
                                                </div>
                                            </div>
                                            <div className="space-y-4 pt-8 border-t border-white/10">
                                                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-white/40">
                                                    <span>Días Alquiler</span>
                                                    <span className="text-white text-sm">{dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) + 1 : 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-white/40">
                                                    <span>Base Diaria</span>
                                                    <span className="text-white text-sm">${selectedVehicle?.daily_rental_price}</span>
                                                </div>
                                                {needsAirport && (
                                                    <div className="flex justify-between items-center text-emerald-400">
                                                        <span className="text-[10px] font-black uppercase tracking-widest">VIP Airport</span>
                                                        <span className="text-sm">✓</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COL 2: PERSONAL INFO & OPTIONS (4/12) */}
                            <div className="lg:col-span-4 space-y-16">
                                <div className="space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                        <h3 className="text-xl font-black uppercase tracking-tight">Datos del <span className="text-primary italic">Titular</span></h3>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-3">Nombre Completo</Label>
                                            <div className="relative group">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="ESCRIBA SU NOMBRE"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value.toUpperCase())}
                                                    className="h-16 pl-16 rounded-3xl bg-white dark:bg-primary/5 border-slate-200 dark:border-primary/10 transition-all font-bold text-base"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-3">Whatsapp de Contacto</Label>
                                            <div className="relative group">
                                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="+1 (786) 000-0000"
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="h-16 pl-16 rounded-3xl bg-white dark:bg-primary/5 border-slate-200 dark:border-primary/10 transition-all font-bold text-base"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-3">Correo Electrónico</Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="CLIENTE@EMAIL.COM"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value.toUpperCase())}
                                                    className="h-16 pl-16 rounded-3xl bg-white dark:bg-primary/5 border-slate-200 dark:border-primary/10 transition-all font-bold text-base"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                        <h3 className="text-xl font-black uppercase tracking-tight">Opciones <span className="text-primary italic">VIP</span></h3>
                                    </div>
                                    <div
                                        onClick={() => setNeedsAirport(!needsAirport)}
                                        className={`flex items-center justify-between p-10 rounded-[3rem] border-2 transition-all cursor-pointer group/opt ${needsAirport ? 'bg-primary/5 border-primary/40 shadow-xl shadow-primary/5' : 'bg-white dark:bg-primary/5 border-slate-100 dark:border-primary/5 hover:border-primary/20'}`}
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className={`h-22 w-22 rounded-[2rem] flex items-center justify-center transition-all shadow-xl ${needsAirport ? 'bg-primary text-white scale-110 shadow-primary/30' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/10 text-primary'}`}>
                                                <Plane className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <p className="font-black uppercase tracking-tight text-xl leading-none mb-2">Servicio Aeropuerto</p>
                                                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em]">Logística directa en Terminal</p>
                                            </div>
                                        </div>
                                        <div className={`w-18 h-9 rounded-full transition-all relative flex items-center px-1 ${needsAirport ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-800'}`}>
                                            <div className={`h-7 w-7 rounded-full bg-white shadow-2xl transition-all duration-300 ${needsAirport ? 'translate-x-[36px]' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COL 3: CALENDAR (5/12) */}
                            <div className="lg:col-span-5 space-y-12">
                                <div className="space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                        <h3 className="text-xl font-black uppercase tracking-tight">Calendario de <span className="text-primary italic">Reserva</span></h3>
                                    </div>
                                    <div className="bg-white dark:bg-primary/5 rounded-[4rem] p-12 border border-slate-200 dark:border-primary/10 flex justify-center shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden ring-1 ring-slate-100 dark:ring-primary/5">
                                        <Calendar
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                            locale={es}
                                            className="pointer-events-auto scale-110 xl:scale-125 origin-center"
                                        />
                                    </div>
                                    <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Seleccione el período de inicio y entrega</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. FOOTER - ACTION BAR */}
                    <div className="px-16 py-12 border-t border-slate-100 dark:border-primary/10 bg-white dark:bg-slate-950 flex flex-col sm:flex-row gap-12 items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                            className="w-full sm:w-fit px-16 h-20 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[12px] hover:bg-slate-100 dark:hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary"
                        >
                            ← Volver a la flota
                        </Button>
                        <Button
                            onClick={handleWhatsAppSubmit}
                            className="w-full sm:w-[600px] h-26 rounded-[3rem] bg-[#25D366] hover:bg-[#20ba5a] text-white font-black uppercase tracking-[0.5em] text-[16px] shadow-[0_35px_80px_rgba(37,211,102,0.5)] transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-10"
                        >
                            Confirmar por WhatsApp
                            <div className="h-16 w-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="" className="h-10 w-10 invert brightness-0" />
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    )
}
