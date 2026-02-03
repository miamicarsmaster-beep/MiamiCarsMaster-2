"use client"

import { useState } from "react"
import { Profile, Vehicle } from "@/types/database"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Mail, Phone, Trash2, Car } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { resetPassword } from "@/app/actions/reset-password"
import { deleteInvestor } from "@/app/actions/delete-investor"
import { toast } from "sonner"

interface InvestorsTableProps {
    investors: Profile[]
    vehicles: Vehicle[]
}

export function InvestorsTable({ investors: initialInvestors, vehicles }: InvestorsTableProps) {
    const [investors, setInvestors] = useState(initialInvestors)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedInvestor, setSelectedInvestor] = useState<Profile | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [investorToDelete, setInvestorToDelete] = useState<Profile | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        country: "",
    })
    const [newPassword, setNewPassword] = useState("")

    const resetForm = () => {
        setFormData({
            full_name: "",
            phone: "",
            country: "",
        })
        setNewPassword("")
    }

    const handleEdit = async () => {
        if (!selectedInvestor) return
        setIsLoading(true)
        try {
            // Update profile info
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    country: formData.country,
                })
                .eq("id", selectedInvestor.id)

            if (error) throw error

            // Update password if provided
            if (newPassword) {
                const passResult = await resetPassword(selectedInvestor.id, newPassword)
                if (passResult?.error) {
                    toast.error("Error al restablecer contraseña: " + passResult.error)
                } else {
                    toast.success("Contraseña actualizada")
                }
            }

            // Update local state
            setInvestors(investors.map(inv =>
                inv.id === selectedInvestor.id
                    ? { ...inv, ...formData }
                    : inv
            ))

            setIsEditOpen(false)
            setSelectedInvestor(null)
            resetForm()
            router.refresh()
            toast.success("Inversor actualizado")
        } catch (error: any) {
            console.error("Error updating investor:", error)
            toast.error("Error al actualizar inversor")
        } finally {
            setIsLoading(false)
        }
    }

    const confirmDelete = (investor: Profile) => {
        setInvestorToDelete(investor)
        setIsDeleteOpen(true)
    }

    const handleDelete = async () => {
        if (!investorToDelete) return
        setIsLoading(true)
        try {
            const result = await deleteInvestor(investorToDelete.id)

            if (result?.error) {
                toast.error("Error al eliminar inversor: " + result.error)
            } else {
                setInvestors(investors.filter(inv => inv.id !== investorToDelete.id))
                toast.success("Inversor eliminado exitosamente")
                router.refresh()
                setIsDeleteOpen(false)
                setInvestorToDelete(null)
            }
        } catch (error) {
            console.error("Error deleting investor:", error)
            toast.error("Error al eliminar inversor")
        } finally {
            setIsLoading(false)
        }
    }

    const openEditDialog = (investor: Profile) => {
        setSelectedInvestor(investor)
        setFormData({
            full_name: investor.full_name || "",
            phone: investor.phone || "",
            country: investor.country || "",
        })
        setNewPassword("")
        setIsEditOpen(true)
    }

    const getVehicleCount = (investorId: string) => {
        return vehicles.filter(v => v.assigned_investor_id === investorId).length
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2 mb-8 px-2 mt-4">
                <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent uppercase italic">
                    Gestión de <span className="text-primary">Inversores</span>
                </h2>
                <p className="text-muted-foreground font-bold tracking-widest text-xs uppercase opacity-70">Base de datos de socios estratégicos • {investors.length} registros</p>
            </div>

            <div className="glass-card overflow-hidden shadow-2xl">
                <Table>
                    <TableHeader className="bg-sidebar-accent/50">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="font-bold uppercase text-xs tracking-widest py-5">Nombre / Identidad</TableHead>
                            <TableHead className="font-bold uppercase text-xs tracking-widest py-5">Contacto</TableHead>
                            <TableHead className="font-bold uppercase text-xs tracking-widest py-5">Ubicación</TableHead>
                            <TableHead className="font-bold uppercase text-xs tracking-widest py-5">Patrimonio (Autos)</TableHead>
                            <TableHead className="text-right font-bold uppercase text-xs tracking-widest py-5 px-6">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {investors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                    No hay inversores en la base de datos
                                </TableCell>
                            </TableRow>
                        ) : (
                            investors.map((investor) => (
                                <TableRow key={investor.id} className="group hover:bg-primary/5 transition-all border-border/30">
                                    <TableCell className="py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base tracking-tight group-hover:text-primary transition-colors">
                                                {investor.full_name || "Sin nombre"}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium opacity-70 italic">
                                                {investor.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-sm font-medium opacity-80">
                                            {investor.phone ? (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-primary" />
                                                    {investor.phone}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">—</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded-md bg-sidebar-accent/20 border-border/50 text-sm uppercase font-bold tracking-tighter">
                                            {investor.country || "Internacional"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <Car className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="font-black italic text-xl tracking-tighter">
                                                {getVehicleCount(investor.id)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-2 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 w-9 p-0 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
                                                onClick={() => openEditDialog(investor)}
                                                title="Editar Perfil"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 w-9 p-0 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                onClick={() => confirmDelete(investor)}
                                                title="Eliminar Inversor"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Inversor</DialogTitle>
                        <DialogDescription>
                            Actualiza la información del inversor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Nombre Completo</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Juan Pérez"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 305 123 4567"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">País</Label>
                            <Input
                                id="country"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                placeholder="Argentina"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email (No editable)</Label>
                            <Input value={selectedInvestor?.email || ""} disabled />
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                            <Label htmlFor="password">Nueva Contraseña (Opcional)</Label>
                            <Input
                                id="password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Dejar en blanco para mantener actual"
                            />
                            <p className="text-xs text-muted-foreground">Escribe una nueva contraseña solo si deseas cambiarla.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEdit} disabled={isLoading}>
                            {isLoading ? "Actualizando..." : "Actualizar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Estás seguro?</DialogTitle>
                        <DialogDescription>
                            Esta acción eliminará permanentemente al inversor <strong>{investorToDelete?.full_name || investorToDelete?.email}</strong> y no se puede deshacer.
                            Los vehículos asignados quedarán sin inversor asignado.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                            {isLoading ? "Eliminando..." : "Eliminar Inversor"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
