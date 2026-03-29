"use client"

import { useEffect } from "react"

interface ModalProps {
    open: boolean
    onClose: () => void
    children: React.ReactNode
}

export function Modal({ open, onClose, children }: ModalProps) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose()
        document.addEventListener("keydown", handler)
        return () => document.removeEventListener("keydown", handler)
    }, [onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-md animate-scale-in">
                {children}
            </div>
        </div>
    )
}
