import { getVehicles } from "@/lib/data/vehicles"
import { getInvestors } from "@/lib/data/profiles"
import { VehiclesGrid } from "@/components/dashboard/VehiclesTable"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function VehiclesPage() {
    // Fetch data with error handling
    try {
        const [vehicles, investors] = await Promise.all([
            getVehicles(),
            getInvestors()
        ])

        console.log('[VehiclesPage] Data loaded - Vehicles:', vehicles.length, 'Investors:', investors.length)

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Flota</h2>
                    <p className="text-muted-foreground">
                        Administra todos los vehículos de la plataforma
                    </p>
                </div>

                <VehiclesGrid vehicles={vehicles} investors={investors} />
            </div>
        )
    } catch (error) {
        console.error('[VehiclesPage] Error loading data:', error)
        throw error // Let error boundary handle it
    }
}
