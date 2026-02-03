"use client"

import { MessageCircle } from "lucide-react"

export function FloatingWhatsApp() {
    return (
        <a
            href="https://wa.me/17868241042"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_40px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 group"
        >
            <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />
            <MessageCircle className="h-8 w-8 transition-transform duration-300 group-hover:rotate-12" />
        </a>
    )
}
