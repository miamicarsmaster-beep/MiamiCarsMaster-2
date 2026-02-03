"use client"

import { Button } from "@/components/ui/button"
import { FinancialRecord } from "@/types/database"
import { toast } from "sonner"
import { Download } from "lucide-react"

interface DownloadReportButtonProps {
    data: any[]
}

export function DownloadReportButton({ data }: DownloadReportButtonProps) {
    const handleDownload = () => {
        if (!data || data.length === 0) {
            toast.error("No hay datos disponibles para el reporte de este mes.")
            return
        }

        try {
            // Create CSV content
            const headers = ["Fecha", "Tipo", "Categoría", "Vehículo", "Monto", "Descripción"]
            const csvRows = [
                headers.join(","),
                ...data.map(record => {
                    const vehicleName = record.vehicle ? `${record.vehicle.make} ${record.vehicle.model}` : "N/A"
                    return [
                        new Date(record.date).toLocaleDateString(),
                        record.type === 'income' ? 'Ingreso' : 'Egreso',
                        record.category,
                        `"${vehicleName}"`,
                        record.amount,
                        `"${record.description || ''}"`
                    ].join(",")
                })
            ]
            const csvContent = csvRows.join("\n")

            // Create blob and download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            const fileName = `Reporte_Mensual_${new Date().getMonth() + 1}_${new Date().getFullYear()}.csv`

            link.setAttribute("href", url)
            link.setAttribute("download", fileName)
            link.style.visibility = "hidden"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success("Reporte generado y descargado exitosamente.")
        } catch (error) {
            console.error("Error generating report:", error)
            toast.error("Error al generar el reporte.")
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleDownload}
            className="rounded-full h-12 px-6 font-black uppercase tracking-widest text-xs border-primary/20 bg-primary/5 hover:bg-primary/10"
        >
            <Download className="h-4 w-4 mr-2" />
            Descargar Reporte Mes
        </Button>
    )
}
