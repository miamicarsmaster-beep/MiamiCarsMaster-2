import { getInvestors } from "@/lib/data/profiles"
import { getVehicles } from "@/lib/data/vehicles"
import { InvestorsTable } from "@/components/dashboard/InvestorsTable"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export default async function InvestorsPage() {
    const [investors, vehicles] = await Promise.all([
        getInvestors(),
        getVehicles()
    ])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gestión de Inversores</h2>
                <p className="text-muted-foreground">
                    Administra los inversores de la plataforma
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Inversores</CardTitle>
                    <CardDescription>
                        Edita información de inversores y visualiza sus vehículos asignados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <InvestorsTable investors={investors} vehicles={vehicles} />
                </CardContent>
            </Card>

            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base">💡 Cómo agregar un nuevo inversor</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Ve a <strong>Supabase Dashboard → Authentication → Users</strong></p>
                    <p>2. Click en <strong>&quot;Add User&quot;</strong> y crea el usuario con email y contraseña</p>
                    <p>3. El perfil se creará automáticamente con rol &quot;investor&quot;</p>
                    <p>4. Regresa aquí para editar su información y asignarle vehículos</p>
                </CardContent>
            </Card>
        </div>
    )
}
