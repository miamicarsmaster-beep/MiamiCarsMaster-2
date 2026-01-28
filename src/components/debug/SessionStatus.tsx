"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function SessionStatus() {
    const [status, setStatus] = useState<string>("Checking...")
    const [isVisible, setIsVisible] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        // Initial check
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) {
                setStatus(`Error: ${error.message}`)
            } else if (session) {
                setStatus(`✅ Auth: ${session.user.email} (${session.user.role})`)
            } else {
                setStatus("❌ No active session")
            }
        }

        checkSession()

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[SessionStatus] Auth Event:', event)
            if (session) {
                setStatus(`✅ Auth: ${session.user.email}`)
                if (event === 'SIGNED_OUT') {
                    router.refresh()
                }
            } else {
                setStatus("❌ No active session")
            }
        })

        // Toggle visibility with Ctrl+Shift+D
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                setIsVisible(prev => !prev)
            }
        }
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            subscription.unsubscribe()
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [supabase, router])

    // Always visible for now to help the user debug immediately without knowing shortcuts
    // In a real app we might hide this or use the shortcut logic
    return (
        <div className="fixed bottom-0 right-0 p-2 bg-black/90 text-white text-xs z-[9999] opacity-80 hover:opacity-100 transition-opacity rounded-tl-lg pointer-events-none font-mono border-t border-l border-white/20">
            {status}
        </div>
    )
}
