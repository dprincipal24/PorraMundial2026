import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { KnockoutPdfDocument, type UserKnockoutPred } from '@/lib/pdf/KnockoutPdf'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('No autorizado', { status: 401 })

  const [profileRes, settingsRes] = await Promise.all([
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    supabase.from('app_settings').select('key, value'),
  ])

  const isAdmin = profileRes.data?.is_admin ?? false
  const settingsMap = Object.fromEntries(
    ((settingsRes.data ?? []) as { key: string; value: string }[]).map(s => [s.key, s.value])
  )
  const knockoutOpen = settingsMap['knockout_predictions_open'] === 'true'

  if (!isAdmin && knockoutOpen) {
    return new NextResponse('Los pronósticos de eliminatorias aún están abiertos', { status: 403 })
  }

  const [profilesRes, knockoutPredsRes] = await Promise.all([
    supabase.from('profiles').select('id, name').order('name'),
    supabase.from('knockout_predictions').select('user_id, round, team_id'),
  ])

  const profiles = (profilesRes.data ?? []) as { id: string; name: string }[]
  const allKnockoutPreds = (knockoutPredsRes.data ?? []) as { user_id: string; round: string; team_id: string }[]

  const knockoutByUser: Record<string, Record<string, string[]>> = {}
  for (const p of allKnockoutPreds) {
    if (!knockoutByUser[p.user_id]) knockoutByUser[p.user_id] = {}
    if (!knockoutByUser[p.user_id][p.round]) knockoutByUser[p.user_id][p.round] = []
    knockoutByUser[p.user_id][p.round].push(p.team_id)
  }

  const users: UserKnockoutPred[] = profiles.map(prof => ({
    id: prof.id,
    name: prof.name,
    roundPicks: knockoutByUser[prof.id] ?? {},
  }))

  const now = new Date()
  const generatedAt = now.toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const buffer = await renderToBuffer(
    <KnockoutPdfDocument users={users} generatedAt={generatedAt} />
  )

  const filename = `porra-mundial-eliminatorias-${now.toISOString().slice(0, 10)}.pdf`
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
