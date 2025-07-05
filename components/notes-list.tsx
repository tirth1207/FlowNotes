'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Share2, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface Note {
  id: string
  title: string
  content: any
  is_blog: boolean
  sharing_link?: string
  created_at: string
  updated_at: string
  owner_id: string
  is_shared?: boolean
  shared_by?: {
    name: string
    email: string
  }
}

interface NotesListProps {
  notes: Note[]
  user: any
}

export function NotesList({ notes, user }: NotesListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [shareModalNote, setShareModalNote] = useState<Note | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [emailToShare, setEmailToShare] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const supabase = createClient()

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    
    setLoading(noteId)
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
      
      if (error) {
        console.error('Error deleting note:', error)
        alert('Failed to delete note')
      } else {
        // Refresh the page to update the list
        window.location.reload()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete note')
    } finally {
      setLoading(null)
    }
  }

  // Share by email
  const handleShareByEmail = async () => {
    if (!shareModalNote || !emailToShare) return
    setIsSaving(true)
    setShareMessage('')
    const { error } = await supabase.rpc('share_note', {
      note_uuid: shareModalNote.id,
      user_email: emailToShare
    })
    if (error) {
      setShareMessage('Error sharing note')
    } else {
      setShareMessage('Note shared successfully!')
      setEmailToShare('')
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </h2>
        <Link href="/note/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No notes yet. Create your first note to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base line-clamp-2">
                    {note.title || 'Untitled'}
                  </CardTitle>
                  <div className="flex gap-1">
                    {note.is_blog && (
                      <Badge variant="secondary" className="text-xs">
                        Blog
                      </Badge>
                    )}
                    {note.is_shared && (
                      <Badge variant="outline" className="text-xs">
                        Shared
                      </Badge>
                    )}
                  </div>
                </div>
                {note.is_shared && note.shared_by && (
                  <p className="text-xs text-muted-foreground">
                    Shared by {note.shared_by.name || note.shared_by.email}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {note.content?.content?.[0]?.content?.[0]?.text || 'No content'}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-1">
                    <Link href={`/note/${note.id}`}>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </Link>
                    
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setShareModalNote(note)}
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                    
                    {!note.is_shared && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDelete(note.id)}
                        disabled={loading === note.id}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!shareModalNote} onOpenChange={(open) => { if (!open) setShareModalNote(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Note</DialogTitle>
          </DialogHeader>
          {shareModalNote && (
            <>
              {/* Share by Email UI */}
              <div className="border-t pt-4 mt-4">
                <div className="mb-2 font-semibold">Share by Email</div>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={emailToShare}
                    onChange={e => setEmailToShare(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full"
                    type="email"
                  />
                  <Button size="sm" onClick={handleShareByEmail} disabled={isSaving || !emailToShare}>
                    {isSaving ? 'Sharing...' : 'Share'}
                  </Button>
                </div>
                {shareMessage && <div className={shareMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}>{shareMessage}</div>}
              </div>
            </>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="mt-4 w-full">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
} 