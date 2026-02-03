import { getInvestors } from "@/lib/data/profiles"
import { getVehicles } from "@/lib/data/vehicles"
import { InvestorsTable } from "@/components/dashboard/InvestorsTable"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateInvestorDialog } from "@/components/dashboard/CreateInvestorDialog"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export default async function InvestorsPage() {
    const [investors, vehicles] = await Promise.all([
        getInvestors(),
        getVehicles()
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Inversores</h2>
                    <p className="text-muted-foreground">
                        Administra los inversores de la plataforma
                    </p>
                </div>
                <CreateInvestorDialog />
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
        </div>
    )
}
