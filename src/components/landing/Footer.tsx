"use client"

import Link from "next/link"
import Image from "next/image"

export function Footer() {
    return (
        <footer className="bg-slate-950 text-white py-24 border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
                    <div className="col-span-1 md:col-span-2">
                        <div className="relative w-64 h-16 md:w-80 md:h-20 mb-8 transition-all">
                            <Image
                                src="/logo-white.png"
                                alt="Miami Cars Investments"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500 max-w-sm leading-relaxed italic">
                            Plataforma tecnológica líder en gestión de activos <br />
                            y optimización de flotas en Florida. <br />
                            <span className="text-primary not-italic mt-2 block">v2.0 Built for International Excellence</span>
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-white/40">Navegación</h4>
                        <ul className="space-y-4 text-xs font-black uppercase tracking-widest">
                            <li><Link href="#como-funciona" className="hover:text-primary transition-all">Cómo funciona</Link></li>
                            <li><Link href="#beneficios" className="hover:text-primary transition-all">Beneficios</Link></li>
                            <li><Link href="#contacto" className="hover:text-primary transition-all">Contacto</Link></li>
                            <li><Link href="/login" className="hover:text-primary transition-all">Area Inversor</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-white/40">Sistemas</h4>
                        <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-slate-500">
                            <li>STATUS: ONLINE</li>
                            <li>VERSION: v2.0 PE</li>
                            <li>ENCRYPTION: AES-256</li>
                            <li>USA OFFICE: MIAMI, FL</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-600">
                        © {new Date().getFullYear()} Miami Cars plataforma. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-8 text-xs font-black uppercase tracking-[0.2em] text-slate-600">
                        <Link href="#" className="hover:text-white transition-colors">Términos</Link>
                        <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
