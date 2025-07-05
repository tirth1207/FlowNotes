"use client"
import { renderMarkdown } from './simple-note-editor'

export default function PublicNoteViewer({ title, content }: { title: string, content: string }) {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">{title || 'Untitled'}</h1>
        <div className="prose prose-sm max-w-none">
          {renderMarkdown(content)}
        </div>
      </div>
    </div>
  )
} 