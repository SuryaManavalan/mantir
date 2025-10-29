// src/routes/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    component: Home,
})

function Home() {
    return (
        <div className="p-8 max-w-md mx-auto min-h-screen flex flex-col justify-center text-center">
            <h1 className="text-3xl font-bold mb-4">Hello World!</h1>
            <p className="text-lg mb-6">Welcome to Mantir</p>
        </div>
    )
}