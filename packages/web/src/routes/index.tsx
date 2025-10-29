// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { Note } from '@prisma/client'
import { useState } from 'react'

// --- Server function: runs only on the server ---
export const listNotes = createServerFn({ method: 'GET' }).handler(async () => {
  // Import server-only code inside handler (keeps client bundle clean)
  const { prisma } = await import('../server/db')
  const notes = await prisma.note.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return notes as Note[]
})

// --- Route: use the server fn in a loader so SSR gets fresh data ---
export const Route = createFileRoute('/')({
  loader: () => listNotes(),
  component: Home,
})

function Home() {
  // Data from the loader (SSR + hydrated)
  const notesFromServer = Route.useLoaderData() as Note[]

  // Keep a local input for now; server writes can be added next
  const [note, setNote] = useState('')

  // Placeholder: client-only add is disabled to avoid diverging from server data
  const addNote = () => {
    // In the next step, make a server function to create a note,
    // call it here, then invalidate/refetch.
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addNote()
  }

  return (
    <div className="p-8 max-w-md mx-auto min-h-screen flex flex-col justify-center text-center">
      <h1 className="text-3xl font-bold mb-4">Hello World!</h1>
      <p className="text-lg mb-6">Welcome to Mantir</p>

      {/* note input (wired for future server create) */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter a note"
          className="border border-gray-300 rounded px-4 py-2 flex-1"
        />
        <button
          onClick={addNote}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={!note.trim()}
          title="Server create not wired yet"
        >
          Add Note
        </button>
      </div>

      {/* list of notes from the DB */}
      <div className="mt-8 text-left">
        <h2 className="text-2xl font-semibold mb-4">Notes</h2>
        <ul className="list-disc list-inside">
          {notesFromServer.map((n) => (
            <li key={n.id} className="mb-2">
              {n.content ?? '(untitled)'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
