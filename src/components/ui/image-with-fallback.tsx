"use client"

import { useState, useEffect } from "react"
import Image, { ImageProps } from "next/image"

interface ImageWithFallbackProps extends ImageProps {
    fallbackSrc: string
}

export function ImageWithFallback({ src, fallbackSrc, alt, ...props }: ImageWithFallbackProps) {
    // Use fallback immediately if src is null, undefined, or empty string
    const initialSrc = src && String(src).trim() !== '' ? src : fallbackSrc
    const [imgSrc, setImgSrc] = useState(initialSrc)

    useEffect(() => {
        // Update imgSrc when src changes, but use fallback if src is invalid
        const newSrc = src && String(src).trim() !== '' ? src : fallbackSrc
        setImgSrc(newSrc)
    }, [src, fallbackSrc])

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt}
            onError={() => {
                setImgSrc(fallbackSrc)
            }}
        />
    )
}
