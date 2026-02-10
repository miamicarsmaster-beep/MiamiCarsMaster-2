"use client"

import { FileText, Building2, Car, BadgeDollarSign, LayoutDashboard, Wrench, ShieldCheck, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

export function ProcessSection() {
    const steps = [
        {
            icon: Building2,
            title: "ESTRUCTURA LEGAL LLC",
            description: "Constitución de tu empresa en Florida y obtención de EIN. Seguridad jurídica total en USA.",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            icon: Car,
            title: "ADQUISICIÓN ASISTIDA",
            description: "Análisis de mercado y compra de vehículos con alto valor de reventa y tasa de rentabilidad.",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            icon: LayoutDashboard,
            title: "GESTIÓN OPERATIVA",
            description: "Activación en plataformas, seguros comerciales y mantenimiento preventivo certificado.",
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        },
        {
            icon: TrendingUp,
            title: "RENDICIÓN & CASHflow",
            description: "Depósitos mensuales automáticos y acceso directo a tu dashboard de inversor 24/7.",
            color: "text-primary",
            bg: "bg-primary/10"
        }
    ]

    return (
        <section id="como-funciona" className="py-20 md:py-32 bg-slate-50 dark:bg-slate-950/50 relative overflow-hidden">
            <div className="absolute top-1/2 left-0 h-96 w-96 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 -ml-40" />

            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
                    <div className="space-y-4 max-w-2xl">
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-primary italic">Metodología Miami Cars</span>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                            Ciclo de Inversión <br />
                            <span className="text-primary italic">Optimizado.</span>
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest max-w-[300px] leading-relaxed border-l-2 border-primary pl-6">
                        Simplificamos la complejidad legal y operativa para que tu capital trabaje por ti.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex flex-col p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-border/50 hover:border-primary/30 transition-all group"
                        >
                            <div className={`h-16 w-16 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center mb-10 group-hover:scale-110 transition-transform`}>
                                <step.icon className="h-8 w-8" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest mb-4 italic leading-tight">{step.title}</h3>
                            <p className="text-xs font-bold text-muted-foreground leading-relaxed uppercase opacity-70 italic tracking-tighter">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
