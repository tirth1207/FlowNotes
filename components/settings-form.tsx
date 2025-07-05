'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { IconApi, IconBook, IconCopy, IconEye, IconEyeOff, IconRefresh } from '@tabler/icons-react'

interface User {
  id: string
  name: string
  email: string
  api_key?: string
  blog_enabled?: boolean
  blog_url?: string
}

interface SettingsFormProps {
  user: User
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [apiKey, setApiKey] = useState(user?.api_key || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [blogEnabled, setBlogEnabled] = useState(user?.blog_enabled || false)
  const [blogUrl, setBlogUrl] = useState(user?.blog_url || '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const generateApiKey = async () => {
    setIsLoading(true)
    try {
      const newApiKey = `nf_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      setApiKey(newApiKey)
      
      // Save to database
      const { error } = await supabase
        .from('users')
        .update({ api_key: newApiKey })
        .eq('id', user.id)
      
      if (error) {
        setMessage('Failed to save API key')
      } else {
        setMessage('API key generated and saved successfully!')
      }
    } catch (error) {
      setMessage('Error generating API key')
    } finally {
      setIsLoading(false)
    }
  }

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setMessage('API key copied to clipboard!')
    } catch (error) {
      setMessage('Failed to copy API key')
    }
  }

  const updateBlogSettings = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          blog_enabled: blogEnabled,
          blog_url: blogUrl 
        })
        .eq('id', user.id)
      
      if (error) {
        setMessage('Failed to update blog settings')
      } else {
        setMessage('Blog settings updated successfully!')
      }
    } catch (error) {
      setMessage('Error updating blog settings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded text-sm ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconApi className="h-5 w-5" />
            API Key Management
          </CardTitle>
          <CardDescription>
            Generate and manage your API key for blog publishing and external integrations. Keep your API key secure and never share it publicly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                readOnly
                placeholder="Generate an API key to get started"
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateApiKey} disabled={isLoading}>
              <IconRefresh className="h-4 w-4 mr-2" />
              {isLoading ? "Generating..." : "Generate New Key"}
            </Button>
            {apiKey && (
              <Button variant="outline" onClick={copyApiKey}>
                <IconCopy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
          </div>
          {apiKey && (
            <div className="text-xs text-muted-foreground">
              <p>Use this API key to authenticate requests to your blog publishing endpoint.</p>
              <p className="mt-1">Example: <code className="bg-muted px-1 rounded">curl -H "Authorization: Bearer {apiKey}" https://your-api.com/publish</code></p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Usage Examples */}
      {apiKey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconApi className="h-5 w-5" />
              API Usage Examples
            </CardTitle>
            <CardDescription>
              Here are examples of how to use your API key to interact with NoteForge programmatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Blog Posts API */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">📝 Get All Blog Posts</h4>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">cURL:</div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border">
                  <code>{`curl -H "Authorization: Bearer ${apiKey}" \\
  https://your-domain.com/api/blog`}</code>
                </pre>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">JavaScript (fetch):</div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border">
                  <code>{`const response = await fetch('https://your-domain.com/api/blog', {
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  }
});
const blogPosts = await response.json();`}</code>
                </pre>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Python (requests):</div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border">
                  <code>{`import requests

headers = {
    'Authorization': f'Bearer ${apiKey}',
    'Content-Type': 'application/json'
}

response = requests.get('https://your-domain.com/api/blog', headers=headers)
blog_posts = response.json()`}</code>
                </pre>
              </div>
            </div>

            {/* Create Note API */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">✏️ Create a New Note</h4>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">cURL:</div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border">
                  <code>{`curl -X POST https://your-domain.com/api/notes \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My New Note",
    "content": "This is the content of my note",
    "is_blog": false
  }'`}</code>
                </pre>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">JavaScript (fetch):</div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border">
                  <code>{`const response = await fetch('https://your-domain.com/api/notes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My New Note',
    content: 'This is the content of my note',
    is_blog: false
  })
});
const newNote = await response.json();`}</code>
                </pre>
              </div>
            </div>

            {/* Update Note API */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">🔄 Update an Existing Note</h4>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">cURL:</div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border">
                  <code>{`curl -X PUT https://your-domain.com/api/notes/NOTE_ID \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Updated Note Title",
    "content": "Updated content here",
    "is_blog": true
  }'`}</code>
                </pre>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">JavaScript (fetch):</div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border">
                  <code>{`const response = await fetch('https://your-domain.com/api/notes/NOTE_ID', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Updated Note Title',
    content: 'Updated content here',
    is_blog: true
  })
});
const updatedNote = await response.json();`}</code>
                </pre>
              </div>
            </div>

            {/* Search Notes API */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">🔍 Search Your Notes</h4>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">cURL:</div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border">
                  <code>{`curl -H "Authorization: Bearer ${apiKey}" \\
  "https://your-domain.com/api/notes/search?q=meeting+notes"`}</code>
                </pre>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">JavaScript (fetch):</div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto border">
                  <code>{`const response = await fetch('https://your-domain.com/api/notes/search?q=meeting+notes', {
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  }
});
const searchResults = await response.json();`}</code>
                </pre>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Replace <code className="bg-blue-100 px-1 rounded">your-domain.com</code> with your actual NoteForge domain. 
                The API endpoints are automatically available when you deploy your NoteForge instance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blog Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBook className="h-5 w-5" />
            Blog Publishing Settings
          </CardTitle>
          <CardDescription>
            Configure your blog publishing preferences and settings. Enable blog mode to publish your notes as public blog posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Blog Publishing</Label>
              <p className="text-sm text-muted-foreground">
                Allow notes to be published as blog posts with public access
              </p>
            </div>
            <Switch
              checked={blogEnabled}
              onCheckedChange={setBlogEnabled}
              disabled={isLoading}
            />
          </div>
          
          {blogEnabled && (
            <div className="space-y-2">
              <Label htmlFor="blog-url">Blog URL</Label>
              <Input
                id="blog-url"
                placeholder="https://your-blog.com"
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your blog posts will be published to this URL. Leave empty to use the default NoteForge blog endpoint.
              </p>
            </div>
          )}
          
          <Button onClick={updateBlogSettings} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Blog Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Account Status</Badge>
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 