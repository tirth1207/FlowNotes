"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  IconBook,
  IconDashboard,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconLogout,
  IconSearch,
  IconSettings,
  IconShare,
  IconUser,
  IconUsers,
  IconWriting,
} from "@tabler/icons-react"
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (userData) {
            setUser({
              id: userData.id,
              name: userData.name || userData.email.split('@')[0],
              email: userData.email,
              avatar: userData.avatar
            })
          } else if (error) {
            // If user doesn't exist in our table, create them
            const { data: newUser } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
              })
              .select()
              .single()
            
            if (newUser) {
              setUser({
                id: newUser.id,
                name: newUser.name || newUser.email.split('@')[0],
                email: newUser.email,
                avatar: newUser.avatar
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "My Notes",
      url: "/dashboard",
      icon: IconFileDescription,
    },
    {
      title: "Shared With Me",
      url: "/dashboard?shared=true",
      icon: IconShare,
    },
    {
      title: "Blog Posts",
      url: "/dashboard?blog=true",
      icon: IconBook,
    },
  ]

  const navSecondary = [
    {
      title: "Search Notes",
      url: "/search",
      icon: IconSearch,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Help",
      url: "/help",
      icon: IconHelp,
    },
  ]

  const documents = [
    {
      name: "Quick Notes",
      url: "/note/new",
      icon: IconWriting,
    },
    {
      name: "Templates",
      url: "/templates",
      icon: IconFolder,
    },
    {
      name: "Team Notes",
      url: "/team",
      icon: IconUsers,
    },
  ]

  if (loading) {
    return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5">
                <div className="animate-pulse bg-gray-200 h-5 w-5 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-8 w-full rounded"></div>
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">NoteForge</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
              <SidebarFooter>
          <NavUser user={user ? { name: user.name || '', email: user.email || '', avatar: user.avatar } : null} />
        </SidebarFooter>
    </Sidebar>
  )
}
