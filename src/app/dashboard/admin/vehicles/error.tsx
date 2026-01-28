'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function VehiclesError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[VehiclesError]', error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <CardTitle>Error al Cargar Vehículos</CardTitle>
                    </div>
                    <CardDescription>
                        Hubo un problema al cargar la información de los vehículos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {error.message || 'Error desconocido. Por favor intenta nuevamente.'}
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={reset} className="flex-1">
                            Intentar Nuevamente
                        </Button>
                        <Button variant="outline" onClick={() => window.location.href = '/dashboard/admin'} className="flex-1">
                            Volver al Dashboard
                        </Button>
                    </div>
                    {error.digest && (
                        <p className="text-xs text-muted-foreground">
                            Error ID: {error.digest}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
