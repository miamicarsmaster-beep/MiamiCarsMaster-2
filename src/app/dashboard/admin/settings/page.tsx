"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { checkUserStatus, forceDeleteUser } from "@/app/actions/debug-auth"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
    const [email, setEmail] = useState("")
    const [status, setStatus] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleCheck = async () => {
        if (!email) return
        setIsLoading(true)
        setStatus(null)
        try {
            const result = await checkUserStatus(email)
            setStatus(result)
        } catch (error) {
            toast.error("Error checking status")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to FORCE delete this user? This cannot be undone.")) return
        setIsLoading(true)
        try {
            const result = await forceDeleteUser(email)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("User deleted successfully")
                setStatus(null)
            }
        } catch (error) {
            toast.error("Error deleting user")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h2>
                <p className="text-muted-foreground">Herramientas de diagnóstico y mantenimiento</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Diagnóstico de Usuarios</CardTitle>
                    <CardDescription>Verifica el estado de un usuario y repara cuentas huérfanas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Email del usuario..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button onClick={handleCheck} disabled={isLoading}>
                            Verificar
                        </Button>
                    </div>

                    {status && (
                        <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Estado Auth:</span>
                                <Badge variant={status.status === 'found' ? 'default' : 'destructive'}>
                                    {status.status === 'found' ? 'Existe en Auth' : 'No existe'}
                                </Badge>
                            </div>

                            {status.status === 'found' && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">User ID:</span>
                                        <code className="text-xs bg-muted p-1 rounded">{status.user.id}</code>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Perfil en DB:</span>
                                        <Badge variant={status.profile ? 'default' : 'destructive'}>
                                            {status.profile ? 'Existe' : 'No encontrado (Huérfano)'}
                                        </Badge>
                                    </div>
                                    {status.profile && (
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Rol:</span>
                                            <span>{status.profile.role}</span>
                                        </div>
                                    )}
                                    {status.profileError && (
                                        <div className="text-red-500 text-sm">
                                            Error perfil: {status.profileError}
                                        </div>
                                    )}

                                    <div className="pt-4 border-t">
                                        <Button variant="destructive" onClick={handleDelete} className="w-full">
                                            Forzar Eliminación de Usuario
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2 text-center">
                                            Útil si el usuario existe en Auth pero falló al crear el perfil.
                                            Elimínalo e intenta crearlo de nuevo.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
