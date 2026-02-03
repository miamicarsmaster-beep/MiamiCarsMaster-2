"use client"

import { motion } from "framer-motion"
import { LayoutDashboard, BadgeDollarSign, FileText, Wrench, ShieldCheck, Zap } from "lucide-react"

export function SystemPreview() {
    const screens = [
        {
            title: "DASHBOARD REAL-TIME",
            description: "Control total de ocupación y ubicación GPS de cada activo.",
            icon: LayoutDashboard,
            color: "border-primary"
        },
        {
            title: "RENTABILIDAD APY",
            description: "Algoritmos que optimizan tarifas para maximizar tu retorno.",
            icon: BadgeDollarSign,
            color: "border-emerald-500"
        },
        {
            title: "VAULT JURÍDICO",
            description: "Seguridad bancaria para tus títulos y reportes fiscales.",
            icon: FileText,
            color: "border-blue-500"
        }
    ]

    return (
        <section className="py-32 bg-slate-950 overflow-hidden relative">
            {/* Decorative Lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-primary via-transparent to-transparent" />
                <div className="absolute top-0 left-2/4 w-[1px] h-full bg-gradient-to-b from-blue-500 via-transparent to-transparent opacity-50" />
                <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-primary via-transparent to-transparent" />
            </div>

            <div className="container mx-auto px-6">
                <div className="text-center mb-24">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 italic">System Architecture v2.0 Premium Ops</span>
                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic text-white mt-6">
                        Funcionalidades <span className="text-primary italic">Sin Fronteras.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {screens.map((screen, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className={`p-10 bg-white/5 backdrop-blur-3xl rounded-[3rem] border-l-4 ${screen.color} hover:bg-white/10 transition-all group`}
                        >
                            <div className="flex items-center gap-6 mb-8 text-white">
                                <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                    <screen.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-widest italic">{screen.title}</h3>
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase leading-relaxed italic tracking-tighter">
                                {screen.description}
                            </p>

                            <div className="mt-10 pt-8 border-t border-white/5 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Security Verified</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    )
}
