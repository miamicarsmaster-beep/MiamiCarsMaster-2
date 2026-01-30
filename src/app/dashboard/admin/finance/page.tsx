import { getFinancialRecords } from "@/lib/data/financial"
import { getVehicles } from "@/lib/data/vehicles"
import { FinancialTable } from "@/components/dashboard/FinancialTable"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export default async function FinancePage() {
    const [records, vehicles] = await Promise.all([
        getFinancialRecords(),
        getVehicles()
    ])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gestión Financiera</h2>
                <p className="text-muted-foreground">
                    Registra ingresos y gastos de la flota
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transacciones</CardTitle>
                    <CardDescription>
                        Historial completo de ingresos y gastos por vehículo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FinancialTable records={records} vehicles={vehicles} />
                </CardContent>
            </Card>
        </div>
    )
}
