import { createClient } from "@/lib/supabase/server"

export interface InvestorVehicleFinancials {
    vehicleId: string
    make: string
    model: string
    licensePlate: string | null
    imageUrl: string | null
    totalIncome: number
    totalExpenses: number
    netBalance: number
    transactionCount: number
}

export interface InvestorFinancialSummary {
    investorId: string
    investorName: string | null
    investorEmail: string
    vehicleCount: number
    totalIncome: number
    totalExpenses: number
    netBalance: number
    vehicles: InvestorVehicleFinancials[]
    lastTransactionDate: string | null
}

/**
 * Get financial summary for all investors or a specific investor
 */
export async function getInvestorFinancialSummary(investorId?: string): Promise<InvestorFinancialSummary[]> {
    const supabase = await createClient()

    // Get all investors or specific investor
    let investorsQuery = supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'investor')

    if (investorId) {
        investorsQuery = investorsQuery.eq('id', investorId)
    } else {
        investorsQuery = investorsQuery.order('full_name', { ascending: true })
    }

    const { data: investors, error: investorsError } = await investorsQuery

    if (investorsError) {
        console.error('Error fetching investors:', investorsError)
        return []
    }

    if (!investors || investors.length === 0) {
        return []
    }

    // Get all vehicles with their assigned investors
    const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, assigned_investor_id, image_url')
        .not('assigned_investor_id', 'is', null)

    if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError)
    }

    const allVehicles = vehicles || []

    // Get all financial records
    const vehicleIds = allVehicles.map(v => v.id)

    let financialRecords: any[] = []
    if (vehicleIds.length > 0) {
        const { data: records, error: recordsError } = await supabase
            .from('financial_records')
            .select('vehicle_id, type, amount, date')
            .in('vehicle_id', vehicleIds)

        if (recordsError) {
            console.error('Error fetching financial records:', recordsError)
        } else {
            financialRecords = records || []
        }
    }

    // Build summary for each investor
    const summaries: InvestorFinancialSummary[] = investors.map(investor => {
        // Get vehicles for this investor
        const investorVehicles = allVehicles.filter(v => v.assigned_investor_id === investor.id)

        // Calculate financials for each vehicle
        const vehicleFinancials: InvestorVehicleFinancials[] = investorVehicles.map(vehicle => {
            const vehicleRecords = financialRecords.filter(r => r.vehicle_id === vehicle.id)

            const income = vehicleRecords
                .filter(r => r.type === 'income')
                .reduce((sum, r) => sum + Number(r.amount), 0)

            const expenses = vehicleRecords
                .filter(r => r.type === 'expense')
                .reduce((sum, r) => sum + Number(r.amount), 0)

            return {
                vehicleId: vehicle.id,
                make: vehicle.make,
                model: vehicle.model,
                licensePlate: vehicle.license_plate,
                imageUrl: (vehicle as any).image_url,
                totalIncome: income,
                totalExpenses: expenses,
                netBalance: income - expenses,
                transactionCount: vehicleRecords.length
            }
        })

        // Calculate investor totals
        const totalIncome = vehicleFinancials.reduce((sum, v) => sum + v.totalIncome, 0)
        const totalExpenses = vehicleFinancials.reduce((sum, v) => sum + v.totalExpenses, 0)

        // Get last transaction date for this investor's vehicles
        const investorVehicleIds = investorVehicles.map(v => v.id)
        const investorRecords = financialRecords.filter(r => investorVehicleIds.includes(r.vehicle_id))
        const lastTransactionDate = investorRecords.length > 0
            ? investorRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
            : null

        return {
            investorId: investor.id,
            investorName: investor.full_name,
            investorEmail: investor.email,
            vehicleCount: investorVehicles.length,
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
            vehicles: vehicleFinancials,
            lastTransactionDate
        }
    })

    // Sort by net balance descending (highest balance first)
    return summaries.sort((a, b) => b.netBalance - a.netBalance)
}

/**
 * Get monthly financial summary for a specific investor
 */
export async function getInvestorMonthlyFinancials(investorId: string, months: number = 6) {
    const supabase = await createClient()

    // Get investor's vehicles
    const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('assigned_investor_id', investorId)

    if (!vehicles || vehicles.length === 0) {
        return []
    }

    const vehicleIds = vehicles.map(v => v.id)

    // Get financial records for the last N months
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const { data: records } = await supabase
        .from('financial_records')
        .select('type, amount, date')
        .in('vehicle_id', vehicleIds)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true })

    if (!records) {
        return []
    }

    // Group by month
    const monthlyData: Record<string, { income: number; expenses: number }> = {}

    records.forEach(record => {
        const date = new Date(record.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 }
        }

        if (record.type === 'income') {
            monthlyData[monthKey].income += Number(record.amount)
        } else {
            monthlyData[monthKey].expenses += Number(record.amount)
        }
    })

    // Convert to array and calculate net
    return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
    }))
}
