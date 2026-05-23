import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trophy, Star, BarChart2, Users, Zap } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/inicio')

  return (
    <main className="min-h-screen stars-bg flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-6">
          <span className="text-7xl md:text-8xl">🏆</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
          <span className="gold-text">PORRA</span>{' '}
          <span className="text-white">MUNDIAL</span>
          <br />
          <span className="text-amber-400">2026</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-lg mb-8 leading-relaxed">
          Haz tus pronósticos de todos los partidos del Mundial,
          compite con tus amigos y sube en la clasificación en tiempo real.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <Link href="/register">
            <Button size="lg" variant="primary" className="w-full sm:w-auto">
              <Star size={18} />
              Unirme a la Porra
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Ya tengo cuenta
            </Button>
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full">
          {[
            {
              icon: Star,
              title: '104 Partidos',
              desc: 'Pronostica todos los partidos de la fase de grupos y eliminatorias',
              color: 'text-amber-400',
            },
            {
              icon: Trophy,
              title: 'Sistema de Puntos',
              desc: '3 pts resultado · 6 pts marcador exacto · hasta 40 pts por el campeón',
              color: 'text-green-400',
            },
            {
              icon: BarChart2,
              title: 'Ranking en Vivo',
              desc: 'La clasificación se actualiza en tiempo real conforme avanzan los partidos',
              color: 'text-blue-400',
            },
            {
              icon: Users,
              title: 'Hasta 30 amigos',
              desc: 'Invita a tus amigos con el enlace. Sin instalación, desde el móvil',
              color: 'text-purple-400',
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="glass rounded-xl p-5 text-left">
              <Icon size={22} className={`mb-3 ${color}`} />
              <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring table */}
      <section className="px-4 pb-16 max-w-3xl mx-auto w-full">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap size={18} className="text-amber-400" />
            <h2 className="font-black text-white">Sistema de Puntuación</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Resultado correcto (1X2)', pts: '+3 pts', color: 'text-green-400' },
              { label: 'Marcador exacto', pts: '+6 pts', color: 'text-amber-400' },
              { label: 'Clasificado a fase final', pts: '+5 pts', color: 'text-blue-400' },
              { label: 'Clasificado a Octavos', pts: '+5 pts', color: 'text-blue-400' },
              { label: 'Clasificado a Cuartos', pts: '+9 pts', color: 'text-purple-400' },
              { label: 'Clasificado a Semifinales', pts: '+15 pts', color: 'text-orange-400' },
              { label: 'Clasificado a la Final', pts: '+25 pts', color: 'text-red-400' },
              { label: '🏆 Campeón del Mundo', pts: '+40 pts', color: 'text-amber-400' },
            ].map(({ label, pts, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-gray-300">{label}</span>
                <span className={`font-black ${color}`}>{pts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
