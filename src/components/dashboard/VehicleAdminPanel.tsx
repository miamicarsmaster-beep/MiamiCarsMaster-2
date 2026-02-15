"use client"

import { cn } from "@/lib/utils"

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
    DollarSign, Trash2, Plus, FileText, Loader2, TrendingUp, AlertCircle, Upload,
    Eye, ChevronLeft, ChevronRight, Activity, Image as ImageIcon, FileBadge,
    FileBox, ChevronDown, Settings, CarFront, User
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import {
    updateVehicleAction,
    deleteVehicleAction,
    uploadVehicleImageAction,
    createVehiclePhotoAction,
    createMileageLogAction,
    createMaintenanceAction,
    createRentalAction,
    createDocumentAction,
    deleteGeneralAction,
    uploadGalleryPhotoAction,
    uploadVehicleDocumentAction,
    createFinancialRecordAction,
    getVehiclePhotosAction,
    getVehicleDocumentsAction,
    getVehicleMaintenanceAction,
    getVehicleMileageAction,
    getVehicleRentalsAction
} from "@/app/actions/vehicles"
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
    mileage_at_service?: number | null
    display_notes?: string
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
        assigned_investor_id: vehicle.assigned_investor_id || "none",
        image_url: vehicle.image_url || "",
        seats: vehicle.seats || 5,
        transmission: vehicle.transmission || "automatic",
        fuel_type: vehicle.fuel_type || "nafta",
        range: vehicle.range || 0,
        expected_occupancy_days: vehicle.expected_occupancy_days || 240,
        management_fee_percent: vehicle.management_fee_percent || 20,
        management_fee_type: vehicle.management_fee_type || 'percentage',
        management_fee_fixed_amount: vehicle.management_fee_fixed_amount || 0,
        apply_management_fee: vehicle.apply_management_fee ?? true
    })

    const [isLoadingData, setIsLoadingData] = useState(false)
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
    const [maintenanceReceipts, setMaintenanceReceipts] = useState<File[]>([])



    const supabase = createClient()
    const router = useRouter()

    // Cálculos
    const effectiveFee = formData.apply_management_fee
        ? (formData.management_fee_type === 'percentage'
            ? (formData.daily_rental_price * (formData.expected_occupancy_days || 240) * (formData.management_fee_percent || 20) / 100)
            : (formData.management_fee_fixed_amount || 0))
        : 0
    const grossIncome = formData.daily_rental_price * (formData.expected_occupancy_days || 240)
    const netIncome = grossIncome - effectiveFee
    const roi = formData.purchase_price > 0 ? ((netIncome / formData.purchase_price) * 100).toFixed(0) : 0

    const getStatusBadge = () => {
        const statusConfig = {
            available: { label: 'Disponible', className: 'bg-emerald-500 hover:bg-emerald-600' },
            rented: { label: 'Alquilado', className: 'bg-blue-500 hover:bg-blue-600' },
            maintenance: { label: 'Mantenimiento', className: 'bg-orange-500 hover:bg-orange-600' },
            inactive: { label: 'Inactivo', className: 'bg-slate-500 hover:bg-slate-600' }
        }
        return statusConfig[formData.status as keyof typeof statusConfig] || statusConfig.available
    }

    const handleQuickStatusUpdate = async (newStatus: Vehicle["status"]) => {
        if (newStatus === formData.status) return

        setIsSaving(true)
        try {
            const { success, data, error } = await updateVehicleAction(vehicle.id, { status: newStatus })

            if (error) throw new Error(error)
            if (!success || !data) throw new Error("No se pudo confirmar la actualización")

            setFormData(prev => ({ ...prev, status: newStatus }))
            toast.success(`Estado actualizado a ${newStatus.toUpperCase()}`)
            router.refresh()
        } catch (error: any) {
            console.error("Error updating status:", error)
            toast.error(`Error al actualizar el estado: ${error.message || 'Error desconocido'}`)
        } finally {
            setIsSaving(false)
        }
    }

    // Handlers
    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Limpiar el objeto formData para enviar solo lo que la base de datos acepta
            const {
                id: _id,
                created_at: _ca,
                // assigned_investor_id is needed, so don't exclude it here if we want to update it
                ...dataToUpdate
            } = formData;

            const updateData: any = { ...dataToUpdate };
            // Ensure assigned_investor_id is included from formData if it was excluded or if we need to explicitly set it
            // Current formData structure includes it.
            // The destructuring above: `...dataToUpdate` includes everything EXCEPT id, created_at, AND assigned_investor_id (because of `assigned_investor_id: _ai_id`).
            // So we need to put it back.

            if (formData.assigned_investor_id === 'none' || !formData.assigned_investor_id) {
                updateData.assigned_investor_id = null;
            } else {
                updateData.assigned_investor_id = formData.assigned_investor_id;
            }

            // Normalizar campos opcionales para evitar problemas con UNIQUE constraints (strings vacíos vs null)
            if (updateData.license_plate === "") updateData.license_plate = null;
            if (updateData.vin === "") updateData.vin = null;

            // Detectar si el millaje cambió para crear un registro en el historial
            const hasMileageChanged = Number(formData.mileage) !== vehicle.mileage;

            if (hasMileageChanged) {
                await createMileageLogAction({
                    vehicle_id: vehicle.id,
                    mileage: Number(formData.mileage),
                    date: new Date().toISOString(),
                    notes: "Actualización manual desde panel general"
                })
            }

            const { success, data, error } = await updateVehicleAction(vehicle.id, updateData)

            if (error) throw new Error(error)
            if (!success || !data) throw new Error("No se pudo obtener la respuesta del servidor")

            if (onUpdate && data) onUpdate(data as any)
            setIsEditMode(false)
            toast.success("Vehículo actualizado correctamente")
            router.refresh()
        } catch (error: any) {
            console.error("Error saving vehicle:", error)
            toast.error(`Error al guardar cambios: ${error.message || 'Error desconocido'}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("¿Eliminar vehículo permanentemente?")) return
        try {
            const { success, error } = await deleteVehicleAction(vehicle.id)
            if (error) throw new Error(error)
            if (!success) throw new Error("No se pudo confirmar la eliminación")

            if (onDelete) onDelete(vehicle.id)
            onClose()
            router.refresh()
        } catch (error: any) {
            console.error("Error deleting vehicle:", error)
            toast.error(`Error al eliminar: ${error.message || 'Error desconocido'}`)
        }
    }

    const handleChangeHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingHeroImage(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const uploadResult = await uploadVehicleImageAction(formData)

            if (uploadResult.error || !uploadResult.publicUrl) {
                throw new Error(uploadResult.error || "Error al subir imagen principal")
            }

            const updateResult = await updateVehicleAction(vehicle.id, {
                image_url: uploadResult.publicUrl
            })

            if (updateResult.error) {
                throw new Error(updateResult.error)
            }

            setFormData(prev => ({ ...prev, image_url: uploadResult.publicUrl }))
            if (onUpdate) onUpdate({ ...vehicle, image_url: uploadResult.publicUrl })
            toast.success("Imagen actualizada")
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Error al subir imagen")
        } finally {
            setIsUploadingHeroImage(false)
            e.target.value = '' // Reset input so same file can be selected again
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
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('vehicleId', vehicle.id)

                    const uploadResult = await uploadGalleryPhotoAction(formData)

                    if (uploadResult.error || !uploadResult.publicUrl) {
                        throw new Error(uploadResult.error || "Error al subir imagen")
                    }

                    const { data: newPhoto, error: dbError } = await createVehiclePhotoAction({
                        vehicle_id: vehicle.id,
                        image_url: uploadResult.publicUrl,
                        caption: file.name.split('.')[0],
                        photo_order: photos.length + successCount + index,
                        is_primary: photos.length === 0 && index === 0,
                        has_damage: false,
                        damage_markers: []
                    })

                    if (dbError) throw new Error(dbError) // Use Error object for consistent handling

                    if (newPhoto) {
                        newPhotos.push(newPhoto as VehiclePhoto)
                        successCount++
                    }
                } catch (error) {
                    console.error(`Error uploading ${file.name}:`, error)
                    failCount++
                }
            })

            await Promise.all(uploadPromises)

            if (successCount > 0) {
                // Sort by photo_order to prevent UI glitch if uploads finish out of order
                newPhotos.sort((a, b) => a.photo_order - b.photo_order)
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
            e.target.value = '' // Reset input
        }


    }

    const handleSaveMileage = async () => {
        if (!newMileageValue) return toast.error("Ingresa el millaje")
        const mileage = parseInt(newMileageValue)
        if (isNaN(mileage)) return toast.error("Millaje inválido")
        if (mileage <= vehicle.mileage) return toast.warning("El nuevo millaje debe ser mayor al actual")

        setIsSaving(true)
        try {
            // 1. Create mileage log and update vehicle mileage via server action
            const { error: actionError } = await createMileageLogAction({
                vehicle_id: vehicle.id,
                mileage: mileage,
                date: new Date().toISOString(),
                notes: mileageNote || null
            })

            if (actionError) throw new Error(actionError)

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

            // Upload receipts if they exist
            if (maintenanceReceipts.length > 0) {
                const uploadPromises = maintenanceReceipts.map(async (file) => {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('vehicleId', vehicle.id)

                    const uploadResult = await uploadVehicleDocumentAction(formData)

                    if (uploadResult.error || !uploadResult.publicUrl) {
                        throw new Error(uploadResult.error || "Error al subir recibo")
                    }

                    return uploadResult.publicUrl
                })

                receiptUrls = await Promise.all(uploadPromises)
            }

            const cost = parseFloat(maintenanceForm.cost)
            const currentMileage = parseInt(maintenanceForm.current_mileage)

            if (isNaN(cost)) return toast.error("Costo inválido")
            if (isNaN(currentMileage)) return toast.error("Millaje inválido")

            const { error } = await createMaintenanceAction({
                vehicle_id: vehicle.id,
                service_type: type,
                cost: cost,
                mileage_at_service: currentMileage,
                date: maintenanceForm.date,
                next_service_mileage: maintenanceForm.next_service_mileage ? parseInt(maintenanceForm.next_service_mileage) : null,
                notes: `${maintenanceForm.notes || ''} \n[Millaje al servicio: ${maintenanceForm.current_mileage}]`.trim(),
                status: 'completed',
                receipt_images: receiptUrls.length > 0 ? receiptUrls : null
            })

            if (error) throw new Error(error)

            // 1.5 Update vehicle mileage if it's greater than current
            if (currentMileage > vehicle.mileage) {
                await createMileageLogAction({
                    vehicle_id: vehicle.id,
                    mileage: currentMileage,
                    date: maintenanceForm.date,
                    notes: `Registro automático desde mantenimiento: ${type}`
                })
                setFormData(prev => ({ ...prev, mileage: currentMileage }))
                if (onUpdate) onUpdate({ ...vehicle, mileage: currentMileage })
                loadMileageHistory() // Re-cargar historial de millaje
            }

            // 2. Si hay un costo, registrarlo en financial_records
            if (cost > 0) {
                const { error: finError } = await createFinancialRecordAction({
                    vehicle_id: vehicle.id,
                    type: 'expense',
                    category: type,
                    amount: cost,
                    date: maintenanceForm.date,
                    description: `MANTENIMIENTO: ${type}`.toUpperCase(),
                    proof_image_url: receiptUrls.length > 0 ? receiptUrls[0] : null
                })
                if (finError) console.error("Error al registrar gasto financiero:", finError)
            }

            toast.success("Mantenimiento registrado")
            router.refresh()
            setIsMaintenanceDialogOpen(false)
            setMaintenanceReceipts([])
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
            const amount = parseFloat(rentalForm.amount)
            if (isNaN(amount)) return toast.error("Monto inválido")


            // 1. Create Rental
            const { error: rentalError } = await createRentalAction({
                vehicle_id: vehicle.id,
                customer_name: rentalForm.customer_name || 'Cliente',
                start_date: rentalForm.start_date.toISOString(),
                end_date: rentalForm.end_date.toISOString(),
                platform: rentalForm.platform,
                total_amount: amount,
                status: rentalForm.status,
                notes: rentalForm.notes
            })

            if (rentalError) throw new Error(rentalError)

            // 2. Register income in financial_records
            if (amount > 0) {
                const { error: finError } = await createFinancialRecordAction({
                    vehicle_id: vehicle.id,
                    type: 'income',
                    category: 'Renta',
                    amount: amount,
                    date: new Date().toISOString().split('T')[0],
                    description: `RENTA: ${rentalForm.customer_name || 'CLIENTE'} (${rentalForm.platform})`.toUpperCase()
                })
                if (finError) console.error("Error al registrar ingreso financiero:", finError)
            }

            toast.success("Reserva creada")
            router.refresh()
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
            // Reload rentals to update calendar/list
            if (activeTab === "alquileres") loadRentalHistory()
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
            const { error } = await deleteGeneralAction("vehicle_photos", photoId)
            if (error) throw new Error(error)
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
                try {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('vehicleId', vehicle.id)

                    const uploadResult = await uploadVehicleDocumentAction(formData)

                    if (uploadResult.error || !uploadResult.publicUrl) {
                        console.error("Upload error:", uploadResult.error)
                        throw new Error(uploadResult.error || "Error al subir documento")
                    }

                    // Intentar inferir el tipo basado en el nombre
                    let docType = 'other'
                    const nameLower = file.name.toLowerCase()
                    if (nameLower.includes('title') || nameLower.includes('titulo')) docType = 'vehicle_title'
                    else if (nameLower.includes('insurance') || nameLower.includes('seguro')) docType = 'insurance'
                    else if (nameLower.includes('contract') || nameLower.includes('contrato')) docType = 'contract'

                    const fileExt = file.name.split('.').pop()

                    const { error: dbError } = await createDocumentAction({
                        vehicle_id: vehicle.id,
                        title: file.name.split('.')[0],
                        file_url: uploadResult.publicUrl,
                        type: docType,
                        category: fileExt
                    })

                    if (dbError) {
                        console.error("Database insert error:", dbError)
                        throw new Error(`Error en base de datos: ${dbError} (Asegúrate de ejecutar la migración SQL)`)
                    }
                } catch (err: any) {
                    console.error("Individual file upload error:", err)
                    throw err // Re-throw to be caught by outer try/catch
                }
            }

            toast.success("Documentos subidos correctamente")
            loadDocuments()
        } catch (error: any) {
            console.error("Upload error details:", error)
            toast.error(error.message || "Error al subir documentos")
        } finally {
            setIsUploadingDocument(false)
            e.target.value = '' // Reset input
        }
    }

    const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("¿Eliminar este documento?")) return

        try {
            const { error } = await deleteGeneralAction("documents", docId)
            if (error) throw new Error(error)
            setDocumentsList(documentsList.filter(d => d.id !== docId))
            toast.success("Documento eliminado")
        } catch (error) {
            console.error(error)
            toast.error("Error al eliminar documento")
        }
    }

    // Load data functions
    const loadPhotos = async () => {
        setIsLoadingData(true)
        try {
            const { success, data, error } = await getVehiclePhotosAction(vehicle.id)
            if (error) throw new Error(error)
            if (success && data) setPhotos(data as VehiclePhoto[])
        } catch (error) {
            console.error("Error loading photos:", error)
            toast.error("Error al cargar fotos")
        } finally {
            setIsLoadingData(false)
        }
    }

    const loadMileageHistory = async () => {
        try {
            const { success, data, error } = await getVehicleMileageAction(vehicle.id)
            if (error) throw new Error(error)
            if (success && data) setMileageHistory(data)
        } catch (error) {
            console.error("Error loading mileage:", error)
        }
    }

    const loadMaintenanceHistory = async () => {
        setIsLoadingData(true)
        try {
            const { success, data, error } = await getVehicleMaintenanceAction(vehicle.id)
            if (error) throw new Error(error)

            const processedData = (data || []).map((record: any) => {
                let mileage = record.mileage_at_service
                if (!mileage && record.notes) {
                    const match = record.notes.match(/\[Millaje al servicio: (\d+)\]/)
                    if (match) mileage = parseInt(match[1])
                }

                return {
                    ...record,
                    mileage_at_service: mileage,
                    display_notes: record.notes?.replace(/\[Millaje al servicio: \d+\]/, '').trim()
                }
            })
            setMaintenanceHistory(processedData)
        } catch (error) {
            console.error("Error loading maintenance history:", error)
            toast.error("Error al cargar historial de mantenimiento")
        } finally {
            setIsLoadingData(false)
        }
    }

    const handleDeleteMaintenance = async (maintId: string) => {
        if (!confirm("¿Eliminar este registro de mantenimiento?")) return

        try {
            const { error } = await deleteGeneralAction("maintenances", maintId)
            if (error) throw new Error(error)
            setMaintenanceHistory(maintenanceHistory.filter(m => m.id !== maintId))
            toast.success("Registro eliminado")
        } catch (error) {
            console.error(error)
            toast.error("Error al eliminar mantenimiento")
        }
    }

    const loadRentalHistory = async () => {
        try {
            const { success, data, error } = await getVehicleRentalsAction(vehicle.id)
            if (error) throw new Error(error)
            if (success && data) setRentalHistory(data)
        } catch (error) {
            console.error("Error loading rentals:", error)
        }
    }

    const loadDocuments = async () => {
        try {
            const { success, data, error } = await getVehicleDocumentsAction(vehicle.id)
            if (error) throw new Error(error)
            if (success && data) setDocumentsList(data)
        } catch (error) {
            console.error("Error loading documents:", error)
        }
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
            <Dialog open={true} onOpenChange={() => onClose()}>
                <DialogContent showCloseButton={false} className="max-w-[98vw] sm:max-w-[98vw] max-h-[98vh] w-full h-full p-0 border-0 bg-transparent flex items-center justify-center animate-in zoom-in-95 duration-300">
                    <div className="bg-background w-full h-full max-w-[1800px] max-h-[95vh] rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-border shadow-[0_0_100px_rgba(0,0,0,0.4)] relative">

                        {/* Left Navigation Sidebar - Cleaned up */}
                        <div className="hidden md:flex w-[80px] lg:w-[260px] bg-secondary/30 border-r border-border flex-col relative z-20 backdrop-blur-xl">
                            <div className="p-6 flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                                    <CarFront className="h-6 w-6 text-white" />
                                </div>
                                <div className="hidden lg:block">
                                    <h2 className="text-sm font-black italic uppercase leading-none">Panel</h2>
                                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Administración</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 px-3 flex-1 overflow-y-auto custom-scrollbar">
                                {[
                                    { id: "general", label: "Resumen", icon: Activity, desc: "KPIs y Datos Base" },
                                    { id: "galeria", label: "Galería", icon: ImageIcon, desc: "Media Vault" },
                                    { id: "millaje", label: "Millaje", icon: Gauge, desc: "Track & Proyecciones" },
                                    { id: "mantenimiento", label: "Servicios", icon: Wrench, desc: "Mantenimiento Log" },
                                    { id: "documentos", label: "Legal", icon: FileBadge, desc: "Documentación" },
                                    { id: "alquileres", label: "Rentas", icon: CalendarDays, desc: "Historial y Reservas" }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative overflow-hidden group text-left",
                                            activeTab === item.id
                                                ? "bg-background shadow-lg border border-border/50"
                                                : "hover:bg-primary/5 border border-transparent"
                                        )}
                                    >
                                        {activeTab === item.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                        )}
                                        <div className={cn(
                                            "h-9 w-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                                            activeTab === item.id ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                                        )}>
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <div className="hidden lg:block min-w-0">
                                            <p className={cn("text-xs font-black uppercase tracking-wide truncate", activeTab === item.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                                                {item.label}
                                            </p>
                                            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">{item.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 mt-auto border-t border-border/50">
                                <Button
                                    variant="outline"
                                    onClick={() => onClose()}
                                    className="w-full h-10 rounded-xl border-border bg-background/50 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all font-black uppercase tracking-widest text-[10px]"
                                >
                                    <X className="h-4 w-4 lg:mr-2" /> <span className="hidden lg:inline">Cerrar</span>
                                </Button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">

                            {/* Top Hero Section */}
                            <div className="relative h-[280px] md:h-[380px] w-full shrink-0 group">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onClose()}
                                    className="absolute top-4 left-4 z-40 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md h-10 w-10 md:hidden"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onClose()}
                                    className="absolute top-6 right-6 z-50 bg-black/20 hover:bg-white/20 text-white/80 hover:text-white rounded-full backdrop-blur-md h-12 w-12 border border-white/10 shadow-2xl transition-all hover:scale-110 hover:rotate-90 duration-300"
                                >
                                    <X className="h-6 w-6" />
                                </Button>

                                <div className="absolute inset-0 bg-black/10 z-10" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-20" />
                                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/30 to-transparent z-20" />

                                <ImageWithFallback
                                    src={formData.image_url || "/placeholder-car.svg"}
                                    fallbackSrc="/placeholder-car.svg"
                                    alt="Cover"
                                    width={1200}
                                    height={600}
                                    className="w-full h-full object-cover opacity-100 transition-opacity duration-700"
                                    unoptimized
                                />

                                {/* Content Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-30 flex flex-col md:flex-row md:items-end justify-between gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Badge className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-lg ${getStatusBadge().className}`}>
                                                {getStatusBadge().label}
                                            </Badge>
                                            {formData.assigned_investor_id && formData.assigned_investor_id !== 'none' && (
                                                <Badge variant="outline" className="bg-background/50 backdrop-blur-md border-primary/30 text-primary rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                                                    {investors.find(i => i.id === formData.assigned_investor_id)?.full_name || 'Inversor'}
                                                </Badge>
                                            )}
                                        </div>
                                        <div>
                                            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none drop-shadow-2xl">
                                                {formData.make} <span className="text-primary">{formData.model}</span>
                                            </h1>
                                            <p className="text-sm md:text-base font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-80 flex items-center gap-4">
                                                <span>{formData.year}</span>
                                                <span className="h-1 w-1 rounded-full bg-primary/50" />
                                                <span>{formData.license_plate || 'NO PLACA'}</span>
                                                <span className="h-1 w-1 rounded-full bg-primary/50" />
                                                <span>{(formData.mileage || 0).toLocaleString()} MI</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isEditMode && (
                                            <div className="relative">
                                                <Button
                                                    variant="secondary"
                                                    className="h-10 px-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/10"
                                                >
                                                    <Camera className="h-4 w-4 mr-2" /> Cambiar Portada
                                                </Button>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleChangeHeroImage}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        )}

                                        {activeTab === 'general' && (
                                            <Button
                                                onClick={isEditMode ? handleSave : () => setIsEditMode(true)}
                                                className={cn(
                                                    "h-10 px-6 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95",
                                                    isEditMode ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white" : "bg-primary shadow-primary/20 text-primary-foreground"
                                                )}
                                            >
                                                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isEditMode ? <Save className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                                                {isEditMode ? "Guardar Cambios" : "Editar Datos"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full space-y-0">
                                    <TabsContent value="general" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                                            {/* Left Col - Stats & Main Info */}
                                            <div className="xl:col-span-8 space-y-8">
                                                {/* KPI Cards */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="p-6 rounded-3xl bg-secondary/20 border border-border/50 relative overflow-hidden">
                                                        <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                                                            <TrendingUp className="h-32 w-32" />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 mb-2">ROI Estimado</p>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-4xl font-black italic tracking-tighter text-emerald-500">{roi}%</span>
                                                            <span className="text-xs font-bold text-emerald-500/50 uppercase">Anual</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-6 rounded-3xl bg-secondary/20 border border-border/50 relative overflow-hidden">
                                                        <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                                                            <Activity className="h-32 w-32" />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 mb-2">Inversión (Purchase)</p>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-4xl font-black italic tracking-tighter text-blue-500">${formData.purchase_price?.toLocaleString() || '0'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-6 rounded-3xl bg-secondary/20 border border-border/50 relative overflow-hidden">
                                                        <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                                                            <Gauge className="h-32 w-32" />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 mb-2">Uso Actual</p>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-4xl font-black italic tracking-tighter text-primary">{(formData.mileage || 0).toLocaleString()}</span>
                                                            <span className="text-xs font-bold text-primary/50 uppercase">MI</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Specs Grid */}
                                                <div className="space-y-6">
                                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                        <span className="h-1 w-6 bg-primary rounded-full" /> Especificaciones
                                                    </h3>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2rem] border border-border/50 bg-background/50 backdrop-blur-sm">

                                                        {/* Data Point Component */}
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Marca</Label>
                                                            {isEditMode ? (
                                                                <Input value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} className="font-bold uppercase tracking-wide" />
                                                            ) : (
                                                                <div className="text-lg font-black italic uppercase tracking-tight">{formData.make}</div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Modelo</Label>
                                                            {isEditMode ? (
                                                                <Input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="font-bold uppercase tracking-wide" />
                                                            ) : (
                                                                <div className="text-lg font-black italic uppercase tracking-tight">{formData.model}</div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Año</Label>
                                                            {isEditMode ? (
                                                                <Input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} className="font-bold uppercase tracking-wide" />
                                                            ) : (
                                                                <div className="text-lg font-black italic uppercase tracking-tight">{formData.year}</div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Placa</Label>
                                                            {isEditMode ? (
                                                                <Input value={formData.license_plate} onChange={e => setFormData({ ...formData, license_plate: e.target.value })} className="font-bold uppercase tracking-wide" />
                                                            ) : (
                                                                <div className="text-lg font-black italic uppercase tracking-tight">{formData.license_plate}</div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1 md:col-span-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">VIN (Chasis)</Label>
                                                            {isEditMode ? (
                                                                <Input value={formData.vin} onChange={e => setFormData({ ...formData, vin: e.target.value })} className="font-bold uppercase tracking-wide font-mono" />
                                                            ) : (
                                                                <div className="text-base font-bold font-mono tracking-widest opacity-80">{formData.vin}</div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1 md:col-span-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Ubicación</Label>
                                                            {isEditMode ? (
                                                                <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="font-bold uppercase tracking-wide" />
                                                            ) : (
                                                                <div className="text-base font-bold italic flex items-center gap-2">
                                                                    <MapPin className="h-4 w-4 text-primary" />
                                                                    {formData.location}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1 md:col-span-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Socio Inversor</Label>
                                                            {isEditMode ? (
                                                                <Select value={formData.assigned_investor_id} onValueChange={(v) => setFormData({ ...formData, assigned_investor_id: v })}>
                                                                    <SelectTrigger className="font-bold uppercase tracking-wide">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">Sin Asignar</SelectItem>
                                                                        {investors.map(i => (
                                                                            <SelectItem key={i.id} value={i.id}>{i.full_name || i.email}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <div className="text-base font-bold italic flex items-center gap-2 text-foreground/80">
                                                                    <User className="h-4 w-4 text-primary" />
                                                                    {investors.find(i => i.id === formData.assigned_investor_id)?.full_name || 'Sin Asignar'}
                                                                </div>
                                                            )}
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Col - Additional & Status */}
                                            <div className="xl:col-span-4 space-y-8">
                                                <div className="p-6 rounded-[2rem] bg-secondary/10 border border-border/50">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Estado & Disponibilidad</h4>

                                                    <div className="flex flex-col gap-2">
                                                        {["available", "rented", "maintenance", "inactive"].map((s) => (
                                                            <div
                                                                key={s}
                                                                onClick={() => handleQuickStatusUpdate(s as Vehicle['status'])}
                                                                className={cn(
                                                                    "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                                                                    formData.status === s ? "bg-background border-primary/50 shadow-lg" : "border-transparent hover:bg-background/50 hover:border-border"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn("h-2 w-2 rounded-full",
                                                                        s === 'available' ? 'bg-emerald-500' :
                                                                            s === 'rented' ? 'bg-blue-500' :
                                                                                s === 'maintenance' ? 'bg-orange-500' : 'bg-slate-500'
                                                                    )} />
                                                                    <span className={cn("text-xs font-black uppercase tracking-wide", formData.status === s ? "text-foreground" : "text-muted-foreground")}>{s}</span>
                                                                </div>
                                                                {formData.status === s && <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Mini Gallery Preview */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preview Galería</h4>
                                                        <Button variant="link" onClick={() => setActiveTab('galeria')} className="text-[10px] font-black uppercase h-auto p-0 text-primary">Ver Todo</Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {photos.slice(0, 4).map(p => (
                                                            <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-secondary relative">
                                                                <img src={p.image_url} className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                        {photos.length === 0 && (
                                                            <div className="col-span-2 aspect-[2/1] rounded-xl border border-dashed border-border flex items-center justify-center">
                                                                <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Sin Fotos</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </TabsContent>

                                    <TabsContent value="galeria" className="m-0 focus-visible:outline-none">
                                        <div className="p-8 space-y-8">
                                            <div className="flex justify-between items-end px-2">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-2xl font-black italic tracking-tight uppercase">Bóveda de <span className="text-primary">Imágenes</span></h3>
                                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Documentación visual del activo</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        size="lg"
                                                        className="h-12 border-primary/20 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all rounded-xl shadow-lg shadow-primary/5 relative"
                                                        onClick={() => document.getElementById('photo-upload-tab')?.click()}
                                                        disabled={isUploadingPhoto}
                                                    >
                                                        {isUploadingPhoto ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Camera className="h-5 w-5 mr-3" />}
                                                        {isUploadingPhoto ? "Subiendo..." : "Añadir Multimedia"}
                                                        <input
                                                            id="photo-upload-tab"
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handlePhotoUpload}
                                                        />
                                                    </Button>
                                                </div>
                                            </div>

                                            {isLoadingData ? (
                                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">Revelando boveda...</p>
                                                </div>
                                            ) : photos.length === 0 ? (
                                                <div className="text-center py-24 glass-card border-dashed border-primary/20 bg-primary/2 group hover:bg-primary/5 transition-colors border-border/40">
                                                    <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                        <ImageIcon className="h-10 w-10 text-primary" />
                                                    </div>
                                                    <h3 className="text-xl font-black uppercase tracking-widest mb-2">Galería Vacía</h3>
                                                    <p className="text-muted-foreground max-w-sm mx-auto font-medium mb-10 text-sm">No se han cargado registros visuales para esta unidad.</p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => document.getElementById('photo-upload-tab')?.click()}
                                                        className="rounded-xl font-black uppercase text-xs tracking-widest border-primary/20 hover:bg-primary hover:text-white h-11 px-8"
                                                    >
                                                        Capturar Primera Imagen
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                    {photos.map((photo) => (
                                                        <div
                                                            key={photo.id}
                                                            className="group relative h-48 rounded-[2rem] overflow-hidden bg-muted border border-border/40 cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 scale-100 hover:scale-[1.02]"
                                                            onClick={() => setSelectedPhoto(photo)}
                                                        >
                                                            <img
                                                                src={photo.image_url}
                                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                                alt="Vehicle"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md text-white hover:bg-red-500 hover:text-white transition-colors"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeletePhoto(photo.id, e);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="bg-primary/95 text-white text-[8px] font-black uppercase px-2 py-1 rounded-sm tracking-widest">DETALLES</div>
                                                                </div>
                                                            </div>
                                                            {photo.is_primary && (
                                                                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 border border-emerald-400/50">
                                                                    <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                                                    Principal
                                                                </div>
                                                            )}
                                                            {photo.has_damage && (
                                                                <div className="absolute top-4 right-4 bg-red-500 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg shadow-red-500/20 border border-red-400/50">
                                                                    Daño Detectado
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="millaje" className="m-0 focus-visible:outline-none">
                                        <div className="p-8 space-y-10">
                                            <div className="flex justify-between items-end px-2">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-2xl font-black italic tracking-tight uppercase">Monitor de <span className="text-primary">Kilometraje</span></h3>
                                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Histórico de uso y proyecciones</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    className="h-12 border-primary/20 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all rounded-xl shadow-lg shadow-primary/5"
                                                    onClick={() => setIsMileageDialogOpen(true)}
                                                >
                                                    <Gauge className="h-5 w-5 mr-3" /> Registrar Lectura
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                                <div className="md:col-span-12 lg:col-span-8">
                                                    <div className="glass-card p-8 h-[400px] border-border/40 relative group">
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                                    <TrendingUp className="h-5 w-5 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black italic uppercase tracking-tighter text-sm">Curva de Uso</h4>
                                                                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Últimas 10 lecturas certificadas</p>
                                                                </div>
                                                            </div>
                                                            <div className="bg-background border border-border px-4 py-2 rounded-xl">
                                                                <span className="text-xs font-black uppercase text-primary">Consumo Promedio: <span className="text-foreground">{(mileageHistory.length > 1 ? (Math.max(...mileageHistory.map(m => m.mileage)) - Math.min(...mileageHistory.map(m => m.mileage))) / (mileageHistory.length - 1) : 0).toFixed(0)} MI/Mes</span></span>
                                                            </div>
                                                        </div>

                                                        {mileageHistory.length > 1 ? (
                                                            <div className="h-64 w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <AreaChart data={[...mileageHistory].reverse().slice(-10)}>
                                                                        <defs>
                                                                            <linearGradient id="colorMileage" x1="0" y1="0" x2="0" y2="1">
                                                                                <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.3} />
                                                                                <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0} />
                                                                            </linearGradient>
                                                                        </defs>
                                                                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" vertical={false} opacity={0.3} />
                                                                        <XAxis
                                                                            dataKey="date"
                                                                            tick={{ fontSize: 9, fontWeight: 900 }}
                                                                            tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                            stroke="oklch(var(--muted-foreground))"
                                                                            axisLine={false}
                                                                            tickLine={false}
                                                                        />
                                                                        <YAxis
                                                                            hide
                                                                            domain={['dataMin - 500', 'auto']}
                                                                        />
                                                                        <Tooltip
                                                                            content={({ active, payload }) => {
                                                                                if (active && payload && payload.length) {
                                                                                    return (
                                                                                        <div className="bg-slate-900 border border-primary/20 p-3 rounded-xl shadow-2xl">
                                                                                            <p className="text-xs font-black uppercase text-primary mb-1">Lectura Certificada</p>
                                                                                            <p className="text-xl font-black italic text-white tracking-tighter">{payload[0].value?.toLocaleString()} MI</p>
                                                                                            <p className="text-[8px] font-bold text-slate-500 mt-1">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return null;
                                                                            }}
                                                                        />
                                                                        <Area
                                                                            type="monotone"
                                                                            dataKey="mileage"
                                                                            stroke="oklch(var(--primary))"
                                                                            strokeWidth={4}
                                                                            fillOpacity={1}
                                                                            fill="url(#colorMileage)"
                                                                        />
                                                                    </AreaChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center h-64 gap-3 bg-secondary/10 rounded-2xl border border-dashed border-border">
                                                                <TrendingUp className="h-8 w-8 opacity-10" />
                                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Datos insuficientes para graficar</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="md:col-span-12 lg:col-span-4 space-y-6">
                                                    <div className="flex items-center justify-between px-2">
                                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Historial Reciente</h4>
                                                        <div className="h-1 w-8 bg-primary/20 rounded-full"></div>
                                                    </div>

                                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {mileageHistory.length === 0 ? (
                                                            <div className="p-8 text-center bg-secondary/5 rounded-2xl border border-dashed border-border">
                                                                <p className="text-xs font-black uppercase text-muted-foreground opacity-40">Sin lecturas previas</p>
                                                            </div>
                                                        ) : (
                                                            mileageHistory.map((log) => (
                                                                <div key={log.id} className="flex items-center justify-between p-4 glass-card border-border/20 group hover:bg-primary/5 transition-all">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                                            <Gauge className="h-4 w-4 text-primary" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-black italic tracking-tight">{log.mileage.toLocaleString()} MI</p>
                                                                            <p className="text-xs font-black text-muted-foreground uppercase opacity-60">Verified: {new Date(log.date).toLocaleDateString()}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_oklch(0.7_0.2_150)]"></div>
                                                                        <span className="text-[8px] font-bold text-muted-foreground opacity-40">CERT</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="mantenimiento" className="m-0 focus-visible:outline-none">
                                        <div className="p-8 space-y-8">
                                            <div className="flex justify-between items-end px-2">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-2xl font-black italic tracking-tight uppercase">Historial de <span className="text-primary">Mantenimiento</span></h3>
                                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Registro técnico y preventivo</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    className="h-12 border-primary/20 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all rounded-xl shadow-lg shadow-primary/5"
                                                    onClick={() => setIsMaintenanceDialogOpen(true)}
                                                >
                                                    <Plus className="h-5 w-5 mr-3" /> Nuevo Registro
                                                </Button>
                                            </div>

                                            {isLoadingData ? (
                                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">Consultando historial...</p>
                                                </div>
                                            ) : maintenanceHistory.length === 0 ? (
                                                <div className="text-center py-24 glass-card border-dashed border-primary/20 bg-primary/2 group hover:bg-primary/5 transition-colors border-border/40">
                                                    <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                        <Wrench className="h-10 w-10 text-primary" />
                                                    </div>
                                                    <h3 className="text-xl font-black uppercase tracking-widest mb-2">Sin registros técnicos</h3>
                                                    <p className="text-muted-foreground max-w-sm mx-auto font-medium mb-10 text-sm">No se han detectado servicios realizados en esta unidad.</p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setIsMaintenanceDialogOpen(true)}
                                                        className="rounded-xl font-black uppercase text-xs tracking-widest border-primary/20 hover:bg-primary hover:text-white h-11 px-8"
                                                    >
                                                        Registrar Servicio
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="glass-card overflow-hidden border-border/40">
                                                    <Table>
                                                        <TableHeader className="bg-sidebar-accent/30">
                                                            <TableRow className="hover:bg-transparent border-border/40">
                                                                <TableHead className="font-bold uppercase text-xs tracking-widest py-4">Fecha</TableHead>
                                                                <TableHead className="font-bold uppercase text-xs tracking-widest py-4">Servicio</TableHead>
                                                                <TableHead className="font-bold uppercase text-xs tracking-widest py-4">Kilometraje</TableHead>
                                                                <TableHead className="font-bold uppercase text-xs tracking-widest py-4">Inversión</TableHead>
                                                                <TableHead className="text-right font-bold uppercase text-xs tracking-widest py-4 px-6">Acciones</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {maintenanceHistory.map((record) => (
                                                                <TableRow key={record.id} className="group hover:bg-primary/5 border-border/20 transition-all">
                                                                    <TableCell className="py-5 text-xs font-bold uppercase opacity-60">
                                                                        {new Date(record.date).toLocaleDateString()}
                                                                    </TableCell>
                                                                    <TableCell className="py-5">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-black italic text-sm tracking-tight group-hover:text-primary transition-colors uppercase">
                                                                                {record.service_type}
                                                                            </span>
                                                                            <span className="text-xs font-bold text-muted-foreground tracking-widest opacity-60 truncate max-w-[200px]">
                                                                                {record.display_notes || record.notes || "Servicio estándar sin incidencias"}
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="py-5">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-black italic text-sm tracking-tighter opacity-80 uppercase text-primary">
                                                                                {record.mileage_at_service?.toLocaleString() || "-"} MI
                                                                            </span>
                                                                            {record.next_service_mileage && (
                                                                                <span className="text-xs font-black text-muted-foreground uppercase tracking-tighter">Next @ {record.next_service_mileage.toLocaleString()}</span>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="py-5">
                                                                        <span className="font-black italic text-sm tracking-tighter text-primary">${record.cost?.toLocaleString()}</span>
                                                                    </TableCell>
                                                                    <TableCell className="text-right px-6 py-5">
                                                                        <div className="flex justify-end gap-2">
                                                                            {record.receipt_images && record.receipt_images.length > 0 && (
                                                                                record.receipt_images.length === 1 ? (
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-9 w-9 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                                                                        onClick={() => window.open(record.receipt_images![0], '_blank')}
                                                                                    >
                                                                                        <FileText className="h-4 w-4" />
                                                                                    </Button>
                                                                                ) : (
                                                                                    <DropdownMenu>
                                                                                        <DropdownMenuTrigger asChild>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                className="h-9 w-9 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                                                                            >
                                                                                                <span className="flex items-center justify-center relative">
                                                                                                    <FileText className="h-4 w-4" />
                                                                                                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center border-white border">
                                                                                                        {record.receipt_images.length}
                                                                                                    </span>
                                                                                                </span>
                                                                                            </Button>
                                                                                        </DropdownMenuTrigger>
                                                                                        <DropdownMenuContent align="end" className="w-48 bg-popover dark:bg-slate-900 border-primary/20">
                                                                                            <div className="px-3 py-2 border-b border-border/50 mb-1">
                                                                                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Documentos Adjuntos</span>
                                                                                            </div>
                                                                                            {record.receipt_images.map((img, i) => (
                                                                                                <DropdownMenuItem
                                                                                                    key={i}
                                                                                                    className="text-xs font-bold uppercase tracking-tight py-2 cursor-pointer"
                                                                                                    onClick={() => window.open(img, '_blank')}
                                                                                                >
                                                                                                    <FileText className="h-3 w-3 mr-2 opacity-50" />
                                                                                                    Documento #{i + 1}
                                                                                                </DropdownMenuItem>
                                                                                            ))}
                                                                                        </DropdownMenuContent>
                                                                                    </DropdownMenu>
                                                                                )
                                                                            )}
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                                                                onClick={() => handleDeleteMaintenance(record.id)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="alquileres" className="mt-0 outline-none">
                                        <div className="space-y-10">
                                            <div className="flex justify-between items-end px-2">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-2xl font-black italic tracking-tight uppercase">Calendario <span className="text-primary">& Operaciones</span></h3>
                                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Flujo de reservas y disponibilidad</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    className="h-12 border-primary/20 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all rounded-xl shadow-lg shadow-primary/5"
                                                    onClick={() => setIsRentalDialogOpen(true)}
                                                >
                                                    <Plus className="h-5 w-5 mr-3" /> Nueva Reserva
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                                {/* CALENDAR VIEW */}
                                                <div className="md:col-span-12 lg:col-span-5">
                                                    <div className="glass-card p-8 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden group border-border/40">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                                        <h4 className="font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3 text-lg">
                                                            <CalendarDays className="h-5 w-5 text-primary" /> Disponibilidad Real
                                                        </h4>
                                                        <div className="flex justify-center bg-sidebar-accent/20 rounded-2xl p-6 border border-border/20 backdrop-blur-sm">
                                                            <Calendar
                                                                mode="single"
                                                                locale={es}
                                                                className="rounded-md border-0 [--cell-size:44px]"
                                                                modifiers={{ booked: getBookedDates() }}
                                                                modifiersClassNames={{ booked: "bg-primary text-primary-foreground rounded-full" }}
                                                            />
                                                        </div>
                                                        <div className="mt-8 flex gap-8 text-xs font-black uppercase tracking-widest justify-center">
                                                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_oklch(0.8_0.18_185)]"></div> Ocupado</div>
                                                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-border/40"></div> Disponible</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* HISTORY LIST */}
                                                <div className="md:col-span-12 lg:col-span-7 space-y-6">
                                                    <div className="flex items-center gap-2 px-2">
                                                        <div className="h-1 w-6 bg-primary rounded-full"></div>
                                                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground italic">Historial Operativo</h4>
                                                    </div>

                                                    {isLoadingData ? (
                                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                            <p className="text-xs font-black uppercase tracking-widest animate-pulse">Consultando Calendario...</p>
                                                        </div>
                                                    ) : rentalHistory.length === 0 ? (
                                                        <div className="text-center py-24 glass-card border-dashed border-primary/20 bg-primary/2 group hover:bg-primary/5 transition-colors border-border/40">
                                                            <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                                <CalendarDays className="h-10 w-10 text-primary" />
                                                            </div>
                                                            <h3 className="text-xl font-black uppercase tracking-widest mb-2">Activo en Reposo</h3>
                                                            <p className="text-muted-foreground max-w-sm mx-auto font-medium mb-10 text-sm">No se han detectado reservas en el sistema para esta unidad.</p>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setIsRentalDialogOpen(true)}
                                                                className="rounded-xl font-black uppercase text-xs tracking-widest border-primary/20 hover:bg-primary hover:text-white h-11 px-8"
                                                            >
                                                                Registrar Evento
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="glass-card overflow-hidden border-border/40">
                                                            <Table>
                                                                <TableHeader className="bg-sidebar-accent/30">
                                                                    <TableRow className="hover:bg-transparent border-border/40">
                                                                        <TableHead className="font-bold uppercase text-xs tracking-widest py-4">Cliente</TableHead>
                                                                        <TableHead className="font-bold uppercase text-xs tracking-widest py-4">Período</TableHead>
                                                                        <TableHead className="font-bold uppercase text-xs tracking-widest py-4">Estado</TableHead>
                                                                        <TableHead className="text-right font-bold uppercase text-xs tracking-widest py-4 px-6">Ingreso</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {rentalHistory.map((rental) => (
                                                                        <TableRow key={rental.id} className="group hover:bg-primary/5 border-border/20 transition-all">
                                                                            <TableCell className="py-5">
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-black italic text-sm tracking-tight group-hover:text-primary transition-colors uppercase">
                                                                                        {rental.customer_name || 'Generic Client'}
                                                                                    </span>
                                                                                    <span className="text-xs font-bold text-muted-foreground tracking-widest opacity-60 uppercase">
                                                                                        Platform: {rental.platform || 'Direct'}
                                                                                    </span>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="py-5">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-xs font-bold uppercase opacity-80">
                                                                                        {new Date(rental.start_date).toLocaleDateString()}
                                                                                    </span>
                                                                                    <span className="text-xs font-bold text-primary/60 italic tracking-tighter uppercase whitespace-nowrap">
                                                                                        → {new Date(rental.end_date).toLocaleDateString()}
                                                                                    </span>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="py-5">
                                                                                <Badge className={`
                                                                                uppercase text-xs font-black tracking-widest px-2 py-0.5 rounded-md shadow-sm border-0
                                                                                ${rental.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' : ''}
                                                                                ${rental.status === 'completed' ? 'bg-primary/10 text-primary' : ''}
                                                                                ${rental.status === 'cancelled' ? 'bg-slate-500/10 text-slate-500' : ''}
                                                                            `}>
                                                                                    {rental.status === 'confirmed' ? 'Activo' : rental.status === 'completed' ? 'Finalizado' : 'Baja'}
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell className="text-right py-5 px-6">
                                                                                <span className="font-black italic text-sm tracking-tighter text-glow text-primary">
                                                                                    ${rental.total_amount?.toLocaleString() || '0'}
                                                                                </span>
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

                                    <TabsContent value="documentos" className="mt-0 outline-none">
                                        <div className="space-y-10">
                                            <div className="flex justify-between items-end px-2">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-2xl font-black italic tracking-tight uppercase">Bóveda de <span className="text-primary">Documentos</span></h3>
                                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Cumplimiento y registros legales</p>
                                                </div>
                                                <div className="flex gap-4">
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
                                                        size="lg"
                                                        className="h-12 border-primary/20 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all rounded-xl shadow-lg shadow-primary/5 px-8"
                                                        onClick={() => document.getElementById('document-upload')?.click()}
                                                        disabled={isUploadingDocument}
                                                    >
                                                        {isUploadingDocument ? (
                                                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                                        ) : (
                                                            <Plus className="h-5 w-5 mr-3" />
                                                        )}
                                                        Subir Archivos
                                                    </Button>
                                                </div>
                                            </div>

                                            {documentsList.length === 0 ? (
                                                <div className="text-center py-24 glass-card border-dashed border-primary/20 bg-primary/2 group hover:bg-primary/5 transition-colors border-border/40">
                                                    <div className="bg-primary/10 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-inner border border-primary/20">
                                                        <FileText className="h-12 w-12 text-primary" />
                                                    </div>
                                                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Bóveda Vacía</h3>
                                                    <p className="text-muted-foreground max-w-sm mx-auto font-medium mb-12 text-sm">No se han sincronizado registros legales. Almacena seguros, títulos o contratos en este espacio seguro.</p>
                                                    <Button
                                                        onClick={() => document.getElementById('document-upload')?.click()}
                                                        className="h-12 px-10 rounded-xl font-black tracking-widest text-xs uppercase shadow-2xl shadow-primary/20"
                                                    >
                                                        Iniciar Sincronización
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    {documentsList.map((doc) => (
                                                        <div
                                                            key={doc.id}
                                                            className="group relative glass-card p-6 hover:shadow-2xl hover:border-primary/40 transition-all duration-500 cursor-pointer overflow-hidden border-border/40"
                                                            onClick={() => setSelectedDocument(doc)}
                                                        >
                                                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[2.5rem] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                                <div className="mt-[-8px] mr-[-8px]">
                                                                    <FileBadge className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-4">
                                                                <div className={`w-full h-44 rounded-2xl flex items-center justify-center border shadow-2xl overflow-hidden transition-transform duration-500 group-hover:scale-[1.02] ${doc.file_url.toLowerCase().endsWith('.pdf') || doc.category?.toLowerCase() === 'pdf'
                                                                    ? 'bg-red-500/5 text-red-500 border-red-500/10'
                                                                    : 'bg-primary/5 text-primary border-primary/10'
                                                                    }`}>
                                                                    {doc.file_url.toLowerCase().endsWith('.pdf') || doc.category?.toLowerCase() === 'pdf' ? (
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <FileText className="h-12 w-12 opacity-40" />
                                                                            <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Vista PDF</span>
                                                                        </div>
                                                                    ) : (
                                                                        <img
                                                                            src={doc.file_url}
                                                                            alt={doc.title}
                                                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                                (e.target as HTMLImageElement).parentElement?.insertAdjacentHTML('beforeend', '<div class="flex flex-col items-center gap-2 opacity-20"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-[8px] font-black uppercase tracking-widest">Error de Carga</span></div>');
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h4 className="font-black italic text-sm tracking-tight truncate group-hover:text-primary transition-colors uppercase">
                                                                        {doc.title}
                                                                    </h4>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase opacity-60">
                                                                            {doc.type.replace('_', ' ')}
                                                                        </span>
                                                                        <div className="w-1 h-1 rounded-full bg-border" />
                                                                        <span className="text-[8px] font-bold text-primary/60 uppercase tracking-tighter">
                                                                            {(doc as any).category || 'FILE'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-border/20">
                                                                <div className="h-full bg-primary/40 w-0 group-hover:w-full transition-all duration-1000" />
                                                            </div>

                                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm hover:text-red-500 transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDeleteDocument(doc.id, e)
                                                                    }}
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
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CHECK-IN DIALOG */}
            <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen} >
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
            </Dialog>

            {/* RENTAL DIALOG */}
            <Dialog open={isRentalDialogOpen} onOpenChange={setIsRentalDialogOpen} >
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
            </Dialog>

            {/* MILEAGE DIALOG */}
            <Dialog open={isMileageDialogOpen} onOpenChange={setIsMileageDialogOpen} >
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
            </Dialog>

            {/* MAINTENANCE DIALOG */}
            <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen} >
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0 bg-transparent shadow-none">
                    <div className="bg-slate-50 dark:bg-slate-950/95 border border-primary/20 flex flex-col max-h-[90vh] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        {/* Header Premium */}
                        <div className="relative px-8 py-10 overflow-hidden flex-shrink-0">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="h-16 w-16 rounded-2xl cyber-gradient flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/40 mb-6 rotate-3">
                                    <Wrench className="h-8 w-8" />
                                </div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-3 text-slate-900 dark:text-white">
                                    Nuevo <span className="text-primary text-glow font-black">Registro</span> Técnico
                                </h2>
                                <p className="text-[11px] font-black text-primary/60 uppercase tracking-[0.3em]">
                                    Unidad ID: {vehicle.license_plate || vehicle.id.slice(0, 8)}
                                </p>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="px-10 py-2 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Tipo de Servicio</Label>
                                    <Select
                                        value={maintenanceForm.service_type}
                                        onValueChange={(val) => setMaintenanceForm(prev => ({ ...prev, service_type: val }))}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-bold uppercase text-[11px] tracking-widest hover:bg-primary/10 transition-colors">
                                            <SelectValue placeholder="SELECCIONAR..." />
                                        </SelectTrigger>
                                        <SelectContent className="z-[600] bg-white dark:bg-slate-900 border-primary/20 shadow-2xl">
                                            <SelectItem value="Cambio de Aceite y Filtro">ACEITE & FILTRO</SelectItem>
                                            <SelectItem value="Cambio de Neumáticos">NEUMÁTICOS</SelectItem>
                                            <SelectItem value="Filtro de Aire">FILTRO DE AIRE</SelectItem>
                                            <SelectItem value="Frenos">SISTEMA DE FRENOS</SelectItem>
                                            <SelectItem value="Batería">BATERÍA / ELÉCTRICO</SelectItem>
                                            <SelectItem value="Alineación y Balanceo">ALINEACIÓN</SelectItem>
                                            <SelectItem value="Otro">OTRO SERVICIO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Fecha del Evento</Label>
                                    <Input
                                        type="date"
                                        className="h-12 bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-bold text-sm"
                                        value={maintenanceForm.date}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {maintenanceForm.service_type === "Otro" && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Especificación Técnica</Label>
                                    <Input
                                        placeholder="EJ: REPARACIÓN DE TRANSMISIÓN..."
                                        className="h-12 bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-bold uppercase text-[11px] tracking-widest"
                                        value={maintenanceForm.custom_service_type}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, custom_service_type: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Inversión ($)</Label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                        <Input
                                            type="number"
                                            className="h-12 pl-12 bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-black italic text-xl tracking-tighter"
                                            placeholder="0.00"
                                            value={maintenanceForm.cost}
                                            onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Kilometraje (MI)</Label>
                                    <div className="relative group">
                                        <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                        <Input
                                            type="number"
                                            className="h-12 pl-12 bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-black italic text-xl tracking-tighter"
                                            placeholder="50000"
                                            value={maintenanceForm.current_mileage}
                                            onChange={(e) => setMaintenanceForm(prev => ({ ...prev, current_mileage: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 p-6 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-4">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Próxima Alerta (Millas)</Label>
                                        <Button
                                            variant="ghost"
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                const current = parseInt(maintenanceForm.current_mileage || "0")
                                                if (current > 0) {
                                                    setMaintenanceForm(prev => ({ ...prev, next_service_mileage: (current + 5000).toString() }))
                                                } else {
                                                    toast.warning("Ingrese millaje actual")
                                                }
                                            }}
                                            className="h-8 px-4 bg-primary text-white hover:bg-primary/80 rounded-lg font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-primary/20"
                                        >
                                            +5K MI Sugerido
                                        </Button>
                                    </div>
                                    <Input
                                        type="number"
                                        className="h-12 bg-transparent border-primary/20 rounded-xl font-black italic text-lg tracking-tighter text-glow"
                                        placeholder="55000"
                                        value={maintenanceForm.next_service_mileage}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, next_service_mileage: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Notas del Servicio</Label>
                                <Textarea
                                    placeholder="DETALLES TÉCNICOS, MARCAS DE REPUESTOS, DIAGNÓSTICO..."
                                    className="min-h-[100px] bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-bold text-sm p-4 resize-none focus:bg-primary/10 transition-all uppercase placeholder:text-xs placeholder:tracking-widest"
                                    value={maintenanceForm.notes}
                                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Evidencia Fotográfica (FACTURAS/RECIBOS)</Label>

                                {/* Dropzone */}
                                <div
                                    className="relative h-24 border-2 border-dashed border-primary/20 rounded-2xl flex items-center justify-center bg-primary/2 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
                                    onClick={() => document.getElementById('receipt')?.click()}
                                >
                                    <input
                                        id="receipt"
                                        type="file"
                                        accept="image/*,.pdf"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || [])
                                            setMaintenanceReceipts(prev => [...prev, ...files])
                                            e.target.value = '' // Reset input
                                        }}
                                        className="hidden"
                                    />
                                    <div className="flex flex-col items-center">
                                        <Upload className="h-6 w-6 text-primary/40 group-hover:text-primary transition-colors mb-2" />
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Click para añadir archivos</span>
                                    </div>
                                </div>

                                {/* File List */}
                                {maintenanceReceipts.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                        {maintenanceReceipts.map((file, index) => (
                                            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-1">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-lg">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-xs font-black uppercase tracking-tighter truncate">{file.name}</span>
                                                        <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">Listo para subir</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500 hover:bg-red-500/10 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMaintenanceReceipts(prev => prev.filter((_, i) => i !== index));
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-8 bg-black/5 flex-shrink-0 flex gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setIsMaintenanceDialogOpen(false)}
                                className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary/5"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveMaintenance}
                                disabled={isSaving}
                                className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-5 w-5 mr-3" />
                                        Certificar Mantenimiento
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                                        const currentIndex = photos.findIndex(p => p.id === selectedPhoto?.id)
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
                                        const currentIndex = photos.findIndex(p => p.id === selectedPhoto?.id)
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
                                    src={selectedPhoto?.image_url}
                                    alt={selectedPhoto?.caption || "Vehicle Photo"}
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                                />
                            </div>

                            {/* Caption / Info Footer */}
                            <div className="mt-4 text-center">
                                <p className="text-white/90 font-medium text-lg">{selectedPhoto?.caption || "Sin título"}</p>
                                <p className="text-white/50 text-sm">
                                    {selectedPhoto?.created_at ? new Date(selectedPhoto.created_at).toLocaleDateString() : ""}
                                    {selectedPhoto?.is_primary && <span className="ml-2 text-emerald-400 font-bold">• Principal</span>}
                                </p>

                                <div className="flex gap-2 justify-center mt-3 scale-90 opacity-70 hover:opacity-100 transition-opacity">
                                    {!selectedPhoto?.is_primary && (
                                        <Button variant="secondary" size="sm" onClick={() => selectedPhoto && handleSetPrimaryPhoto(selectedPhoto.id)}>
                                            Hacer Principal
                                        </Button>
                                    )}
                                    <Button variant="destructive" size="sm" onClick={(e) => {
                                        if (selectedPhoto) {
                                            handleDeletePhoto(selectedPhoto.id, e)
                                            setSelectedPhoto(null)
                                        }
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
                                        value={rentalForm.end_date?.toISOString().split('T')[0] || ''}
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
            {
                selectedDocument && (
                    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col animate-in fade-in duration-300">
                        <div className="p-4 flex items-center justify-between text-white border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold">{selectedDocument?.title}</h3>
                                    <p className="text-xs text-white/50 lowercase">{selectedDocument?.type} • {selectedDocument?.created_at ? new Date(selectedDocument.created_at).toLocaleDateString() : ""}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-10 w-10" asChild>
                                    <a href={selectedDocument?.file_url} target="_blank" rel="noopener noreferrer">
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

                        <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center">
                            {selectedDocument?.file_url?.toLowerCase().endsWith('.pdf') || selectedDocument?.category?.toLowerCase() === 'pdf' ? (
                                <iframe
                                    src={selectedDocument?.file_url}
                                    className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl"
                                    title={selectedDocument?.title}
                                />
                            ) : (
                                <div className="relative group max-w-full max-h-full">
                                    <img
                                        src={selectedDocument?.file_url}
                                        alt={selectedDocument?.title}
                                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </>
    )
}

function InfoRow({
    label,
    value,
    isEditMode,
    onChange,
    type = "text",
    className,
    prefix,
    suffix
}: {
    label: string;
    value: string;
    isEditMode?: boolean;
    onChange?: (val: string) => void;
    type?: string;
    className?: string;
    prefix?: string;
    suffix?: string;
}) {
    return (
        <div className={cn("flex justify-between items-center py-4 border-b border-border/30 group transition-colors", className)}>
            <span className="text-xs font-black text-muted-foreground dark:text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">{label}</span>
            {isEditMode && onChange ? (
                <div className="flex items-center gap-2 w-2/3">
                    {prefix && <span className="text-sm font-bold opacity-50">{prefix}</span>}
                    <input
                        type={type}
                        value={value.replace(/[^0-9.]/g, '')} // Clean value for numeric input if needed, but value is string here
                        onChange={(e) => onChange(e.target.value)}
                        className="h-10 text-right bg-primary/5 border-primary/20 rounded-lg font-black italic tracking-tight w-full px-3 outline-none"
                    />
                    {suffix && <span className="text-sm font-bold opacity-50">{suffix}</span>}
                </div>
            ) : (
                <span className="text-sm font-black italic tracking-tight uppercase">
                    {prefix}{type === "number" ? (parseFloat(value.replace(/,/g, '')) || 0).toLocaleString() : value}{suffix}
                </span>
            )}
        </div>
    )
}
