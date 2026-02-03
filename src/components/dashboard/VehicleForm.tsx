"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Upload } from "lucide-react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Profile } from "@/types/database"

interface VehicleFormProps {
    investors: Profile[]
}

export function VehicleForm({ investors }: VehicleFormProps) {
    const form = useFormContext()
    const [isLoading, setIsLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState("")
    const supabase = createClient()

    const generatePlaceholderImage = (make: string, model: string) => {
        const carName = `${make} ${model}`.replace(/\s+/g, '+')
        return `https://source.unsplash.com/800x600/?${carName},car`
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen debe ser menor a 5MB')
            return
        }

        setIsLoading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `vehicles/${fileName}`

            const { error } = await supabase.storage
                .from('vehicle-images')
                .upload(filePath, file, { cacheControl: '3600', upsert: false })

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('vehicle-images')
                .getPublicUrl(filePath)

            form.setValue("image_url", publicUrl, { shouldDirty: true })
            setPreviewUrl(publicUrl)
            toast.success("Imagen subida correctamente")
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Error al subir imagen')
        } finally {
            setIsLoading(false)
        }
    }

    const currentImageUrl = previewUrl || form.watch("image_url")

    return (
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            {/* Image Upload Section */}
            <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel>Imagen del Vehículo</FormLabel>
                        <div className="flex gap-2">
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                    className="bg-white/5 border-border/50 focus:border-primary/50 transition-all font-medium"
                                    onChange={(e) => {
                                        field.onChange(e);
                                        setPreviewUrl(e.target.value);
                                    }}
                                />
                            </FormControl>
                            <div className="relative">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleUpload}
                                    disabled={isLoading}
                                />
                                <Button type="button" variant="outline" size="icon" disabled={isLoading}>
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <FormMessage />
                        {(currentImageUrl || field.value) && (
                            <div className="mt-2 rounded-lg overflow-hidden border relative h-48 w-full">
                                <ImageWithFallback
                                    src={currentImageUrl || generatePlaceholderImage(form.watch("make") || "Car", form.watch("model") || "Vehicle")}
                                    fallbackSrc={generatePlaceholderImage("Car", "Vehicle")}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Marca *</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Toyota" className="bg-white/5 border-border/60 focus:bg-white/10 transition-all" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Modelo *</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Corolla" className="bg-white/5 border-border/60 focus:bg-white/10 transition-all" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Año *</FormLabel>
                            <FormControl>
                                <Input {...field} type="number" className="bg-white/5 border-border/60 focus:bg-white/10 transition-all" onChange={e => field.onChange(e.target.valueAsNumber)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="license_plate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Placa</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="ABC-123" className="bg-white/5 border-border/60 focus:bg-white/10 transition-all" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/70">VIN</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="VIN..." className="bg-white/5 border-border/60 focus:bg-white/10 transition-all" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Estado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent position="popper">
                                    <SelectItem value="available">Disponible</SelectItem>
                                    <SelectItem value="rented">Alquilado</SelectItem>
                                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="assigned_investor_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Inversor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin asignar" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent position="popper">
                                    <SelectItem value="none">Sin asignar</SelectItem>
                                    {investors.map((inv) => (
                                        <SelectItem key={inv.id} value={inv.id}>
                                            {inv.full_name || inv.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="purchase_price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Precio Compra ($)</FormLabel>
                            <FormControl>
                                <Input {...field} value={field.value ?? ""} type="number" className="bg-white/5 border-border/60 focus:bg-white/10 transition-all" onChange={e => field.onChange(e.target.valueAsNumber || null)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Millaje</FormLabel>
                            <FormControl>
                                <Input {...field} value={field.value ?? ""} type="number" className="bg-white/5 border-border/60 focus:bg-white/10 transition-all" onChange={e => field.onChange(e.target.valueAsNumber)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Ubicación</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="Miami..." className="bg-white/5 border-border/60 focus:bg-white/10 transition-all" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}
