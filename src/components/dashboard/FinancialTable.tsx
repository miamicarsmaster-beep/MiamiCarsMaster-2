"use client"

import { useState } from "react"
import { FinancialRecord, Vehicle } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, TrendingUp, TrendingDown, Loader2, Save, Eye, Calendar, DollarSign, FileText, X } from "lucide-react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface FinancialTableProps {
    records: FinancialRecord[]
    vehicles: Vehicle[]
}

export function FinancialTable({ records: initialRecords, vehicles }: FinancialTableProps) {
    const [records, setRecords] = useState(initialRecords)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        vehicle_id: "",
        type: "expense" as FinancialRecord["type"],
        category: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
    })

    const resetForm = () => {
        setFormData({
            vehicle_id: "",
            type: "expense",
            category: "",
            amount: "",
            date: new Date().toISOString().split('T')[0],
            description: "",
        })
    }

    const handleAdd = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("financial_records")
                .insert([{
                    ...formData,
                    amount: Number(formData.amount),
                }])
                .select(`
          *,
          vehicle:vehicles(id, make, model, year, license_plate)
        `)
                .single()

            if (error) throw error

            setRecords([data, ...records])
            setIsAddOpen(false)
            resetForm()
            router.refresh()
        } catch (error) {
            console.error("Error adding financial record:", error)
            alert("Error al agregar registro financiero")
        } finally {
            setIsLoading(false)
        }
    }

    const getTypeBadge = (type: FinancialRecord["type"]) => {
        if (type === "income") {
            return (
                <Badge className="bg-emerald-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Ingreso
                </Badge>
            )
        }
        return (
            <Badge className="bg-red-500">
                <TrendingDown className="h-3 w-3 mr-1" />
                Gasto
            </Badge>
        )
    }

    const getTotals = () => {
        const income = records.filter(r => r.type === 'income').reduce((sum, r) => sum + Number(r.amount), 0)
        const expenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + Number(r.amount), 0)
        return { income, expenses, net: income - expenses }
    }

    const totals = getTotals()

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 group hover:from-emerald-500/20 transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Ingresos Consolidados</p>
                    <div className="flex justify-between items-end">
                        <p className="text-3xl font-black italic tracking-tighter text-glow text-emerald-400">${totals.income.toLocaleString()}</p>
                        <TrendingUp className="h-8 w-8 text-emerald-500/30 group-hover:text-emerald-500/50 transition-colors" />
                    </div>
                </div>
                <div className="glass-card p-6 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20 group hover:from-red-500/20 transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Egresos Totales</p>
                    <div className="flex justify-between items-end">
                        <p className="text-3xl font-black italic tracking-tighter text-glow text-red-400">${totals.expenses.toLocaleString()}</p>
                        <TrendingDown className="h-8 w-8 text-red-500/30 group-hover:text-red-500/50 transition-colors" />
                    </div>
                </div>
                <div className="glass-card p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 group hover:from-primary/20 transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Balance Operativo</p>
                    <div className="flex justify-between items-end">
                        <p className="text-3xl font-black italic tracking-tighter text-glow text-primary">${totals.net.toLocaleString()}</p>
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Plus className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-2">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-widest italic">Registros <span className="text-primary">Recientes</span></h3>
                    <p className="text-[10px] text-muted-foreground font-bold">{records.length} Operaciones registradas</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={resetForm}
                            className="h-11 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nueva Operación
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0 bg-transparent shadow-none">
                        <div className="bg-slate-50 dark:bg-slate-950/95 border border-primary/20 flex flex-col max-h-[90vh] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            <div className="relative px-8 py-10 overflow-hidden flex-shrink-0 text-center">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                                <DialogHeader>
                                    <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-3 text-slate-900 dark:text-white">
                                        Registrar <span className="text-secondary text-glow font-black">Operación</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-[11px] font-black text-primary/60 uppercase tracking-[0.3em]">
                                        Inyectar datos financieros al sistema de flota
                                    </DialogDescription>
                                </DialogHeader>
                            </div>
                            <div className="px-10 pb-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Unidad de Transporte</Label>
                                    <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                                        <SelectTrigger className="h-12 bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-bold italic text-sm">
                                            <SelectValue placeholder="Seleccionar vehículo para cargo" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[600] bg-white dark:bg-slate-900 border-primary/20 shadow-2xl">
                                            {vehicles.map((v) => (
                                                <SelectItem key={v.id} value={v.id} className="font-bold uppercase text-[11px] tracking-wider">
                                                    {v.year} {v.make} {v.model} - [{v.license_plate || "No Plate"}]
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Naturaleza</Label>
                                        <Select value={formData.type} onValueChange={(value: FinancialRecord["type"]) => setFormData({ ...formData, type: value })}>
                                            <SelectTrigger className="h-12 bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-black italic uppercase text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="z-[600] bg-white dark:bg-slate-900 border-primary/20 shadow-2xl">
                                                <SelectItem value="income" className="text-emerald-500 font-black tracking-widest text-[11px]">INGRESO (+)</SelectItem>
                                                <SelectItem value="expense" className="text-red-500 font-black tracking-widest text-[11px]">GASTO (-)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Monto Transaccional</Label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-lg">$</span>
                                            <Input
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                className="h-12 pl-10 bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-black italic text-xl tracking-tighter"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Categoría Operativa</Label>
                                        <Input
                                            id="category"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="h-12 bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-bold italic text-sm"
                                            placeholder="Ej: Renta, Seguro, Gas..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Fecha Ejecución</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="h-12 bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-bold italic text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-primary">Detalle Descriptivo</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="bg-slate-200/50 dark:bg-primary/5 border-primary/20 rounded-xl font-bold text-sm p-4 min-h-[100px] resize-none focus:bg-primary/10 transition-all uppercase placeholder:text-[10px] placeholder:tracking-widest"
                                        placeholder="Breve explicación del movimiento..."
                                    />
                                </div>
                            </div>
                            <DialogFooter className="px-10 py-8 border-t border-primary/10 flex items-center justify-end gap-4 bg-primary/[0.02]">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsAddOpen(false)}
                                    className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                >
                                    Abortar
                                </Button>
                                <Button
                                    onClick={handleAdd}
                                    disabled={isLoading || !formData.vehicle_id || !formData.amount || !formData.category}
                                    className="h-12 px-10 rounded-xl bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Confirmar Carga
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="glass-card overflow-x-auto custom-scrollbar">
                <div className="min-w-[800px]">
                    <Table>
                        <TableHeader className="bg-sidebar-accent/30">
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Fecha</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Activo / Unidad</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Categoría</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Detalle</TableHead>
                                <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest py-5">Monto Final</TableHead>
                                <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest py-5 px-6">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic font-medium">
                                        Sin movimientos financieros detectados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                records.map((record) => (
                                    <TableRow key={record.id} className="group hover:bg-primary/5 border-border/20 transition-all">
                                        <TableCell className="py-5">
                                            <div className="text-xs font-bold uppercase opacity-60 tracking-wider">
                                                {new Date(record.date).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black italic text-sm tracking-tight group-hover:text-primary transition-colors uppercase">
                                                    {record.vehicle?.make} {record.vehicle?.model}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground tracking-widest opacity-60">
                                                    ID: {record.vehicle?.license_plate || record.vehicle_id.slice(0, 8)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`rounded-full border-0 px-3 py-1 text-[11px] uppercase font-black italic tracking-widest shadow-lg text-white
                                            ${record.type === 'income' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                                {record.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-xs font-medium opacity-70 italic">
                                            {record.description || "Sin descripción adicional"}
                                        </TableCell>
                                        <TableCell className={`text-right font-black italic text-lg tracking-tighter ${record.type === 'income' ? 'text-emerald-400 text-glow' : 'text-red-400'}`}>
                                            {record.type === 'income' ? '+' : '-'}${Number(record.amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSelectedRecord(record)}
                                                className="h-9 w-9 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal de Detalle */}
            <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 bg-transparent shadow-none">
                    <div className="bg-slate-50 dark:bg-slate-950/95 border border-primary/20 flex flex-col max-h-[90vh] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        {selectedRecord && (
                            <>
                                <div className="relative px-6 md:px-8 py-8 md:py-10 overflow-hidden flex-shrink-0">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                        <div>
                                            <Badge className={`rounded-full border-0 px-3 py-1 text-[10px] uppercase font-black italic tracking-widest shadow-lg text-white mb-4
                                                ${selectedRecord.type === 'income' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                                {selectedRecord.category}
                                            </Badge>
                                            <DialogTitle className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900 dark:text-white mb-2">
                                                {selectedRecord.type === 'income' ? 'Ingreso' : 'Gasto'} <span className="text-primary text-glow">Operativo</span>
                                            </DialogTitle>
                                            <p className="text-[11px] font-black text-primary/60 uppercase tracking-[0.3em]">
                                                Hash ID: {selectedRecord.id.slice(0, 16)}...
                                            </p>
                                        </div>
                                        <div className={`text-right font-black italic text-3xl md:text-4xl tracking-tighter ${selectedRecord.type === 'income' ? 'text-emerald-400 text-glow' : 'text-red-400'}`}>
                                            {selectedRecord.type === 'income' ? '+' : '-'}${Number(selectedRecord.amount).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 md:px-10 pb-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" /> Fecha de Ejecución
                                                </Label>
                                                <p className="text-base md:text-lg font-black italic text-slate-800 dark:text-slate-200">
                                                    {new Date(selectedRecord.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 flex items-center gap-2">
                                                    <DollarSign className="h-3 w-3" /> Asociado a Unidad
                                                </Label>
                                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                                    <p className="font-black italic text-primary uppercase">
                                                        {selectedRecord.vehicle?.make} {selectedRecord.vehicle?.model}
                                                    </p>
                                                    <p className="text-[10px] font-bold opacity-60">PLACA: {selectedRecord.vehicle?.license_plate || 'SIN PLACA'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 flex items-center gap-2">
                                                    <FileText className="h-3 w-3" /> Descripción
                                                </Label>
                                                <p className="text-sm font-bold italic leading-relaxed text-slate-600 dark:text-slate-400 uppercase">
                                                    {selectedRecord.description || "Sin descripción adicional registrada"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 flex items-center gap-2">
                                                Comprobante / Ticket
                                            </Label>
                                            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border-2 border-primary/10 bg-black/5 group">
                                                {selectedRecord.proof_image_url ? (
                                                    <>
                                                        <ImageWithFallback
                                                            src={selectedRecord.proof_image_url}
                                                            fallbackSrc="/placeholder-doc.svg"
                                                            alt="Comprobante"
                                                            fill
                                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                                                            <Button
                                                                variant="outline"
                                                                className="bg-white/10 backdrop-blur-md border-white/20 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                                                                onClick={() => window.open(selectedRecord.proof_image_url!, '_blank')}
                                                            >
                                                                Expandir Imagen
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30">
                                                        <FileText className="h-12 w-12 mb-2" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin Documento</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="px-10 py-8 border-t border-primary/10 flex items-center justify-center bg-primary/[0.02]">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedRecord(null)}
                                        className="h-12 px-12 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-red-500/10 hover:text-red-500 transition-all group"
                                    >
                                        <X className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" /> Cerrar Detalle
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
