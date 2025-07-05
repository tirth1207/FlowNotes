import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const apiKey = authHeader.replace('Bearer ', '')
    
    // Verify API key
    const supabase = createClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('api_key', apiKey)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    if (!user.blog_enabled) {
      return NextResponse.json({ error: 'Blog publishing is not enabled for this user' }, { status: 403 })
    }

    const body = await request.json()
    const { note_id, title, content } = body

    if (!note_id || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields: note_id, title, content' }, { status: 400 })
    }

    // Verify the note belongs to the user
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', note_id)
      .eq('owner_id', user.id)
      .eq('is_blog', true)
      .single()

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found or not marked as blog post' }, { status: 404 })
    }

    // Here you would typically publish to the user's blog URL
    // For now, we'll just return a success response
    const publishResult = {
      success: true,
      note_id: note_id,
      published_url: `${user.blog_url}/posts/${note_id}`,
      published_at: new Date().toISOString()
    }

    return NextResponse.json(publishResult)

  } catch (error) {
    console.error('Blog publishing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const apiKey = authHeader.replace('Bearer ', '')
    
    // Verify API key
    const supabase = createClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('api_key', apiKey)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Get user's blog posts
    const { data: blogPosts, error: postsError } = await supabase
      .from('notes')
      .select('id, title, content, created_at, updated_at')
      .eq('owner_id', user.id)
      .eq('is_blog', true)
      .order('updated_at', { ascending: false })

    if (postsError) {
      return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        blog_url: user.blog_url
      },
      blog_posts: blogPosts
    })

  } catch (error) {
    console.error('Blog API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 