import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { TEAMS } from '@/lib/data/teams'

const TEAM_NAME: Record<string, string> = Object.fromEntries(TEAMS.map(t => [t.id, t.name]))

const ROUNDS = [
  { key: 'r16',      label: 'Clasificados a Octavos de Final',  count: 16 },
  { key: 'qf',       label: 'Clasificados a Cuartos de Final',  count: 8  },
  { key: 'sf',       label: 'Clasificados a Semifinales',        count: 4  },
  { key: 'final',    label: 'Clasificados a la Final',           count: 2  },
  { key: 'champion', label: 'Campeon del Mundo',                 count: 1  },
]

export interface UserKnockoutPred {
  id: string
  name: string
  roundPicks: Record<string, string[]>
}

const PAD = 32

const S = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8, paddingHorizontal: PAD, paddingTop: 28, paddingBottom: 40, color: '#111827' },

  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#B45309' },
  docSub: { fontSize: 9, color: '#374151', marginTop: 2, marginBottom: 3 },
  docTs: { fontSize: 7.5, color: '#9CA3AF', marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', borderBottomStyle: 'solid' },

  userBar: { backgroundColor: '#1E3A5F', paddingHorizontal: 10, paddingVertical: 5, marginBottom: 7, marginTop: 7, borderRadius: 3 },
  userName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },

  roundSection: { marginBottom: 5 },
  roundTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#4B5563', marginBottom: 3 },
  teamsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  teamChip: { fontSize: 7, color: '#374151', marginRight: 6, marginBottom: 2, paddingHorizontal: 5, paddingVertical: 2, backgroundColor: '#F3F4F6', borderRadius: 2 },
  noTeams: { fontSize: 7, color: '#D1D5DB' },
  champion: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#B45309' },

  sectionTitle: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#9CA3AF', marginTop: 7, marginBottom: 3 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB', borderBottomStyle: 'solid', marginVertical: 5 },

  footer: { position: 'absolute', bottom: 18, left: PAD, right: PAD, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#E5E7EB', borderTopStyle: 'solid', paddingTop: 4 },
  footerText: { fontSize: 6.5, color: '#9CA3AF' },
})

interface Props {
  users: UserKnockoutPred[]
  generatedAt: string
}

export function KnockoutPdfDocument({ users, generatedAt }: Props) {
  return (
    <Document title="Porra Mundial 2026 — Eliminatorias">
      <Page size="A4" style={S.page}>
        <Text style={S.docTitle}>PORRA MUNDIAL 2026</Text>
        <Text style={S.docSub}>Pronósticos — Fase Eliminatoria</Text>
        <Text style={S.docTs}>
          Descargado el {generatedAt} · {users.length} participantes · Documento de transparencia
        </Text>

        {users.map((user, uIdx) => (
          <View key={user.id}>
            {uIdx > 0 && <View style={S.divider} />}

            <View style={S.userBar}>
              <Text style={S.userName}>{user.name}</Text>
            </View>

            <Text style={S.sectionTitle}>PREDICCIONES FASE ELIMINATORIA</Text>

            {ROUNDS.map((round) => {
              const ids = user.roundPicks[round.key] ?? []
              const isChampion = round.key === 'champion'
              return (
                <View key={round.key} style={S.roundSection} wrap={false}>
                  <Text style={S.roundTitle}>{round.label} ({round.count})</Text>
                  {ids.length > 0 ? (
                    <View style={S.teamsRow}>
                      {ids.map((tid) => (
                        <Text key={tid} style={isChampion ? S.champion : S.teamChip}>
                          {TEAM_NAME[tid] ?? tid}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={S.noTeams}>Sin pronostico</Text>
                  )}
                </View>
              )
            })}
          </View>
        ))}

        <View style={S.footer} fixed>
          <Text style={S.footerText}>Porra Mundial 2026 · Fase Eliminatoria · Documento de transparencia</Text>
          <Text style={S.footerText}>{generatedAt}</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
