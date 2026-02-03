"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function Navbar() {
    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/60 backdrop-blur-2xl"
        >
            <div className="container mx-auto flex h-20 items-center justify-between px-6 sm:px-10">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="relative w-40 h-10 md:w-64 md:h-16 transition-all">
                        <Image
                            src="/logo-white.png"
                            alt="Miami Cars Investments"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </Link>

                <div className="hidden lg:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                    <Link href="#como-funciona" className="hover:text-primary transition-all hover:tracking-[0.4em]">
                        Cómo funciona
                    </Link>
                    <Link href="#fleet" className="hover:text-primary transition-all hover:tracking-[0.4em]">
                        Nuestra Flota
                    </Link>
                    <Link href="#beneficios" className="hover:text-primary transition-all hover:tracking-[0.4em]">
                        Beneficios
                    </Link>
                    <Link href="#contacto" className="hover:text-primary transition-all hover:tracking-[0.3em]">
                        Contacto
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/login" className="hidden sm:block">
                        <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 rounded-xl px-6">
                            Area Inversor
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button className="h-11 px-8 text-[10px] font-black uppercase tracking-widest rounded-xl bg-primary shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            Acceso Directo
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.nav>
    )
}
