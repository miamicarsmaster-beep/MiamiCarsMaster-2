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
import {
    Camera, Gauge, MapPin, Settings, Wrench, X, CalendarDays,
    Activity, CreditCard, CheckCircle2, Edit3, Save, DollarSign, Eye, Upload, Trash2, AlertCircle, Plus, FileText
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

interface VehiclePhoto {
    id: string
    vehicle_id: string
    image_url: string
    caption: string | null
    photo_order: number
    is_primary: boolean
    has_damage: boolean
    damage_markers: DamageMarker[] | null
    created_at: string
}

interface DamageMarker {
    x: number
    y: number
    label: string
    description: string
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
    onClose: () => void
    onUpdate?: (vehicle: Vehicle) => void
    onDelete?: (vehicleId: string) => void
}

export function VehicleAdminPanel({ vehicle, onClose, onUpdate, onDelete }: VehicleAdminPanelProps) {
    const [activeTab, setActiveTab] = useState("overview")
    const [isEditMode, setIsEditMode] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
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

    // Gallery state
    const [photos, setPhotos] = useState<VehiclePhoto[]>([])
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [tempMarkers, setTempMarkers] = useState<{ x: number, y: number }[]>([])
    const [newMarkerLabel, setNewMarkerLabel] = useState("")
    const [newMarkerDesc, setNewMarkerDesc] = useState("")

    // Mileage state
    const [mileageHistory, setMileageHistory] = useState<MileageLog[]>([])
    const [newLogData, setNewLogData] = useState({
        date: new Date().toISOString().split('T')[0],
        mileage: 0,
        notes: ""
    })

    // Maintenance state
    const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
    const [newMaintenanceData, setNewMaintenanceData] = useState({
        service_type: "",
        cost: 0,
        date: new Date().toISOString().split('T')[0],
        notes: "",
        next_service_date: "",
        next_service_mileage: 0,
        status: "completed" as "pending" | "completed"
    })
    const [maintenancePhotos, setMaintenancePhotos] = useState<File[]>([])
    const [isUploadingMaintenance, setIsUploadingMaintenance] = useState(false)

    // Rentals State
    const [rentalHistory, setRentalHistory] = useState<RentalRecord[]>([])
    // New rental state removed as unused

    // Documents State
    const [documentsList, setDocumentsList] = useState<DocumentRecord[]>([])

    const router = useRouter()
    const supabase = createClient()

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            available: "bg-blue-600 text-white",
            rented: "bg-emerald-600 text-white",
            maintenance: "bg-orange-500 text-white",
            inactive: "bg-slate-500 text-white",
        }
        return colors[status] || "bg-slate-500 text-white"
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { data, error } = await supabase
                .from("vehicles")
                .update({
                    make: formData.make,
                    model: formData.model,
                    year: formData.year,
                    license_plate: formData.license_plate,
                    vin: formData.vin,
                    mileage: formData.mileage,
                    location: formData.location,
                    status: formData.status,
                    daily_rental_price: formData.daily_rental_price,
                    purchase_price: formData.purchase_price,
                    assigned_investor_id: formData.assigned_investor_id || null,
                    image_url: formData.image_url
                })
                .eq("id", vehicle.id)
                .select()
                .single()

            if (error) throw error
            if (onUpdate && data) onUpdate(data as Vehicle)
            setIsEditMode(false)
            router.refresh()
        } catch (error) {
            console.error("Error updating vehicle:", error)
            alert("Error al actualizar el vehículo")
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        // Reset form data to original vehicle data
        setFormData({
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
        setIsEditMode(false)
    }

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar este vehículo?")) return
        try {
            const { error } = await supabase.from("vehicles").delete().eq("id", vehicle.id)
            if (error) throw error
            if (onDelete) onDelete(vehicle.id)
            onClose()
            router.refresh()
        } catch (error) {
            console.error("Error deleting vehicle:", error)
            alert("Error al eliminar el vehículo")
        }
    }

    // Load photos when gallery tab is opened
    useEffect(() => {
        if (activeTab === "photos") {
            loadPhotos()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    const loadPhotos = async () => {
        try {
            const { data, error } = await supabase
                .from("vehicle_photos")
                .select("*")
                .eq("vehicle_id", vehicle.id)
                .order("photo_order", { ascending: true })

            if (error) throw error
            setPhotos((data || []) as VehiclePhoto[])
        } catch (error) {
            console.error("Error loading photos:", error)
        }
    }

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        const newPhotos = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `vehicles/${vehicle.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('vehicle-images')
                    .upload(filePath, file)

                if (uploadError) continue

                const { data: { publicUrl } } = supabase.storage
                    .from('vehicle-images')
                    .getPublicUrl(filePath)

                const { data: photoData, error: photoError } = await supabase
                    .from("vehicle_photos")
                    .insert({
                        vehicle_id: vehicle.id,
                        image_url: publicUrl,
                        photo_order: photos.length + i,
                        is_primary: photos.length === 0 && i === 0
                    })
                    .select()
                    .single()

                if (!photoError && photoData) {
                    newPhotos.push(photoData as VehiclePhoto)
                }
            }
            setPhotos([...photos, ...newPhotos])
        } catch (error) {
            console.error("Error uploading photos:", error)
        } finally {
            setIsUploading(false)
        }
    }

    // New Image Click Handler (Logic for marking damage)
    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectedPhotoIndex === null) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setTempMarkers([...tempMarkers, { x, y }])
        // In a real app, you would open a popover to ask for label/desc
        setNewMarkerLabel("Nuevo Daño")
    }

    const saveMarker = async () => {
        if (selectedPhotoIndex === null) return
        const currentPhoto = photos[selectedPhotoIndex]
        if (!currentPhoto) return

        const updatedBlobs = [
            ...(currentPhoto.damage_markers || []),
            ...tempMarkers.map(m => ({ ...m, label: newMarkerLabel, description: newMarkerDesc }))
        ]

        try {
            const { error } = await supabase
                .from("vehicle_photos")
                .update({
                    damage_markers: updatedBlobs,
                    has_damage: updatedBlobs.length > 0
                })
                .eq("id", currentPhoto.id)

            if (error) throw error

            const updatedPhotos = [...photos]
            updatedPhotos[selectedPhotoIndex] = { ...currentPhoto, damage_markers: updatedBlobs }
            setPhotos(updatedPhotos)

            setTempMarkers([])
            setNewMarkerLabel("")
            setNewMarkerDesc("")
        } catch (error) {
            console.error("Error saving marker", error)
        }
    }

    const handleDeletePhoto = async (photoId: string) => {
        if (!confirm("¿Eliminar esta foto?")) return
        try {
            await supabase.from("vehicle_photos").delete().eq("id", photoId)
            setPhotos(photos.filter(p => p.id !== photoId))
            if (selectedPhotoIndex !== null && photos[selectedPhotoIndex]?.id === photoId) {
                setSelectedPhotoIndex(null)
            }
        } catch (error) {
            console.error(error)
        }
    }

    // Mileage Logic
    useEffect(() => {
        if (activeTab === "mileage") {
            loadMileageHistory()
            setNewLogData((prev) => ({ ...prev, mileage: formData.mileage }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    const loadMileageHistory = async () => {
        try {
            const { data, error } = await supabase
                .from("mileage_history")
                .select("*")
                .eq("vehicle_id", vehicle.id)
                .order("date", { ascending: false })

            if (error) throw error
            setMileageHistory(data || [])
        } catch (error) {
            console.error("Error loading mileage history:", error)
        }
    }

    const handleAddMileageLog = async () => {
        try {
            const { data: logData, error: logError } = await supabase
                .from("mileage_history")
                .insert({
                    vehicle_id: vehicle.id,
                    mileage: newLogData.mileage,
                    date: newLogData.date,
                    notes: newLogData.notes
                })
                .select()
                .single()

            if (logError) throw logError

            if (newLogData.mileage > formData.mileage) {
                await supabase.from("vehicles").update({ mileage: newLogData.mileage }).eq("id", vehicle.id)
                setFormData(prev => ({ ...prev, mileage: newLogData.mileage }))
            }

            setMileageHistory([logData, ...mileageHistory])
            alert("Registro agregado correctamente")
        } catch (error) {
            console.error("Error saving mileage:", error)
            alert("Error al guardar registro")
        }
    }

    // Maintenance Logic
    useEffect(() => {
        if (activeTab === "maintenance") loadMaintenanceHistory()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    const loadMaintenanceHistory = async () => {
        const { data } = await supabase
            .from("maintenances")
            .select("*")
            .eq("vehicle_id", vehicle.id)
            .order("date", { ascending: false })
        setMaintenanceHistory(data || [])
    }

    const handleMaintenancePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        // Limit to 5 photos
        if (files.length > 5) {
            alert("Máximo 5 fotos por servicio")
            return
        }
        // Validate size (10MB per file)
        const maxSize = 10 * 1024 * 1024
        const invalidFiles = files.filter(f => f.size > maxSize)
        if (invalidFiles.length > 0) {
            alert(`Algunos archivos exceden 10MB: ${invalidFiles.map(f => f.name).join(', ')}`)
            return
        }
        setMaintenancePhotos(files)
    }

    const handleSaveMaintenance = async () => {
        if (!newMaintenanceData.service_type) {
            alert("Por favor ingresa el tipo de servicio")
            return
        }

        setIsUploadingMaintenance(true)
        try {
            let receiptImageUrls: string[] = []

            // Upload photos if any
            if (maintenancePhotos.length > 0) {
                const uploadPromises = maintenancePhotos.map(async (file) => {
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                    const filePath = `maintenance-receipts/${vehicle.id}/${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('vehicle-documents')
                        .upload(filePath, file)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                        .from('vehicle-documents')
                        .getPublicUrl(filePath)

                    return publicUrl
                })

                receiptImageUrls = await Promise.all(uploadPromises)
            }

            // Insert maintenance record
            const { data: maintenanceData, error: maintenanceError } = await supabase
                .from("maintenances")
                .insert({
                    vehicle_id: vehicle.id,
                    service_type: newMaintenanceData.service_type,
                    cost: newMaintenanceData.cost || null,
                    date: newMaintenanceData.date,
                    notes: newMaintenanceData.notes || null,
                    next_service_date: newMaintenanceData.next_service_date || null,
                    next_service_mileage: newMaintenanceData.next_service_mileage || null,
                    status: newMaintenanceData.status,
                    receipt_images: receiptImageUrls.length > 0 ? receiptImageUrls : null
                })
                .select()
                .single()

            if (maintenanceError) throw maintenanceError

            setMaintenanceHistory([maintenanceData, ...maintenanceHistory])

            // Reset form
            setNewMaintenanceData({
                service_type: "",
                cost: 0,
                date: new Date().toISOString().split('T')[0],
                notes: "",
                next_service_date: "",
                next_service_mileage: 0,
                status: "completed"
            })
            setMaintenancePhotos([])

            alert("Servicio registrado exitosamente")
        } catch (error) {
            console.error("Error saving maintenance:", error)
            alert("Error al guardar servicio")
        } finally {
            setIsUploadingMaintenance(false)
        }
    }

    // Rentals Logic
    useEffect(() => {
        if (activeTab === "rentals") loadRentalHistory()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    const loadRentalHistory = async () => {
        const { data } = await supabase.from("rentals").select("*").eq("vehicle_id", vehicle.id).order("start_date", { ascending: false })
        setRentalHistory(data || [])
    }
    // handleSaveRental removed as unused


    // Documents Logic
    useEffect(() => {
        if (activeTab === "documents") loadDocuments()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    const loadDocuments = async () => {
        const { data } = await supabase.from("documents").select("*").eq("vehicle_id", vehicle.id).order("created_at", { ascending: false })
        setDocumentsList(data || [])
    }

    const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // setIsUploadingDocument(true) removed
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `documents/${vehicle.id}/${fileName}`

            const { error: uploadError } = await supabase.storage.from('vehicle-documents').upload(filePath, file)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('vehicle-documents').getPublicUrl(filePath)

            const { data, error } = await supabase.from("documents").insert({
                vehicle_id: vehicle.id,
                title: file.name,
                file_url: publicUrl,
                type: 'other',
                category: 'general'
            }).select().single()

            if (error) throw error
            setDocumentsList([data, ...documentsList])
        } catch {
            alert("Error al subir documento")
        } finally {
            // setIsUploadingDocument(false) removed
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent
                className="!max-w-[100vw] !w-full h-screen sm:h-[94vh] sm:!max-w-[96vw] sm:!w-[96vw] sm:rounded-xl p-0 gap-0 overflow-hidden bg-background z-[100] border-0 outline-none ring-0 shadow-2xl"
                style={{ zIndex: 100 }}>
                {/* HEADER - Borderless & Airy */}
                <div className="flex-shrink-0 px-6 sm:px-10 py-6 sm:py-8 bg-background relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground truncate">
                                    {formData.year} {formData.make} {formData.model}
                                </h1>
                                <Badge variant="secondary" className={`${getStatusColor(formData.status)} px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border-0`}>
                                    {formData.status}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground/80 font-medium whitespace-nowrap">
                                <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">{formData.license_plate || "Sin Placa"}</span>
                                <span className="hidden sm:inline text-muted-foreground/30">•</span>
                                <span className="font-mono text-xs hidden sm:inline">VIN: {formData.vin || "N/A"}</span>
                                <span className="hidden sm:inline text-muted-foreground/30">•</span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {formData.location || "Sin ubicación"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                            {isEditMode ? (
                                <>
                                    <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="text-muted-foreground hover:text-foreground">
                                        Cancelar
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)} className="border-border/50 bg-background hover:bg-muted/50 text-foreground shadow-sm">
                                    <Edit3 className="h-3.5 w-3.5 mr-2" />
                                    Editar
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full sm:ml-2 hover:bg-destructive/10 hover:text-destructive transition-colors">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">

                        {/* HORIZONTAL TABS NAVIGATION */}
                        <div className="flex-shrink-0 border-b border-border/40 bg-background/95 backdrop-blur z-20 px-6 sm:px-8">
                            <TabsList className="h-14 w-full justify-start gap-6 bg-transparent p-0 overflow-x-auto scrollbar-hide">
                                {[
                                    { value: "overview", label: "General", icon: Settings },
                                    { value: "photos", label: "Galería", icon: Camera },
                                    { value: "mileage", label: "Millaje", icon: Gauge },
                                    { value: "maintenance", label: "Mantenimiento", icon: Wrench },
                                    { value: "rentals", label: "Alquileres", icon: CalendarDays },
                                    { value: "documents", label: "Documentos", icon: FileText },
                                ].map((tab) => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="relative flex items-center gap-2 px-1 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground text-muted-foreground transition-all group whitespace-nowrap">
                                        <tab.icon className="h-4 w-4" />
                                        <span className="font-medium">{tab.label}</span>
                                        {/* Glow Effect on Active */}
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary opacity-0 group-data-[state=active]:opacity-100 dark:shadow-[0_0_10px_2px_rgba(59,130,246,0.5)] transition-opacity" />
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* MAIN CONTENT */}
                        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-slate-950/50">
                            <TabsContent value="overview" className="m-0 p-4 sm:p-8 space-y-6">

                                {/* BENTO GRID LAYOUT */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                                    {/* AREA 1: HERO IMAGE (Span 2 cols on desktop) */}
                                    <div className="col-span-1 sm:col-span-2 lg:col-span-2 row-span-2 relative group rounded-2xl overflow-hidden shadow-2xl transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] min-h-[300px]">
                                        <ImageWithFallback
                                            src={formData.image_url || `https://source.unsplash.com/1600x900/?${formData.make}+${formData.model},car`}
                                            fallbackSrc={`https://source.unsplash.com/1600x900/?car`}
                                            alt={`${formData.make} ${formData.model}`}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                                        <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md">
                                                    {formData.year}
                                                </Badge>
                                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md font-mono">
                                                    {formData.license_plate}
                                                </Badge>
                                            </div>
                                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{formData.make} {formData.model}</h2>
                                            <p className="text-white/80 line-clamp-2 max-w-md text-sm sm:text-base">
                                                Vehículo premium ideal para alquileres ejecutivos. Mantenimiento al día y listo para entrega inmediata.
                                            </p>
                                        </div>
                                    </div>

                                    {/* AREA 2: PRIMARY KPI - DAILY RATE */}
                                    <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                                        <div className="flex justify-between items-start relative z-10">
                                            <span className="text-blue-100 font-medium text-sm uppercase tracking-wider">Tarifa Diaria</span>
                                            <CreditCard className="h-5 w-5 text-blue-200" />
                                        </div>
                                        <div className="relative z-10">
                                            {isEditMode ? (
                                                <Input
                                                    type="number"
                                                    value={formData.daily_rental_price}
                                                    onChange={(e) => setFormData({ ...formData, daily_rental_price: Number(e.target.value) })}
                                                    className="text-4xl sm:text-5xl font-bold bg-transparent border-0 border-b border-white/30 rounded-none px-0 text-white focus-visible:ring-0 placeholder:text-white/50 h-auto"
                                                />
                                            ) : (
                                                <span className="text-4xl sm:text-5xl font-bold tracking-tight block">
                                                    ${formData.daily_rental_price.toLocaleString()}
                                                </span>
                                            )}
                                            <span className="text-blue-100 text-sm mt-1 block opacity-80">Promedio de mercado: ${formData.daily_rental_price * 0.9}</span>
                                        </div>
                                    </div>

                                    {/* AREA 3: ROI METRIC */}
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col justify-between group hover:border-purple-500/50 transition-colors cursor-default">
                                        <div className="flex justify-between items-start">
                                            <span className="text-muted-foreground font-medium text-sm uppercase tracking-wider group-hover:text-purple-600 transition-colors">ROI Estimado</span>
                                            <Activity className="h-5 w-5 text-muted-foreground/50 group-hover:text-purple-600 transition-colors" />
                                        </div>
                                        <div>
                                            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground block group-hover:text-purple-600 transition-colors">
                                                {formData.purchase_price > 0 ? ((formData.daily_rental_price * 240 / formData.purchase_price) * 100).toFixed(0) : 0}%
                                            </span>
                                            <span className="text-muted-foreground text-sm mt-1 block">Retorno anual proyectado</span>
                                        </div>
                                    </div>

                                    {/* AREA 4: MILEAGE */}
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col justify-between group hover:border-blue-500/50 transition-colors cursor-default">
                                        <div className="flex justify-between items-start">
                                            <span className="text-muted-foreground font-medium text-sm uppercase tracking-wider group-hover:text-blue-600 transition-colors">Millaje</span>
                                            <Gauge className="h-5 w-5 text-muted-foreground/50 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <div>
                                            {isEditMode ? (
                                                <Input
                                                    type="number"
                                                    value={formData.mileage}
                                                    onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                                                    className="text-3xl font-bold bg-transparent border-0 border-b border-border rounded-none px-0 h-auto focus-visible:ring-0"
                                                />
                                            ) : (
                                                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground block group-hover:text-blue-600 transition-colors">
                                                    {(formData.mileage / 1000).toFixed(1)}k
                                                </span>
                                            )}
                                            <span className="text-muted-foreground text-sm mt-1 block">Millas totales</span>
                                        </div>
                                    </div>

                                    {/* AREA 5: PURCHASE PRICE */}
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col justify-between group hover:border-emerald-500/50 transition-colors cursor-default">
                                        <div className="flex justify-between items-start">
                                            <span className="text-muted-foreground font-medium text-sm uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Inversión</span>
                                            <DollarSign className="h-5 w-5 text-muted-foreground/50 group-hover:text-emerald-600 transition-colors" />
                                        </div>
                                        <div>
                                            {isEditMode ? (
                                                <Input
                                                    type="number"
                                                    value={formData.purchase_price}
                                                    onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                                                    className="text-3xl font-bold bg-transparent border-0 border-b border-border rounded-none px-0 h-auto focus-visible:ring-0"
                                                />
                                            ) : (
                                                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground block group-hover:text-emerald-600 transition-colors">
                                                    ${(formData.purchase_price / 1000).toFixed(0)}k
                                                </span>
                                            )}
                                            <span className="text-muted-foreground text-sm mt-1 block">Valor de compra</span>
                                        </div>
                                    </div>
                                </div>

                                {/* DETAILS SECTION - Clean & Integrated */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                                    {/* SPECIFICATIONS */}
                                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-border/50">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <Settings className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-bold">Especificaciones Técnicas</h3>
                                        </div>
                                        {isEditMode ? (
                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marca</Label>
                                                    <Input
                                                        value={formData.make}
                                                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                                        className="text-xl font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modelo</Label>
                                                    <Input
                                                        value={formData.model}
                                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                                        className="text-xl font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Año</Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.year}
                                                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                                                        className="text-xl font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placa</Label>
                                                    <Input
                                                        value={formData.license_plate}
                                                        onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                                                        className="text-lg font-mono font-bold"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">VIN</Label>
                                                    <Input
                                                        value={formData.vin}
                                                        onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                                                        className="text-sm font-mono font-semibold"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marca</p>
                                                    <p className="text-lg sm:text-xl font-bold">{formData.make}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modelo</p>
                                                    <p className="text-lg sm:text-xl font-bold">{formData.model}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Año</p>
                                                    <p className="text-lg sm:text-xl font-bold">{formData.year}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placa</p>
                                                    <p className="text-base sm:text-lg font-mono font-bold">{formData.license_plate || "N/A"}</p>
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">VIN</p>
                                                    <p className="text-sm font-mono bg-muted/50 px-3 py-2 rounded font-semibold inline-block">{formData.vin || "N/A"}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT: Quick Actions & Status - 1 column */}
                                    <div className="space-y-6">
                                        {/* Status Card */}
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-border/50">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Activity className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <h3 className="text-lg font-bold">Estado Actual</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <select
                                                        value={formData.status}
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Vehicle['status'] })}
                                                        className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-border rounded-xl px-4 py-3 pr-10 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
                                                        <option value="available">Disponible</option>
                                                        <option value="rented">Alquilado</option>
                                                        <option value="maintenance">Mantenimiento</option>
                                                        <option value="inactive">Inactivo</option>
                                                    </select>
                                                    <div className={`absolute right-3 top-3 h-3 w-3 rounded-full pointer-events-none ${getStatusColor(formData.status).split(' ')[0]}`} />
                                                </div>

                                                {/* Quick Actions Grid */}
                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                    <Button variant="outline" className="h-auto py-3 flex-col gap-1 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 border-border/50 rounded-xl" onClick={() => alert("Función: Check-in rápido")}>
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Check-in</span>
                                                    </Button>
                                                    <Button variant="outline" className="h-auto py-3 flex-col gap-1 hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-900/20 border-border/50 rounded-xl" onClick={() => setActiveTab('maintenance')}>
                                                        <Wrench className="h-5 w-5 text-orange-600" />
                                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Service</span>
                                                    </Button>
                                                    <Button variant="outline" className="h-auto py-3 flex-col gap-1 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 border-border/50 rounded-xl" onClick={() => setActiveTab('rentals')}>
                                                        <CalendarDays className="h-5 w-5 text-blue-600" />
                                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Agenda</span>
                                                    </Button>
                                                    <Button variant="outline" className="h-auto py-3 flex-col gap-1 hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-900/20 border-border/50 rounded-xl" onClick={() => setActiveTab('documents')}>
                                                        <FileText className="h-5 w-5 text-purple-600" />
                                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Docs</span>
                                                    </Button>
                                                </div>

                                                <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl" onClick={handleDelete}>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Eliminar Vehículo
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* GALLERY TAB - Full Implementation */}
                            {/* GALLERY TAB - Full Implementation (Borderless) */}
                            <TabsContent value="photos" className="m-0 p-4 sm:p-6 space-y-6 h-full flex flex-col overflow-hidden">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                                    {/* LEFT: Photo Grid - 8 columns */}
                                    <div className="col-span-1 lg:col-span-8 flex flex-col min-h-0">
                                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Camera className="h-5 w-5 text-primary" />
                                                Galería ({photos.length})
                                            </h3>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    onChange={handleUpload}
                                                    disabled={isUploading}
                                                />
                                                <Button size="sm" variant="outline" className="gap-2" disabled={isUploading}>
                                                    <Plus className="h-4 w-4" />
                                                    {isUploading ? "Subiendo..." : "Agregar Fotos"}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-2 pb-20 scrollbar-hide">
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {photos.map((photo, index) => (
                                                    <div
                                                        key={photo.id}
                                                        className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedPhotoIndex === index ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50'}`}
                                                        onClick={() => {
                                                            setSelectedPhotoIndex(index)
                                                        }}
                                                    >
                                                        <ImageWithFallback
                                                            src={photo.image_url}
                                                            fallbackSrc={`https://source.unsplash.com/1600x900/?car`}
                                                            alt={`Foto ${index + 1}`}
                                                            fill
                                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                        {photo.damage_markers && photo.damage_markers.length > 0 && (
                                                            <div className="absolute top-1 right-1 z-10">
                                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                                                                    {photo.damage_markers.length}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                    </div>
                                                ))}
                                                {photos.length === 0 && (
                                                    <div className="col-span-full h-64 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 text-muted-foreground">
                                                        <Camera className="h-10 w-10 mb-2 opacity-20" />
                                                        <p>Arrastra fotos aquí o usa el botón &quot;Agregar&quot;</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: Detail View - 4 columns */}
                                    <div className="col-span-1 lg:col-span-4 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border/50 overflow-hidden">
                                        {(selectedPhotoIndex !== null && photos[selectedPhotoIndex]) ? (
                                            <div className="flex flex-col h-full">
                                                <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-slate-950">
                                                    <span className="font-semibold text-sm">Detalle de Foto</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-green-600 mr-2"
                                                        onClick={saveMarker}
                                                        title="Guardar Marcadores"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDeletePhoto(photos[selectedPhotoIndex].id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="relative flex-1 bg-black/5 dark:bg-black/40 flex items-center justify-center overflow-hidden group">
                                                    <div className="relative max-h-full max-w-full" onClick={handleImageClick}>
                                                        <ImageWithFallback
                                                            src={photos[selectedPhotoIndex].image_url}
                                                            fallbackSrc={`https://source.unsplash.com/1600x900/?car`}
                                                            alt="Detalle"
                                                            width={800}
                                                            height={600}
                                                            className="max-h-[40vh] lg:max-h-[50vh] object-contain shadow-lg"
                                                            style={{ width: 'auto' }}
                                                        />
                                                        {tempMarkers.map((marker, i) => (
                                                            <div
                                                                key={i}
                                                                className="absolute h-4 w-4 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"
                                                                style={{ top: `${marker.y}%`, left: `${marker.x}%` }}
                                                            />
                                                        ))}
                                                        {photos[selectedPhotoIndex].damage_markers?.map((blob: DamageMarker, i: number) => (
                                                            <div
                                                                key={i}
                                                                className="absolute h-6 w-6 bg-red-500/20 rounded-full border-2 border-red-500 shadow-sm flex items-center justify-center text-[10px] font-bold text-red-600 transform -translate-x-1/2 -translate-y-1/2 z-10 hover:scale-125 transition-transform cursor-help"
                                                                style={{ top: `${blob.y}%`, left: `${blob.x}%` }}
                                                                title={blob.description}
                                                            >
                                                                {i + 1}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="absolute bottom-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Click para marcar daño
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white dark:bg-slate-950 border-t max-h-[250px] overflow-y-auto">
                                                    <p className="text-xs text-muted-foreground w-full text-center py-2">
                                                        {photos[selectedPhotoIndex].damage_markers?.length || 0} daños marcados.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                                                <p className="text-sm">Selecciona una foto para ver detalles</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                            {/* MILEAGE TAB - Clean Dashboard */}
                            <TabsContent value="mileage" className="m-0 p-4 sm:p-6 space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* LEFT: Stats & History */}
                                    <div className="col-span-1 lg:col-span-8 space-y-6">
                                        {/* KPI Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                                                <div className="relative z-10">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Millaje Actual</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-mono font-bold tracking-tighter">{formData.mileage.toLocaleString()}</span>
                                                        <span className="text-sm font-medium text-slate-400">mi</span>
                                                    </div>
                                                </div>
                                                <Gauge className="absolute right-4 bottom-4 h-16 w-16 text-white/5 rotate-[-45deg] group-hover:rotate-0 transition-transform duration-500" />
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col justify-center">
                                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Última Lectura</p>
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-5 w-5 text-primary" />
                                                    <span className="text-xl font-bold">
                                                        {mileageHistory[0]?.date ? new Date(mileageHistory[0].date).toLocaleDateString() : 'Hoy'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {mileageHistory.length} registros totales
                                                </p>
                                            </div>
                                        </div>

                                        {/* Chart Area */}
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-border/50">
                                            <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-primary" />
                                                Tendencia de Uso
                                            </h3>
                                            <div className="h-48 w-full flex items-end justify-between gap-2">
                                                {mileageHistory.length > 0 ? (
                                                    mileageHistory.slice(0, 12).reverse().map((log, i, arr) => {
                                                        const max = Math.max(...arr.map(m => m.mileage));
                                                        const min = Math.min(...arr.map(m => m.mileage)) * 0.95;
                                                        const height = ((log.mileage - min) / (max - min)) * 100;
                                                        return (
                                                            <div key={log.id} className="flex-1 flex flex-col items-center gap-2 group relative">
                                                                <div
                                                                    className="w-full bg-primary/10 hover:bg-primary/80 transition-all rounded-t-sm relative group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                                >
                                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                                        {log.mileage.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground hidden sm:block truncate w-full text-center">
                                                                    {new Date(log.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                                        Datos insuficientes para la gráfica
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Recent Logs List */}
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 overflow-hidden">
                                            <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                                                <h3 className="font-bold text-sm">Historial de Registros</h3>
                                                <Button variant="ghost" size="sm" className="h-8 text-xs">Exportar CSV</Button>
                                            </div>
                                            <div className="divide-y max-h-[400px] overflow-y-auto">
                                                {mileageHistory.map((log) => (
                                                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-xs ring-1 ring-blue-100 dark:ring-blue-800">
                                                                Mi
                                                            </div>
                                                            <div>
                                                                <p className="font-bold font-mono text-sm">{log.mileage.toLocaleString()}</p>
                                                                <p className="text-xs text-muted-foreground text-[10px] uppercase font-medium mt-0.5">
                                                                    {new Date(log.date).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {log.notes && (
                                                            <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full max-w-[200px] truncate hidden sm:block">
                                                                {log.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {mileageHistory.length === 0 && (
                                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                                        Sin historial registrado.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: Add New Entry Form */}
                                    <div className="col-span-1 lg:col-span-4">
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-border/50 sticky top-6 shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Plus className="h-5 w-5" />
                                                </div>
                                                <h3 className="font-bold text-lg">Nuevo Registro</h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="mileage-date" className="text-xs font-semibold uppercase text-muted-foreground">Fecha</Label>
                                                    <Input
                                                        id="mileage-date"
                                                        type="date"
                                                        value={newLogData.date}
                                                        onChange={(e) => setNewLogData({ ...newLogData, date: e.target.value })}
                                                        className="bg-slate-50 border-input font-medium"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="mileage-value" className="text-xs font-semibold uppercase text-muted-foreground">Lectura (Millas)</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="mileage-value"
                                                            type="number"
                                                            value={newLogData.mileage}
                                                            onChange={(e) => setNewLogData({ ...newLogData, mileage: parseInt(e.target.value) || 0 })}
                                                            className="pl-10 font-mono font-bold text-lg"
                                                        />
                                                        <Gauge className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground text-right">
                                                        Actual: {formData.mileage.toLocaleString()}
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="mileage-notes" className="text-xs font-semibold uppercase text-muted-foreground">Notas (Opcional)</Label>
                                                    <textarea
                                                        id="mileage-notes"
                                                        value={newLogData.notes}
                                                        onChange={(e) => setNewLogData({ ...newLogData, notes: e.target.value })}
                                                        className="w-full min-h-[80px] rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                                        placeholder="Ej: Cambio de aceite, viaje largo..."
                                                    />
                                                </div>

                                                <Button className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 mt-2" onClick={handleAddMileageLog}>
                                                    Guardar Registro
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* MAINTENANCE TAB */}
                            {/* MAINTENANCE TAB - Full Implementation */}
                            <TabsContent value="maintenance" className="m-0 p-4 sm:p-6 space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Left: Service History & Timeline */}
                                    <div className="col-span-1 lg:col-span-8 space-y-6">
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 overflow-hidden">
                                            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                                                <h3 className="font-bold text-lg flex items-center gap-2">
                                                    <Wrench className="h-5 w-5 text-orange-500" />
                                                    Historial de Servicios ({maintenanceHistory.length})
                                                </h3>
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className="gap-1 bg-white dark:bg-slate-950">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                        {maintenanceHistory.filter(m => m.status === 'completed').length} Completados
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Service History List */}
                                            <div className="divide-y max-h-[600px] overflow-y-auto">
                                                {maintenanceHistory.length > 0 ? maintenanceHistory.map((service) => (
                                                    <div key={service.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-start gap-4">
                                                                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${service.status === 'completed'
                                                                        ? 'bg-emerald-100 dark:bg-emerald-900/20'
                                                                        : 'bg-orange-100 dark:bg-orange-900/20'
                                                                    }`}>
                                                                    <Wrench className={`h-6 w-6 ${service.status === 'completed'
                                                                            ? 'text-emerald-600'
                                                                            : 'text-orange-600'
                                                                        }`} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-base">{service.service_type}</h4>
                                                                    <p className="text-sm text-muted-foreground mt-1">
                                                                        {new Date(service.date).toLocaleDateString('es-ES', {
                                                                            year: 'numeric',
                                                                            month: 'long',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </p>
                                                                    {service.notes && (
                                                                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                                                                            {service.notes}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                {service.cost && (
                                                                    <p className="font-bold text-lg font-mono">
                                                                        ${service.cost.toLocaleString()}
                                                                    </p>
                                                                )}
                                                                <Badge
                                                                    variant={service.status === 'completed' ? 'default' : 'secondary'}
                                                                    className={service.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500'}
                                                                >
                                                                    {service.status === 'completed' ? 'Completado' : 'Pendiente'}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* Receipt Photos Gallery */}
                                                        {service.receipt_images && service.receipt_images.length > 0 && (
                                                            <div className="mt-4">
                                                                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                                                    Comprobantes ({service.receipt_images.length})
                                                                </p>
                                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                                    {service.receipt_images.map((imageUrl, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary cursor-pointer group relative"
                                                                            onClick={() => window.open(imageUrl, '_blank')}
                                                                        >
                                                                            <ImageWithFallback
                                                                                src={imageUrl}
                                                                                fallbackSrc="https://source.unsplash.com/400x400/?receipt,document"
                                                                                alt={`Comprobante ${idx + 1}`}
                                                                                fill
                                                                                className="object-cover transition-transform group-hover:scale-110"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                                                <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Next Service Info */}
                                                        {(service.next_service_date || service.next_service_mileage) && (
                                                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                                                <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400 mb-1">
                                                                    Próximo Servicio
                                                                </p>
                                                                <div className="flex gap-4 text-sm">
                                                                    {service.next_service_date && (
                                                                        <span className="text-blue-700 dark:text-blue-300">
                                                                            📅 {new Date(service.next_service_date).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                    {service.next_service_mileage && (
                                                                        <span className="text-blue-700 dark:text-blue-300">
                                                                            🛣️ {service.next_service_mileage.toLocaleString()} mi
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )) : (
                                                    <div className="p-12 text-center h-[300px] flex flex-col items-center justify-center">
                                                        <div className="h-16 w-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Wrench className="h-8 w-8 text-orange-400 opacity-50" />
                                                        </div>
                                                        <h4 className="text-lg font-bold text-foreground mb-1">Sin registros de mantenimiento</h4>
                                                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                                            Mantén el vehículo en óptimas condiciones registrando cada servicio.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: New Service Form */}
                                    <div className="col-span-1 lg:col-span-4">
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-border/50 sticky top-6 shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                                                    <Plus className="h-5 w-5" />
                                                </div>
                                                <h3 className="font-bold text-lg">Nuevo Servicio</h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="service-type" className="text-xs font-semibold uppercase text-muted-foreground">
                                                        Tipo de Servicio *
                                                    </Label>
                                                    <Input
                                                        id="service-type"
                                                        value={newMaintenanceData.service_type}
                                                        onChange={(e) => setNewMaintenanceData({ ...newMaintenanceData, service_type: e.target.value })}
                                                        placeholder="Ej: Cambio de aceite, Alineación..."
                                                        className="bg-slate-50 border-input font-medium"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="service-date" className="text-xs font-semibold uppercase text-muted-foreground">
                                                            Fecha *
                                                        </Label>
                                                        <Input
                                                            id="service-date"
                                                            type="date"
                                                            value={newMaintenanceData.date}
                                                            onChange={(e) => setNewMaintenanceData({ ...newMaintenanceData, date: e.target.value })}
                                                            className="bg-slate-50 border-input font-medium"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="service-cost" className="text-xs font-semibold uppercase text-muted-foreground">
                                                            Costo
                                                        </Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                                                            <Input
                                                                id="service-cost"
                                                                type="number"
                                                                value={newMaintenanceData.cost}
                                                                onChange={(e) => setNewMaintenanceData({ ...newMaintenanceData, cost: parseFloat(e.target.value) || 0 })}
                                                                className="pl-7 font-mono font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="service-status" className="text-xs font-semibold uppercase text-muted-foreground">
                                                        Estado
                                                    </Label>
                                                    <select
                                                        id="service-status"
                                                        value={newMaintenanceData.status}
                                                        onChange={(e) => setNewMaintenanceData({ ...newMaintenanceData, status: e.target.value as "pending" | "completed" })}
                                                        className="w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    >
                                                        <option value="completed">Completado</option>
                                                        <option value="pending">Pendiente</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="service-notes" className="text-xs font-semibold uppercase text-muted-foreground">
                                                        Notas (Opcional)
                                                    </Label>
                                                    <textarea
                                                        id="service-notes"
                                                        value={newMaintenanceData.notes}
                                                        onChange={(e) => setNewMaintenanceData({ ...newMaintenanceData, notes: e.target.value })}
                                                        className="w-full min-h-[80px] rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                                                        placeholder="Detalles del servicio realizado..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                                                        Fotos de Comprobante (Opcional)
                                                    </Label>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={handleMaintenancePhotosChange}
                                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="w-full gap-2"
                                                        >
                                                            <Camera className="h-4 w-4" />
                                                            {maintenancePhotos.length > 0
                                                                ? `${maintenancePhotos.length} foto(s) seleccionada(s)`
                                                                : 'Seleccionar Fotos (Máx. 5)'}
                                                        </Button>
                                                    </div>
                                                    {maintenancePhotos.length > 0 && (
                                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                                            {maintenancePhotos.map((file, idx) => (
                                                                <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-border/50 relative">
                                                                    <img
                                                                        src={URL.createObjectURL(file)}
                                                                        alt={`Preview ${idx + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setMaintenancePhotos(maintenancePhotos.filter((_, i) => i !== idx))}
                                                                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        Sube hasta 5 fotos de facturas o comprobantes (10MB máx. c/u)
                                                    </p>
                                                </div>

                                                <div className="pt-4 border-t">
                                                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                                                        Próximo Servicio (Opcional)
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="next-date" className="text-xs">Fecha</Label>
                                                            <Input
                                                                id="next-date"
                                                                type="date"
                                                                value={newMaintenanceData.next_service_date}
                                                                onChange={(e) => setNewMaintenanceData({ ...newMaintenanceData, next_service_date: e.target.value })}
                                                                className="text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="next-mileage" className="text-xs">Millaje</Label>
                                                            <Input
                                                                id="next-mileage"
                                                                type="number"
                                                                value={newMaintenanceData.next_service_mileage}
                                                                onChange={(e) => setNewMaintenanceData({ ...newMaintenanceData, next_service_mileage: parseInt(e.target.value) || 0 })}
                                                                className="text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    className="w-full h-12 text-base font-bold shadow-lg shadow-orange-600/20 bg-orange-600 hover:bg-orange-700 mt-4"
                                                    onClick={handleSaveMaintenance}
                                                    disabled={isUploadingMaintenance || !newMaintenanceData.service_type}
                                                >
                                                    {isUploadingMaintenance ? (
                                                        <>Guardando...</>
                                                    ) : (
                                                        <>
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Registrar Servicio
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* RENTALS TAB */}
                            {/* RENTALS TAB - Modern List */}
                            <TabsContent value="rentals" className="m-0 p-4 sm:p-6 space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Stats Column */}
                                    <div className="lg:col-span-1 space-y-4">
                                        <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-lg shadow-emerald-600/20 relative overflow-hidden">
                                            <div className="relative z-10">
                                                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Ingresos Totales (Mes)</p>
                                                <h3 className="text-3xl font-bold font-mono tracking-tight">$3,450</h3>
                                                <div className="flex items-center gap-1 mt-2 text-emerald-100 text-xs">
                                                    <Activity className="h-3 w-3" />
                                                    <span>+12% vs mes anterior</span>
                                                </div>
                                            </div>
                                            <DollarSign className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-border/50">
                                            <h4 className="font-bold text-sm mb-4">Tarifa Diaria Promedio</h4>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold font-mono">${formData.daily_rental_price}</span>
                                                <span className="text-xs text-muted-foreground">/ día</span>
                                            </div>
                                            <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                                                <div className="h-full bg-blue-500 w-2/3" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* List Column */}
                                    <div className="lg:col-span-2">
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 overflow-hidden">
                                            <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                                                <h3 className="font-bold text-sm">Reservas Recientes</h3>
                                                <Button size="sm" className="h-8 gap-2 bg-slate-900 text-white hover:bg-slate-800">
                                                    <Plus className="h-3 w-3" />
                                                    Nueva Reserva
                                                </Button>
                                            </div>
                                            <div className="divide-y">
                                                {rentalHistory.length > 0 ? rentalHistory.map(rental => (
                                                    <div key={rental.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                                {rental.customer_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm">{rental.customer_name}</p>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold font-mono text-sm">${rental.total_amount}</p>
                                                            <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                                                                Confirmado
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                                        No hay reservas registradas.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* DOCUMENTS TAB */}
                            {/* DOCUMENTS TAB - Grid Layout */}
                            <TabsContent value="documents" className="m-0 p-4 sm:p-6 space-y-6">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 p-6 min-h-[300px]">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="font-bold text-lg">Documentación</h3>
                                            <p className="text-muted-foreground text-sm">Contratos, seguros y manuales.</p>
                                        </div>
                                        <Button className="gap-2" onClick={() => document.getElementById('doc-upload')?.click()}>
                                            <Upload className="h-4 w-4" />
                                            Subir Nuevo
                                        </Button>
                                        <input
                                            id="doc-upload"
                                            type="file"
                                            className="hidden"
                                            onChange={handleUploadDocument}
                                        />
                                    </div>

                                    {/* Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {documentsList.length > 0 ? documentsList.map(doc => (
                                            <div key={doc.id} className="group relative bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                                                <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center mb-3 shadow-sm text-blue-600">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <h4 className="font-bold text-sm truncate pr-4" title={doc.title}>{doc.title}</h4>
                                                <p className="text-[10px] text-muted-foreground uppercase mt-1">{doc.type}</p>

                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6">
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50">
                                                <FileText className="h-12 w-12 text-slate-300 mb-3" />
                                                <p className="font-medium text-slate-500">No hay documentos</p>
                                                <p className="text-xs text-slate-400 mt-1">Sube el seguro o registro del vehículo</p>
                                            </div>
                                        )}

                                        {/* Upload Placeholder */}
                                        <div
                                            className="flex flex-col items-center justify-center text-center border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/50 rounded-xl p-4 cursor-pointer transition-all h-full min-h-[120px]"
                                            onClick={() => document.getElementById('doc-upload')?.click()}
                                        >
                                            <Plus className="h-6 w-6 text-blue-500 mb-2" />
                                            <span className="text-xs font-bold text-blue-600">Subir</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div >
                    </Tabs>
                </div >
            </DialogContent>
        </Dialog>
    )
}
