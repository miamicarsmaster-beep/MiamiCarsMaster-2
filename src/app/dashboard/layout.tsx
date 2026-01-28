import { Sidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SessionStatus } from "@/components/debug/SessionStatus"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80 bg-gray-900">
                <Sidebar />
            </div>
            <main className="md:pl-72 h-full bg-slate-50/50 dark:bg-black">
                <DashboardHeader />
                <div className="p-8 h-[calc(100vh-4rem)] overflow-y-auto">
                    {children}
                </div>
            </main>
            <SessionStatus />
        </div>
    )
}
