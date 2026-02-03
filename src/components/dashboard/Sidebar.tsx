"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Car,
    FileText,
    Settings,
    LogOut,
    BadgeDollarSign
} from "lucide-react"

const adminRoutes = [
    {
        label: "Panel General",
        icon: LayoutDashboard,
        href: "/dashboard/admin",
        color: "text-sky-500",
    },
    {
        label: "Inversores",
        icon: Users,
        href: "/dashboard/admin/investors",
        color: "text-violet-500",
    },
    {
        label: "Flota de Autos",
        icon: Car,
        href: "/dashboard/admin/vehicles",
        color: "text-pink-700",
    },
    {
        label: "Finanzas & Gastos",
        icon: BadgeDollarSign,
        href: "/dashboard/admin/finance",
        color: "text-emerald-500",
    },
    {
        label: "Documentos",
        icon: FileText,
        href: "/dashboard/admin/documents",
        color: "text-orange-700",
    },
]

const investorRoutes = [
    {
        label: "Mis Autos",
        icon: Car,
        href: "/dashboard/investor",
        color: "text-sky-500",
    },
    {
        label: "Mis Finanzas",
        icon: BadgeDollarSign,
        href: "/dashboard/investor/finance",
        color: "text-emerald-500",
    },
    {
        label: "Documentos",
        icon: FileText,
        href: "/dashboard/investor/documents",
        color: "text-orange-700",
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const isAdmin = pathname.startsWith("/dashboard/admin")
    const routes = isAdmin ? adminRoutes : investorRoutes

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
            <div className="px-3 py-2 flex-1">
                <Link href="/" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        {/* Logo placeholder */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-blue-600 rounded-lg animate-pulse opacity-75 blur-sm" />
                        <div className="relative bg-background rounded-lg w-full h-full flex items-center justify-center">
                            <span className="text-primary font-bold text-xs">MC</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">
                        Miami<span className="text-primary">Cars</span>
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            prefetch={false}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition",
                                pathname === route.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3">
                <div className="bg-sidebar-accent/50 rounded-xl p-4 mb-4 border border-sidebar-border">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs text-muted-foreground">Sistema Operativo</span>
                    </div>
                    <p className="text-xs font-medium">v1.0.0 Stable</p>
                </div>
                <Link
                    href="/api/auth/logout"
                    prefetch={false}
                    className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition text-muted-foreground"
                >
                    <div className="flex items-center flex-1">
                        <LogOut className="h-5 w-5 mr-3 text-red-500" />
                        Cerrar Sesión
                    </div>
                </Link>
            </div>
        </div>
    )
}
