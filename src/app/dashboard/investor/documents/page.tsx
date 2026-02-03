"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Eye, FolderOpen, File, Image as ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

interface Document {
    id: string
    title: string
    file_url: string
    type: string
    category: string | null
    expiry_date: string | null
    created_at: string
    vehicle_id: string | null
}

const CATEGORIES = [
    { value: "registration", label: "Registro" },
    { value: "insurance", label: "Seguro" },
    { value: "inspection", label: "Inspección" },
    { value: "contract", label: "Contrato" },
    { value: "invoice", label: "Factura" },
    { value: "other", label: "Otro" },
]

export default function InvestorDocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

    const supabase = createClient()

    useEffect(() => {
        loadDocuments()
    }, [])

    const loadDocuments = async () => {
        try {
            setIsLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get documents for vehicles assigned to this investor
            const { data: vehicles } = await supabase
                .from("vehicles")
                .select("id")
                .eq("assigned_investor_id", user.id)

            const vehicleIds = vehicles?.map(v => v.id) || []

            const { data, error } = await supabase
                .from("documents")
                .select("*")
                .or(`vehicle_id.in.(${vehicleIds.join(',')}),vehicle_id.is.null`)
                .order("created_at", { ascending: false })

            if (error) throw error
            setDocuments(data || [])
        } catch (error) {
            console.error("Error loading documents:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8" />
        if (type.includes('pdf')) return <FileText className="h-8 w-8" />
        return <File className="h-8 w-8" />
    }

    const getCategoryBadge = (category: string | null) => {
        const cat = CATEGORIES.find(c => c.value === category)
        return cat ? cat.label : "Sin categoría"
    }

    const filteredDocuments = selectedCategory === "all"
        ? documents
        : documents.filter(d => d.category === selectedCategory)

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                        Vault de <span className="text-primary">Documentos</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Archivo digital centralizado de tu flota e inversión</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group">
                        <FileText className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </div>
                    <Badge variant="outline" className="rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border-border/50">
                        {documents.length} Archivos
                    </Badge>
                </div>
            </div>

            {/* Premium Category Filter */}
            <div className="flex gap-2 p-1.5 bg-sidebar-accent/20 backdrop-blur-md rounded-[1.5rem] border border-border/50 w-fit overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setSelectedCategory("all")}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                        selectedCategory === "all"
                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    )}
                >
                    Todos
                </button>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                            selectedCategory === cat.value
                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Documents Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i} className="animate-pulse bg-muted/20 border-border/50 rounded-[2rem] h-[300px]" />
                    ))}
                </div>
            ) : filteredDocuments.length === 0 ? (
                <Card className="bg-muted/30 border-dashed border-border/50 rounded-[2.5rem] py-24 text-center">
                    <div className="bg-primary/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FolderOpen className="h-10 w-10 text-primary opacity-20" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Sin Documentos Disponibles</h4>
                    <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-2">
                        {selectedCategory === "all" ? "Aún no se han cargado archivos" : "No hay archivos en esta categoría"}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDocuments.map((doc) => (
                        <Card key={doc.id} className="group relative overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-sm border-border/50 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]">
                            <div className="p-6 pb-2">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:rotate-12",
                                        doc.type.includes('pdf') ? "bg-red-500" : "bg-blue-500"
                                    )}>
                                        {getFileIcon(doc.type)}
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border/50 bg-muted/30">
                                        {getCategoryBadge(doc.category)}
                                    </Badge>
                                </div>
                                <h4 className="text-sm font-black uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors">
                                    {doc.title}
                                </h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 mt-1">
                                    Agregado: {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <CardContent className="p-6 pt-4 space-y-6">
                                <div
                                    className="flex items-center justify-center h-40 bg-slate-900/40 rounded-[1.5rem] border border-white/5 text-muted-foreground group-hover:bg-slate-900/60 transition-all cursor-pointer relative overflow-hidden shadow-inner"
                                    onClick={() => setPreviewDoc(doc)}
                                >
                                    {doc.type.startsWith('image/') ? (
                                        <ImageWithFallback
                                            src={doc.file_url}
                                            fallbackSrc=""
                                            alt={doc.title}
                                            fill
                                            className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="h-10 w-10 opacity-20" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">PREVIEW</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center">
                                        <div className="h-12 w-12 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                            <Eye className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>
                                </div>

                                {doc.expiry_date && (
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-500 italic">
                                            Expira: {new Date(doc.expiry_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-11 border-border/50 hover:bg-primary hover:text-white transition-all shadow-lg hover:shadow-primary/20"
                                        onClick={() => setPreviewDoc(doc)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Ver
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-11 w-11 rounded-xl p-0 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                                        onClick={() => {
                                            const a = document.createElement('a')
                                            a.href = doc.file_url
                                            a.download = doc.title
                                            a.click()
                                        }}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Preview Dialog */}
            <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
                <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden rounded-[2rem] border-none bg-slate-950 shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-900 border-b border-white/5 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-white font-black uppercase tracking-tight flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary" />
                                {previewDoc?.title}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                {previewDoc?.category ? getCategoryBadge(previewDoc.category) : "Documento General"} • {previewDoc && new Date(previewDoc.created_at).toLocaleDateString()}
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mr-10 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest"
                            onClick={() => {
                                if (previewDoc) {
                                    const a = document.createElement('a')
                                    a.href = previewDoc.file_url
                                    a.download = previewDoc.title
                                    a.click()
                                }
                            }}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                        </Button>
                    </DialogHeader>
                    <div className="flex-1 w-full h-[calc(85vh-88px)] bg-slate-900/50 flex items-center justify-center p-4">
                        {previewDoc?.type.includes('pdf') ? (
                            <iframe
                                src={`${previewDoc.file_url}#toolbar=0`}
                                className="w-full h-full rounded-xl border border-white/5 shadow-2xl"
                                title={previewDoc.title}
                            />
                        ) : previewDoc?.type.startsWith('image/') ? (
                            <div className="relative w-full h-full p-4">
                                <ImageWithFallback
                                    src={previewDoc.file_url}
                                    fallbackSrc=""
                                    alt={previewDoc.title}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                    <FileText className="h-10 w-10 text-slate-400" />
                                </div>
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                                    Previsualización no disponible para este tipo de archivo
                                </p>
                                <Button
                                    className="rounded-xl font-black uppercase text-xs tracking-widest"
                                    onClick={() => window.open(previewDoc?.file_url, '_blank')}
                                >
                                    Abrir en nueva pestaña
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
