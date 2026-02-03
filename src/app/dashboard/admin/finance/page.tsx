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
        <div className="space-y-10">
            <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase">Gestión <span className="text-primary">Financiera</span></h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">
                    Control de ingresos y flujo de caja operativo
                </p>
            </div>

            <div className="glass-card p-1 shadow-2xl">
                <div className="p-8 border-b border-border/40">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary">Historial de Transacciones</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Auditoría completa de movimientos financieros por unidad</p>
                </div>
                <div className="p-4">
                    <FinancialTable records={records} vehicles={vehicles} />
                </div>
            </div>
        </div>
    )
}
