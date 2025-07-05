import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TeamJoinPage({ params }: { params: { invite_id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?next=' + encodeURIComponent(`/team/join/${params.invite_id}`))
  }

  // Fetch the invite
  const { data: invite } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', params.invite_id)
    .single()

  if (!invite) {
    return <div className="max-w-xl mx-auto p-8 text-center"><h1 className="text-2xl font-bold mb-4">Invite Not Found</h1></div>
  }

  // If already accepted
  if (invite.status === 'accepted') {
    return <div className="max-w-xl mx-auto p-8 text-center"><h1 className="text-2xl font-bold mb-4">You are already a member of this team!</h1></div>
  }

  // If email matches, accept the invite
  const userEmail = session.user.email
  if (invite.invited_email === userEmail) {
    await supabase
      .from('team_members')
      .update({ user_id: session.user.id, status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', params.invite_id)
    return <div className="max-w-xl mx-auto p-8 text-center"><h1 className="text-2xl font-bold mb-4">Welcome to the team!</h1></div>
  }

  return <div className="max-w-xl mx-auto p-8 text-center"><h1 className="text-2xl font-bold mb-4">This invite is for {invite.invited_email}. Please log in with the correct email.</h1></div>
} 