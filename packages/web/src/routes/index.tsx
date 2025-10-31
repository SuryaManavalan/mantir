// src/routes/index.tsx
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import type { Note } from '@prisma/client'
import { useState } from 'react'
import { z } from 'zod'
import { Trash } from 'lucide-react'

// --- Server function: runs only on the server ---
// Fetch list of notes from the database
export const listNotes = createServerFn({ method: 'GET' }).handler(async () => {
  // Import server-only code inside handler (keeps client bundle clean)
  const { prisma } = await import('../server/db')
  const notes = await prisma.note.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return notes as Note[]
})

// Create a new note in the database
export const createNote = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ content: z.string().trim().min(1) }))
  .handler(async ({ data }) => {
    // Import inside handler to avoid bundling Prisma client into the client
    const { prisma } = await import('../server/db')

    // Create note with validated data
    const note = await prisma.note.create({
      data: { content: data.content },
    })

    return note
  })

export const deleteNote = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const { prisma } = await import('../server/db')

    const deletedNote = await prisma.note.delete({
      where: { id: data.id }
    })

    return deletedNote
  })

// --- Route: use the server fn in a loader so SSR gets fresh data ---
export const Route = createFileRoute('/')({
  loader: () => listNotes(),
  component: Home,
})

function Home() {
  // Data from the loader (SSR + hydrated)
  const notesFromServer = Route.useLoaderData() as Note[]

  // Router for invalidating data
  const router = useRouter()

  // Keep a local input for now; server writes can be added next
  const [note, setNote] = useState('')

  // Use the server function hook
  const createNoteFn = useServerFn(createNote)
  const deleteNoteFn = useServerFn(deleteNote)

  // Handle creating a note
  const addNote = async () => {
    if (!note.trim()) return

    try {
      await createNoteFn({ data: { content: note.trim() } })
      setNote('') // Clear input on success
      // Invalidate the route to refetch the notes
      router.invalidate()
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  const removeNote = async (id: number) => {
    try {
      await deleteNoteFn({ data: { id } })
      // Invalidate the route to refetch the notes
      router.invalidate()
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
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
        >
          Add Note
        </button>
      </div>

      {/* list of notes from the DB */}
      <div className="mt-8 text-left">
        <h2 className="text-2xl font-semibold mb-4">Notes</h2>
        <ul className="list-disc list-inside">
          {notesFromServer.map((n) => (
            <li key={n.id} className="mb-2 flex items-center justify-between">
              <span>{n.content ?? '(untitled)'}</span>
              <button
                onClick={() => removeNote(n.id)}
                className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                aria-label="Delete note"
              >
                <Trash size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
