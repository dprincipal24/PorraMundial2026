'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, X, Send, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  user_id: string
  message: string
  created_at: string
  user_name: string
}

interface Props {
  userId: string
  userName: string
  isAdmin: boolean
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

export function ChatWidget({ userId, userName, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const namesRef = useRef<Record<string, string>>({})
  const openRef = useRef(open)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const isFirstLoadRef = useRef(true)

  useEffect(() => { openRef.current = open }, [open])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function load() {
      const since = new Date(Date.now() - TWO_DAYS_MS).toISOString()
      const [{ data: msgs }, { data: profiles }] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('id, user_id, message, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: true })
          .limit(300),
        supabase.from('profiles').select('id, name'),
      ])
      if (!active) return
      const names: Record<string, string> = {}
      for (const p of profiles ?? []) names[p.id] = p.name
      namesRef.current = names

      const merged = (msgs ?? []).map(m => ({ ...m, user_name: names[m.user_id] ?? 'Anónimo' }))

      // La primera carga (montaje/recarga de página) solo establece la base de
      // "ya visto" — no hay nada con lo que comparar todavía, así que no cuenta
      // como no leído. Solo lo que llega DESPUÉS de esa base es "nuevo" de verdad.
      if (isFirstLoadRef.current) {
        seenIdsRef.current = new Set(merged.map(m => m.id))
        isFirstLoadRef.current = false
      } else {
        const newCount = merged.filter(m => !seenIdsRef.current.has(m.id) && m.user_id !== userId).length
        seenIdsRef.current = new Set(merged.map(m => m.id))
        if (newCount > 0 && !openRef.current) setUnread(u => u + newCount)
      }

      setMessages(merged)
      setLoading(false)
    }
    load()

    // Red de seguridad: si el WebSocket se queda dormido en segundo plano (móvil)
    // o el token de sesión se refresca a mitad de conexión, esto recupera los
    // mensajes perdidos sin que el usuario tenga que recargar la página.
    const pollId = setInterval(load, 25000)
    function handleVisible() {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener('focus', handleVisible)

    const channel = supabase
      .channel('chat_messages_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => {
          const m = payload.new as { id: string; user_id: string; message: string; created_at: string }
          if (seenIdsRef.current.has(m.id)) return
          seenIdsRef.current.add(m.id)
          const resolvedName = namesRef.current[m.user_id] ?? (m.user_id === userId ? userName : 'Anónimo')
          setMessages(prev => [...prev, { ...m, user_name: resolvedName }])
          if (!openRef.current && m.user_id !== userId) setUnread(u => u + 1)
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        payload => {
          const old = payload.old as { id: string }
          seenIdsRef.current.delete(old.id)
          setMessages(prev => prev.filter(m => m.id !== old.id))
        },
      )
      .subscribe(status => {
        if (status !== 'SUBSCRIBED') console.warn('[chat] realtime status:', status)
      })

    return () => {
      active = false
      clearInterval(pollId)
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener('focus', handleVisible)
      supabase.removeChannel(channel)
    }
  }, [userId, userName])

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, open])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')
    const supabase = createClient()
    await supabase.from('chat_messages').insert({ user_id: userId, message: trimmed })
  }

  async function deleteMessage(id: string) {
    const supabase = createClient()
    await supabase.from('chat_messages').delete().eq('id', id)
  }

  return (
    <>
      <button
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) setUnread(0)
        }}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center shadow-lg shadow-black/30 cursor-pointer"
        aria-label="Chat"
      >
        {open ? <X size={20} className="text-black" /> : <MessageCircle size={20} className="text-black" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] h-96 max-h-[70vh] glass rounded-2xl border border-gray-700 flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <p className="font-bold text-white text-sm">Chat de la porra</p>
            <p className="text-[10px] text-gray-500">se borra a los 2 días</p>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {loading ? (
              <div className="py-8 text-center text-gray-500 text-xs">Cargando...</div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs px-4">
                Todavía no hay mensajes. ¡Escribe el primero!
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className="group flex items-start gap-1.5 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className={cn('font-bold', m.user_id === userId ? 'text-amber-400' : 'text-blue-400')}>
                      {m.user_name}
                    </span>
                    <span className="text-gray-300">: {m.message}</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => deleteMessage(m.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0 cursor-pointer"
                      aria-label="Borrar mensaje"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-2 border-t border-gray-700 flex items-center gap-1.5">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={500}
              placeholder="Escribe un mensaje..."
              className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Enviar"
            >
              <Send size={14} className="text-black" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
