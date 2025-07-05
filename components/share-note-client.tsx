'use client'
import PublicNoteViewer from './public-note-viewer'

export default function ShareNoteClient({ title, content }: { title: string, content: string }) {
  return <PublicNoteViewer title={title} content={content} />
}
