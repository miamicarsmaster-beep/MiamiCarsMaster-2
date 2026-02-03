"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Upload, FileText, Download, Trash2, Eye, FolderOpen, File, Image as ImageIcon, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface Document {
    id: string
    title: string
    file_url: string
    type: string
    category: string | null
    expiry_date: string | null
    created_at: string
    vehicle_id: string | null
    owner_id: string | null
    vehicle?: { make: string; model: string; year: number }
    owner?: { full_name: string | null; email: string }
}

interface Vehicle {
    id: string
    make: string
    model: string
    year: number
    license_plate: string | null
}

interface Profile {
    id: string
    full_name: string | null
    email: string
    role: string
}

const CATEGORIES = [
    { value: "registration", label: "Registro" },
    { value: "insurance", label: "Seguro" },
    { value: "inspection", label: "Inspección" },
    { value: "contract", label: "Contrato" },
    { value: "invoice", label: "Factura" },
    { value: "other", label: "Otro" },
]

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [filterVehicleId, setFilterVehicleId] = useState<string>("all")
    const [filterProfileId, setFilterProfileId] = useState<string>("all")

    // Upload form state
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadTitle, setUploadTitle] = useState("")
    const [uploadCategory, setUploadCategory] = useState("other")
    const [uploadExpiryDate, setUploadExpiryDate] = useState("")
    const [uploadVehicleId, setUploadVehicleId] = useState<string>("none")
    const [uploadProfileId, setUploadProfileId] = useState<string>("none")

    const supabase = createClient()

    useEffect(() => {
        loadDocuments()
        loadFilters()
    }, [])

    const loadFilters = async () => {
        try {
            const [{ data: vData }, { data: pData }] = await Promise.all([
                supabase.from("vehicles").select("id, make, model, year, license_plate").order("make"),
                supabase.from("profiles").select("id, full_name, email, role").order("full_name")
            ])
            setVehicles(vData || [])
            setProfiles(pData || [])
        } catch (error) {
            console.error("Error loading filters:", error)
        }
    }

    const loadDocuments = async () => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from("documents")
                .select(`
                    id, 
                    title, 
                    file_url, 
                    type, 
                    category, 
                    expiry_date, 
                    created_at, 
                    vehicle_id, 
                    owner_id,
                    vehicle:vehicles!documents_vehicle_id_fkey(make, model, year),
                    owner:profiles!documents_owner_id_fkey(full_name, email)
                `)
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Supabase Query Error Details:", error)
                // Intentar una carga simplificada si la completa falla
                const { data: simpleData, error: simpleError } = await supabase
                    .from("documents")
                    .select("*")
                    .order("created_at", { ascending: false })

                if (simpleError) {
                    throw new Error(`Error fatal: ${simpleError.message}`)
                }

                setDocuments(simpleData || [])
                toast.warning("Cargado sin detalles de auto/vendedor")
                return
            }

            // Normalizar datos de Supabase
            const normalizedData = (data as any[] || []).map(doc => ({
                ...doc,
                vehicle: Array.isArray(doc.vehicle) ? doc.vehicle[0] : doc.vehicle,
                owner: Array.isArray(doc.owner) ? doc.owner[0] : doc.owner
            }))

            setDocuments(normalizedData as Document[])
        } catch (error: any) {
            console.error("Error loading documents:", error)
            toast.error(`Error al cargar: ${error.message || "Problema de conexión"}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024 // 10MB in bytes
            if (file.size > maxSize) {
                toast.error(`El archivo es demasiado grande. Máximo permitido: 10MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
                e.target.value = '' // Clear input
                return
            }

            setUploadFile(file)
            if (!uploadTitle) {
                // Clean filename for title
                const cleanName = file.name.replace(/\.[^/.]+$/, "") // Remove extension
                setUploadTitle(cleanName)
            }
        }
    }

    const handleUpload = async () => {
        if (!uploadFile) {
            toast.error("Por favor selecciona un archivo")
            return
        }

        // Double-check file size before upload
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (uploadFile.size > maxSize) {
            toast.error("El archivo excede el tamaño máximo permitido (10MB)")
            return
        }

        setIsUploading(true)
        try {
            // Upload file to storage (usando el bucket 'documents')
            const fileExt = uploadFile.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `general/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, uploadFile)

            if (uploadError) {
                console.error("Storage upload error:", uploadError)
                throw new Error(`Error de almacenamiento: ${uploadError.message}`)
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath)

            // Create document record
            const { error: dbError } = await supabase
                .from("documents")
                .insert({
                    title: uploadTitle,
                    file_url: publicUrl,
                    type: uploadCategory, // Logical category (e.g., 'insurance')
                    category: uploadFile.type, // MIME type (e.g., 'image/jpeg')
                    expiry_date: uploadExpiryDate || null,
                    vehicle_id: uploadVehicleId === "none" ? null : uploadVehicleId,
                    owner_id: uploadProfileId === "none" ? null : uploadProfileId
                })

            if (dbError) {
                console.error("Database insert error:", dbError)
                throw new Error(`Error en base de datos: ${dbError.message}`)
            }

            toast.success("Documento subido exitosamente")
            loadDocuments() // Reload to get associations

            // Reset form
            setUploadFile(null)
            setUploadTitle("")
            setUploadCategory("other")
            setUploadExpiryDate("")
            setUploadVehicleId("none")
            setUploadProfileId("none")
            setIsUploadDialogOpen(false)
        } catch (error: any) {
            console.error("Error uploading document:", error)
            toast.error(error.message || "Error al subir documento")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async (doc: Document) => {
        if (!confirm("¿Estás seguro de eliminar este documento?")) return

        try {
            // Extract file path from URL
            const urlParts = doc.file_url.split('/')
            const filePath = `general/${urlParts[urlParts.length - 1]}`

            // Delete from storage
            await supabase.storage
                .from('documents')
                .remove([filePath])

            // Delete from database
            const { error } = await supabase
                .from("documents")
                .delete()
                .eq("id", doc.id)

            if (error) throw error

            setDocuments(documents.filter(d => d.id !== doc.id))
            toast.success("Documento eliminado")
        } catch (error) {
            console.error("Error deleting document:", error)
            toast.error("Error al eliminar documento")
        }
    }

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />
        if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
        return <File className="h-8 w-8 text-slate-500" />
    }

    const getCategoryBadge = (category: string | null) => {
        const cat = CATEGORIES.find(c => c.value === category)
        return cat ? cat.label : "Sin categoría"
    }

    const filteredDocuments = documents.filter(doc => {
        // Filter by category (using 'type' which stores 'insurance', 'contract', etc.)
        if (selectedCategory !== "all" && doc.type !== selectedCategory) return false

        // Filter by search query
        if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            // Also search in vehicle/owner info
            const vehicleMatch = doc.vehicle && `${doc.vehicle.make} ${doc.vehicle.model}`.toLowerCase().includes(searchQuery.toLowerCase())
            const ownerMatch = doc.owner && doc.owner.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
            if (!vehicleMatch && !ownerMatch) return false
        }

        // Filter by vehicle
        if (filterVehicleId !== "all" && doc.vehicle_id !== filterVehicleId) return false

        // Filter by profile
        if (filterProfileId !== "all" && doc.owner_id !== filterProfileId) return false

        return true
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Documentos</h2>
                    <p className="text-muted-foreground">
                        Gestiona todos los documentos de la plataforma
                    </p>
                </div>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Documento
                </Button>
            </div>

            {/* Filters bar */}
            <div className="flex flex-col md:flex-row gap-4 items-end bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex-1 w-full space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-slate-500">Búsqueda</Label>
                    <Input
                        placeholder="Buscar por título, auto o vendedor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10"
                    />
                </div>

                <div className="w-full md:w-64 space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-slate-500">Filtrar por Auto</Label>
                    <Select value={filterVehicleId} onValueChange={setFilterVehicleId}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Todos los autos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los autos</SelectItem>
                            {vehicles.map(v => (
                                <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.year})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:w-64 space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-slate-500">Filtrar por Vendedor/Inversor</Label>
                    <Select value={filterProfileId} onValueChange={setFilterProfileId}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Todos los perfiles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los perfiles</SelectItem>
                            {profiles.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {(searchQuery || filterVehicleId !== "all" || filterProfileId !== "all" || selectedCategory !== "all") && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearchQuery("")
                            setFilterVehicleId("all")
                            setFilterProfileId("all")
                            setSelectedCategory("all")
                        }}
                        className="h-10 text-slate-500"
                    >
                        Limpiar
                    </Button>
                )}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                >
                    Todos ({documents.length})
                </Button>
                {CATEGORIES.map(cat => {
                    const count = documents.filter(d => d.type === cat.value).length
                    return (
                        <Button
                            key={cat.value}
                            variant={selectedCategory === cat.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(cat.value)}
                        >
                            {cat.label} ({count})
                        </Button>
                    )
                })}
            </div>

            {/* Documents Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-24 bg-muted rounded-lg mb-4" />
                                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredDocuments.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                        <div className="bg-primary/10 p-6 rounded-full mb-4 ring-1 ring-primary/20">
                            <FolderOpen className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">No hay documentos</h3>
                        <p className="max-w-sm mx-auto text-sm">
                            {selectedCategory === "all"
                                ? "Sube tu primer documento para comenzar"
                                : "No hay documentos en esta categoría"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDocuments.map((doc) => (
                        <Card key={doc.id} className="group hover:shadow-lg transition-all">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-sm truncate">{doc.title}</CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {getCategoryBadge(doc.type)}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Preview Area */}
                                <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center relative group-hover:border-primary/30 transition-colors">
                                    {doc.category?.startsWith('image/') ? (
                                        <img
                                            src={doc.file_url}
                                            alt={doc.title}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                                                <FileText className={`h-8 w-8 ${doc.category?.includes('pdf') ? 'text-red-500' : 'text-slate-400'}`} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {doc.category?.split('/')[1] || 'FILE'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {doc.expiry_date && (
                                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded">
                                        <AlertCircle className="h-3 w-3" />
                                        Vence: {new Date(doc.expiry_date).toLocaleDateString()}
                                    </div>
                                )}

                                {(doc.vehicle || doc.owner) && (
                                    <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        {doc.vehicle && (
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-tight">
                                                <Badge variant="outline" className="h-4 px-1 text-[9px] font-bold">AUTO</Badge>
                                                <span className="truncate">{doc.vehicle.make} {doc.vehicle.model} ({doc.vehicle.year})</span>
                                            </div>
                                        )}
                                        {doc.owner && (
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-tight">
                                                <Badge variant="outline" className="h-4 px-1 text-[9px] font-bold">VEND</Badge>
                                                <span className="truncate">{doc.owner.full_name || doc.owner.email}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => window.open(doc.file_url, '_blank')}
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Ver
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            const a = document.createElement('a')
                                            a.href = doc.file_url
                                            a.download = doc.title
                                            a.click()
                                        }}
                                    >
                                        <Download className="h-3 w-3 mr-1" />
                                        Bajar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(doc)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Subir Documento</DialogTitle>
                        <DialogDescription>
                            Sube un archivo PDF o imagen para almacenar en la plataforma
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">Archivo</Label>
                            <Input
                                id="file"
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,image/*"
                                onChange={handleFileChange}
                            />
                            <p className="text-xs text-muted-foreground">
                                Formatos: PDF, imágenes (JPG, PNG, GIF), documentos Word. Máximo: 10MB
                            </p>
                            {uploadFile && (
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{uploadFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {uploadFile.size > 1024 * 1024
                                                ? `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`
                                                : `${(uploadFile.size / 1024).toFixed(2)} KB`
                                            }
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadFile(null)
                                            const input = document.getElementById('file') as HTMLInputElement
                                            if (input) input.value = ''
                                        }}
                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                                placeholder="Nombre del documento"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select value={uploadCategory} onValueChange={setUploadCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiry">Fecha de Vencimiento (Opcional)</Label>
                            <Input
                                id="expiry"
                                type="date"
                                value={uploadExpiryDate}
                                onChange={(e) => setUploadExpiryDate(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="vehicle-select">Asociar Auto (Opcional)</Label>
                                <Select value={uploadVehicleId} onValueChange={setUploadVehicleId}>
                                    <SelectTrigger id="vehicle-select">
                                        <SelectValue placeholder="Sin asociar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin asociar</SelectItem>
                                        {vehicles.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="profile-select">Asociar Vendedor (Opcional)</Label>
                                <Select value={uploadProfileId} onValueChange={setUploadProfileId}>
                                    <SelectTrigger id="profile-select">
                                        <SelectValue placeholder="Sin asociar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin asociar</SelectItem>
                                        {profiles.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpload} disabled={isUploading || !uploadFile}>
                            {isUploading ? "Subiendo..." : "Subir"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
