"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { motion } from "framer-motion"

export function ContactSection() {
    return (
        <section id="contacto" className="py-24 md:py-40 bg-slate-950 text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -px-20 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

            <div className="container mx-auto px-6 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto space-y-8 md:space-y-10"
                >
                    <span className="text-xs font-black uppercase tracking-[0.5em] text-primary italic">Asesoría VIP 24/7</span>
                    <h2 className="text-4xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">
                        Escala tu capital <br />
                        <span className="text-primary italic">en miami.</span>
                    </h2>

                    <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto mb-16 uppercase italic tracking-tighter">
                        Agenda una consulta directa con nuestros especialistas hoy mismo.
                        Descubre por qué somos la opción n°1 para inversores internacionales.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Button
                            asChild
                            size="lg"
                            className="h-20 px-12 text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/40 rounded-2xl bg-[#25D366] hover:bg-[#25D366]/90 hover:scale-105 transition-all text-white border-0"
                        >
                            <a href="https://wa.me/17868241042" target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="mr-3 h-6 w-6" /> WhatsApp Premium Support
                            </a>
                        </Button>

                    </div>

                    <div className="pt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 opacity-40">
                        {['SEGURIDAD JURÍDICA', 'ALTA RENTABILIDAD', 'GESTIÓN TOTAL', 'TRANSPARENCIA 100%'].map((item, i) => (
                            <span key={i} className="text-xs font-black tracking-[0.3em] font-mono">{item}</span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
