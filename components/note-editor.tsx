'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  IconArrowLeft, 
  IconGavel, 
  IconShare, 
  IconTrash, 
  IconEye,
  IconEyeOff,
  IconBook,
  IconBookOff
} from '@tabler/icons-react'

interface Note {
  id?: string
  title: string
  content: any
  is_blog: boolean
  sharing_link?: string
  created_at?: string
  updated_at?: string
  owner_id?: string
}

interface User {
  id: string
  name: string
  email: string
}

interface NoteEditorProps {
  noteId: string | null
  initialData: Note
  user: User
  isShared?: boolean
}

export function NoteEditor({ noteId, initialData, user, isShared = false }: NoteEditorProps) {
  const [title, setTitle] = useState(initialData.title)
  const [isBlog, setIsBlog] = useState(initialData.is_blog)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [message, setMessage] = useState('')
  const [showSharing, setShowSharing] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialData.content,
    onUpdate: ({ editor }) => {
      // Auto-save on content change
      debouncedSave(editor.getJSON())
    },
  })

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (content: any) => {
      await saveNote(content)
    }, 1000),
    []
  )

  // Debounce utility
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const saveNote = async (content?: any) => {
    if (isShared) return // Don't save if note is shared (read-only)
    
    setIsSaving(true)
    try {
      const noteData = {
        title: title || 'Untitled',
        content: content || editor?.getJSON() || {},
        is_blog: isBlog,
        updated_at: new Date().toISOString()
      }

      if (noteId) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', noteId)
          .eq('owner_id', user.id)

        if (error) throw error
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert({
            ...noteData,
            owner_id: user.id
          })
          .select()
          .single()

        if (error) throw error
        
        // Update URL with new note ID
        router.replace(`/note/${data.id}`)
      }

      setLastSaved(new Date())
      setMessage('Saved successfully!')
      setTimeout(() => setMessage(''), 2000)
    } catch (error) {
      console.error('Error saving note:', error)
      setMessage('Error saving note')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteNote = async () => {
    if (!noteId || isShared) return
    
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('owner_id', user.id)

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting note:', error)
      setMessage('Error deleting note')
    }
  }

  const shareNote = async () => {
    if (!noteId || isShared) return
    
    if (!shareEmail) {
      setMessage('Please enter an email address')
      return
    }

    setIsSharing(true)
    try {
      const { error } = await supabase.rpc('share_note', {
        note_uuid: noteId,
        user_email: shareEmail
      })

      if (error) throw error

      setMessage('Note shared successfully!')
      setShareEmail('')
      setShowSharing(false)
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error sharing note:', error)
      setMessage('Error sharing note')
    } finally {
      setIsSharing(false)
    }
  }

  const toggleBlog = async () => {
    if (isShared) return
    
    setIsBlog(!isBlog)
    await saveNote()
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="w-64"
                disabled={isShared}
              />
              
              {isBlog && (
                <Badge variant="secondary">
                  <IconBook className="w-3 h-3 mr-1" />
                  Blog
                </Badge>
              )}
              
              {isShared && (
                <Badge variant="outline">
                  Shared
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isShared && (
              <>
                <div className="flex items-center gap-2">
                  <IconBookOff className="w-4 h-4" />
                  <Switch
                    checked={isBlog}
                    onCheckedChange={toggleBlog}
                    disabled={isSaving}
                  />
                  <IconBook className="w-4 h-4" />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSharing(!showSharing)}
                >
                  <IconShare className="w-4 h-4 mr-2" />
                  Share
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveNote}
                  disabled={isSaving}
                >
                  <IconGavel className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>

                {noteId && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteNote}
                  >
                    <IconTrash className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="px-4 pb-2 text-xs text-muted-foreground flex items-center justify-between">
          <div>
            {lastSaved && (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
          <div>
            {message && (
              <span className={message.includes('Error') ? 'text-red-600' : 'text-green-600'}>
                {message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sharing dialog */}
      {showSharing && (
        <Card className="absolute top-20 right-4 z-50 w-80">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Share Note</h3>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={shareNote}
                  disabled={isSharing}
                >
                  {isSharing ? 'Sharing...' : 'Share'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSharing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <div className="h-full border rounded-lg p-4 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  )
} 