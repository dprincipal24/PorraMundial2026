'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Home, BarChart2, Star, Settings, Menu, X, LogOut, BookOpen, FlaskConical } from 'lucide-react'
import Image from 'next/image'

interface NavbarProps {
  isAdmin?: boolean
  userName?: string
  userAvatar?: string | null
}

const NAV_LINKS = [
  { href: '/inicio',      label: 'Inicio',        icon: Home },
  { href: '/leaderboard', label: 'Clasificación', icon: BarChart2 },
  { href: '/predictions', label: 'Pronósticos',   icon: Star },
  { href: '/simulador',   label: 'Simulador',     icon: FlaskConical },
  { href: '/rules',       label: 'Reglas',        icon: BookOpen },
]

function SmallAvatar({ avatarUrl, name }: { avatarUrl: string | null | undefined; name: string }) {
  if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
    return <Image src={avatarUrl} alt={name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" unoptimized />
  }
  if (avatarUrl && avatarUrl.length <= 4) {
    return <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-sm leading-none">{avatarUrl}</span>
  }
  return (
    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-black text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export function Navbar({ isAdmin, userName, userAvatar }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/inicio" className="flex items-center gap-2 group">
            <span className="text-2xl">🏆</span>
            <div className="leading-none">
              <p className="text-sm font-black tracking-wider text-amber-400">PORRA</p>
              <p className="text-xs font-bold text-gray-400 tracking-widest">MUNDIAL 2026</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/inicio' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5',
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'text-gray-400 hover:text-purple-400 hover:bg-white/5',
                )}
              >
                <Settings size={15} />
                Admin
              </Link>
            )}
          </div>

          {/* User + logout */}
          <div className="hidden md:flex items-center gap-3">
            {userName && (
              <Link
                href="/perfil"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <SmallAvatar avatarUrl={userAvatar} name={userName} />
                <span>
                  Hola, <span className="text-white font-medium group-hover:text-amber-400 transition-colors">{userName.split(' ')[0]}</span>
                </span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded cursor-pointer"
            >
              <LogOut size={15} />
              Salir
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 space-y-1 border-t border-white/5 pt-3">
            {userName && (
              <Link
                href="/perfil"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5"
              >
                <SmallAvatar avatarUrl={userAvatar} name={userName} />
                Mi perfil
              </Link>
            )}
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/inicio' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5',
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-purple-400 hover:bg-white/5"
              >
                <Settings size={16} />
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-white/5 cursor-pointer"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
