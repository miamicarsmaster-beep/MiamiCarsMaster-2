"use client"

import { Zap, Globe, Lock, Smartphone, LayoutDashboard, FileText, Wrench, BadgeDollarSign } from "lucide-react"
import { motion } from "framer-motion"

export function BenefitsSection() {
    const systemFeatures = [
        {
            icon: LayoutDashboard,
            title: "DASHBOARD OPERATIVO",
            description: "Vista 360° de tus activos. Ocupación, ubicación y estado de salud en tiempo real.",
            color: "text-primary"
        },
        {
            icon: BadgeDollarSign,
            title: "LIBRO DE FINANZAS",
            description: "Desglose diario de ingresos y gastos. Reportes PDF mensuales con un clic.",
            color: "text-emerald-500"
        },
        {
            icon: FileText,
            title: "VAULT DOCUMENTAL",
            description: "Títulos, registros, seguros y contratos centralizados y protegidos bajo cifrado.",
            color: "text-blue-500"
        },
        {
            icon: Wrench,
            title: "TRACK DE MANTENIMIENTO",
            description: "Historial completo de servicios con fotos de recibos y certificación técnica.",
            color: "text-orange-500"
        }
    ]

    return (
        <section id="beneficios" className="py-32 bg-background overflow-hidden transition-colors duration-500">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Ventaja Tecnológica</span>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none mt-4 text-foreground">
                                Tu Dashboard <br />
                                <span className="text-primary italic">tu tranquilidad.</span>
                            </h2>
                        </div>
                        <p className="text-lg text-muted-foreground font-medium leading-relaxed uppercase opacity-70 italic tracking-tighter">
                            Nuestra plataforma v2.0 Premium Ops no solo gestiona tus vehículos,
                            te da el control absoluto de tu inversión desde cualquier parte del mundo.
                            Transparencia radical en cada milla recorrida y cada dólar generado.
                        </p>

                        <div className="pt-6 border-t border-border/50">
                            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-emerald-500 italic">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Sistema Verificado v4.0 Active Support
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                        {/* Decorative background element */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                        {systemFeatures.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="p-8 rounded-[2rem] border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl hover:border-primary/30 transition-all group relative z-10"
                            >
                                <div className={`h-14 w-14 rounded-2xl bg-background shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                                    <feature.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest mb-3 italic leading-tight text-foreground">{feature.title}</h3>
                                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase opacity-70 italic tracking-tight">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
