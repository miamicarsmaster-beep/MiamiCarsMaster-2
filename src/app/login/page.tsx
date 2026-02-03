"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                throw new Error(signInError.message)
            }

            if (!data.user) {
                throw new Error('No se pudo obtener información del usuario')
            }

            // Get user profile to determine role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            if (profileError) {
                console.error('Profile error:', profileError)
                // Expose specific error details for debugging
                const errorDetails = `Error: ${profileError.message} (Code: ${profileError.code}) ${profileError.details || ''} ${profileError.hint || ''}`
                throw new Error(errorDetails)
            }

            // Start redirection process
            console.log('Login successful. Profile role:', profile?.role)
            setIsRedirecting(true)

            // Wait a moment for cookies to set
            await new Promise(resolve => setTimeout(resolve, 500))

            // Default to investor if no role found (robustness for broken profiles)
            // If profile is null, we assume it's an investor (fallback)
            const role = profile?.role || 'investor'

            // Use window.location.href for a hard navigation which ensures middleware re-runs
            if (role === 'admin') {
                window.location.href = '/dashboard/admin'
            } else {
                window.location.href = '/dashboard/investor'
            }

            // Keep loading state true while redirecting - don't set to false
        } catch (err: unknown) {
            console.error('Login error:', err)
            const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión. Por favor intenta nuevamente.'
            setError(errorMessage)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-200/[0.2] dark:bg-grid-white/[0.05] -z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] -z-10" />

            <Card className="w-full max-w-md border-border/60 shadow-xl backdrop-blur-sm bg-background/80">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="text-3xl font-bold tracking-tighter">
                            MIAMI<span className="text-primary">CARS</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
                    <CardDescription>
                        Ingresa a tu panel de control
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        {isRedirecting && (
                            <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    ✓ Redirigiendo al panel de control...
                                </p>
                            </div>
                        )}
                        {error && !isRedirecting && (
                            <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nombre@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Contraseña</Label>
                                <Link href="#" className="text-xs text-primary hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full shadow-lg shadow-primary/20"
                            size="lg"
                            disabled={isLoading || isRedirecting}
                        >
                            {isRedirecting ? "Redirigiendo..." : isLoading ? "Ingresando..." : "Ingresar"}
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </div>
    )
}
