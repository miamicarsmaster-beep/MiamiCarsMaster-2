"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { deleteInvestor } from "@/app/actions/delete-investor"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DeleteInvestorButtonProps {
    investorId: string
    investorName: string
}

export function DeleteInvestorButton({ investorId, investorName }: DeleteInvestorButtonProps) {
    const [open, setOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteInvestor(investorId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Inversor eliminado correctamente")
                setOpen(false)
                router.refresh()
            }
        } catch (error) {
            toast.error("Error al eliminar el inversor")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] !bg-white border-0 shadow-2xl rounded-[32px] z-[201]">
                <DialogHeader className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="space-y-2">
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                            ¿Eliminar <span className="text-red-600">Inversor?</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 leading-relaxed px-4">
                            Estás a punto de eliminar a <span className="text-slate-900 font-black">{investorName}</span>.
                            <br /><br />
                            Esta acción no se puede deshacer y borrará su acceso de forma permanente.
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="flex-1 h-12 rounded-2xl font-black uppercase italic tracking-widest border-slate-200 text-slate-400 hover:bg-slate-50 transition-all text-[10px]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 h-12 rounded-2xl font-black uppercase italic tracking-widest bg-red-600 hover:bg-red-700 transition-all shadow-xl shadow-red-200 text-[10px]"
                    >
                        {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : "Eliminar Permanentemente"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
