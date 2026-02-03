"use client"

import "@/styles/dialog-fix.css"
import { useState, useEffect } from "react"
import { Vehicle } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    Camera, Gauge, MapPin, Wrench, X, CalendarDays, CheckCircle2, Edit3, Save,
    DollarSign, Trash2, Plus, FileText, Loader2, TrendingUp, AlertCircle, Upload, Eye, ChevronLeft, ChevronRight, Activity, Image as ImageIcon
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

// Interfaces (mantener las originales)
interface VehiclePhoto {
    id: string
    vehicle_id: string
    image_url: string
    caption: string | null
    photo_order: number
    is_primary: boolean
    has_damage: boolean
    damage_markers: any[] | null
    created_at: string
}

interface MileageLog {
    id: string
    vehicle_id: string
    mileage: number
    date: string
    notes: string | null
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

interface MaintenanceRecord {
    id: string
    vehicle_id: string
    service_type: string
    cost: number | null
    date: string
    notes: string | null
    next_service_date: string | null
    next_service_mileage: number | null
    status: 'pending' | 'completed'
    receipt_images: string[] | null
    created_at: string
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

interface VehicleAdminPanelProps {
    vehicle: Vehicle
    investors?: { id: string; full_name: string | null; email: string }[]
    onClose: () => void
    onUpdate?: (vehicle: Vehicle) => void
    onDelete?: (vehicleId: string) => void
}

export function VehicleAdminPanel({ vehicle, investors = [], onClose, onUpdate, onDelete }: VehicleAdminPanelProps) {
    const [activeTab, setActiveTab] = useState("general")
    const [isEditMode, setIsEditMode] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        id: vehicle.id,
        created_at: vehicle.created_at,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        license_plate: vehicle.license_plate || "",
        vin: vehicle.vin || "",
        mileage: vehicle.mileage || 0,
        location: vehicle.location || "",
        status: vehicle.status,
        daily_rental_price: vehicle.daily_rental_price || 0,
        purchase_price: vehicle.purchase_price || 0,
        assigned_investor_id: vehicle.assigned_investor_id || "",
        image_url: vehicle.image_url || ""
    })

    // Estados para funcionalidades
    const [photos, setPhotos] = useState<VehiclePhoto[]>([])
    const [mileageHistory, setMileageHistory] = useState<MileageLog[]>([])
    const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
    const [rentalHistory, setRentalHistory] = useState<RentalRecord[]>([])
    const [documentsList, setDocumentsList] = useState<DocumentRecord[]>([])
    const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false)
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
    const [selectedPhoto, setSelectedPhoto] = useState<VehiclePhoto | null>(null)
    const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false)
    const [isRentalDialogOpen, setIsRentalDialogOpen] = useState(false)
    const [rentalForm, setRentalForm] = useState({
        customer_name: "",
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined,
        platform: "Turo",
        amount: "",
        status: "confirmed",
        notes: ""
    })
    const [isUploadingDocument, setIsUploadingDocument] = useState(false)
    const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null)
    const [isMileageDialogOpen, setIsMileageDialogOpen] = useState(false)
    const [newMileageValue, setNewMileageValue] = useState<string>("")
    const [mileageNote, setMileageNote] = useState("")

    // Maintenance State
    const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false)
    const [maintenanceForm, setMaintenanceForm] = useState({
        service_type: "",
        custom_service_type: "",
        cost: "",
        date: new Date().toISOString().split('T')[0],
        current_mileage: "",
        next_service_mileage: "",
        notes: ""
    })
    const [maintenanceReceipt, setMaintenanceReceipt] = useState<File | null>(null)



    const supabase = createClient()
    const router = useRouter()

    // Cálculos
    const roi = formData.purchase_price > 0
        ? ((formData.daily_rental_price * 240 / formData.purchase_price) * 100).toFixed(0)
        : 0

    const getStatusBadge = () => {
        const statusConfig = {
            available: { label: 'Disponible', className: 'bg-emerald-500' },
            rented: { label: 'Alquilado', className: 'bg-blue-500' },
            maintenance: { label: 'Mantenimiento', className: 'bg-orange-500' },
            inactive: { label: 'Inactivo', className: 'bg-slate-500' }
        }
        return statusConfig[formData.status as keyof typeof statusConfig] || statusConfig.available
    }

    // Handlers
    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Limpiar el objeto formData para enviar solo lo que la base de datos acepta
            const {
                id: _id,
                created_at: _ca,
                ...dataToUpdate
            } = formData;

            const updateData: any = { ...dataToUpdate };

            // Manejar el caso de "Sin asignar" para el inversor
            if (updateData.assigned_investor_id === 'none' || !updateData.assigned_investor_id) {
                updateData.assigned_investor_id = null;
            }

            const { data, error } = await supabase
                .from("vehicles")
                .update(updateData)
                .eq("id", vehicle.id)
                .select()
                .single()

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            if (onUpdate && data) onUpdate(data as Vehicle)
            setIsEditMode(false)
            toast.success("Vehículo actualizado correctamente")
            router.refresh()
        } catch (error: any) {
            console.error("Error completo:", error)
            toast.error(error.message || "Error al actualizar los datos")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("¿Eliminar vehículo permanentemente?")) return
        try {
            await supabase.from("vehicles").delete().eq("id", vehicle.id)
            if (onDelete) onDelete(vehicle.id)
            onClose()
            router.refresh()
        } catch (error) {
            console.error(error)
        }
    }

    const handleChangeHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingHeroImage(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${vehicle.id}-hero-${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('vehicle-images')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('vehicle-images')
                .getPublicUrl(fileName)

            await supabase
                .from('vehicles')
                .update({ image_url: publicUrl })
                .eq('id', vehicle.id)

            setFormData(prev => ({ ...prev, image_url: publicUrl }))
            alert("Imagen actualizada")
        } catch (error) {
            console.error(error)
            alert("Error al subir imagen")
        } finally {
            setIsUploadingHeroImage(false)
        }
    }


    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploadingPhoto(true)
        const newPhotos: VehiclePhoto[] = []
        let successCount = 0
        let failCount = 0

        try {
            toast.info(`Subiendo ${files.length} imágenes...`)

            const uploadPromises = Array.from(files).map(async (file, index) => {
                try {
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${vehicle.id}-photo-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('vehicle-images')
                        .upload(fileName, file)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                        .from('vehicle-images')
                        .getPublicUrl(fileName)

                    const { data: newPhoto, error: dbError } = await supabase
                        .from('vehicle_photos')
                        .insert({
                            vehicle_id: vehicle.id,
                            image_url: publicUrl,
                            caption: file.name.split('.')[0],
                            photo_order: photos.length + successCount + index, // Estimate order
                            is_primary: photos.length === 0 && index === 0,
                            has_damage: false,
                            damage_markers: []
                        })
                        .select()
                        .single()

                    if (dbError) throw dbError

                    newPhotos.push(newPhoto as VehiclePhoto)
                    successCount++
                } catch (error) {
                    console.error(`Error uploading ${file.name}:`, error)
                    failCount++
                }
            })

            await Promise.all(uploadPromises)

            if (successCount > 0) {
                setPhotos(prev => [...prev, ...newPhotos])
                toast.success(`${successCount} fotos subidas correctamente`)
            }
            if (failCount > 0) {
                toast.error(`${failCount} fotos no pudieron subirse`)
            }

        } catch (error) {
            console.error(error)
            toast.error("Error general al subir fotos")
        } finally {
            setIsUploadingPhoto(false)
            e.target.value = ''
        }
    }

    const handleSaveMileage = async () => {
        if (!newMileageValue) return toast.error("Ingresa el millaje")
        const mileage = parseInt(newMileageValue)
        if (isNaN(mileage)) return toast.error("Millaje inválido")
        if (mileage <= vehicle.mileage) return toast.warning("El nuevo millaje debe ser mayor al actual")

        setIsSaving(true)
        try {
            // 1. Insert into history
            const { error: historyError } = await supabase
                .from('mileage_history')
                .insert({
                    vehicle_id: vehicle.id,
                    mileage: mileage,
                    date: new Date().toISOString(),
                    notes: mileageNote || null
                })

            if (historyError) throw historyError

            // 2. Update vehicle current mileage
            const { error: updateError } = await supabase
                .from('vehicles')
                .update({ mileage: mileage })
                .eq('id', vehicle.id)

            if (updateError) throw updateError

            // Success
            toast.success("Lectura de millaje registrada")
            setFormData(prev => ({ ...prev, mileage }))
            setIsMileageDialogOpen(false)
            setNewMileageValue("")
            setMileageNote("")
            loadMileageHistory()

            if (onUpdate) {
                onUpdate({ ...vehicle, mileage })
            }

        } catch (error) {
            console.error(error)
            toast.error("Error al registrar millaje")
        } finally {
            setIsSaving(false)
        }
    }
    const handleSaveMaintenance = async () => {
        const type = maintenanceForm.service_type === "Otro" ? maintenanceForm.custom_service_type : maintenanceForm.service_type

        if (!type) return toast.error("Seleccione el tipo de servicio")
        if (!maintenanceForm.cost) return toast.error("Ingrese el costo")
        if (!maintenanceForm.current_mileage) return toast.error("Ingrese el millaje actual")

        setIsSaving(true)
        try {
            let receiptUrls: string[] = []

            // Upload receipt if exists
            if (maintenanceReceipt) {
                const fileExt = maintenanceReceipt.name.split('.').pop()
                const fileName = `${vehicle.id}-maint-${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('documents') // Usamos el bucket de documentos
                    .upload(`maintenance/${fileName}`, maintenanceReceipt)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(`maintenance/${fileName}`)

                receiptUrls = [publicUrl]
            }

            const { error } = await supabase
                .from('maintenances')
                .insert({
                    vehicle_id: vehicle.id,
                    service_type: type,
                    cost: parseFloat(maintenanceForm.cost),
                    date: maintenanceForm.date,
                    next_service_mileage: maintenanceForm.next_service_mileage ? parseInt(maintenanceForm.next_service_mileage) : null,
                    notes: `${maintenanceForm.notes || ''} \n[Millaje al servicio: ${maintenanceForm.current_mileage}]`.trim(),
                    status: 'completed',
                    receipt_images: receiptUrls.length > 0 ? receiptUrls : null
                })

            if (error) throw error

            toast.success("Mantenimiento registrado")
            setIsMaintenanceDialogOpen(false)
            setMaintenanceReceipt(null)
            setMaintenanceForm({
                service_type: "",
                custom_service_type: "",
                cost: "",
                date: new Date().toISOString().split('T')[0],
                current_mileage: vehicle.mileage.toString(), // Default to current
                next_service_mileage: "",
                notes: ""
            })
            loadMaintenanceHistory()
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar mantenimiento")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveRental = async () => {
        if (!rentalForm.start_date || !rentalForm.end_date) return toast.error("Seleccione las fechas")
        if (!rentalForm.amount) return toast.error("Ingrese el monto total")

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('rentals')
                .insert({
                    vehicle_id: vehicle.id,
                    customer_name: rentalForm.customer_name || 'Cliente',
                    start_date: rentalForm.start_date.toISOString(),
                    end_date: rentalForm.end_date.toISOString(),
                    platform: rentalForm.platform,
                    total_amount: parseFloat(rentalForm.amount),
                    status: rentalForm.status,
                    notes: rentalForm.notes
                })

            if (error) throw error

            toast.success("Reserva creada")
            setIsRentalDialogOpen(false)
            setRentalForm({
                customer_name: "",
                start_date: undefined,
                end_date: undefined,
                platform: "Turo",
                amount: "",
                status: "confirmed",
                notes: ""
            })
            loadRentalHistory()
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar reserva")
        } finally {
            setIsSaving(false)
        }
    }

    const getBookedDates = () => {
        let dates: Date[] = []
        rentalHistory.forEach(rental => {
            if (rental.status === 'cancelled') return
            try {
                // Adjust for timezone issues if necessary, usually parseISO handles strict ISO strings well
                const start = new Date(rental.start_date)
                const end = new Date(rental.end_date)
                // Add one day to end date to make it inclusive if needed or check logic
                // usually rentals are inclusive start to end
                const range = eachDayOfInterval({ start, end })
                dates = [...dates, ...range]
            } catch (e) {
                console.error("Date parsing error", e)
            }
        })
        return dates
    }

    const handleSetPrimaryPhoto = async (photoId: string) => {
        try {
            // Optimistic update
            const updatedPhotos = photos.map(p => ({
                ...p,
                is_primary: p.id === photoId
            }))
            setPhotos(updatedPhotos)

            // Update in DB (first set all to false, then one to true - or better, use a stored procedure or just update the new primary, but triggers might be needed. 
            // Simple approach: update all for this vehicle to false, then correct one to true. Or just the previous primary to false.
            // But we don't know the previous easily without state.

            // Note: A better approach usually involves a transaction or simpler logic, for now we will just update the clicked one to true.
            // But usually we want only one primary. 
            // Let's assume we just update the specific photo to be primary. 
            // Ideally backend would handle "unsetting" others.

            // For now, let's just update the local state which is what matters for UI immediately.
            // And send update to DB for this photo.

            await supabase.from('vehicle_photos').update({ is_primary: true }).eq('id', photoId)
            await supabase.from('vehicle_photos').update({ is_primary: false }).eq('vehicle_id', vehicle.id).neq('id', photoId)

            toast.success("Foto principal actualizada")
        } catch (error) {
            console.error(error)
            toast.error("Error al actualizar foto principal")
            loadPhotos() // Revert on error
        }
    }

    const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("¿Eliminar esta foto?")) return

        try {
            await supabase.from('vehicle_photos').delete().eq('id', photoId)
            setPhotos(photos.filter(p => p.id !== photoId))
            toast.success("Foto eliminada")
        } catch (error) {
            console.error(error)
            toast.error("Error al eliminar foto")
        }
    }

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploadingDocument(true)
        try {
            toast.info(`Subiendo ${files.length} documentos...`)

            for (const file of Array.from(files)) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${vehicle.id}-doc-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                // Intentar inferir el tipo basado en el nombre
                let docType = 'other'
                const nameLower = file.name.toLowerCase()
                if (nameLower.includes('title') || nameLower.includes('titulo')) docType = 'vehicle_title'
                else if (nameLower.includes('insurance') || nameLower.includes('seguro')) docType = 'insurance'
                else if (nameLower.includes('contract') || nameLower.includes('contrato')) docType = 'contract'

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, file)

                if (uploadError) {
                    console.error("Storage upload error:", uploadError)
                    throw new Error(`Error de almacenamiento: ${uploadError.message}`)
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName)

                const { error: dbError } = await supabase
                    .from('documents')
                    .insert({
                        vehicle_id: vehicle.id,
                        title: file.name.split('.')[0],
                        file_url: publicUrl,
                        type: docType,
                        category: fileExt // Guardamos la extensión para facilitar la UI
                    })

                if (dbError) {
                    console.error("Database insert error:", dbError)
                    throw new Error(`Error en base de datos: ${dbError.message} (Asegúrate de ejecutar la migración SQL)`)
                }
            }

            toast.success("Documentos subidos correctamente")
            loadDocuments()
        } catch (error: any) {
            console.error("Upload error details:", error)
            toast.error(error.message || "Error al subir documentos")
        } finally {
            setIsUploadingDocument(false)
        }
    }

    const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("¿Eliminar este documento?")) return

        try {
            await supabase.from('documents').delete().eq('id', docId)
            setDocumentsList(documentsList.filter(d => d.id !== docId))
            toast.success("Documento eliminado")
        } catch (error) {
            console.error(error)
            toast.error("Error al eliminar documento")
        }
    }

    // Load data functions
    const loadPhotos = async () => {
        const { data } = await supabase
            .from("vehicle_photos")
            .select("*")
            .eq("vehicle_id", vehicle.id)
            .order("photo_order", { ascending: true })
        setPhotos((data || []) as VehiclePhoto[])
    }

    const loadMileageHistory = async () => {
        const { data } = await supabase
            .from("mileage_history")
            .select("*")
            .eq("vehicle_id", vehicle.id)
            .order("date", { ascending: false })
        setMileageHistory(data || [])
    }

    const loadMaintenanceHistory = async () => {
        const { data } = await supabase
            .from("maintenances")
            .select("*")
            .eq("vehicle_id", vehicle.id)
            .order("date", { ascending: false })
        setMaintenanceHistory(data || [])
    }

    const loadRentalHistory = async () => {
        const { data } = await supabase
            .from("rentals")
            .select("*")
            .eq("vehicle_id", vehicle.id)
            .order("start_date", { ascending: false })
        setRentalHistory(data || [])
    }

    const loadDocuments = async () => {
        const { data } = await supabase
            .from("documents")
            .select("*")
            .eq("vehicle_id", vehicle.id)
            .order("created_at", { ascending: false })
        setDocumentsList(data || [])
    }

    useEffect(() => {
        if (activeTab === "galeria") loadPhotos()
        if (activeTab === "millaje") loadMileageHistory()
        if (activeTab === "mantenimiento") loadMaintenanceHistory()
        if (activeTab === "alquileres") loadRentalHistory()
        if (activeTab === "documentos") loadDocuments()
    }, [activeTab])

    const statusBadge = getStatusBadge()

    return (
        <>
            <div className="fixed inset-0 z-40 md:left-72 bg-slate-50 dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300 shadow-2xl">
                {/* HEADER */}
                <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {formData.year} {formData.make} {formData.model}
                            </h1>
                            <Badge className={`${statusBadge.className} text-white px-3 py-1 text-xs font-semibold uppercase`}>
                                {statusBadge.label}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditMode ? (
                                <>
                                    <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancelar</Button>
                                    <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        Guardar
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                                    <Edit3 className="h-4 w-4 mr-2" /> Editar
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[1600px] mx-auto p-8">

                        {/* HERO SECTION - 2 COLUMNAS */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

                            {/* COLUMNA IZQUIERDA - IMAGEN */}
                            <div className="lg:col-span-7 space-y-4">
                                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl group bg-slate-200">
                                    <ImageWithFallback
                                        src={formData.image_url || `https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&h=800&fit=crop`}
                                        fallbackSrc="/placeholder-car.svg"
                                        alt="Vehicle"
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="flex items-end justify-between">
                                            <div className="text-white">
                                                <p className="text-sm font-medium opacity-90 mb-1">Placa: {formData.license_plate || 'N/A'}</p>
                                                <p className="text-xs opacity-75">VIN: {formData.vin || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <input type="file" id="hero-upload" accept="image/*" className="hidden" onChange={handleChangeHeroImage} disabled={isUploadingHeroImage} />
                                                <label htmlFor="hero-upload">
                                                    <Button size="icon" variant="secondary" className="h-11 w-11 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-lg cursor-pointer" asChild>
                                                        <span>{isUploadingHeroImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}</span>
                                                    </Button>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA - KPI CARDS */}
                            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                                    <DollarSign className="h-8 w-8 mb-3 opacity-80" />
                                    <p className="text-xs uppercase font-semibold opacity-90 mb-1">Tarifa Diaria</p>
                                    <p className="text-3xl font-bold">${formData.daily_rental_price}</p>
                                    <p className="text-xs opacity-75 mt-1">Por día de alquiler</p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                                    <TrendingUp className="h-8 w-8 mb-3 opacity-80" />
                                    <p className="text-xs uppercase font-semibold opacity-90 mb-1">ROI Estimado</p>
                                    <p className="text-3xl font-bold">{roi}%</p>
                                    <p className="text-xs opacity-75 mt-1">Retorno anual proyectado</p>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                                    <Gauge className="h-8 w-8 mb-3 opacity-80" />
                                    <p className="text-xs uppercase font-semibold opacity-90 mb-1">Millaje</p>
                                    <p className="text-3xl font-bold">{(formData.mileage / 1000).toFixed(1)}k</p>
                                    <p className="text-xs opacity-75 mt-1">Millas totales</p>
                                </div>

                                <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-6 text-white shadow-lg">
                                    <DollarSign className="h-8 w-8 mb-3 opacity-80" />
                                    <p className="text-xs uppercase font-semibold opacity-90 mb-1">Inversión</p>
                                    <p className="text-2xl font-bold">${(formData.purchase_price / 1000).toFixed(0)}k</p>
                                    <p className="text-xs opacity-75 mt-1">Valor de compra</p>
                                </div>
                            </div>
                        </div>



                        {/* TABS */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto rounded-none">
                                {[
                                    { value: "general", label: "General", icon: FileText },
                                    { value: "galeria", label: "Galería", icon: Camera },
                                    { value: "millaje", label: "Millaje", icon: Gauge },
                                    { value: "mantenimiento", label: "Mantenimiento", icon: Wrench },
                                    { value: "alquileres", label: "Alquileres", icon: CalendarDays },
                                    { value: "documentos", label: "Documentos", icon: FileText },
                                ].map(tab => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950 px-6 py-4"
                                    >
                                        <tab.icon className="h-4 w-4 mr-2" />
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <div className="p-8">
                                <TabsContent value="general" className="mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="text-lg font-bold mb-4">Especificaciones Técnicas</h3>
                                            <div className="space-y-4">
                                                <InfoRow
                                                    label="Marca"
                                                    value={formData.make}
                                                    isEditMode={isEditMode}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, make: val }))}
                                                />
                                                <InfoRow
                                                    label="Modelo"
                                                    value={formData.model}
                                                    isEditMode={isEditMode}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, model: val }))}
                                                />
                                                <InfoRow
                                                    label="Año"
                                                    value={formData.year.toString()}
                                                    isEditMode={isEditMode}
                                                    type="number"
                                                    onChange={(val) => setFormData(prev => ({ ...prev, year: parseInt(val) || 2024 }))}
                                                />
                                                <InfoRow
                                                    label="VIN"
                                                    value={formData.vin || ''}
                                                    isEditMode={isEditMode}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, vin: val }))}
                                                />
                                                <InfoRow
                                                    label="Placa"
                                                    value={formData.license_plate || ''}
                                                    isEditMode={isEditMode}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, license_plate: val }))}
                                                />
                                                <InfoRow
                                                    label="Ubicación"
                                                    value={formData.location || ''}
                                                    isEditMode={isEditMode}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold mb-4">Información Financiera</h3>
                                            <div className="space-y-4">
                                                <InfoRow
                                                    label="Precio de Compra"
                                                    value={formData.purchase_price.toString()}
                                                    isEditMode={isEditMode}
                                                    type="number"
                                                    onChange={(val) => setFormData(prev => ({ ...prev, purchase_price: parseFloat(val) || 0 }))}
                                                />
                                                <InfoRow
                                                    label="Tarifa Diaria"
                                                    value={formData.daily_rental_price.toString()}
                                                    isEditMode={isEditMode}
                                                    type="number"
                                                    onChange={(val) => setFormData(prev => ({ ...prev, daily_rental_price: parseFloat(val) || 0 }))}
                                                />
                                                <InfoRow label="ROI Estimado" value={`${roi}%`} />
                                                <div className="flex justify-between items-center py-2">
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Inversor Asignado</span>
                                                    {isEditMode ? (
                                                        <Select
                                                            value={formData.assigned_investor_id}
                                                            onValueChange={(val) => setFormData(prev => ({ ...prev, assigned_investor_id: val }))}
                                                        >
                                                            <SelectTrigger className="w-[200px] h-9">
                                                                <SelectValue placeholder="Seleccionar inversor" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Sin asignar</SelectItem>
                                                                {investors.map(investor => (
                                                                    <SelectItem key={investor.id} value={investor.id}>
                                                                        {investor.full_name || investor.email}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            {investors.find(i => i.id === formData.assigned_investor_id)?.full_name || 'Sin asignar'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="galeria" className="mt-0">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold">Galería de Imágenes</h3>
                                                <p className="text-sm text-muted-foreground">{photos.length} fotos registradas</p>
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    id="gallery-upload"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handlePhotoUpload}
                                                    disabled={isUploadingPhoto}
                                                />
                                                <Label htmlFor="gallery-upload">
                                                    <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                                                        <span>
                                                            {isUploadingPhoto ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                                            Subir Nueva
                                                        </span>
                                                    </Button>
                                                </Label>
                                            </div>
                                        </div>

                                        {photos.length === 0 ? (
                                            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                                                <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Camera className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No hay fotos</h3>
                                                <p className="text-slate-500 max-w-sm mx-auto mb-6">Sube fotos del vehículo para documentar su estado.</p>
                                                <Label htmlFor="gallery-upload">
                                                    <Button className="cursor-pointer" asChild>
                                                        <span>Subir Foto</span>
                                                    </Button>
                                                </Label>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {photos.map((photo) => (
                                                    <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 border shadow-sm">
                                                        <ImageWithFallback
                                                            src={photo.image_url}
                                                            fallbackSrc="/placeholder-car.svg"
                                                            alt={photo.caption || "Foto del vehículo"}
                                                            fill
                                                            className="object-cover transition-transform group-hover:scale-105 cursor-pointer"
                                                            onClick={() => setSelectedPhoto(photo)}
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                                            <div className="pointer-events-auto flex gap-2">
                                                                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setSelectedPhoto(photo)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={(e) => handleDeletePhoto(photo.id, e)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        {photo.is_primary && (
                                                            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                                                Principal
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="millaje" className="mt-0">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <Gauge className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold">Millaje Actual</h3>
                                                    <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                                                        {formData.mileage.toLocaleString()} <span className="text-sm text-muted-foreground font-sans font-normal">mi</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <Button onClick={() => setIsMileageDialogOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" /> Registrar Lectura
                                            </Button>
                                        </div>

                                        {mileageHistory.length > 0 && (
                                            <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm">
                                                <h4 className="text-sm font-medium text-muted-foreground mb-6 flex items-center">
                                                    <Activity className="h-4 w-4 mr-2" /> Tendencia de Uso
                                                </h4>
                                                <div className="h-[300px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={[...mileageHistory].reverse()}>
                                                            <defs>
                                                                <linearGradient id="colorMileage" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                            <XAxis
                                                                dataKey="date"
                                                                tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                stroke="#64748b"
                                                                fontSize={12}
                                                                tickLine={false}
                                                                axisLine={false}
                                                            />
                                                            <YAxis
                                                                stroke="#64748b"
                                                                fontSize={12}
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                                            />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                formatter={(value: any) => [`${value.toLocaleString()} mi`, 'Millaje']}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="mileage"
                                                                stroke="#3b82f6"
                                                                strokeWidth={3}
                                                                fillOpacity={1}
                                                                fill="url(#colorMileage)"
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        )}

                                        {mileageHistory.length === 0 ? (
                                            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Gauge className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Sin registros</h3>
                                                <p className="text-slate-500 mb-6">No hay historial de millaje registrado.</p>
                                            </div>
                                        ) : (
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Fecha</TableHead>
                                                            <TableHead>Millaje</TableHead>
                                                            <TableHead>Notas</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {mileageHistory.map((log) => (
                                                            <TableRow key={log.id}>
                                                                <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                                                                <TableCell className="font-mono font-medium">{log.mileage.toLocaleString()} mi</TableCell>
                                                                <TableCell className="text-muted-foreground">{log.notes || "-"}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="mantenimiento" className="mt-0">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold">Historial de Mantenimiento</h3>
                                                <p className="text-sm text-muted-foreground">Servicios y reparaciones realizados</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setMaintenanceForm(prev => ({ ...prev, current_mileage: vehicle.mileage.toString() }))
                                                setIsMaintenanceDialogOpen(true)
                                            }}>
                                                <Plus className="h-4 w-4 mr-2" /> Nuevo Servicio
                                            </Button>
                                        </div>

                                        {maintenanceHistory.length === 0 ? (
                                            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Wrench className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Sin mantenimientos</h3>
                                                <p className="text-slate-500 mb-6">No hay registros de servicios o reparaciones.</p>
                                            </div>
                                        ) : (
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Fecha</TableHead>
                                                            <TableHead>Servicio</TableHead>
                                                            <TableHead>Millaje</TableHead>
                                                            <TableHead>Próximo</TableHead>
                                                            <TableHead>Costo</TableHead>
                                                            <TableHead>Notas</TableHead>
                                                            <TableHead className="text-right w-[50px]"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {maintenanceHistory.map((record) => (
                                                            <TableRow key={record.id}>
                                                                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                                                                <TableCell className="font-medium">{record.service_type}</TableCell>
                                                                {/* @ts-ignore - DB field might slightly differ but assuming mileage_at_service or checking type definition */}
                                                                <TableCell>{(record as any).mileage_at_service?.toLocaleString() || "-"} mi</TableCell>
                                                                {/* @ts-ignore */}
                                                                <TableCell>{(record as any).next_service_mileage ? `${(record as any).next_service_mileage?.toLocaleString()} mi` : "-"}</TableCell>
                                                                <TableCell>${record.cost?.toLocaleString()}</TableCell>
                                                                <TableCell className="max-w-[200px] truncate text-muted-foreground">{record.notes}</TableCell>
                                                                <TableCell className="text-right">
                                                                    {record.receipt_images && record.receipt_images.length > 0 && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                                            onClick={() => window.open(record.receipt_images![0], '_blank')}
                                                                            title="Ver comprobante"
                                                                        >
                                                                            <ImageIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}

                                    </div>
                                </TabsContent>

                                <TabsContent value="alquileres" className="mt-0">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold">Calendario y Reservas</h3>
                                                <p className="text-sm text-muted-foreground">Gestiona la disponibilidad del vehículo</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setIsRentalDialogOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" /> Nueva Reserva
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            {/* CALENDAR VIEW */}
                                            <div className="md:col-span-12 lg:col-span-5">
                                                <div className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
                                                    <h4 className="font-medium mb-6 flex items-center gap-2 text-lg">
                                                        <CalendarDays className="h-5 w-5 text-blue-500" /> Disponibilidad
                                                    </h4>
                                                    <div className="flex justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                                        <Calendar
                                                            mode="single"
                                                            // We use the 'modifiers' prop to highlight booked dates
                                                            modifiers={{ booked: getBookedDates() }}
                                                            modifiersStyles={{
                                                                booked: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', borderRadius: '8px' }
                                                            }}
                                                            locale={es}
                                                            className="rounded-md border-0 [--cell-size:48px] scale-105"
                                                        />
                                                    </div>
                                                    <div className="mt-6 flex gap-6 text-sm justify-center text-muted-foreground">
                                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Alquilado</div>
                                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200"></div> Disponible</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* HISTORY LIST */}
                                            <div className="md:col-span-12 lg:col-span-7 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Historial de Alquileres</h4>
                                                </div>

                                                {rentalHistory.length === 0 ? (
                                                    <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                                                        <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <CalendarDays className="h-8 w-8 text-slate-400" />
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Sin alquileres</h3>
                                                        <p className="text-slate-500 mb-6">No hay registros de reservas aún.</p>
                                                        <Button variant="outline" onClick={() => setIsRentalDialogOpen(true)}>Crear Primera Reserva</Button>
                                                    </div>
                                                ) : (
                                                    <div className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                                                                    <TableHead>Cliente</TableHead>
                                                                    <TableHead>Fechas</TableHead>
                                                                    <TableHead>Plataforma</TableHead>
                                                                    <TableHead>Estado</TableHead>
                                                                    <TableHead className="text-right">Total</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {rentalHistory.map((rental) => (
                                                                    <TableRow key={rental.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                                        <TableCell className="font-medium">{rental.customer_name || 'Cliente'}</TableCell>
                                                                        <TableCell className="text-sm">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium text-slate-900 dark:text-slate-200">
                                                                                    {new Date(rental.start_date).toLocaleDateString()}
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground whitespace-nowrap italic">
                                                                                    hasta {new Date(rental.end_date).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="secondary" className="font-normal capitalize px-2">{rental.platform || 'Manual'}</Badge>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="outline" className={`
                                                                                ${rental.status === 'confirmed' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : ''}
                                                                                ${rental.status === 'completed' ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}
                                                                                ${rental.status === 'cancelled' ? 'border-slate-300 text-slate-500 bg-slate-50' : ''}
                                                                            `}>
                                                                                {rental.status === 'confirmed' ? 'Confirmado' : rental.status === 'completed' ? 'Completado' : 'Cancelado'}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                                                                            ${rental.total_amount?.toLocaleString() || '0'}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="documentos" className="mt-0">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold">Documentación</h3>
                                                <p className="text-sm text-muted-foreground">Seguros, registros y otros archivos</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="file"
                                                    id="document-upload"
                                                    className="hidden"
                                                    multiple
                                                    accept="image/*,.pdf"
                                                    onChange={handleDocumentUpload}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => document.getElementById('document-upload')?.click()}
                                                    disabled={isUploadingDocument}
                                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                >
                                                    {isUploadingDocument ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Plus className="h-4 w-4 mr-2" />
                                                    )}
                                                    Subir Documentos
                                                </Button>
                                            </div>
                                        </div>

                                        {documentsList.length === 0 ? (
                                            <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                                                <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <FileText className="h-10 w-10 text-slate-400" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Carpeta vacía</h3>
                                                <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">No hay documentos cargados. Puedes subir PDFs o imágenes de seguros, títulos, etc.</p>
                                                <Button variant="outline" onClick={() => document.getElementById('document-upload')?.click()}>
                                                    Comenzar a subir
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {documentsList.map((doc) => (
                                                    <div
                                                        key={doc.id}
                                                        className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer"
                                                        onClick={() => setSelectedDocument(doc)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-800 ${doc.file_url.toLowerCase().endsWith('.pdf') || doc.category?.toLowerCase() === 'pdf'
                                                                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                                                : 'bg-slate-50 text-blue-600 dark:bg-slate-800/50 dark:text-blue-400'
                                                                }`}>
                                                                {!(doc.file_url.toLowerCase().endsWith('.pdf') || doc.category?.toLowerCase() === 'pdf') ? (
                                                                    <img
                                                                        src={doc.file_url}
                                                                        alt={doc.title}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <FileText className="h-8 w-8" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                                                                    {doc.title}
                                                                </p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                                    {doc.type.replace('_', ' ')} | {doc.category || 'FILE'}
                                                                </p>
                                                                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-medium">
                                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Acciones Rápidas */}
                                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-sm text-slate-600 hover:text-blue-600"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setSelectedDocument(doc)
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-sm text-red-600 hover:bg-red-50"
                                                                onClick={(e) => handleDeleteDocument(doc.id, e)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </div >
                        </Tabs >


                    </div >
                </div >
            </div >

            {/* CHECK-IN DIALOG */}
            < Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen} >
                <DialogContent className="sm:max-w-[450px]">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold">Check-in Rápido</h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Registrar devolución del vehículo y actualizar estado a disponible.
                            </p>
                        </div>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="mileage">Millaje Actual</Label>
                                <Input id="mileage" type="number" placeholder="Ej: 45000" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notas de estado</Label>
                                <Input id="notes" placeholder="Sin daños visibles..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsCheckInDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={() => {
                                // Lógica básica de check-in
                                setIsCheckInDialogOpen(false);
                                alert("Check-in registrado (simulado)");
                            }}>Confirmar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* RENTAL DIALOG */}
            < Dialog open={isRentalDialogOpen} onOpenChange={setIsRentalDialogOpen} >
                <DialogContent className="sm:max-w-[500px]">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold">Nueva Reserva</h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Crear un nuevo contrato de alquiler.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsRentalDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={() => setIsRentalDialogOpen(false)}>Crear Reserva</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* MILEAGE DIALOG */}
            < Dialog open={isMileageDialogOpen} onOpenChange={setIsMileageDialogOpen} >
                <DialogContent className="sm:max-w-[400px]">
                    <div className="space-y-6">
                        <div>
                            <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-center">Registrar Millaje</h2>
                            <p className="text-muted-foreground text-sm text-center mt-1">
                                Actualiza la lectura del odómetro del vehículo.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-mileage">Lectura Actual</Label>
                                <div className="relative">
                                    <Input
                                        id="current-mileage"
                                        type="number"
                                        placeholder="0"
                                        className="pl-10 text-lg font-mono"
                                        value={newMileageValue}
                                        onChange={(e) => setNewMileageValue(e.target.value)}
                                    />
                                    <Gauge className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <span className="absolute right-3 top-3 text-sm text-muted-foreground">mi</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Última lectura: <span className="font-medium text-foreground">{vehicle.mileage.toLocaleString()} mi</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mileage-notes">Notas (Opcional)</Label>
                                <Input
                                    id="mileage-notes"
                                    placeholder="Ej: Cambio de aceite, devolución..."
                                    value={mileageNote}
                                    onChange={(e) => setMileageNote(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsMileageDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveMileage} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Registrar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* MAINTENANCE DIALOG */}
            < Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen} >
                <DialogContent className="sm:max-w-[500px]">
                    <div className="space-y-6">
                        <div>
                            <div className="mx-auto bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h2 className="text-xl font-bold text-center">Registrar Mantenimiento</h2>
                            <p className="text-muted-foreground text-sm text-center mt-1">
                                Detalla el servicio realizado al vehículo.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Servicio</Label>
                                    <Select
                                        value={maintenanceForm.service_type}
                                        onValueChange={(val) => setMaintenanceForm(prev => ({ ...prev, service_type: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cambio de Aceite y Filtro">Cambio de Aceite y Filtro</SelectItem>
                                            <SelectItem value="Cambio de Neumáticos">Cambio de Neumáticos</SelectItem>
                                            <SelectItem value="Filtro de Aire">Filtro de Aire</SelectItem>
                                            <SelectItem value="Filtro de Cabina">Filtro de Cabina</SelectItem>
                                            <SelectItem value="Aceite de Transmisión">Aceite de Transmisión</SelectItem>
                                            <SelectItem value="Frenos">Frenos</SelectItem>
                                            <SelectItem value="Batería">Batería</SelectItem>
                                            <SelectItem value="Alineación y Balanceo">Alineación y Balanceo</SelectItem>
                                            <SelectItem value="Otro">Otro (Extraordinario)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha</Label>
                                    <Input
                                        type="date"
                                        value={maintenanceForm.date}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {maintenanceForm.service_type === "Otro" && (
                                <div className="space-y-2">
                                    <Label>Especifique el servicio</Label>
                                    <Input
                                        placeholder="Ej: Cambio de radiador..."
                                        value={maintenanceForm.custom_service_type}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, custom_service_type: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Costo ($)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            className="pl-9"
                                            placeholder="0.00"
                                            value={maintenanceForm.cost}
                                            onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Millaje Actual</Label>
                                    <Input
                                        type="number"
                                        placeholder="Ej: 50000"
                                        value={maintenanceForm.current_mileage}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, current_mileage: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Próximo Servicio (Millas)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Ej: 55000"
                                        value={maintenanceForm.next_service_mileage}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, next_service_mileage: e.target.value }))}
                                    />
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => {
                                            const current = parseInt(maintenanceForm.current_mileage || "0")
                                            if (current > 0) {
                                                setMaintenanceForm(prev => ({ ...prev, next_service_mileage: (current + 5000).toString() }))
                                            } else {
                                                toast.warning("Ingrese millaje actual primero")
                                            }
                                        }}
                                    >
                                        +5k
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Opcional. Indica cuándo debe realizarse el próximo mantenimiento.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Notas Adicionales</Label>
                                <Textarea
                                    placeholder="Detalles sobre marcas, repuestos usados..."
                                    value={maintenanceForm.notes}
                                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="receipt">Foto de Comprobante / Recibo</Label>
                                <div className="mt-1 flex items-center gap-4">
                                    <Input
                                        id="receipt"
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setMaintenanceReceipt(e.target.files?.[0] || null)}
                                        className="cursor-pointer"
                                    />
                                    {maintenanceReceipt && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 px-2"
                                            onClick={() => {
                                                setMaintenanceReceipt(null)
                                                const input = document.getElementById('receipt') as HTMLInputElement
                                                if (input) input.value = ''
                                            }}
                                        >
                                            Quitar
                                        </Button>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground">Opcional. Sube una foto o PDF de la factura.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveMaintenance} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Registrar Mantenimiento
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* LIGHTBOX LAYOUT */}
            {
                selectedPhoto && (
                    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedPhoto(null)}>

                        {/* Close Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 z-50 h-10 w-10 rounded-full"
                            onClick={() => setSelectedPhoto(null)}
                        >
                            <X className="h-6 w-6" />
                        </Button>

                        {/* Navigation Buttons (if multiple photos) */}
                        {photos.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 h-12 w-12 rounded-full hidden md:flex"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
                                        const prevIndex = (currentIndex - 1 + photos.length) % photos.length
                                        setSelectedPhoto(photos[prevIndex])
                                    }}
                                >
                                    <ChevronLeft className="h-8 w-8" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 h-12 w-12 rounded-full hidden md:flex"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
                                        const nextIndex = (currentIndex + 1) % photos.length
                                        setSelectedPhoto(photos[nextIndex])
                                    }}
                                >
                                    <ChevronRight className="h-8 w-8" />
                                </Button>
                            </>
                        )}

                        {/* Main Image Container */}
                        <div className="relative max-w-7xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                            <div className="relative flex-1 w-full flex items-center justify-center">
                                <img
                                    src={selectedPhoto.image_url}
                                    alt={selectedPhoto.caption || "Vehicle Photo"}
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                                />
                            </div>

                            {/* Caption / Info Footer */}
                            <div className="mt-4 text-center">
                                <p className="text-white/90 font-medium text-lg">{selectedPhoto.caption || "Sin título"}</p>
                                <p className="text-white/50 text-sm">
                                    {new Date(selectedPhoto.created_at).toLocaleDateString()}
                                    {selectedPhoto.is_primary && <span className="ml-2 text-emerald-400 font-bold">• Principal</span>}
                                </p>

                                <div className="flex gap-2 justify-center mt-3 scale-90 opacity-70 hover:opacity-100 transition-opacity">
                                    {!selectedPhoto.is_primary && (
                                        <Button variant="secondary" size="sm" onClick={() => handleSetPrimaryPhoto(selectedPhoto.id)}>
                                            Hacer Principal
                                        </Button>
                                    )}
                                    <Button variant="destructive" size="sm" onClick={(e) => {
                                        handleDeletePhoto(selectedPhoto.id, e)
                                        setSelectedPhoto(null)
                                    }}>
                                        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }




            {/* RENTAL DIALOG */}
            <Dialog open={isRentalDialogOpen} onOpenChange={setIsRentalDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <div className="space-y-6">
                        <div>
                            <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-center">Registrar Nueva Reserva</h2>
                            <p className="text-muted-foreground text-sm text-center mt-1">
                                Ingresa los detalles del alquiler para este vehículo.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Nombre del Cliente</Label>
                                <Input
                                    placeholder="Ej: Juan Pérez"
                                    value={rentalForm.customer_name}
                                    onChange={(e) => setRentalForm(prev => ({ ...prev, customer_name: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Fecha de Inicio</Label>
                                    <Input
                                        type="date"
                                        value={rentalForm.start_date ? rentalForm.start_date.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : undefined
                                            setRentalForm(prev => ({ ...prev, start_date: date }))
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha de Fin</Label>
                                    <Input
                                        type="date"
                                        value={rentalForm.end_date ? rentalForm.end_date.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : undefined
                                            setRentalForm(prev => ({ ...prev, end_date: date }))
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Plataforma</Label>
                                    <Select
                                        value={rentalForm.platform}
                                        onValueChange={(val) => setRentalForm(prev => ({ ...prev, platform: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Turo">Turo</SelectItem>
                                            <SelectItem value="GetAround">GetAround</SelectItem>
                                            <SelectItem value="Privado">Privado (Manual)</SelectItem>
                                            <SelectItem value="Directo">Venta Directa</SelectItem>
                                            <SelectItem value="Otro">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Monto Total ($)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            className="pl-9"
                                            placeholder="0.00"
                                            value={rentalForm.amount}
                                            onChange={(e) => setRentalForm(prev => ({ ...prev, amount: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Notas Adicionales</Label>
                                <Textarea
                                    placeholder="Cualquier aclaración sobre la reserva..."
                                    value={rentalForm.notes}
                                    onChange={(e) => setRentalForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setIsRentalDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSaveRental} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Reserva
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DOCUMENT VIEWER LIGHTBOX */}
            {selectedDocument && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col animate-in fade-in duration-300">
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between text-white border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold">{selectedDocument.title}</h3>
                                <p className="text-xs text-white/50 lowercase">{selectedDocument.type} • {new Date(selectedDocument.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-10 w-10" asChild>
                                <a href={selectedDocument.file_url} target="_blank" rel="noopener noreferrer">
                                    <Upload className="h-5 w-5 rotate-90" />
                                </a>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                                onClick={() => setSelectedDocument(null)}
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center">
                        {selectedDocument.file_url.toLowerCase().endsWith('.pdf') || selectedDocument.category?.toLowerCase() === 'pdf' ? (
                            <iframe
                                src={selectedDocument.file_url}
                                className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl"
                                title={selectedDocument.title}
                            />
                        ) : (
                            <div className="relative group max-w-full max-h-full">
                                <img
                                    src={selectedDocument.file_url}
                                    alt={selectedDocument.title}
                                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

function InfoRow({
    label,
    value,
    isEditMode,
    onChange,
    type = "text"
}: {
    label: string;
    value: string;
    isEditMode?: boolean;
    onChange?: (val: string) => void;
    type?: string;
}) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
            {isEditMode && onChange ? (
                <Input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-2/3 h-8 text-right bg-slate-50 dark:bg-slate-800 border-none font-semibold"
                />
            ) : (
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {type === "number" && !isEditMode ? parseFloat(value).toLocaleString() : value}
                </span>
            )}
        </div>
    )
}
