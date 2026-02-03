import Link from "next/link"
import Image from "next/image"

export function Footer() {
    return (
        <footer className="bg-foreground text-background py-12 border-t border-border/10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="relative w-80 h-24 mb-6 brightness-0 invert">
                            <Image
                                src="/logo.png"
                                alt="Miami Cars Investments"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                        <p className="mt-4 text-muted-foreground/60 max-w-sm">
                            Plataforma tecnológica líder en gestión de inversiones de renta de vehículos en Florida.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Navegación</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground/60">
                            <li><Link href="#como-funciona" className="hover:text-primary transition-colors">Cómo funciona</Link></li>
                            <li><Link href="#beneficios" className="hover:text-primary transition-colors">Beneficios</Link></li>
                            <li><Link href="#contacto" className="hover:text-primary transition-colors">Contacto</Link></li>
                            <li><Link href="/login" className="hover:text-primary transition-colors">Area de Inversor</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground/60">
                            <li><Link href="#" className="hover:text-primary transition-colors">Términos y Condiciones</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Política de Privacidad</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 text-center text-xs text-muted-foreground/40">
                    © {new Date().getFullYear()} Miami Cars. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    )
}
