"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import {
    Clock,
    Wrench,
    Calendar,
    FileText,
    TrendingUp,
    ChevronRight,
    AlertCircle
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ActivityItem {
    id: string
    type: 'maintenance' | 'rental' | 'document' | 'finance'
    title: string
    subtitle: string
    date: string
    vehicle_info: string
    status?: string
}

export function ActivityFeed({ investorId }: { investorId: string }) {
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setIsLoading(true)

                // Get investor's vehicles
                const { data: vehicles } = await supabase
                    .from('vehicles')
                    .select('id, make, model')
                    .eq('assigned_investor_id', investorId)

                const vehicleIds = vehicles?.map(v => v.id) || []
                if (vehicleIds.length === 0) {
                    setActivities([])
                    return
                }

                // Fetch recent maintenance
                const { data: maintenance } = await supabase
                    .from('maintenances')
                    .select('*, vehicle:vehicles(make, model)')
                    .in('vehicle_id', vehicleIds)
                    .order('date', { ascending: false })
                    .limit(5)

                // Fetch recent rentals
                const { data: rentals } = await supabase
                    .from('rentals')
                    .select('*, vehicle:vehicles(make, model)')
                    .in('vehicle_id', vehicleIds)
                    .order('created_at', { ascending: false })
                    .limit(5)

                // Fetch recent documents
                const { data: docs } = await supabase
                    .from('documents')
                    .select('*, vehicle:vehicles(make, model)')
                    .in('vehicle_id', vehicleIds)
                    .order('created_at', { ascending: false })
                    .limit(5)

                // Combine and format
                const combined: ActivityItem[] = [
                    ...(maintenance || []).map(m => ({
                        id: `m-${m.id}`,
                        type: 'maintenance' as const,
                        title: `Mantenimiento: ${m.service_type}`,
                        subtitle: m.notes || 'Servicio registrado',
                        date: m.date,
                        vehicle_info: `${m.vehicle?.make} ${m.vehicle?.model}`,
                        status: m.status
                    })),
                    ...(rentals || []).map(r => ({
                        id: `r-${r.id}`,
                        type: 'rental' as const,
                        title: `Nuevo Alquiler: ${r.customer_name}`,
                        subtitle: `${r.platform} - $${r.total_amount}`,
                        date: r.created_at,
                        vehicle_info: `${r.vehicle?.make} ${r.vehicle?.model}`,
                        status: r.status
                    })),
                    ...(docs || []).map(d => ({
                        id: `d-${d.id}`,
                        type: 'document' as const,
                        title: `Documento: ${d.title}`,
                        subtitle: d.category || 'Archivo subido',
                        date: d.created_at,
                        vehicle_info: d.vehicle ? `${d.vehicle.make} ${d.vehicle.model}` : 'Documento General',
                        status: 'uploaded'
                    }))
                ]

                // Sort by date newest first
                setActivities(combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8))
            } catch (error) {
                console.error('Error fetching activity feed:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchActivities()
    }, [investorId, supabase])

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Clock className="h-8 w-8 text-primary opacity-50" />
                </div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sin Novedades</h4>
                <p className="text-xs font-medium text-muted-foreground/60 mt-2 uppercase tracking-wide">No hay actividad reciente en tu flota</p>
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 via-border/50 to-transparent" />

            <div className="space-y-6">
                {activities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative flex gap-6 pl-2"
                    >
                        <div className={cn(
                            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-white dark:border-slate-900 shadow-xl transition-all duration-300",
                            activity.type === 'maintenance' ? "bg-orange-500 text-white" :
                                activity.type === 'rental' ? "bg-emerald-500 text-white" :
                                    activity.type === 'document' ? "bg-blue-500 text-white" : "bg-slate-500 text-white"
                        )}>
                            {activity.type === 'maintenance' && <Wrench className="h-5 w-5" />}
                            {activity.type === 'rental' && <Calendar className="h-5 w-5" />}
                            {activity.type === 'document' && <FileText className="h-5 w-5" />}
                            {activity.type === 'finance' && <TrendingUp className="h-5 w-5" />}
                        </div>

                        <div className="flex flex-1 flex-col pb-6 border-b border-border/10 last:border-0 pt-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black uppercase tracking-widest text-primary italic">
                                    {activity.vehicle_info}
                                </span>
                                <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: es })}
                                </span>
                            </div>
                            <h5 className="text-sm font-black uppercase italic tracking-tighter leading-tight group-hover:text-primary transition-colors">
                                {activity.title}
                            </h5>
                            <p className="text-xs font-medium text-muted-foreground mt-1 line-clamp-1 opacity-70">
                                {activity.subtitle}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <button className="w-full mt-6 py-4 rounded-2xl border border-dashed border-border/50 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2">
                Ver Todo el Historial
                <ChevronRight className="h-3 w-3" />
            </button>
        </div>
    )
}
