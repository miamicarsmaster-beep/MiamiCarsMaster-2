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
import { createVehicleAction, deleteVehicleAction } from "@/app/actions/vehicles"

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
    expected_occupancy_days: z.coerce.number().min(0).max(365).optional().default(240),
    management_fee_percent: z.coerce.number().min(0).max(100).optional().default(20),
    management_fee_type: z.enum(["percentage", "fixed"]).optional().default("percentage"),
    management_fee_fixed_amount: z.coerce.number().min(0).optional().default(0),
    apply_management_fee: z.boolean().optional().default(true),
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
            expected_occupancy_days: 240,
            management_fee_percent: 20,
            management_fee_type: "percentage",
            management_fee_fixed_amount: 0,
            apply_management_fee: true,
        },
    })

    const resetForm = () => {
        form.reset()
    }

    const onSubmit = async (values: VehicleFormValues) => {
        try {
            const payload = {
                ...values,
                year: Number(values.year),
                purchase_price: values.purchase_price ? Number(values.purchase_price) : null,
                mileage: Number(values.mileage),
                daily_rental_price: values.daily_rental_price ? Number(values.daily_rental_price) : null,
                assigned_investor_id: values.assigned_investor_id === "none" ? null : (values.assigned_investor_id || null),
                license_plate: values.license_plate?.trim() || null,
                vin: values.vin?.trim() || null,
                // Keep as-is; server action handles null fallback
                image_url: values.image_url?.trim() || null,
                expected_occupancy_days: Number(values.expected_occupancy_days) || 240,
                management_fee_percent: Number(values.management_fee_percent) || 20,
                management_fee_type: values.management_fee_type || 'percentage',
                management_fee_fixed_amount: Number(values.management_fee_fixed_amount) || 0,
                apply_management_fee: values.apply_management_fee ?? true,
            }

            const { success, data, error } = await createVehicleAction(payload)

            if (error) throw new Error(error)
            if (!success || !data) throw new Error("No se pudo obtener la respuesta del servidor")

            setVehicles([data as Vehicle, ...vehicles])
            setIsAddOpen(false)
            resetForm()
            toast.success("Vehículo agregado correctamente")
            startTransition(() => {
                router.refresh()
            })
        } catch (error: any) {
            console.error("Error adding vehicle:", error)
            toast.error(`Error al agregar vehículo: ${error.message || 'Error desconocido'}`)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este vehículo?")) return

        try {
            const { success, error } = await deleteVehicleAction(id)

            if (error) throw new Error(error)
            if (!success) throw new Error("No se pudo confirmar la eliminación")

            setVehicles(vehicles.filter(v => v.id !== id))
            toast.success("Vehículo eliminado")
            startTransition(() => {
                router.refresh()
            })
        } catch (error: any) {
            console.error("Error deleting vehicle:", error)
            toast.error(`Error al eliminar vehículo: ${error.message || 'Error desconocido'}`)
        }
    }

    return (
        <div className="space-y-10 relative">
            {isPending && (
                <div className="absolute inset-0 z-50 bg-background/40 backdrop-blur-xl flex items-center justify-center rounded-3xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-2">
                            <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-3 w-3 bg-primary rounded-full animate-bounce"></div>
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-primary animate-pulse">Sincronizando</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-2">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-black italic tracking-tight uppercase text-foreground">Activos <span className="text-primary">Operativos</span></h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{vehicles.length} Unidades en inventario</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={resetForm}
                            size="lg"
                            className="h-12 w-full sm:w-auto px-6 rounded-xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20"
                        >
                            <Plus className="mr-2 h-5 w-5" /> Agregar vehículo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border shadow-2xl max-w-2xl max-h-[90vh] rounded-[3rem] p-0 overflow-y-auto">
                        <div className="p-8 pb-0">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tight text-foreground">Registro de <span className="text-primary">Nueva Unidad</span></DialogTitle>
                                <DialogDescription className="text-sm font-bold uppercase tracking-widest opacity-60 text-muted-foreground">
                                    Introducir especificaciones técnicas y financieras
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="px-8 pb-4">
                            <Form {...form}>
                                <div className="space-y-6 pt-6">
                                    <VehicleForm investors={investors} />
                                </div>
                            </Form>
                        </div>
                        <DialogFooter className="mt-4 gap-3 sm:gap-0 border-t border-border pt-6 px-8 pb-8 sticky bottom-0 bg-card">
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
