import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { NotesList } from '@/components/notes-list'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = createClient()
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Get user profile with proper error handling
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  let userToUse
  if (error || !user) {
    // If user doesn't exist in our table, create them
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      redirect('/login')
    }

    userToUse = newUser
  } else {
    userToUse = user
  }

  // Await searchParams before accessing its properties
  const params = await searchParams
  
  // Get notes based on filter
  let notes: any[] = []
  const isShared = params.shared === 'true'
  const isBlog = params.blog === 'true'
  
  if (isShared) {
    // Get notes shared with user
    const { data: sharedNotes } = await supabase
      .from('shared_notes')
      .select(`
        note_id,
        notes (
          id,
          title,
          content,
          is_blog,
          sharing_link,
          created_at,
          updated_at,
          owner_id,
          users!notes_owner_id_fkey (name, email)
        )
      `)
      .eq('shared_with', session.user.id)
    
    notes = sharedNotes?.map(sn => {
      if (sn.notes && typeof sn.notes === 'object') {
        return {
          ...sn.notes,
          is_shared: true,
          shared_by: (sn.notes as any).users
        }
      }
      return null
    }).filter(Boolean) || []
  } else if (isBlog) {
    // Get user's blog posts
    const { data: blogNotes } = await supabase
      .from('notes')
      .select('*')
      .eq('owner_id', session.user.id)
      .eq('is_blog', true)
      .order('updated_at', { ascending: false })
    
    notes = blogNotes || []
  } else {
    // Get user's own notes
    const { data: userNotes } = await supabase
      .from('notes')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('updated_at', { ascending: false })
    
    notes = userNotes || []
  }

  // Quick stats
  const totalNotes = Array.isArray(notes) ? notes.length : 0
  const sharedNotes = Array.isArray(notes) ? notes.filter(n => n.is_shared).length : 0
  const blogNotes = Array.isArray(notes) ? notes.filter(n => n.is_blog).length : 0

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-bold mb-2">Welcome{userToUse?.name ? `, ${userToUse.name}` : ''} 👋</h1>
                <div className="mb-4 flex gap-4 text-sm text-muted-foreground">
                  <div><strong>{totalNotes}</strong> Notes</div>
                  <div><strong>{sharedNotes}</strong> Shared</div>
                  <div><strong>{blogNotes}</strong> Blog Posts</div>
                </div>
                <h2 className="text-xl font-semibold mb-2">{isShared ? 'Shared With Me' : isBlog ? 'Blog Posts' : 'My Notes'}</h2>
                <NotesList notes={notes} user={userToUse} />
                {notes.length === 0 && (
                  <div className="mt-8 text-center text-muted-foreground text-lg">No notes yet. Click <strong>New Note</strong> to get started!</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
