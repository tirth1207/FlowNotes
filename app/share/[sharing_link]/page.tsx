import { createClient } from '@/lib/supabase/server'
import ShareNoteClient from '@/components/share-note-client'

export default async function ShareNotePage({ params }: { params: { sharing_link: string } }) {
  const supabase = createClient()
  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('sharing_link', params.sharing_link)
    .single()

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Note Not Found</h1>
        <p className="text-muted-foreground">This share link is invalid or the note has been deleted.</p>
      </div>
    )
  }

  return <ShareNoteClient title={note.title} content={note.content?.content?.[0]?.content?.[0]?.text || ''} />
} 