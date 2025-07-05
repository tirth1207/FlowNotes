/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useCallback, useRef } from 'react'
import type { JSX } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  IconArrowLeft, 
  IconGavel, 
  IconShare, 
  IconTrash, 
  IconBook,
  IconBookOff,
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconList,
  IconListNumbers,
  IconQuote,
  IconCode,
  IconLink,
  IconClearFormatting,
  IconEye,
  IconEyeOff,
  IconHeading
} from '@tabler/icons-react'
import { nanoid } from 'nanoid'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'

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

interface SimpleNoteEditorProps {
  noteId: string | null
  initialData: Note
  user: User
  isShared?: boolean
}

// Exported markdown renderer for use in public share page and editor preview
export const renderMarkdown = (text: string) => {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: React.ReactNode[] = []
  let isInList = false
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ul') {
        elements.push(<ul key={`list-ul-${elements.length}`} className="my-2 list-disc list-inside">{currentList}</ul>)
      } else if (listType === 'ol') {
        elements.push(<ol key={`list-ol-${elements.length}`} className="my-2 list-decimal list-inside">{currentList}</ol>)
      }
      currentList = []
      isInList = false
      listType = null
    }
  }

  lines.forEach((line, index) => {
    // Process inline formatting first
    let processedLine = line
    // Bold
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Underline
    processedLine = processedLine.replace(/__(.*?)__/g, '<u>$1</u>')
    // Strikethrough
    processedLine = processedLine.replace(/~~(.*?)~~/g, '<del>$1</del>')
    // Code
    processedLine = processedLine.replace(/`(.*?)`/g, '<code className=\"bg-muted px-1 rounded\">$1</code>')
    // Links
    processedLine = processedLine.replace(/\[(.*?)\]\((.*?)\)/g, '<a href=\"$2\" className=\"text-blue-600 underline\">$1</a>')
    // Unordered list
    if (/^(- |\* )/.test(line)) {
      if (!isInList || listType !== 'ul') {
        flushList()
        isInList = true
        listType = 'ul'
      }
      currentList.push(<li key={`li-ul-${index}`} dangerouslySetInnerHTML={{ __html: processedLine.substring(2) }} />)
      return
    }
    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      if (!isInList || listType !== 'ol') {
        flushList()
        isInList = true
        listType = 'ol'
      }
      currentList.push(<li key={`li-ol-${index}`} dangerouslySetInnerHTML={{ __html: processedLine.replace(/^\d+\.\s/, '') }} />)
      return
    }
    // If we reach here and were in a list, flush it
    flushList()
    // Headers
    if (line.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-2xl font-bold my-2" dangerouslySetInnerHTML={{ __html: processedLine.substring(2) }} />)
      return
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-xl font-bold my-2" dangerouslySetInnerHTML={{ __html: processedLine.substring(3) }} />)
      return
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-lg font-bold my-2" dangerouslySetInnerHTML={{ __html: processedLine.substring(4) }} />)
      return
    }
    // Quotes
    if (line.startsWith('> ')) {
      elements.push(<blockquote key={index} className="border-l-4 border-gray-300 pl-4 my-2 italic" dangerouslySetInnerHTML={{ __html: processedLine.substring(2) }} />)
      return
    }
    // Empty lines
    if (line.trim() === '') {
      elements.push(<br key={index} />)
      return
    }
    // Regular paragraphs
    elements.push(<p key={index} className="my-1" dangerouslySetInnerHTML={{ __html: processedLine }} />)
  })
  // Flush any remaining list
  flushList()
  return elements
}

export function SimpleNoteEditor({ noteId, initialData, user, isShared = false }: SimpleNoteEditorProps) {
  const [title, setTitle] = useState(initialData.title)
  const [content, setContent] = useState(initialData.content?.content?.[0]?.content?.[0]?.text || '')
  const [isBlog, setIsBlog] = useState(initialData.is_blog)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [message, setMessage] = useState('')
  const [showSharing, setShowSharing] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [emailToShare, setEmailToShare] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const saveNote = async () => {
    if (isShared) return // Don't save if note is shared (read-only)
    
    setIsSaving(true)
    try {
      const noteData = {
        title: title || 'Untitled',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: content
                }
              ]
            }
          ]
        },
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

  // Rich text formatting functions
  const getSelectedText = () => {
    if (!textareaRef.current) return ''
    const { start, end } = selection
    return content.substring(start, end)
  }

  const replaceSelectedText = (newText: string) => {
    if (!textareaRef.current) return
    const { start, end } = selection
    const newContent = content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)
    
    // Update selection to cover the new text
    const newEnd = start + newText.length
    setSelection({ start, end: newEnd })
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(start, newEnd)
      }
    }, 0)
  }

  const formatText = (format: string) => {
    if (isShared) return
    
    const selectedText = getSelectedText()
    if (!selectedText) return

    let formattedText = selectedText
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'underline':
        formattedText = `__${selectedText}__`
        break
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`
        break
      case 'code':
        formattedText = `\`${selectedText}\``
        break
      case 'quote':
        formattedText = `> ${selectedText}`
        break
      case 'list':
        formattedText = `- ${selectedText}`
        break
      case 'numbered-list':
        formattedText = `1. ${selectedText}`
        break
      case 'link':
        formattedText = `[${selectedText}](url)`
        break
      case 'h1':
        formattedText = `# ${selectedText}`
        break
      case 'h2':
        formattedText = `## ${selectedText}`
        break
      case 'h3':
        formattedText = `### ${selectedText}`
        break
    }
    
    replaceSelectedText(formattedText)
  }

  const clearFormatting = () => {
    if (isShared) return
    
    const selectedText = getSelectedText()
    if (!selectedText) return

    // Remove markdown formatting
    const cleanedText = selectedText
      .replace(/\*\*(.*?)\*\*/g, '$1') // bold
      .replace(/\*(.*?)\*/g, '$1') // italic
      .replace(/__(.*?)__/g, '$1') // underline
      .replace(/~~(.*?)~~/g, '$1') // strikethrough
      .replace(/`(.*?)`/g, '$1') // code
      .replace(/^>\s*/, '') // quote
      .replace(/^[-*]\s*/, '') // list
      .replace(/^\d+\.\s*/, '') // numbered list
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // link
    
    replaceSelectedText(cleanedText)
  }

  const handleTextareaSelect = () => {
    if (!textareaRef.current) return
    const { selectionStart, selectionEnd } = textareaRef.current
    setSelection({ start: selectionStart, end: selectionEnd })
  }

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isShared) return
    
    // Only handle shortcuts when Ctrl/Cmd is pressed
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          formatText('bold')
          break
        case 'i':
          e.preventDefault()
          formatText('italic')
          break
        case 'u':
          e.preventDefault()
          formatText('underline')
          break
        case 'k':
          e.preventDefault()
          formatText('link')
          break
        case 'q':
          e.preventDefault()
          formatText('quote')
          break
        case 'l':
          e.preventDefault()
          formatText('list')
          break
        case 'o':
          e.preventDefault()
          formatText('numbered-list')
          break
        case '`':
          e.preventDefault()
          formatText('code')
          break
        case 'backspace':
          e.preventDefault()
          clearFormatting()
          break
      }
    }
  }

  const handleShareByEmail = async () => {
    if (!noteId || !emailToShare) return
    setIsSaving(true)
    setShareMessage('')
    const { error } = await supabase.rpc('share_note', {
      note_uuid: noteId,
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
                  onClick={() => setShowShareModal(true)}
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

        {/* Formatting Toolbar */}
        {!isShared && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('bold')}
                title="Bold (Ctrl+B)"
              >
                <IconBold className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('italic')}
                title="Italic (Ctrl+I)"
              >
                <IconItalic className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('underline')}
                title="Underline (Ctrl+U)"
              >
                <IconUnderline className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('strikethrough')}
                title="Strikethrough"
              >
                <IconStrikethrough className="w-4 h-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('h1')}
                title="Heading 1"
              >
                <IconHeading className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('h2')}
                title="Heading 2"
              >
                <IconHeading className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('h3')}
                title="Heading 3"
              >
                <IconHeading className="w-4 h-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('list')}
                title="Bullet List"
              >
                <IconList className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('numbered-list')}
                title="Numbered List"
              >
                <IconListNumbers className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('quote')}
                title="Quote"
              >
                <IconQuote className="w-4 h-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('code')}
                title="Code"
              >
                <IconCode className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('link')}
                title="Link"
              >
                <IconLink className="w-4 h-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFormatting}
                title="Clear Formatting"
              >
                <IconClearFormatting className="w-4 h-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant={isPreviewMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                title="Toggle Preview Mode"
              >
                {isPreviewMode ? (
                  <IconEyeOff className="w-4 h-4" />
                ) : (
                  <IconEye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="px-4 pb-2 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
            {!isShared && (
              <span>Use the toolbar above for formatting • Ctrl+S to save</span>
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
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Note</DialogTitle>
          </DialogHeader>
          {!noteId ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">You need to save this note before you can generate a share link.</p>
              <Button
                size="sm"
                onClick={saveNote}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? 'Saving...' : 'Save Note to Share'}
              </Button>
            </div>
          ) : !isShared && (
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
          )}
          <DialogClose asChild>
            <Button variant="outline" className="mt-4 w-full">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <div className="h-full border rounded-lg p-4">
            {isPreviewMode ? (
              <div className="h-full overflow-y-auto prose prose-sm max-w-none">
                {renderMarkdown(content)}
              </div>
            ) : (
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e: { target: { value: any } }) => setContent(e.target.value)}
                onSelect={handleTextareaSelect}
                onKeyDown={handleKeyDown}
                placeholder={!noteId ? "Start writing your note...\n\n💡 Tips:\n• Use the toolbar above for formatting\n• Press Ctrl+S to save\n• Toggle preview mode to see how your note looks" : "Start writing your note... Use the toolbar above for formatting!"}
                className="h-full resize-none border-0 focus:ring-0 text-base font-mono"
                disabled={isShared}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 