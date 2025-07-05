import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SimpleNoteEditor } from '@/components/simple-note-editor'

interface NotePageProps {
  params: {
    id: string
  }
}

export default async function NotePage({ params }: NotePageProps) {
  const supabase = createClient()
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Get user profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  let userToUse = user

  if (userError || !user) {
    // Create user if doesn't exist
    const { data: newUser } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
      })
      .select()
      .single()
    
    if (!newUser) {
      redirect('/login')
    }
    
    userToUse = newUser
  }

  // Handle new note creation
  if (params.id === 'new') {
    return (
      <div className="h-screen flex flex-col">
        <SimpleNoteEditor 
          noteId={null}
          initialData={{
            title: '',
            content: {},
            is_blog: false
          }}
          user={userToUse}
        />
      </div>
    )
  }

  // Get existing note
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', session.user.id)
    .single()

  if (noteError || !note) {
    // Check if note is shared with user
    const { data: sharedNote } = await supabase
      .from('shared_notes')
      .select(`
        notes (
          id,
          title,
          content,
          is_blog,
          sharing_link,
          created_at,
          updated_at,
          owner_id
        )
      `)
      .eq('note_id', params.id)
      .eq('shared_with', session.user.id)
      .single()

    if (!sharedNote?.notes) {
      redirect('/dashboard')
    }

    return (
      <div className="h-screen flex flex-col">
        <SimpleNoteEditor 
          noteId={sharedNote.notes[0].id}
          initialData={sharedNote.notes[0]}
          user={userToUse}
          isShared={true}
        />
        </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <SimpleNoteEditor 
        noteId={note.id}
        initialData={note}
        user={userToUse}
        isShared={false}
      />
    </div>
  )
} 