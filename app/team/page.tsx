"use client"
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const teamMembers = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
]
const teamNotes = [
  { title: 'Team Meeting', id: '1' },
  { title: 'Sprint Plan', id: '2' },
]

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  // For demo, assume a single team for the user (get or create)
  const teamId = 'demo-team-id' // Replace with real logic

  const handleInvite = async () => {
    setIsInviting(true)
    setInviteLink('')
    const supabase = createClient()
    // Insert invite
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        invited_email: inviteEmail,
        status: 'pending',
      })
      .select()
      .single()
    if (error || !data) {
      alert('Error sending invite')
      setIsInviting(false)
      return
    }
    // Show/copy join link
    const link = `${window.location.origin}/team/join/${data.id}`
    setInviteLink(link)
    await navigator.clipboard.writeText(link)
    setInviteEmail('')
    setIsInviting(false)
    alert('Invite sent and link copied!')
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Collaborate with your team</h1>
      <p className="mb-6 text-muted-foreground">Invite team members, manage your team, and share notes for seamless collaboration.</p>
      <h2 className="font-semibold mb-2">Members</h2>
      <ul className="mb-4">
        {teamMembers.map((m, i) => (
          <li key={i}>{m.name} ({m.email})</li>
        ))}
      </ul>
      <form onSubmit={e => { e.preventDefault(); handleInvite(); }} className="flex gap-2 mb-8">
        <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Invite by email" />
        <Button type="submit" disabled={isInviting}>{isInviting ? 'Inviting...' : 'Invite'}</Button>
      </form>
      {inviteLink && (
        <div className="mb-4 text-green-700">Invite link: <a href={inviteLink} className="underline">{inviteLink}</a></div>
      )}
      <div className="mb-8">
        <h2 className="font-semibold mb-2">How to use teams</h2>
        <ul className="list-disc ml-6 text-muted-foreground text-sm">
          <li>Invite members by email to join your team.</li>
          <li>Accepted members can view and collaborate on team notes.</li>
          <li>Use the invite link to onboard new members quickly.</li>
        </ul>
      </div>
      <h2 className="font-semibold mb-2">Team Notes</h2>
      <ul>
        {teamNotes.map((n, i) => (
          <li key={i}>{n.title}</li>
        ))}
      </ul>
    </div>
  )
} 