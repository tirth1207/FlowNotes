"use client"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const templates = [
  { title: 'Meeting Notes', content: '## Meeting Notes\n- Attendees:\n- Agenda:\n- Notes:\n', description: 'Capture meeting details, attendees, and action items.' },
  { title: 'Daily Journal', content: '## Daily Journal\n- Date:\n- Mood:\n- Highlights:\n', description: 'Reflect on your day and track your mood.' },
  { title: 'Project Plan', content: '## Project Plan\n- Goals:\n- Timeline:\n- Tasks:\n', description: 'Outline project goals, timeline, and tasks.' },
]

export default function TemplatesPage() {
  const router = useRouter()
  const useTemplate = (template: any) => {
    // Pass template content via query param or localStorage
    localStorage.setItem('templateContent', template.content)
    router.push('/note/new')
  }
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Jumpstart your notes with templates</h1>
      <p className="mb-6 text-muted-foreground">Choose a template to quickly create a new note for meetings, journaling, or planning.</p>
      <ul className="space-y-4">
        {templates.map((tpl, i) => (
          <li key={i} className="border rounded p-4">
            <div className="font-semibold mb-1">{tpl.title}</div>
            <div className="text-sm text-muted-foreground mb-2">{tpl.description}</div>
            <Button size="sm" onClick={() => useTemplate(tpl)}>Create from Template</Button>
          </li>
        ))}
      </ul>
    </div>
  )
} 