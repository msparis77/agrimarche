'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useUnreadMessages() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  const fetchUnread = async () => {
    if (!user) { setUnread(0); return }
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('lu', false)
    setUnread(count || 0)
  }

  useEffect(() => {
    if (!user) return
    fetchUnread()

    const channel = supabase
      .channel(`unread-badge-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => fetchUnread())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => fetchUnread())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  return unread
}
