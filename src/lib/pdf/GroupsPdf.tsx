import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { AWARDS } from '@/lib/data/awards'
import { TEAMS, GROUPS } from '@/lib/data/teams'

const TEAM_NAME: Record<string, string> = Object.fromEntries(TEAMS.map(t => [t.id, t.name]))
const TEAM_GROUP: Record<string, string> = Object.fromEntries(TEAMS.map(t => [t.id, t.group]))

export interface MatchRow {
  id: number
  group: string
  num: number
  home: string
  away: string
}

export interface UserGroupPred {
  id: string
  name: string
  matchPreds: Record<number, { home: number; away: number }>
  qualifyIds: string[]
  awards: Record<string, string>
}

const PAD = 32

const S = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8, paddingHorizontal: PAD, paddingTop: 28, paddingBottom: 40, color: '#111827' },

  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#B45309' },
  docSub: { fontSize: 9, color: '#374151', marginTop: 2, marginBottom: 3 },
  docTs: { fontSize: 7.5, color: '#9CA3AF', marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', borderBottomStyle: 'solid' },

  userBar: { backgroundColor: '#1E3A5F', paddingHorizontal: 10, paddingVertical: 5, marginBottom: 7, marginTop: 7, borderRadius: 3 },
  userName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },

  sectionTitle: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#9CA3AF', marginTop: 7, marginBottom: 3 },

  groupsRow: { flexDirection: 'row' },
  groupCol: { flex: 1, paddingRight: 8, marginBottom: 3 },
  groupLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#4B5563', marginBottom: 2, paddingBottom: 1.5, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', borderBottomStyle: 'solid' },
  matchRow: { flexDirection: 'row', paddingVertical: 1.5, alignItems: 'center' },
  mNum: { width: 13, fontSize: 6.5, color: '#9CA3AF' },
  mHome: { flex: 1, fontSize: 7, color: '#374151' },
  mAway: { flex: 1, fontSize: 7, color: '#374151', textAlign: 'right' },
  mScore: { width: 24, textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: '#B45309' },
  mNoScore: { width: 24, textAlign: 'center', fontSize: 7, color: '#D1D5DB' },

  qualifyGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  qualifyItem: { width: '25%', flexDirection: 'row', marginBottom: 3, paddingRight: 6 },
  qualifyG: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#6B7280', width: 16 },
  qualifyT: { flex: 1, fontSize: 7, color: '#374151' },

  awardsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  awardItem: { width: '50%', flexDirection: 'row', marginBottom: 2.5, paddingRight: 8 },
  awardKey: { fontSize: 7.5, color: '#6B7280', width: 85 },
  awardVal: { flex: 1, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#1F2937' },
  awardNone: { flex: 1, fontSize: 7.5, color: '#D1D5DB' },

  divider: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB', borderBottomStyle: 'solid', marginVertical: 5 },

  footer: { position: 'absolute', bottom: 18, left: PAD, right: PAD, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#E5E7EB', borderTopStyle: 'solid', paddingTop: 4 },
  footerText: { fontSize: 6.5, color: '#9CA3AF' },
})

// 3 groups per row → 4 rows for 12 groups
const GROUP_ROWS: string[][] = []
for (let i = 0; i < GROUPS.length; i += 3) GROUP_ROWS.push(GROUPS.slice(i, i + 3))

interface Props {
  users: UserGroupPred[]
  matches: MatchRow[]
  generatedAt: string
}

export function GroupsPdfDocument({ users, matches, generatedAt }: Props) {
  const byGroup: Record<string, MatchRow[]> = {}
  for (const m of matches) {
    if (!byGroup[m.group]) byGroup[m.group] = []
    byGroup[m.group].push(m)
  }

  return (
    <Document title="Porra Mundial 2026 — Grupos y Premios">
      <Page size="A4" style={S.page}>
        <Text style={S.docTitle}>PORRA MUNDIAL 2026</Text>
        <Text style={S.docSub}>Pronósticos — Fase de Grupos y Premios Individuales</Text>
        <Text style={S.docTs}>
          Descargado el {generatedAt} · {users.length} participantes · Documento de transparencia
        </Text>

        {users.map((user, uIdx) => {
          const qualifyByGroup: Record<string, string[]> = {}
          for (const tid of user.qualifyIds) {
            const g = TEAM_GROUP[tid]
            if (g) {
              if (!qualifyByGroup[g]) qualifyByGroup[g] = []
              qualifyByGroup[g].push(TEAM_NAME[tid] ?? tid)
            }
          }

          return (
            <View key={user.id}>
              {uIdx > 0 && <View style={S.divider} />}

              <View style={S.userBar}>
                <Text style={S.userName}>{user.name}</Text>
              </View>

              {/* Match predictions by group */}
              <Text style={S.sectionTitle}>PARTIDOS DE LA FASE DE GRUPOS</Text>
              {GROUP_ROWS.map((rowGroups, rIdx) => (
                <View key={rIdx} style={S.groupsRow} wrap={false}>
                  {rowGroups.map((g) => (
                    <View key={g} style={S.groupCol}>
                      <Text style={S.groupLabel}>Grupo {g}</Text>
                      {(byGroup[g] ?? []).map((m) => {
                        const pred = user.matchPreds[m.id]
                        return (
                          <View key={m.id} style={S.matchRow}>
                            <Text style={S.mNum}>{m.num}</Text>
                            <Text style={S.mHome}>{m.home}</Text>
                            {pred !== undefined
                              ? <Text style={S.mScore}>{pred.home}-{pred.away}</Text>
                              : <Text style={S.mNoScore}>—</Text>
                            }
                            <Text style={S.mAway}>{m.away}</Text>
                          </View>
                        )
                      })}
                    </View>
                  ))}
                </View>
              ))}

              {/* Qualify picks */}
              <Text style={S.sectionTitle}>CLASIFICADOS A LA FASE FINAL (32 equipos)</Text>
              <View style={S.qualifyGrid}>
                {GROUPS.map((g) => {
                  const picks = qualifyByGroup[g] ?? []
                  const [d1, d2, t3] = picks
                  const text = picks.length === 0
                    ? '—'
                    : t3
                    ? `${d1}, ${d2} +${t3}(3.º)`
                    : picks.join(', ')
                  return (
                    <View key={g} style={S.qualifyItem}>
                      <Text style={S.qualifyG}>{g}:</Text>
                      <Text style={S.qualifyT}>{text}</Text>
                    </View>
                  )
                })}
              </View>

              {/* Awards */}
              <Text style={S.sectionTitle}>PREMIOS INDIVIDUALES</Text>
              <View style={S.awardsRow}>
                {AWARDS.map((award) => {
                  const pick = user.awards[award.type]
                  return (
                    <View key={award.type} style={S.awardItem}>
                      <Text style={S.awardKey}>{award.label}:</Text>
                      {pick
                        ? <Text style={S.awardVal}>{pick}</Text>
                        : <Text style={S.awardNone}>Sin pronóstico</Text>
                      }
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}

        <View style={S.footer} fixed>
          <Text style={S.footerText}>Porra Mundial 2026 · Grupos y Premios · Documento de transparencia</Text>
          <Text style={S.footerText}>{generatedAt}</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
