"use client"

import { Rocket, ShieldCheck, TrendingUp, Users } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export function TuroSection() {
    const benefits = [
        {
            icon: TrendingUp,
            title: "MAXIMIZACIÓN DE INGRESOS",
            description: "Algoritmos dinámicos de precios que se ajustan a la demanda del mercado en tiempo real.",
            color: "text-emerald-500 bg-emerald-500/10"
        },
        {
            icon: ShieldCheck,
            title: "SEGURIDAD TOTAL",
            description: "Cobertura de seguro premium y verificación rigurosa de cada conductor.",
            color: "text-blue-500 bg-blue-500/10"
        },
        {
            icon: Users,
            title: "ALCANCE GLOBAL",
            description: "Acceso a una red masiva de usuarios verificados listos para rentar tu vehículo.",
            color: "text-purple-500 bg-purple-500/10"
        }
    ]

    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="w-full lg:w-1/2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="text-xs font-black uppercase tracking-[0.4em] text-primary italic">
                                Alianza Estratégica
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none mt-4 text-foreground flex flex-wrap items-center gap-x-4">
                                Power of <span className="relative h-12 w-40 inline-block"><Image src="/turo-logo.png" alt="Turo" fill className="object-contain" /></span>
                            </h2>
                            <p className="text-lg text-muted-foreground font-medium leading-relaxed uppercase opacity-70 italic tracking-tighter mt-6">
                                Maximizamos el rendimiento de tu flota utilizando la plataforma de car sharing número 1 del mundo.
                                Tu vehículo no solo se renta, se posiciona estratégicamente para generar el mayor retorno posible.
                            </p>
                        </motion.div>

                        <div className="grid gap-6">
                            {benefits.map((benefit, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                                >
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${benefit.color}`}>
                                        <benefit.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider italic text-foreground">
                                            {benefit.title}
                                        </h3>
                                        <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 italic tracking-tight mt-1">
                                            {benefit.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 relative">
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative z-10 p-8 rounded-[3rem] border border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl"
                        >
                            <div className="bg-gradient-to-br from-[#593CFB] to-[#3B28A8] rounded-[2rem] p-10 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Rocket className="w-64 h-64" />
                                </div>

                                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2 relative z-10">
                                    Gestión
                                    <br />
                                    Integral
                                </h3>

                                <div className="mt-8 space-y-4 relative z-10">
                                    <div className="flex justify-between items-end border-b border-white/20 pb-2">
                                        <span className="font-bold uppercase tracking-widest text-sm opacity-80">Optimización</span>
                                        <span className="text-xl font-black italic">CONTINUA</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-white/20 pb-2">
                                        <span className="font-bold uppercase tracking-widest text-sm opacity-80">Cobertura</span>
                                        <span className="text-xl font-black italic">PREMIUM</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-white/20 pb-2">
                                        <span className="font-bold uppercase tracking-widest text-sm opacity-80">Soporte</span>
                                        <span className="text-xl font-black italic">24/7</span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/20">
                                    <p className="text-xs font-medium uppercase tracking-widest opacity-80 leading-relaxed">
                                        Gestión profesional de perfil, fotos de alta calidad y atención al cliente 24/7 para garantizar evaluaciones de 5 estrellas.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    )
}
