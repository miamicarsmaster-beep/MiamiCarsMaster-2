"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Zap, Star, CheckCircle2 } from "lucide-react"

export function ExperienceSection() {
    return (
        <section className="py-32 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        {/* Decorative background for the image */}
                        <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-transparent rounded-[3rem] blur-2xl opacity-50" />

                        <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group">
                            <img
                                src="/mustang-silver.jpg"
                                alt="Mustang Silver Miami"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Floating Badge */}
                            <div className="absolute top-8 left-8 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl flex items-center gap-3 shadow-2xl">
                                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white">
                                    <Star className="h-5 w-5 fill-current" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Premium Fleet</p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-white/60 mt-1">Verified Miami Assets</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-10"
                    >
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">Activos Tangibles</span>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                                Calidad que <br />
                                <span className="text-primary italic">genera renta.</span>
                            </h2>
                        </div>

                        <p className="text-lg text-muted-foreground font-medium leading-relaxed uppercase opacity-70 italic tracking-tighter">
                            Seleccionamos minuciosamente cada vehículo de nuestra flota para garantizar
                            no solo una experiencia premium al usuario, sino una alta tasa de retención
                            de valor y rentabilidad constante para el inversor.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                "Seguros Comerciales Full",
                                "Mantenimiento Certificado",
                                "Custodia en Miami Base",
                                "Valuación Real Mensual"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 group">
                                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-10 flex items-center gap-10">
                            <div>
                                <h4 className="text-3xl font-black italic tracking-tighter">+150k</h4>
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-1">Millas gestionadas</p>
                            </div>
                            <div className="h-10 w-[1px] bg-border/50" />
                            <div>
                                <h4 className="text-3xl font-black italic tracking-tighter">98%</h4>
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-1">Uptime de flota</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
