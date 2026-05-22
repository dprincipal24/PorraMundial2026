'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Lock, User, Trophy } from 'lucide-react'

function usernameToEmail(username: string) {
  const slug = username.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')
  return `${slug}@porra2026.app`
}

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (username.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const email = usernameToEmail(username)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: username.trim() } },
    })

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')
          ? 'Ese nombre ya está en uso, elige otro'
          : `Error: ${signUpError.message}`
      )
      setLoading(false)
      return
    }

    if (!data.session) {
      setError('Error al iniciar sesión tras el registro. Avisa al administrador.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      window.location.href = '/leaderboard'
    }, 1200)
  }

  if (success) {
    return (
      <div className="min-h-screen stars-bg flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-black text-white mt-4">¡Bienvenido a la Porra!</h2>
          <p className="text-gray-400 mt-2">Entrando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen stars-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">⚽</span>
          <h1 className="mt-3 text-2xl font-black">
            <span className="text-white">Únete a la </span>
            <span className="gold-text">Porra</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Mundial USA · Canadá · México 2026</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Tu nombre <span className="text-gray-600">(como te verán los demás)</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: Juanito, Messi Fan..."
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
                  placeholder="Mínimo 6 caracteres"
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
              {loading ? 'Registrando...' : '¡Apuntarme!'}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          <Trophy size={12} className="inline mr-1" />
          La clasificación se actualiza en tiempo real
        </p>
      </div>
    </div>
  )
}
