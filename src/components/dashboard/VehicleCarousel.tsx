"use client"

import { useState, useEffect } from "react"
import { Vehicle } from "@/types/database"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"

interface VehicleCarouselProps {
    vehicles: Vehicle[]
}

export function VehicleCarousel({ vehicles }: VehicleCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const activeVehicles = vehicles.filter(v => v.image_url)

    useEffect(() => {
        if (activeVehicles.length <= 1) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeVehicles.length)
        }, 15000)

        return () => clearInterval(timer)
    }, [activeVehicles.length])

    if (activeVehicles.length === 0) return null

    const currentVehicle = activeVehicles[currentIndex]

    return (
        <div className="relative h-[250px] md:h-[350px] w-full rounded-[2.5rem] overflow-hidden group shadow-2xl border border-white/10 mt-6 bg-slate-900">
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={currentIndex}
                    initial={{ scale: 1.15, opacity: 1 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 15,
                        ease: "linear",
                        opacity: { duration: 0 } // Desactivar desvanecimiento
                    }}
                    className="absolute inset-0"
                >
                    <Image
                        src={currentVehicle.image_url!}
                        alt={`${currentVehicle.make} ${currentVehicle.model}`}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`content-${currentIndex}`}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <Badge className="bg-primary/20 backdrop-blur-md text-primary border-primary/20 mb-4 uppercase font-black tracking-[0.2em] text-xs px-4 py-1.5">
                            Destacado de la Flota
                        </Badge>
                        <h3 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-tight drop-shadow-2xl">
                            {currentVehicle.make} <span className="text-primary">{currentVehicle.model}</span>
                        </h3>
                        <p className="text-white/70 font-bold uppercase tracking-[0.3em] text-xs md:text-xs mt-3 flex items-center gap-4">
                            <span>{currentVehicle.year}</span>
                            <span className="h-1 w-1 rounded-full bg-primary/50" />
                            <span>{currentVehicle.license_plate}</span>
                            <span className="h-1 w-1 rounded-full bg-primary/50" />
                            <span className="text-primary">{currentVehicle.status === 'available' ? 'OPERATIVO' : 'EN SERVICIO'}</span>
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="absolute bottom-8 right-8 flex gap-2">
                {activeVehicles.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? "w-8 bg-primary" : "w-1.5 bg-white/30"
                            }`}
                    />
                ))}
            </div>
        </div>
    )
}
