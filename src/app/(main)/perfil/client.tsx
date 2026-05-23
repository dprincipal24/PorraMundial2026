'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AVATAR_EMOJIS } from '@/lib/data/awards'
import {
  Star, Trophy, Medal, CheckCircle, KeyRound,
  Pencil, Camera, Save, X, Eye, EyeOff,
} from 'lucide-react'

interface PerfilClientProps {
  userId: string
  userEmail: string
  initialName: string
  initialAvatar: string | null
  phase: string
  groupOpen: boolean
  knockoutOpen: boolean
  awardsOpen: boolean
  matchPredCount: number
  groupMatchTotal: number
  qualifyPredCount: number
  qualifyTotal: number
  knockoutPredCount: number
  knockoutTotal: number
  awardPredCount: number
  awardTotal: number
}

function AvatarDisplay({ avatarUrl, name, size }: { avatarUrl: string; name: string; size: number }) {
  if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
    return <Image src={avatarUrl} alt={name} width={size} height={size} className="rounded-full object-cover" unoptimized />
  }
  if (avatarUrl && avatarUrl.length <= 4) {
    return (
      <div className="rounded-full bg-gray-800 flex items-center justify-center" style={{ width: size, height: size }}>
        <span style={{ fontSize: size * 0.45 }}>{avatarUrl}</span>
      </div>
    )
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function PredictionItem({
  icon, label, done, current, total, link, active,
}: {
  icon: React.ReactNode
  label: string
  done: boolean
  current: number
  total: number
  link: string
  active: boolean
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border',
      done ? 'border-green-500/30 bg-green-500/5' : active ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-800 bg-gray-900/50',
    )}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', done ? 'text-green-400' : 'text-white')}>{label}</p>
        {done ? (
          <p className="text-xs text-green-600">Completado</p>
        ) : (
          <p className="text-xs text-gray-500">{current} de {total} introducidos</p>
        )}
      </div>
      {done ? (
        <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
      ) : active ? (
        <Link href={link} className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-2.5 py-1 rounded-lg flex-shrink-0 transition-colors">
          Completar →
        </Link>
      ) : (
        <span className="text-xs text-gray-600 flex-shrink-0">Cerrado</span>
      )}
    </div>
  )
}

export function PerfilClient({
  userId, userEmail, initialName, initialAvatar,
  phase, groupOpen, knockoutOpen, awardsOpen,
  matchPredCount, groupMatchTotal, qualifyPredCount, qualifyTotal,
  knockoutPredCount, knockoutTotal, awardPredCount, awardTotal,
}: PerfilClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // Name
  const [name, setName] = useState(initialName)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(initialName)
  const [nameSaving, setNameSaving] = useState(false)

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar ?? '')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [urlInput, setUrlInput] = useState(initialAvatar?.startsWith('http') ? initialAvatar : '')
  const [avatarSaving, setAvatarSaving] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  // Toast
  const [toast, setToast] = useState('')
  function showToast(text: string) {
    setToast(text)
    setTimeout(() => setToast(''), 3000)
  }

  async function saveName() {
    if (nameInput.trim().length < 2) return
    setNameSaving(true)
    await supabase.from('profiles').update({ name: nameInput.trim() }).eq('id', userId)
    setName(nameInput.trim())
    setEditingName(false)
    setNameSaving(false)
    showToast('Nombre actualizado')
    router.refresh()
  }

  async function saveAvatar(value: string) {
    setAvatarSaving(true)
    await supabase.from('profiles').update({ avatar_url: value || null }).eq('id', userId)
    setAvatarUrl(value)
    setAvatarSaving(false)
    setShowAvatarPicker(false)
    showToast('Avatar actualizado')
    router.refresh()
  }

  async function changePassword() {
    if (newPassword.length < 6) {
      setPasswordMsg({ ok: false, text: 'La nueva contraseña debe tener al menos 6 caracteres' })
      return
    }
    setPasswordSaving(true)
    setPasswordMsg(null)

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    })
    if (verifyError) {
      setPasswordMsg({ ok: false, text: 'Contraseña actual incorrecta' })
      setPasswordSaving(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setPasswordMsg({ ok: false, text: updateError.message })
    } else {
      setPasswordMsg({ ok: true, text: '¡Contraseña cambiada correctamente!' })
      setCurrentPassword('')
      setNewPassword('')
    }
    setPasswordSaving(false)
  }

  const inKnockoutPhase = ['knockout_predictions', 'knockout_playing'].includes(phase) || knockoutOpen
  const showKnockout = inKnockoutPhase || knockoutPredCount > 0
  const showAwards = awardsOpen || awardPredCount > 0

  const matchDone = groupMatchTotal > 0 && matchPredCount >= groupMatchTotal
  const qualifyDone = qualifyPredCount >= qualifyTotal
  const knockoutDone = knockoutPredCount >= knockoutTotal
  const awardsDone = awardPredCount >= awardTotal

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2.5 shadow-xl">
          <CheckCircle size={14} />
          {toast}
        </div>
      )}

      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-4 pt-2">
        <div className="relative">
          <AvatarDisplay avatarUrl={avatarUrl} name={name} size={96} />
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-gray-900 transition-colors cursor-pointer shadow-lg"
            title="Cambiar avatar"
          >
            <Camera size={14} />
          </button>
        </div>

        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameInput(name) } }}
              className="bg-gray-800 border border-amber-500 rounded-lg px-3 py-1.5 text-white text-center font-bold text-xl focus:outline-none"
            />
            <button onClick={saveName} disabled={nameSaving || nameInput.trim().length < 2} className="text-green-400 hover:text-green-300 disabled:opacity-40 cursor-pointer">
              <CheckCircle size={20} />
            </button>
            <button onClick={() => { setEditingName(false); setNameInput(name) }} className="text-gray-500 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditingName(true); setNameInput(name) }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <h1 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">{name}</h1>
            <Pencil size={14} className="text-gray-600 group-hover:text-amber-400 transition-colors" />
          </button>
        )}
      </div>

      {/* Avatar picker */}
      {showAvatarPicker && (
        <div className="glass rounded-xl p-5 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Elige tu avatar</h3>
            <button onClick={() => setShowAvatarPicker(false)} className="text-gray-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {AVATAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => saveAvatar(emoji)}
                disabled={avatarSaving}
                className={cn(
                  'text-2xl p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer',
                  avatarUrl === emoji ? 'bg-amber-500/20 ring-1 ring-amber-500' : '',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="O pega una URL de imagen..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
            />
            <Button size="sm" variant="secondary" onClick={() => saveAvatar(urlInput)} disabled={avatarSaving || !urlInput.startsWith('http')}>
              Usar URL
            </Button>
          </div>
          {avatarUrl && (
            <button onClick={() => saveAvatar('')} className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer">
              Quitar avatar
            </button>
          )}
        </div>
      )}

      {/* Change password */}
      <div className="glass rounded-xl p-5 border border-white/10 space-y-4">
        <h2 className="font-bold text-white flex items-center gap-2">
          <KeyRound size={15} className="text-gray-400" />
          Cambiar contraseña
        </h2>
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              placeholder="Contraseña actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !passwordSaving && currentPassword && newPassword.length >= 6 && changePassword()}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {passwordMsg && (
            <p className={cn('text-xs px-3 py-2 rounded-lg border', passwordMsg.ok ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20')}>
              {passwordMsg.text}
            </p>
          )}
          <Button
            onClick={changePassword}
            disabled={passwordSaving || !currentPassword || newPassword.length < 6}
            className="w-full"
          >
            <Save size={14} />
            {passwordSaving ? 'Cambiando...' : 'Cambiar contraseña'}
          </Button>
        </div>
      </div>

      {/* Prediction status */}
      <div className="glass rounded-xl p-5 border border-white/10 space-y-3">
        <h2 className="font-bold text-white flex items-center gap-2">
          <Star size={15} className="text-amber-400" />
          Estado de pronósticos
        </h2>
        <PredictionItem
          icon={<Star size={15} className="text-amber-400" />}
          label="Partidos de grupos"
          done={matchDone}
          current={matchPredCount}
          total={groupMatchTotal}
          link="/predictions/groups"
          active={groupOpen}
        />
        <PredictionItem
          icon={<span className="text-sm leading-none">🎯</span>}
          label="Equipos clasificados"
          done={qualifyDone}
          current={qualifyPredCount}
          total={qualifyTotal}
          link="/predictions/groups"
          active={groupOpen}
        />
        {showKnockout && (
          <PredictionItem
            icon={<Trophy size={15} className="text-amber-400" />}
            label="Eliminatorias"
            done={knockoutDone}
            current={knockoutPredCount}
            total={knockoutTotal}
            link="/predictions/knockout"
            active={knockoutOpen}
          />
        )}
        {showAwards && (
          <PredictionItem
            icon={<Medal size={15} className="text-amber-400" />}
            label="Premios individuales"
            done={awardsDone}
            current={awardPredCount}
            total={awardTotal}
            link="/predictions/awards"
            active={awardsOpen}
          />
        )}
      </div>
    </div>
  )
}
