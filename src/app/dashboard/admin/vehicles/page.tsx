import { getVehicles } from "@/lib/data/vehicles"
import { getInvestors } from "@/lib/data/profiles"
import { VehiclesGrid } from "@/components/dashboard/VehiclesTable"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export default async function VehiclesPage() {
    // Fetch data with error handling
    try {
        const [vehicles, investors] = await Promise.all([
            getVehicles(),
            getInvestors()
        ])

        console.log('[VehiclesPage] Data loaded - Vehicles:', vehicles.length, 'Investors:', investors.length)

        return (
            <div className="space-y-10">
                <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase font-sans">Flota de <span className="text-primary">Vehículos</span></h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">
                        Gestión de activos de alto rendimiento
                    </p>
                </div>

                <div className="relative">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                    <VehiclesGrid vehicles={vehicles} investors={investors} />
                </div>
            </div>
        )
    } catch (error) {
        console.error('[VehiclesPage] Error loading data:', error)
        throw error // Let error boundary handle it
    }
}
