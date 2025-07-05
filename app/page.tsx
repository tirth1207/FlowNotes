import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const supabase = createClient()
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession()
  
  // If user is signed in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-8 max-w-2xl mx-auto px-4">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome to NoteForge
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            A powerful note-taking app with real-time collaboration and blog publishing
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Create, organize, and share your notes with ease. 
            Publish your thoughts as blog posts with just a click.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="lg">
              Sign Up
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="font-semibold">Smart Notes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rich text editor with real-time collaboration
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <h3 className="font-semibold">Easy Sharing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share notes with team members instantly
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="font-semibold">Blog Publishing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Publish notes as blog posts with API
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
