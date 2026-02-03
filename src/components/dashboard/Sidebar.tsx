"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Car,
    FileText,
    LogOut,
    BadgeDollarSign,
    Calendar,
} from "lucide-react"

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

import Image from "next/image"

export function Sidebar() {
    const pathname = usePathname()
    const isAdmin = pathname.startsWith("/dashboard/admin")
    const routes = isAdmin ? adminRoutes : investorRoutes

    return (
        <div className="flex flex-col h-full bg-sidebar/50 backdrop-blur-xl text-sidebar-foreground border-r border-sidebar-border/50">
            <div className="px-6 py-10 flex-1">
                <Link href="/" className="flex items-center gap-3 mb-10 group px-0">
                    <div className="relative w-full h-24">
                        <Image
                            src="/logo-dark.png"
                            alt="Miami Cars Investments"
                            fill
                            className="object-contain object-left"
                            priority
                        />
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
                                    "text-base group flex p-4.5 w-full justify-start font-bold cursor-pointer rounded-[1.25rem] transition-all duration-500",
                                    active
                                        ? "bg-primary/10 text-primary border-r-[6px] border-primary shadow-[0_10px_30px_rgba(var(--primary),0.1)] scale-[1.02]"
                                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-slate-900 dark:hover:text-white hover:translate-x-1"
                                )}
                            >
                                <div className="flex items-center flex-1 py-1">
                                    <route.icon className={cn(
                                        "h-6 w-6 mr-4 transition-all duration-500",
                                        active ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
                                    )} />
                                    <span className="tracking-tight">{route.label}</span>
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
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]"></div>
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground italic">Sistema Master</span>
                    </div>
                    <p className="text-sm font-black text-foreground">v2.0 Premium Ops</p>
                    <p className="text-xs text-muted-foreground mt-1 font-bold">Conexión Segura v4.0</p>
                </div>

                <Link
                    href="/api/auth/logout"
                    prefetch={false}
                    className="text-base group flex p-5 w-full justify-start font-black cursor-pointer hover:bg-red-500/10 hover:text-red-500 rounded-[1.25rem] transition-all duration-300 text-muted-foreground/70"
                >
                    <div className="flex items-center flex-1">
                        <LogOut className="h-6 w-6 mr-4 text-red-500/50 group-hover:text-red-500 transition-all duration-500 group-hover:rotate-12" />
                        <span className="tracking-tight uppercase text-sm">Cerrar Sesión</span>
                    </div>
                </Link>
            </div>
        </div>
    )
}
