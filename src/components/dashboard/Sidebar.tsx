"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
    LayoutDashboard,
    Users,
    Car,
    FileText,
    LogOut,
    BadgeDollarSign,
    Calendar,
} from "lucide-react"
import Image from "next/image"

const adminRoutes = [
    {
        label: "Panel General",
        icon: LayoutDashboard,
        href: "/dashboard/admin",
    },
    {
        label: "Inversores",
        icon: Users,
        href: "/dashboard/admin/investors",
    },
    {
        label: "Flota de Autos",
        icon: Car,
        href: "/dashboard/admin/vehicles",
    },
    {
        label: "Finanzas & Gastos",
        icon: BadgeDollarSign,
        href: "/dashboard/admin/finance",
    },
    {
        label: "Documentos",
        icon: FileText,
        href: "/dashboard/admin/documents",
    },
]

const investorRoutes = [
    {
        label: "Mis Autos",
        icon: Car,
        href: "/dashboard/investor",
    },
    {
        label: "Alquileres",
        icon: Calendar,
        href: "/dashboard/investor/rentals",
    },
    {
        label: "Mis Finanzas",
        icon: BadgeDollarSign,
        href: "/dashboard/investor/finance",
    },
    {
        label: "Documentos",
        icon: FileText,
        href: "/dashboard/investor/documents",
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const isAdmin = pathname.startsWith("/dashboard/admin")
    const routes = isAdmin ? adminRoutes : investorRoutes

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="flex flex-col h-full bg-sidebar/40 backdrop-blur-xl text-sidebar-foreground border-r border-sidebar-border/50">
            <div className="px-6 py-10 flex-1">
                <Link href="/" className="flex items-center gap-3 mb-10 group px-0">
                    <div className="relative w-full h-24 transition-all duration-500">
                        {mounted && (
                            <Image
                                src={resolvedTheme === "dark" ? "/logo-white.png" : "/logo-dark.png"}
                                alt="Miami Cars Investments"
                                fill
                                className="object-contain object-left"
                                priority
                            />
                        )}
                    </div>
                </Link>

                <div className="space-y-2">
                    {routes.map((route) => {
                        const active = pathname === route.href
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                prefetch={false}
                                className={cn(
                                    "text-base group flex p-4.5 w-full justify-start font-bold cursor-pointer rounded-[1rem] transition-all duration-300 relative overflow-hidden",
                                    active
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-primary/5 hover:text-foreground hover:translate-x-1"
                                )}
                            >
                                {active && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-full" />
                                )}
                                <div className="flex items-center flex-1 py-1">
                                    <route.icon className={cn(
                                        "h-5 w-5 mr-3 transition-all duration-300",
                                        active ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
                                    )} />
                                    <span className="tracking-tight text-sm uppercase tracking-widest">{route.label}</span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>

            <div className="p-6 mt-auto">
                <div className="bg-gradient-to-br from-sidebar-accent/50 to-transparent rounded-[1.5rem] p-6 mb-6 border border-sidebar-border/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 -mr-10 -mt-10 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Sistema Master</span>
                    </div>
                    <p className="text-sm font-black text-foreground">v2.0 Premium Ops</p>
                    <p className="text-xs text-muted-foreground mt-1 font-bold">Conexión Segura v4.0</p>
                </div>

                <a
                    href="/api/auth/logout"
                    className="text-base group flex p-5 w-full justify-start font-black cursor-pointer hover:bg-red-500/10 hover:text-red-500 rounded-[1rem] transition-all duration-300 text-muted-foreground/70"
                >
                    <div className="flex items-center flex-1">
                        <LogOut className="h-5 w-5 mr-3 text-red-500/50 group-hover:text-red-500 transition-all duration-500 group-hover:rotate-12" />
                        <span className="tracking-tight uppercase text-xs font-black tracking-widest">Cerrar Sesión</span>
                    </div>
                </a>
            </div>
        </div>
    )
}
