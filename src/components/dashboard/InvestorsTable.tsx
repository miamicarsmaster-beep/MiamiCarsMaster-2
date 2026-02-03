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
import { Pencil, Mail, Phone, Trash2 } from "lucide-react"
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Inversores ({investors.length})</h3>
                <p className="text-sm text-muted-foreground">
                    Los inversores se crean con el botón "Crear Inversor"
                </p>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>País</TableHead>
                            <TableHead>Vehículos Asignados</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {investors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No hay inversores registrados
                                </TableCell>
                            </TableRow>
                        ) : (
                            investors.map((investor) => (
                                <TableRow key={investor.id}>
                                    <TableCell className="font-medium">
                                        {investor.full_name || "Sin nombre"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            {investor.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {investor.phone ? (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                {investor.phone}
                                            </div>
                                        ) : (
                                            "—"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {investor.country || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {getVehicleCount(investor.id)} vehículos
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(investor)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                                            onClick={() => confirmDelete(investor)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Eliminar
                                        </Button>
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
