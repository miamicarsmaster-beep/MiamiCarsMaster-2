"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
    Car,
    Calendar as CalendarIcon,
    Clock,
    User,
    TrendingUp,
    AlertCircle,
    ChevronRight,
    MapPin,
    BadgeDollarSign
} from "lucide-react"
import { es } from "date-fns/locale"
import { isWithinInterval, parseISO, startOfDay, format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Rental {
    id: string
    vehicle_id: string
    customer_name: string
    start_date: string
    end_date: string
    total_amount: number
    status: string
    platform: string
    vehicle?: {
        make: string
        model: string
        license_plate: string
        image_url: string | null
    }
}

export default function InvestorRentalsPage() {
    const [rentals, setRentals] = useState<Rental[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

    const supabase = createClient()

    useEffect(() => {
        loadRentals()
    }, [])

    const loadRentals = async () => {
        try {
            setIsLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get investor's vehicles first
            const { data: vehicles } = await supabase
                .from("vehicles")
                .select("id")
                .eq("assigned_investor_id", user.id)

            const vehicleIds = vehicles?.map(v => v.id) || []

            if (vehicleIds.length === 0) {
                setRentals([])
                return
            }

            // Get rentals for those vehicles
            const { data, error } = await supabase
                .from("rentals")
                .select(`
                    *,
                    vehicle:vehicles(make, model, license_plate, image_url)
                `)
                .in("vehicle_id", vehicleIds)
                .order("start_date", { ascending: false })

            if (error) throw error
            setRentals(data || [])
        } catch (error) {
            console.error("Error loading rentals:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const activeRentals = rentals.filter(r => {
        const today = startOfDay(new Date())
        const start = startOfDay(parseISO(r.start_date))
        const end = startOfDay(parseISO(r.end_date))
        return today >= start && today <= end
    })

    const upcomingRentals = rentals.filter(r => {
        const today = startOfDay(new Date())
        const start = startOfDay(parseISO(r.start_date))
        return start > today
    })

    const selectedDateRentals = selectedDate ? rentals.filter(r => {
        const date = startOfDay(selectedDate)
        const start = startOfDay(parseISO(r.start_date))
        const end = startOfDay(parseISO(r.end_date))
        return date >= start && date <= end
    }) : []

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-2">
                    Mi <span className="text-primary">Flota Operativa</span>
                </h1>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Calendario de alquileres y gestión de reservas en tiempo real</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-emerald-500/30 transition-all shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-all">
                            <TrendingUp className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">En Curso</p>
                            <p className="text-3xl font-black italic tracking-tighter">{activeRentals.length}<span className="text-sm font-bold text-muted-foreground not-italic ml-1">autos</span></p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-blue-500/30 transition-all shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-all">
                            <CalendarIcon className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Reservas</p>
                            <p className="text-3xl font-black italic tracking-tighter">{upcomingRentals.length}<span className="text-sm font-bold text-muted-foreground not-italic ml-1">próximas</span></p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2rem] p-6 group hover:border-orange-500/30 transition-all shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-all">
                            <BadgeDollarSign className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Ingresos Proyectados</p>
                            <p className="text-3xl font-black italic tracking-tighter">${rentals.filter(r => parseISO(r.start_date) >= new Date()).reduce((sum, r) => sum + r.total_amount, 0).toLocaleString()}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Global Calendar */}
                <div className="lg:col-span-12 xl:col-span-8">
                    <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative min-h-[600px]">
                        <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 -mr-20 -mt-20 rounded-full blur-3xl" />

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                                <CalendarIcon className="h-6 w-6 text-primary" />
                                Calendario de <span className="text-primary">Ocupación</span>
                            </h3>

                            <div className="flex items-center gap-6 p-4 bg-muted/40 rounded-2xl border border-border/50">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 opacity-80">Renta Activa</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 opacity-50" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reserva Próxima</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="bg-slate-50/50 dark:bg-slate-900/20 p-6 md:p-8 rounded-[2.5rem] border border-border/40 shadow-inner flex items-center justify-center">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    locale={es}
                                    className="p-0"
                                    classNames={{
                                        months: "w-full",
                                        month: "w-full space-y-6",
                                        month_caption: "flex justify-center pt-1 relative items-center mb-4",
                                        caption_label: "text-sm font-black uppercase tracking-[0.2em] italic",
                                        nav: "space-x-1 flex items-center",
                                        button_previous: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                                        button_next: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                                        table: "w-full border-collapse",
                                        weekdays: "flex justify-between mb-4",
                                        weekday: "text-muted-foreground w-10 font-black uppercase text-xs tracking-widest text-center",
                                        week: "flex w-full justify-between mt-2",
                                        day: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 flex items-center justify-center",
                                        day_button: cn(
                                            "h-9 w-9 p-0 font-bold aria-selected:opacity-100 rounded-xl transition-all duration-300 hover:bg-primary/10",
                                            "flex items-center justify-center text-[11px]"
                                        ),
                                        today: "bg-primary/10 text-primary font-black border border-primary/20",
                                        selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white shadow-lg shadow-primary/30 scale-110",
                                        outside: "text-muted-foreground/20 opacity-50",
                                        disabled: "text-muted-foreground opacity-50",
                                        hidden: "invisible",
                                    }}
                                    modifiers={{
                                        rented: (date) => rentals.some(rental =>
                                            isWithinInterval(startOfDay(date), {
                                                start: startOfDay(parseISO(rental.start_date)),
                                                end: startOfDay(parseISO(rental.end_date))
                                            })
                                        ),
                                        active: (date) => activeRentals.some(rental =>
                                            isWithinInterval(startOfDay(date), {
                                                start: startOfDay(parseISO(rental.start_date)),
                                                end: startOfDay(parseISO(rental.end_date))
                                            })
                                        )
                                    }}
                                    modifiersClassNames={{
                                        rented: "bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-sm",
                                        active: "bg-emerald-500 text-white font-black shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105"
                                    }}
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-border/30 pb-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Eventos del {selectedDate ? format(selectedDate, 'dd MMMM', { locale: es }) : 'Día Selectionada'}</h4>
                                    <Badge className="bg-primary/10 text-primary border-0 rounded-lg font-black text-xs tracking-widest">{selectedDateRentals.length}</Badge>
                                </div>

                                {selectedDateRentals.length > 0 ? (
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedDateRentals.map((rental) => (
                                            <div key={rental.id} className="p-5 bg-white dark:bg-slate-800/40 border border-border/50 rounded-2xl hover:border-primary/30 transition-all group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-blue-500" />
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="h-10 w-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                                                        <Car className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black italic tracking-tighter uppercase text-sm group-hover:text-primary transition-colors">
                                                            {rental.vehicle?.make} {rental.vehicle?.model}
                                                        </h5>
                                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{rental.vehicle?.license_plate}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5 opacity-60"><User className="h-3 w-3" /> {rental.customer_name}</span>
                                                    <span className="text-emerald-500 italic">${rental.total_amount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                                        <AlertCircle className="h-12 w-12 mb-4" />
                                        <p className="text-xs font-bold uppercase tracking-[0.2em]">Disponibilidad Total</p>
                                        <p className="text-[8px] font-bold uppercase tracking-[0.1em] mt-1">No hay rentas operativas para este día</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar: Upcoming List & Quick Actions */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                    <Card className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-8 shadow-2xl">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3 mb-6">
                            <Clock className="h-6 w-6 text-blue-500" />
                            Feed Operativo <span className="text-primary">Reciente</span>
                        </h3>

                        <div className="space-y-4">
                            {rentals.slice(0, 5).map(rental => (
                                <div key={rental.id} className="flex gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all group">
                                    <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                        {rental.vehicle?.image_url ? (
                                            <img src={rental.vehicle.image_url} alt="Vehicle" className="object-cover w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                                                <Car className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h5 className="font-bold text-xs uppercase truncate group-hover:text-primary transition-colors">{rental.customer_name}</h5>
                                            <span className="text-xs font-black italic tracking-tighter text-emerald-500">${rental.total_amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{rental.vehicle?.make} {rental.vehicle?.model?.split(' ')[0]}</p>
                                            <span className="text-[8px] font-bold tracking-tight opacity-40">{format(parseISO(rental.start_date), 'dd/MM/yy')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button variant="ghost" className="w-full rounded-xl font-black uppercase text-xs tracking-[0.2em] text-muted-foreground hover:text-primary hover:bg-primary/5">
                                Ver Todo el Historial <ChevronRight className="h-3 w-3 ml-2" />
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-primary/10 border-primary/20 rounded-[2.5rem] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 h-40 w-40 bg-primary/20 -mr-20 -mt-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        <h4 className="text-lg font-black uppercase italic tracking-tighter mb-4 text-primary">Status de Negocio</h4>
                        <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">
                            Tu flota tiene una ocupación del <span className="text-primary font-black">{(activeRentals.length / (rentals.length || 1) * 100).toFixed(0)}%</span> en los últimos 30 días.
                        </p>
                        <Button className="w-full rounded-2xl h-12 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 bg-primary text-white hover:scale-105 active:scale-95 transition-all">
                            Optimizar Tarifas
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    )
}
