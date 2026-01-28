"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Eye, FolderOpen, File, Image as ImageIcon } from "lucide-react"
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
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Mis Documentos</h2>
                <p className="text-muted-foreground">
                    Accede a todos los documentos relacionados con tus vehículos
                </p>
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
                    const count = documents.filter(d => d.category === cat.value).length
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
                                ? "No tienes documentos disponibles"
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
                                        {getCategoryBadge(doc.category)}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-center h-24 bg-muted rounded-lg text-muted-foreground">
                                    {getFileIcon(doc.type)}
                                </div>

                                {doc.expiry_date && (
                                    <div className="text-xs text-muted-foreground">
                                        Vence: {new Date(doc.expiry_date).toLocaleDateString()}
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
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
