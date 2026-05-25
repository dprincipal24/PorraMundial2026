import { BookOpen, Star, Trophy, Medal, Coins, Clock, CheckCircle } from 'lucide-react'

export default function RulesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BookOpen className="text-amber-400" size={22} />
          Reglas de la Porra
        </h1>
        <p className="text-gray-500 text-sm mt-1">Mundial 2026 · USA, Canadá y México</p>
      </div>

      {/* Participación */}
      <section className="glass rounded-xl p-5 border border-gray-800 space-y-3">
        <h2 className="font-black text-white flex items-center gap-2">
          <Coins size={18} className="text-yellow-400" />
          Participación
        </h2>
        <p className="text-sm text-gray-300">
          Cada participante aporta <span className="text-white font-bold">10 €</span> al bote. El dinero se reparte entre los tres primeros clasificados:
        </p>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="bg-amber-500/10 rounded-lg py-3 px-2">
            <p className="text-2xl mb-1">🥇</p>
            <p className="font-black text-amber-400">8N − 10 €</p>
            <p className="text-xs text-gray-500 mt-0.5">1.er clasificado</p>
          </div>
          <div className="bg-gray-400/10 rounded-lg py-3 px-2">
            <p className="text-2xl mb-1">🥈</p>
            <p className="font-black text-gray-300">2N €</p>
            <p className="text-xs text-gray-500 mt-0.5">2.º clasificado</p>
          </div>
          <div className="bg-amber-700/10 rounded-lg py-3 px-2">
            <p className="text-2xl mb-1">🥉</p>
            <p className="font-black text-amber-700">10 €</p>
            <p className="text-xs text-gray-500 mt-0.5">3.er clasificado</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">N = número total de participantes</p>
      </section>

      {/* Fase de grupos */}
      <section className="glass rounded-xl p-5 border border-gray-800 space-y-3">
        <h2 className="font-black text-white flex items-center gap-2">
          <Star size={18} className="text-amber-400" />
          Fase de Grupos
        </h2>
        <p className="text-sm text-gray-400">
          Pronostica el marcador exacto de los <span className="text-white">48 partidos</span> de la fase de grupos. Se puntúa así:
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-lg">✨</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-yellow-300">Resultado exacto</p>
              <p className="text-xs text-gray-400">Marcador correcto al 100%</p>
            </div>
            <span className="font-black text-yellow-300 text-lg">+6 pts</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="text-lg">✅</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-400">Signo correcto</p>
              <p className="text-xs text-gray-400">Victoria local, empate o victoria visitante</p>
            </div>
            <span className="font-black text-green-400 text-lg">+3 pts</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-lg">❌</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-400">Fallo</p>
              <p className="text-xs text-gray-400">Signo incorrecto</p>
            </div>
            <span className="font-black text-red-400 text-lg">+0 pts</span>
          </div>
        </div>

        <div className="pt-1 border-t border-gray-800 space-y-2.5">
          <p className="text-sm font-bold text-white">Clasificados de grupo</p>
          <p className="text-sm text-gray-400">
            El Mundial 2026 tiene <strong className="text-white">12 grupos de 4 equipos</strong>. Clasifican directamente los 2 primeros de cada grupo (24 equipos) más los <strong className="text-sky-400">8 mejores terceros</strong> de los 12 grupos.
          </p>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">2</span>
              <p className="text-gray-300"><strong className="text-white">Directos:</strong> los 2 primeros de cada grupo — elige <strong>2 por grupo</strong> · +5 pts por acierto</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">8</span>
              <p className="text-gray-300"><strong className="text-sky-400">Terceros:</strong> los 8 mejores 3.os clasificados — elige hasta <strong>1 tercero</strong> por grupo (máx. 8 en total) · +5 pts por acierto</p>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg px-3 py-2.5 text-xs text-gray-400 space-y-1">
            <p className="font-semibold text-gray-300">¿Qué 8 terceros clasifican? Orden de criterios FIFA:</p>
            <ol className="list-decimal list-inside space-y-0.5 ml-1">
              <li>Puntos obtenidos en la fase de grupos</li>
              <li>Diferencia de goles</li>
              <li>Goles marcados</li>
              <li>Puntos de fair play (tarjetas)</li>
              <li>Ranking FIFA</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Fase eliminatoria */}
      <section className="glass rounded-xl p-5 border border-gray-800 space-y-3">
        <h2 className="font-black text-white flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          Fase Eliminatoria
        </h2>
        <p className="text-sm text-gray-400">
          Antes de que empiece cada ronda, pronostica qué equipos llegan hasta ella. Los puntos aumentan según lo lejos que llegues:
        </p>
        <div className="space-y-1.5">
          {[
            { round: 'Ronda de 32',  pts: 5,  desc: '32 equipos → 16 pasan' },
            { round: 'Cuartos de final', pts: 9, desc: '8 equipos → 4 pasan' },
            { round: 'Semifinales', pts: 15, desc: '4 equipos → 2 pasan' },
            { round: 'Final',       pts: 25, desc: '2 equipos finalistas' },
            { round: 'Campeón',     pts: 40, desc: 'El equipo ganador del torneo' },
          ].map(({ round, pts, desc }) => (
            <div key={round} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/40">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{round}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <span className="font-black text-amber-400">+{pts} pts</span>
            </div>
          ))}
        </div>
      </section>

      {/* Premios individuales */}
      <section className="glass rounded-xl p-5 border border-gray-800 space-y-3">
        <h2 className="font-black text-white flex items-center gap-2">
          <Medal size={18} className="text-amber-400" />
          Premios Individuales
        </h2>
        <p className="text-sm text-gray-400">
          Pronostica el ganador de cada premio individual. Cada acierto vale <span className="text-white font-bold">25 puntos</span>.
        </p>
        <div className="space-y-1.5">
          {[
            { emoji: '🏅', label: 'Balón de Oro',        desc: 'Mejor jugador del torneo' },
            { emoji: '👟', label: 'Bota de Oro',         desc: 'Máximo goleador' },
            { emoji: '🧤', label: 'Guante de Oro',       desc: 'Mejor portero' },
            { emoji: '⭐', label: 'Mejor Jugador Joven', desc: 'Mejor jugador ≤ 21 años a 1 ene 2026' },
          ].map(({ emoji, label, desc }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/40">
              <span className="text-xl">{emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <span className="font-black text-amber-400">+25 pts</span>
            </div>
          ))}
        </div>
      </section>

      {/* Plazos */}
      <section className="glass rounded-xl p-5 border border-gray-800 space-y-3">
        <h2 className="font-black text-white flex items-center gap-2">
          <Clock size={18} className="text-amber-400" />
          Plazos
        </h2>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex gap-2">
            <CheckCircle size={15} className="text-green-400 shrink-0 mt-0.5" />
            <p>Los pronósticos de <span className="text-white font-semibold">grupos y premios individuales</span> deben enviarse antes del inicio del torneo.</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle size={15} className="text-green-400 shrink-0 mt-0.5" />
            <p>Los pronósticos de <span className="text-white font-semibold">fase eliminatoria</span> deben enviarse antes de que arranque esa fase.</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle size={15} className="text-green-400 shrink-0 mt-0.5" />
            <p>Una vez cerrado el plazo <span className="text-white font-semibold">no se pueden modificar</span> los pronósticos. ¡No dejes nada para el último momento!</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle size={15} className="text-green-400 shrink-0 mt-0.5" />
            <p>Cuando el plazo cierra, podrás ver los pronósticos del resto de participantes y descargar un <span className="text-white font-semibold">PDF con todos los pronósticos</span>, firmado con la fecha y hora exacta de descarga, como garantía de que no habrá modificaciones a posteriori.</p>
          </div>
        </div>
      </section>

      {/* Resumen puntuación */}
      <section className="glass rounded-xl p-5 border border-amber-500/20 bg-amber-500/3 space-y-3">
        <h2 className="font-black text-amber-400">Resumen de puntuación</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-400 text-xs">Resultado exacto</p>
            <p className="font-black text-white">6 pts</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-400 text-xs">Signo correcto</p>
            <p className="font-black text-white">3 pts</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-400 text-xs">Clasificado de grupo (×32)</p>
            <p className="font-black text-white">5 pts</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-400 text-xs">Premio individual</p>
            <p className="font-black text-white">25 pts</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-400 text-xs">Fase eliminatoria</p>
            <p className="font-black text-white">5 – 40 pts</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg px-3 py-2">
            <p className="text-gray-400 text-xs">Campeón</p>
            <p className="font-black text-amber-400">40 pts</p>
          </div>
        </div>
      </section>
    </div>
  )
}
