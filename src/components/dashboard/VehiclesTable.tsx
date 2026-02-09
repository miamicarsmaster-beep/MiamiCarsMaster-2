"use client"

import { useState, useTransition } from "react"
import { Vehicle, Profile } from "@/types/database"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
    Form,
} from "@/components/ui/form"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Car } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { VehicleAdminPanel } from "./VehicleAdminPanel"
import { VehicleCard } from "./VehicleCard"
import { VehicleForm } from "./VehicleForm"

const vehicleSchema = z.object({
    make: z.string().min(1, "La marca es requerida"),
    model: z.string().min(1, "El modelo es requerido"),
    year: z.coerce.number().min(1900, "Año inválido").max(new Date().getFullYear() + 1, "Año futuro no permitido"),
    license_plate: z.string().optional(),
    vin: z.string().optional(),
    status: z.enum(["available", "rented", "maintenance", "inactive"]),
    assigned_investor_id: z.string().optional().nullable(),
    purchase_price: z.coerce.number().optional().nullable(),
    mileage: z.coerce.number().min(0).default(0),
    location: z.string().optional(),
    image_url: z.string().optional(),
    daily_rental_price: z.coerce.number().optional().nullable(),
    seats: z.coerce.number().min(1).optional().nullable(),
    transmission: z.string().optional(),
    fuel_type: z.string().optional(),
    range: z.coerce.number().min(0).optional().nullable(),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

interface VehiclesGridProps {
    vehicles: Vehicle[]
    investors: Profile[]
}

export function VehiclesGrid({ vehicles: initialVehicles, investors }: VehiclesGridProps) {
    const [vehicles, setVehicles] = useState(initialVehicles)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [showAdminPanel, setShowAdminPanel] = useState(false)
    const [adminVehicle, setAdminVehicle] = useState<Vehicle | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const supabase = createClient()

    const form = useForm<VehicleFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(vehicleSchema) as any,
        defaultValues: {
            make: "",
            model: "",
            year: new Date().getFullYear(),
            license_plate: "",
            vin: "",
            status: "available",
            assigned_investor_id: "",
            purchase_price: 0,
            mileage: 0,
            location: "",
            image_url: "",
            daily_rental_price: 0,
        },
    })

    const resetForm = () => {
        form.reset()
    }

    const onSubmit = async (values: VehicleFormValues) => {
        // setIsLoading(true) - Removed
        try {
            const carName = `${values.make} ${values.model}`.replace(/\s+/g, '+')
            const placeholderUrl = `https://source.unsplash.com/800x600/?${carName},car`
            const finalImageUrl = values.image_url || placeholderUrl

            const payload = {
                ...values,
                year: Number(values.year),
                purchase_price: values.purchase_price ? Number(values.purchase_price) : null,
                mileage: Number(values.mileage),
                daily_rental_price: values.daily_rental_price ? Number(values.daily_rental_price) : null,
                assigned_investor_id: values.assigned_investor_id === "none" ? null : (values.assigned_investor_id || null),
                image_url: finalImageUrl,
            }

            const { data, error } = await supabase
                .from("vehicles")
                .insert([payload])
                .select(`
                    *,
                    assigned_investor:profiles!assigned_investor_id(id, full_name, email)
                `)
                .single()

            if (error) throw error

            setVehicles([data, ...vehicles])
            setIsAddOpen(false)
            resetForm()
            toast.success("Vehículo agregado correctamente")
            startTransition(() => {
                router.refresh()
            })
        } catch (error) {
            console.error("Error adding vehicle:", error)
            toast.error("Error al agregar vehículo")
        } finally {
            // setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este vehículo?")) return

        // setIsLoading(true)
        try {
            const { error } = await supabase
                .from("vehicles")
                .delete()
                .eq("id", id)

            if (error) throw error

            setVehicles(vehicles.filter(v => v.id !== id))
            toast.success("Vehículo eliminado")
            startTransition(() => {
                router.refresh()
            })
        } catch (error) {
            console.error("Error deleting vehicle:", error)
            toast.error("Error al eliminar vehículo")
        } finally {
            // setIsLoading(false)
        }
    }

    return (
        <div className="space-y-10 relative">
            {isPending && (
                <div className="absolute inset-0 z-50 bg-background/40 backdrop-blur-xl flex items-center justify-center rounded-3xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-2">
                            <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_15px_oklch(0.8_0.18_185)]"></div>
                            <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_15px_oklch(0.8_0.18_185)]"></div>
                            <div className="h-3 w-3 bg-primary rounded-full animate-bounce shadow-[0_0_15px_oklch(0.8_0.18_185)]"></div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Sincronizando</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-2">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-black italic tracking-tight uppercase">Activos <span className="text-primary">Operativos</span></h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{vehicles.length} Unidades en inventario</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={resetForm}
                            size="lg"
                            className="h-12 w-full sm:w-auto px-6 rounded-xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20"
                        >
                            <Plus className="mr-2 h-5 w-5" /> Adquirir Unidad
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-slate-900/95 backdrop-blur-2xl border-border/40 shadow-2xl max-w-2xl max-h-[90vh] rounded-[3rem]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tight">Registro de <span className="text-primary">Nueva Unidad</span></DialogTitle>
                            <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
                                Introducir especificaciones técnicas y financieras
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <div className="contents">
                                <VehicleForm investors={investors} />
                                <DialogFooter className="mt-8 gap-3 sm:gap-0">
                                    <Button variant="ghost" type="button" onClick={() => setIsAddOpen(false)} className="rounded-xl font-bold uppercase text-xs tracking-widest">
                                        Abortar
                                    </Button>
                                    <Button
                                        onClick={form.handleSubmit(onSubmit)}
                                        disabled={form.formState.isSubmitting}
                                        className="px-8 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
                                    >
                                        {form.formState.isSubmitting ? "Formalizando..." : "Registrar Activo"}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {vehicles.length === 0 ? (
                <div className="glass-card p-24 text-center flex flex-col items-center justify-center border-dashed border-primary/20 bg-primary/2 group hover:bg-primary/5 transition-all">
                    <div className="bg-primary/10 p-8 rounded-3xl mb-8 group-hover:scale-110 transition-transform shadow-inner">
                        <Car className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Inventario Vacío</h3>
                    <p className="max-w-md mx-auto text-sm text-muted-foreground font-medium mb-10 leading-relaxed">No se han detectado activos vinculados a tu organización. Comienza expandiendo tu flota para habilitar las herramientas de gestión.</p>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="h-12 px-10 rounded-xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20"
                    >
                        Iniciar Adquisición
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${vehicles.indexOf(vehicle) * 50}ms` }}>
                            <VehicleCard
                                vehicle={vehicle}
                                onDelete={handleDelete}
                                onUpdate={(updatedVehicle) => {
                                    setVehicles(vehicles.map(v =>
                                        v.id === updatedVehicle.id ? updatedVehicle : v
                                    ))
                                }}
                                onManage={(v) => {
                                    setAdminVehicle(v)
                                    setShowAdminPanel(true)
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Vehicle Admin Panel - Unified View/Edit */}
            {showAdminPanel && adminVehicle && (
                <VehicleAdminPanel
                    vehicle={adminVehicle}
                    investors={investors}
                    onClose={() => {
                        setShowAdminPanel(false)
                        setAdminVehicle(null)
                        router.refresh()
                    }}
                    onUpdate={(updatedVehicle) => {
                        setVehicles(vehicles.map(v =>
                            v.id === updatedVehicle.id ? updatedVehicle : v
                        ))
                        setAdminVehicle(updatedVehicle)
                    }}
                    onDelete={(vehicleId) => {
                        setVehicles(vehicles.filter(v => v.id !== vehicleId))
                        setShowAdminPanel(false)
                        setAdminVehicle(null)
                    }}
                />
            )}
        </div>
    )
}
