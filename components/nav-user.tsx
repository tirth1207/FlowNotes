"use client"

import { useState } from "react"
import {
  IconApi,
  IconBook,
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconSettings,
  IconUserCircle,
} from "@tabler/icons-react"
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar?: string
  } | null
}) {
  if (!user) {
    return null
  }
  const { isMobile } = useSidebar()
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [blogEnabled, setBlogEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateApiKey = async () => {
    setIsLoading(true)
    try {
      // Generate a random API key
      const newApiKey = `nf_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      setApiKey(newApiKey)
      
      // Here you would typically save the API key to your database
      // For now, we'll just store it in state
      console.log('Generated API key:', newApiKey)
    } catch (error) {
      console.error('Error generating API key:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBlogEnabled = async () => {
    setIsLoading(true)
    try {
      setBlogEnabled(!blogEnabled)
      // Here you would typically update the user's blog settings in the database
      console.log('Blog enabled:', !blogEnabled)
    } catch (error) {
      console.error('Error updating blog settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconSettings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <IconApi className="mr-2 h-4 w-4" />
                    API Key
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>API Key Management</DialogTitle>
                    <DialogDescription>
                      Generate and manage your API key for blog publishing.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="api-key"
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          readOnly
                          placeholder="Generate an API key to get started"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={generateApiKey} disabled={isLoading}>
                        {isLoading ? "Generating..." : "Generate New Key"}
                      </Button>
                      {apiKey && (
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(apiKey)}>
                          Copy
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <IconBook className="mr-2 h-4 w-4" />
                    Blog Settings
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Blog Publishing Settings</DialogTitle>
                    <DialogDescription>
                      Configure your blog publishing preferences.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Blog Publishing</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow notes to be published as blog posts
                        </p>
                      </div>
                      <Switch
                        checked={blogEnabled}
                        onCheckedChange={toggleBlogEnabled}
                        disabled={isLoading}
                      />
                    </div>
                    {blogEnabled && (
                      <div className="space-y-2">
                        <Label>Blog URL</Label>
                        <Input
                          placeholder="https://your-blog.com"
                          defaultValue="https://your-blog.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          Your blog posts will be published to this URL
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
              <IconLogout className="mr-2 h-4 w-4" />
              {isLoading ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
