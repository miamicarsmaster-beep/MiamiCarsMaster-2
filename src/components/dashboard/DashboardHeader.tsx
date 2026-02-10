import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardHeader() {
    return (
        <div className="border-b border-border bg-background/60 backdrop-blur-xl z-30 flex items-center h-20 px-6 md:px-10 sticky top-0">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-none w-80">
                        <Sidebar />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="ml-auto flex items-center gap-4 md:gap-8">
                <ThemeToggle />

                <div className="flex items-center gap-4 py-2 px-4 rounded-2xl bg-sidebar-accent/30 border border-sidebar-border/20 group hover:border-primary/30 transition-all">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Master Admin</p>
                        <p className="text-[11px] font-bold opacity-60">admin@miamicars.com</p>
                    </div>
                    <Avatar className="h-10 w-10 border border-primary/20 p-0.5">
                        <AvatarImage src="https://github.com/shadcn.png" className="rounded-full" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">AD</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    )
}
