'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Lock, User, Trophy } from 'lucide-react'
import Image from 'next/image'

function usernameToEmail(username: string) {
  const slug = username.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')
  return `${slug}@porra2026.app`
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const email = usernameToEmail(username)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Nombre o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/inicio')
    router.refresh()
  }

  return (
    <div className="min-h-screen stars-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Image
              src="https://files.tips.gg/static/image/news/World-Cup-2026-Logo-PNG.png"
              alt="FIFA World Cup 2026"
              width={240}
              height={240}
              className="w-48 sm:w-60 h-auto drop-shadow-2xl"
              unoptimized
              priority
            />
          </div>
          <h1 className="mt-1 text-2xl font-black">
            <span className="gold-text">PORRA</span>
            <span className="text-white"> MUNDIAL 2026</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tu nombre</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="El nombre con el que te registraste"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-amber-400 hover:text-amber-300 font-semibold">
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          <Trophy size={12} className="inline mr-1" />
          Mundial USA · Canadá · México 2026
        </p>
      </div>
    </div>
  )
}
