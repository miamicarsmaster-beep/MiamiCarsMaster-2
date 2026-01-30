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
                .select()
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
        <div className="space-y-6 relative">
            {isPending && (
                <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                    <div className="flex gap-1">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Flota de Vehículos</h3>
                    <p className="text-sm text-muted-foreground">{vehicles.length} vehículos en total</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" /> Agregar Vehículo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Agregar Nuevo Vehículo</DialogTitle>
                            <DialogDescription>
                                Completa la información del vehículo a agregar a la flota.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <div className="contents">
                                <VehicleForm investors={investors} />
                                <DialogFooter className="mt-4">
                                    <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {vehicles.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                        <div className="bg-primary/10 p-6 rounded-full mb-4 ring-1 ring-primary/20">
                            <Car className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">No hay vehículos registrados</h3>
                        <p className="max-w-sm mx-auto text-sm">Gestiona tu flota agregando tu primer vehículo. Podrás realizar seguimiento de mantenimiento y alquileres.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map((vehicle) => (
                        <VehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            onDelete={handleDelete}
                            onManage={(v) => {
                                setAdminVehicle(v)
                                setShowAdminPanel(true)
                            }}
                        />
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
