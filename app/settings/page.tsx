import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings-form'

export default async function SettingsPage() {
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

    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Personalize your NoteForge experience</h1>
            <p className="text-muted-foreground text-lg">Configure your account settings, API keys, and blog publishing preferences.</p>
          </div>
          <SettingsForm user={newUser} />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Personalize your NoteForge experience</h1>
          <p className="text-muted-foreground text-lg">Configure your account settings, API keys, and blog publishing preferences.</p>
        </div>
        <SettingsForm user={user} />
      </div>
    </div>
  )
} 