"use client"
import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { IconSearch } from '@tabler/icons-react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = async (q: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setResults([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('owner_id', session.user.id)
      .ilike('title', `%${q}%`)
    setResults(data || [])
    setLoading(false)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-6">
        <IconSearch className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Find your notes instantly</h1>
          <div className="text-muted-foreground text-sm">Type keywords to search by title or content.</div>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <Input value={query} onChange={onInputChange} placeholder="Search by title..." />
        <Button onClick={() => handleSearch(query)} disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
      </div>
      <ul className="space-y-2">
        {results.map(note => (
          <li key={note.id} className="border rounded p-2">
            <div className="font-semibold">{note.title}</div>
            <div className="text-xs text-muted-foreground">{note.content?.content?.[0]?.content?.[0]?.text?.slice(0, 100)}</div>
          </li>
        ))}
        {results.length === 0 && !loading && (
          <li className="text-muted-foreground text-center py-8">
            <div className="text-lg">No results found.</div>
            <div className="text-sm">Try a different keyword or check your spelling.</div>
          </li>
        )}
      </ul>
    </div>
  )
} 