"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, TrendingUp, CarFront, Zap, FileText, LayoutDashboard } from "lucide-react"
import { motion } from "framer-motion"

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
            {/* Background Image with Dark Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/hero-mustang.jpg"
                    alt="Miami Luxury Investment"
                    className="w-full h-full object-cover opacity-60 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950/50" />
            </div>

            <div className="container mx-auto px-6 relative z-10 pt-20">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] mb-10"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                        Inversión Estratégica & Rendimiento v2.0
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl sm:text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white mb-8 leading-[0.85] uppercase italic"
                    >
                        Tu capital, <br />
                        <span className="text-primary italic">nuestra operativa.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
                    >
                        Gestionamos flotas de lujo en Miami con transparencia total.
                        Desde la creación de tu LLC hasta la rendición mensual
                        en tiempo real. <span className="text-white font-bold italic">La inversión que puedes ver rodar.</span>
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24"
                    >
                        <Link href="#contacto">
                            <Button size="lg" className="h-16 px-12 text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/40 rounded-2xl bg-primary hover:scale-105 transition-all">
                                Comenzar ahora <ArrowRight className="ml-3 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="#como-funciona">
                            <Button variant="outline" size="lg" className="h-16 px-12 text-xs font-black uppercase tracking-widest rounded-2xl border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/40 transition-all">
                                Explorar Sistema
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Features Badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4"
                    >
                        {[
                            { icon: LayoutDashboard, label: "Dashboard 24/7" },
                            { icon: ShieldCheck, label: "Estructura LLC" },
                            { icon: FileText, label: "Vault Documental" },
                            { icon: Zap, label: "APY Optimizado" },
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 group hover:bg-white/10 transition-all">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <feat.icon className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{feat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
                <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent shadow-[0_0_10px_white]" />
            </div>
        </section>
    )
}
