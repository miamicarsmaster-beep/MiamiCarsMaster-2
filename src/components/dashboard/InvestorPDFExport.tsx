"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { InvestorFinancialSummary, InvestorVehicleFinancials } from "@/lib/data/investor-financials"

interface InvestorPDFExportProps {
    investor: InvestorFinancialSummary
    transactions: any[]
    monthlyBreakdown: Array<{
        month: string
        income: number
        expenses: number
        net: number
    }>
}

export function InvestorPDFExport({ investor, transactions, monthlyBreakdown }: InvestorPDFExportProps) {
    const handleExportPDF = async () => {
        // Dynamically import jsPDF to avoid SSR issues
        const { default: jsPDF } = await import('jspdf')
        const { default: autoTable } = await import('jspdf-autotable')

        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text('REPORTE FINANCIERO', 105, 20, { align: 'center' })

        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text('Miami Cars Investments', 105, 28, { align: 'center' })

        // Investor Info
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`Inversor: ${investor.investorName || 'Sin nombre'}`, 20, 45)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Email: ${investor.investorEmail}`, 20, 52)
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 58)

        // Summary Box
        doc.setFillColor(240, 240, 240)
        doc.rect(20, 65, 170, 35, 'F')

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('RESUMEN FINANCIERO', 25, 72)

        doc.setFont('helvetica', 'normal')
        doc.text(`Vehículos: ${investor.vehicleCount}`, 25, 80)
        doc.text(`Ingresos: $${investor.totalIncome.toLocaleString()}`, 25, 87)
        doc.text(`Gastos: $${investor.totalExpenses.toLocaleString()}`, 25, 94)

        doc.setFont('helvetica', 'bold')
        const balanceColor: [number, number, number] = investor.netBalance >= 0 ? [0, 128, 0] : [255, 0, 0]
        doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2])
        doc.text(`Balance Neto: $${investor.netBalance.toLocaleString()}`, 100, 87)
        doc.setTextColor(0, 0, 0)

        let yPosition = 110
        const pageHeight = doc.internal.pageSize.height
        const margin = 20

        // Helpers
        const checkPageHeight = (needed: number) => {
            if (yPosition + needed > pageHeight - margin) {
                doc.addPage()
                yPosition = margin
                return true
            }
            return false
        }

        // 1. Consolidated Summary Table
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('RESUMEN CONSOLIDADO', margin, yPosition)
        yPosition += 5

        autoTable(doc, {
            startY: yPosition,
            head: [['Concepto', 'Total']],
            body: [
                ['Vehículos Gestionados', `${investor.vehicleCount}`],
                ['Total Ingresos Históricos', `$${investor.totalIncome.toLocaleString()}`],
                ['Total Gastos Históricos', `$${investor.totalExpenses.toLocaleString()}`],
                ['Balance Neto Actual', `$${investor.netBalance.toLocaleString()}`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [45, 45, 45], fontSize: 10 },
            bodyStyles: { fontSize: 10, cellPadding: 5 },
            columnStyles: {
                1: { halign: 'right', fontStyle: 'bold' }
            }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 15

        // 2. Vehicles Detail Section (Card-like layout in PDF)
        if (investor.vehicles.length > 0) {
            checkPageHeight(20)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('ESTADO POR VEHÍCULO', margin, yPosition)
            yPosition += 8

            for (const v of investor.vehicles) {
                checkPageHeight(45)

                // Vehicle Box
                doc.setFillColor(248, 248, 248)
                doc.setDrawColor(220, 220, 220)
                doc.roundedRect(margin, yPosition, 170, 35, 3, 3, 'FD')

                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(0, 0, 0)
                doc.text(`${v.make} ${v.model}`, margin + 8, yPosition + 10)

                doc.setFontSize(9)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(100, 100, 100)
                doc.text(`Patente/ID: ${v.licensePlate || 'N/A'}`, margin + 8, yPosition + 16)

                // Mini Stats in box
                doc.setFontSize(9)
                doc.setTextColor(0, 0, 0)
                doc.text(`Ingresos: +$${v.totalIncome.toLocaleString()}`, margin + 8, yPosition + 26)
                doc.text(`Gastos: -$${v.totalExpenses.toLocaleString()}`, margin + 60, yPosition + 26)

                doc.setFont('helvetica', 'bold')
                const vBalanceColor = v.netBalance >= 0 ? [0, 100, 0] : [150, 0, 0]
                doc.setTextColor(vBalanceColor[0], vBalanceColor[1], vBalanceColor[2])
                doc.text(`Balance: $${v.netBalance.toLocaleString()}`, margin + 120, yPosition + 26)

                doc.setFontSize(8)
                doc.setTextColor(150, 150, 150)
                doc.text(`${v.transactionCount} transacciones registradas`, margin + 8, yPosition + 31)

                doc.setTextColor(0, 0, 0)
                yPosition += 42
            }
        }

        // 3. Monthly Evolution
        if (monthlyBreakdown.length > 0) {
            checkPageHeight(30)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('EVOLUCIÓN MENSUAL', margin, yPosition)
            yPosition += 5

            const monthlyData = monthlyBreakdown.map(m => [
                new Date(m.month + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase(),
                `$${m.income.toLocaleString()}`,
                `$${m.expenses.toLocaleString()}`,
                `$${m.net.toLocaleString()}`
            ])

            autoTable(doc, {
                startY: yPosition,
                head: [['Mes', 'Ingresos', 'Gastos', 'Resultado Neto']],
                body: monthlyData,
                theme: 'grid',
                headStyles: { fillColor: [60, 60, 60], fontSize: 9, fontStyle: 'bold' },
                bodyStyles: { fontSize: 8.5 },
                columnStyles: {
                    1: { halign: 'right' },
                    2: { halign: 'right' },
                    3: { halign: 'right', fontStyle: 'bold' }
                }
            })

            yPosition = (doc as any).lastAutoTable.finalY + 15
        }

        // 4. Full Transactions History
        if (transactions.length > 0) {
            checkPageHeight(30)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('HISTORIAL COMPLETO DE MOVIMIENTOS', margin, yPosition)
            yPosition += 5

            const transactionData = transactions.map(t => [
                new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                `${t.vehicle?.make || ''} ${t.vehicle?.model || ''}`.trim() || 'N/A',
                t.category.toUpperCase(),
                t.description || '—',
                t.type === 'income' ? 'INGRESO' : 'GASTO',
                `${t.type === 'income' ? '+' : '-'}$${Number(t.amount).toLocaleString()}`
            ])

            autoTable(doc, {
                startY: yPosition,
                head: [['Fecha', 'Vehículo', 'Categoría', 'Descripción', 'Tipo', 'Monto']],
                body: transactionData,
                theme: 'striped',
                headStyles: { fillColor: [45, 45, 45], fontSize: 8, fontStyle: 'bold' },
                bodyStyles: { fontSize: 7.5 },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 45 },
                    4: { cellWidth: 15, halign: 'center' },
                    5: { halign: 'right', cellWidth: 25, fontStyle: 'bold' }
                },
                didParseCell: function (data) {
                    if (data.section === 'body' && data.column.index === 5) {
                        const text = data.cell.text[0]
                        if (text.startsWith('+')) {
                            data.cell.styles.textColor = [0, 128, 0]
                        } else if (text.startsWith('-')) {
                            data.cell.styles.textColor = [200, 0, 0]
                        }
                    }
                }
            })
        }

        // Footer
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'italic')
            doc.setTextColor(150, 150, 150)
            doc.text(
                `Miami Cars Investments Corporate Report - Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleString('es-ES')}`,
                105,
                287,
                { align: 'center' }
            )

            // Subtle border
            doc.setDrawColor(240, 240, 240)
            doc.line(10, 282, 200, 282)
        }

        // Save PDF
        const fileName = `Reporte_Completo_${investor.investorName?.replace(/\s+/g, '_') || 'Inversor'}_${new Date().toISOString().split('T')[0]}.pdf`
        doc.save(fileName)
    }

    return (
        <Button
            onClick={handleExportPDF}
            className="rounded-xl h-10 font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg"
        >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
        </Button>
    )
}
