"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createInvestor } from "@/app/actions/create-investor"

const formSchema = z.object({
    firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    country: z.string().min(2, "El país es requerido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export function CreateInvestorDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            country: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("firstName", values.firstName)
            formData.append("lastName", values.lastName)
            formData.append("email", values.email)
            formData.append("country", values.country)
            formData.append("password", values.password)

            const result = await createInvestor(formData)

            if (result?.error) {
                toast.error(result.error)
                return
            }

            toast.success("Inversor creado exitosamente")
            setOpen(false)
            form.reset()
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Error al crear inversor")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 px-6 rounded-xl font-black uppercase italic tracking-tighter bg-primary text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span className="tracking-widest text-[10px]">Crear Inversor</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-card border-border/20">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                        Crear <span className="text-primary">Nuevo Inversor</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
                        Ingresa los datos del nuevo inversor. Se le enviará un correo de confirmación.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Juan" {...field} className="bg-white/5 border-border/20 rounded-xl uppercase font-bold text-xs" />
                                        </FormControl>
                                        <FormMessage className="text-[9px] font-bold" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apellido</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Pérez" {...field} className="bg-white/5 border-border/20 rounded-xl uppercase font-bold text-xs" />
                                        </FormControl>
                                        <FormMessage className="text-[9px] font-bold" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="juan@ejemplo.com" {...field} className="bg-white/5 border-border/20 rounded-xl font-bold text-xs" />
                                    </FormControl>
                                    <FormMessage className="text-[9px] font-bold" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">País</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Argentina" {...field} className="bg-white/5 border-border/20 rounded-xl uppercase font-bold text-xs" />
                                    </FormControl>
                                    <FormMessage className="text-[9px] font-bold" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} className="bg-white/5 border-border/20 rounded-xl font-bold text-xs text-primary" />
                                    </FormControl>
                                    <FormMessage className="text-[9px] font-bold" />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-black uppercase italic tracking-widest bg-primary text-primary-foreground hover:scale-[1.02] transition-all">
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Procesando...
                                    </span>
                                ) : "Crear Cuenta de Inversor"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
