import { Sidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { SessionStatus } from "@/components/debug/SessionStatus"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-full relative overflow-hidden">
            <div className="hidden h-full md:flex md:w-80 md:flex-col md:fixed md:inset-y-0 z-[100]">
                <Sidebar />
            </div>
            <main className="md:pl-80 h-full min-h-screen bg-background relative flex flex-col">
                <DashboardHeader />
                <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />
                <div className="flex-1 p-4 md:p-10 h-full overflow-y-auto relative scroll-smooth">
                    {children}
                </div>
            </main>
            <SessionStatus />
        </div>
    )
}
