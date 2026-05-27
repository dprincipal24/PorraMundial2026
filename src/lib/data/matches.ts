import type { MatchPhase } from '@/lib/types'

export interface MatchSeed {
  id: number
  phase: MatchPhase
  group_name: string | null
  match_number: number
  home_team_id: string | null
  away_team_id: string | null
  home_placeholder: string | null
  away_placeholder: string | null
  match_date: string        // UTC ISO string
  stadium_id: number
  home_score: number | null
  away_score: number | null
  status: 'scheduled' | 'live' | 'finished'
}

// Tiempos ET → UTC (EDT = UTC-4 en verano)
// Estadios: 1=MetLife NJ, 2=AT&T Dallas, 3=SoFi LA, 4=Levi's SF, 5=Arrowhead KC,
//           6=Gillette Boston, 7=Lincoln Philly, 9=Hard Rock Miami, 10=NRG Houston,
//           11=Lumen Seattle, 12=BC Place Vancouver, 13=BMO Toronto,
//           14=Azteca CDMX, 15=Akron Guadalajara, 16=BBVA Monterrey, 17=MBZ Atlanta

const S: MatchSeed[] = [
  // ═══════════════════════════════════════════════════
  // GRUPO A — México · Sudáfrica · Corea del Sur · Chequia
  // ═══════════════════════════════════════════════════
  { id:1,  phase:'groups', group_name:'A', match_number:1, home_team_id:'MEX', away_team_id:'RSA', home_placeholder:null, away_placeholder:null, match_date:'2026-06-11T19:00:00Z', stadium_id:14, home_score:null, away_score:null, status:'scheduled' },
  { id:2,  phase:'groups', group_name:'A', match_number:2, home_team_id:'KOR', away_team_id:'CZE', home_placeholder:null, away_placeholder:null, match_date:'2026-06-12T02:00:00Z', stadium_id:15, home_score:null, away_score:null, status:'scheduled' },
  { id:3,  phase:'groups', group_name:'A', match_number:3, home_team_id:'CZE', away_team_id:'RSA', home_placeholder:null, away_placeholder:null, match_date:'2026-06-18T16:00:00Z', stadium_id:17, home_score:null, away_score:null, status:'scheduled' },
  { id:4,  phase:'groups', group_name:'A', match_number:4, home_team_id:'MEX', away_team_id:'KOR', home_placeholder:null, away_placeholder:null, match_date:'2026-06-19T01:00:00Z', stadium_id:15, home_score:null, away_score:null, status:'scheduled' },
  { id:5,  phase:'groups', group_name:'A', match_number:5, home_team_id:'RSA', away_team_id:'KOR', home_placeholder:null, away_placeholder:null, match_date:'2026-06-25T01:00:00Z', stadium_id:16, home_score:null, away_score:null, status:'scheduled' },
  { id:6,  phase:'groups', group_name:'A', match_number:6, home_team_id:'CZE', away_team_id:'MEX', home_placeholder:null, away_placeholder:null, match_date:'2026-06-25T01:00:00Z', stadium_id:14, home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO B — Canadá · Bosnia-Herzegovina · Qatar · Suiza
  // ═══════════════════════════════════════════════════
  { id:7,  phase:'groups', group_name:'B', match_number:1, home_team_id:'CAN', away_team_id:'BIH', home_placeholder:null, away_placeholder:null, match_date:'2026-06-12T19:00:00Z', stadium_id:13, home_score:null, away_score:null, status:'scheduled' },
  { id:8,  phase:'groups', group_name:'B', match_number:2, home_team_id:'QAT', away_team_id:'SUI', home_placeholder:null, away_placeholder:null, match_date:'2026-06-13T19:00:00Z', stadium_id:4,  home_score:null, away_score:null, status:'scheduled' },
  { id:9,  phase:'groups', group_name:'B', match_number:3, home_team_id:'SUI', away_team_id:'BIH', home_placeholder:null, away_placeholder:null, match_date:'2026-06-18T19:00:00Z', stadium_id:3,  home_score:null, away_score:null, status:'scheduled' },
  { id:10, phase:'groups', group_name:'B', match_number:4, home_team_id:'CAN', away_team_id:'QAT', home_placeholder:null, away_placeholder:null, match_date:'2026-06-18T22:00:00Z', stadium_id:12, home_score:null, away_score:null, status:'scheduled' },
  { id:11, phase:'groups', group_name:'B', match_number:5, home_team_id:'SUI', away_team_id:'CAN', home_placeholder:null, away_placeholder:null, match_date:'2026-06-24T19:00:00Z', stadium_id:12, home_score:null, away_score:null, status:'scheduled' },
  { id:12, phase:'groups', group_name:'B', match_number:6, home_team_id:'BIH', away_team_id:'QAT', home_placeholder:null, away_placeholder:null, match_date:'2026-06-24T19:00:00Z', stadium_id:11, home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO C — Brasil · Marruecos · Haití · Escocia
  // ═══════════════════════════════════════════════════
  { id:13, phase:'groups', group_name:'C', match_number:1, home_team_id:'BRA', away_team_id:'MAR', home_placeholder:null, away_placeholder:null, match_date:'2026-06-13T22:00:00Z', stadium_id:1,  home_score:null, away_score:null, status:'scheduled' },
  { id:14, phase:'groups', group_name:'C', match_number:2, home_team_id:'HAI', away_team_id:'SCO', home_placeholder:null, away_placeholder:null, match_date:'2026-06-14T01:00:00Z', stadium_id:6,  home_score:null, away_score:null, status:'scheduled' },
  { id:15, phase:'groups', group_name:'C', match_number:3, home_team_id:'SCO', away_team_id:'MAR', home_placeholder:null, away_placeholder:null, match_date:'2026-06-19T22:00:00Z', stadium_id:6,  home_score:null, away_score:null, status:'scheduled' },
  { id:16, phase:'groups', group_name:'C', match_number:4, home_team_id:'BRA', away_team_id:'HAI', home_placeholder:null, away_placeholder:null, match_date:'2026-06-20T00:30:00Z', stadium_id:7,  home_score:null, away_score:null, status:'scheduled' },
  { id:17, phase:'groups', group_name:'C', match_number:5, home_team_id:'SCO', away_team_id:'BRA', home_placeholder:null, away_placeholder:null, match_date:'2026-06-24T22:00:00Z', stadium_id:9,  home_score:null, away_score:null, status:'scheduled' },
  { id:18, phase:'groups', group_name:'C', match_number:6, home_team_id:'MAR', away_team_id:'HAI', home_placeholder:null, away_placeholder:null, match_date:'2026-06-24T22:00:00Z', stadium_id:17, home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO D — Estados Unidos · Paraguay · Australia · Turquía
  // ═══════════════════════════════════════════════════
  { id:19, phase:'groups', group_name:'D', match_number:1, home_team_id:'USA', away_team_id:'PAR', home_placeholder:null, away_placeholder:null, match_date:'2026-06-13T01:00:00Z', stadium_id:3,  home_score:null, away_score:null, status:'scheduled' },
  { id:20, phase:'groups', group_name:'D', match_number:2, home_team_id:'AUS', away_team_id:'TUR', home_placeholder:null, away_placeholder:null, match_date:'2026-06-14T04:00:00Z', stadium_id:12, home_score:null, away_score:null, status:'scheduled' },
  { id:21, phase:'groups', group_name:'D', match_number:3, home_team_id:'TUR', away_team_id:'PAR', home_placeholder:null, away_placeholder:null, match_date:'2026-06-20T03:00:00Z', stadium_id:4,  home_score:null, away_score:null, status:'scheduled' },
  { id:22, phase:'groups', group_name:'D', match_number:4, home_team_id:'USA', away_team_id:'AUS', home_placeholder:null, away_placeholder:null, match_date:'2026-06-19T19:00:00Z', stadium_id:11, home_score:null, away_score:null, status:'scheduled' },
  { id:23, phase:'groups', group_name:'D', match_number:5, home_team_id:'TUR', away_team_id:'USA', home_placeholder:null, away_placeholder:null, match_date:'2026-06-26T02:00:00Z', stadium_id:3,  home_score:null, away_score:null, status:'scheduled' },
  { id:24, phase:'groups', group_name:'D', match_number:6, home_team_id:'PAR', away_team_id:'AUS', home_placeholder:null, away_placeholder:null, match_date:'2026-06-26T02:00:00Z', stadium_id:4,  home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO E — Alemania · Curazao · Costa de Marfil · Ecuador
  // ═══════════════════════════════════════════════════
  { id:25, phase:'groups', group_name:'E', match_number:1, home_team_id:'GER', away_team_id:'CUW', home_placeholder:null, away_placeholder:null, match_date:'2026-06-14T17:00:00Z', stadium_id:10, home_score:null, away_score:null, status:'scheduled' },
  { id:26, phase:'groups', group_name:'E', match_number:2, home_team_id:'CIV', away_team_id:'ECU', home_placeholder:null, away_placeholder:null, match_date:'2026-06-14T23:00:00Z', stadium_id:7,  home_score:null, away_score:null, status:'scheduled' },
  { id:27, phase:'groups', group_name:'E', match_number:3, home_team_id:'GER', away_team_id:'CIV', home_placeholder:null, away_placeholder:null, match_date:'2026-06-20T20:00:00Z', stadium_id:13, home_score:null, away_score:null, status:'scheduled' },
  { id:28, phase:'groups', group_name:'E', match_number:4, home_team_id:'ECU', away_team_id:'CUW', home_placeholder:null, away_placeholder:null, match_date:'2026-06-21T00:00:00Z', stadium_id:5,  home_score:null, away_score:null, status:'scheduled' },
  { id:29, phase:'groups', group_name:'E', match_number:5, home_team_id:'ECU', away_team_id:'GER', home_placeholder:null, away_placeholder:null, match_date:'2026-06-25T20:00:00Z', stadium_id:1,  home_score:null, away_score:null, status:'scheduled' },
  { id:30, phase:'groups', group_name:'E', match_number:6, home_team_id:'CUW', away_team_id:'CIV', home_placeholder:null, away_placeholder:null, match_date:'2026-06-25T20:00:00Z', stadium_id:7,  home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO F — Países Bajos · Japón · Suecia · Túnez
  // ═══════════════════════════════════════════════════
  { id:31, phase:'groups', group_name:'F', match_number:1, home_team_id:'NED', away_team_id:'JPN', home_placeholder:null, away_placeholder:null, match_date:'2026-06-14T20:00:00Z', stadium_id:2,  home_score:null, away_score:null, status:'scheduled' },
  { id:32, phase:'groups', group_name:'F', match_number:2, home_team_id:'SWE', away_team_id:'TUN', home_placeholder:null, away_placeholder:null, match_date:'2026-06-15T02:00:00Z', stadium_id:16, home_score:null, away_score:null, status:'scheduled' },
  { id:33, phase:'groups', group_name:'F', match_number:3, home_team_id:'NED', away_team_id:'SWE', home_placeholder:null, away_placeholder:null, match_date:'2026-06-20T17:00:00Z', stadium_id:10, home_score:null, away_score:null, status:'scheduled' },
  { id:34, phase:'groups', group_name:'F', match_number:4, home_team_id:'TUN', away_team_id:'JPN', home_placeholder:null, away_placeholder:null, match_date:'2026-06-21T04:00:00Z', stadium_id:16, home_score:null, away_score:null, status:'scheduled' },
  { id:35, phase:'groups', group_name:'F', match_number:5, home_team_id:'JPN', away_team_id:'SWE', home_placeholder:null, away_placeholder:null, match_date:'2026-06-25T23:00:00Z', stadium_id:2,  home_score:null, away_score:null, status:'scheduled' },
  { id:36, phase:'groups', group_name:'F', match_number:6, home_team_id:'TUN', away_team_id:'NED', home_placeholder:null, away_placeholder:null, match_date:'2026-06-25T23:00:00Z', stadium_id:5,  home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO G — Bélgica · Egipto · Irán · Nueva Zelanda
  // ═══════════════════════════════════════════════════
  { id:37, phase:'groups', group_name:'G', match_number:1, home_team_id:'BEL', away_team_id:'EGY', home_placeholder:null, away_placeholder:null, match_date:'2026-06-15T19:00:00Z', stadium_id:11, home_score:null, away_score:null, status:'scheduled' },
  { id:38, phase:'groups', group_name:'G', match_number:2, home_team_id:'IRN', away_team_id:'NZL', home_placeholder:null, away_placeholder:null, match_date:'2026-06-16T01:00:00Z', stadium_id:3,  home_score:null, away_score:null, status:'scheduled' },
  { id:39, phase:'groups', group_name:'G', match_number:3, home_team_id:'BEL', away_team_id:'IRN', home_placeholder:null, away_placeholder:null, match_date:'2026-06-21T19:00:00Z', stadium_id:3,  home_score:null, away_score:null, status:'scheduled' },
  { id:40, phase:'groups', group_name:'G', match_number:4, home_team_id:'NZL', away_team_id:'EGY', home_placeholder:null, away_placeholder:null, match_date:'2026-06-22T01:00:00Z', stadium_id:12, home_score:null, away_score:null, status:'scheduled' },
  { id:41, phase:'groups', group_name:'G', match_number:5, home_team_id:'EGY', away_team_id:'IRN', home_placeholder:null, away_placeholder:null, match_date:'2026-06-27T03:00:00Z', stadium_id:11, home_score:null, away_score:null, status:'scheduled' },
  { id:42, phase:'groups', group_name:'G', match_number:6, home_team_id:'NZL', away_team_id:'BEL', home_placeholder:null, away_placeholder:null, match_date:'2026-06-27T03:00:00Z', stadium_id:12, home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO H — España · Cabo Verde · Arabia Saudí · Uruguay
  // ═══════════════════════════════════════════════════
  { id:43, phase:'groups', group_name:'H', match_number:1, home_team_id:'ESP', away_team_id:'CPV', home_placeholder:null, away_placeholder:null, match_date:'2026-06-15T16:00:00Z', stadium_id:17, home_score:null, away_score:null, status:'scheduled' },
  { id:44, phase:'groups', group_name:'H', match_number:2, home_team_id:'KSA', away_team_id:'URU', home_placeholder:null, away_placeholder:null, match_date:'2026-06-15T22:00:00Z', stadium_id:9,  home_score:null, away_score:null, status:'scheduled' },
  { id:45, phase:'groups', group_name:'H', match_number:3, home_team_id:'ESP', away_team_id:'KSA', home_placeholder:null, away_placeholder:null, match_date:'2026-06-21T16:00:00Z', stadium_id:17, home_score:null, away_score:null, status:'scheduled' },
  { id:46, phase:'groups', group_name:'H', match_number:4, home_team_id:'URU', away_team_id:'CPV', home_placeholder:null, away_placeholder:null, match_date:'2026-06-21T22:00:00Z', stadium_id:9,  home_score:null, away_score:null, status:'scheduled' },
  { id:47, phase:'groups', group_name:'H', match_number:5, home_team_id:'CPV', away_team_id:'KSA', home_placeholder:null, away_placeholder:null, match_date:'2026-06-27T00:00:00Z', stadium_id:10, home_score:null, away_score:null, status:'scheduled' },
  { id:48, phase:'groups', group_name:'H', match_number:6, home_team_id:'URU', away_team_id:'ESP', home_placeholder:null, away_placeholder:null, match_date:'2026-06-27T00:00:00Z', stadium_id:15, home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO I — Francia · Senegal · Irak · Noruega
  // ═══════════════════════════════════════════════════
  { id:49, phase:'groups', group_name:'I', match_number:1, home_team_id:'FRA', away_team_id:'SEN', home_placeholder:null, away_placeholder:null, match_date:'2026-06-16T19:00:00Z', stadium_id:1,  home_score:null, away_score:null, status:'scheduled' },
  { id:50, phase:'groups', group_name:'I', match_number:2, home_team_id:'IRQ', away_team_id:'NOR', home_placeholder:null, away_placeholder:null, match_date:'2026-06-16T22:00:00Z', stadium_id:6,  home_score:null, away_score:null, status:'scheduled' },
  { id:51, phase:'groups', group_name:'I', match_number:3, home_team_id:'FRA', away_team_id:'IRQ', home_placeholder:null, away_placeholder:null, match_date:'2026-06-22T21:00:00Z', stadium_id:7,  home_score:null, away_score:null, status:'scheduled' },
  { id:52, phase:'groups', group_name:'I', match_number:4, home_team_id:'NOR', away_team_id:'SEN', home_placeholder:null, away_placeholder:null, match_date:'2026-06-23T00:00:00Z', stadium_id:1,  home_score:null, away_score:null, status:'scheduled' },
  { id:53, phase:'groups', group_name:'I', match_number:5, home_team_id:'NOR', away_team_id:'FRA', home_placeholder:null, away_placeholder:null, match_date:'2026-06-26T19:00:00Z', stadium_id:6,  home_score:null, away_score:null, status:'scheduled' },
  { id:54, phase:'groups', group_name:'I', match_number:6, home_team_id:'SEN', away_team_id:'IRQ', home_placeholder:null, away_placeholder:null, match_date:'2026-06-26T19:00:00Z', stadium_id:13, home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO J — Argentina · Argelia · Austria · Jordania
  // ═══════════════════════════════════════════════════
  { id:55, phase:'groups', group_name:'J', match_number:1, home_team_id:'ARG', away_team_id:'ALG', home_placeholder:null, away_placeholder:null, match_date:'2026-06-17T01:00:00Z', stadium_id:5,  home_score:null, away_score:null, status:'scheduled' },
  { id:56, phase:'groups', group_name:'J', match_number:2, home_team_id:'AUT', away_team_id:'JOR', home_placeholder:null, away_placeholder:null, match_date:'2026-06-17T04:00:00Z', stadium_id:4,  home_score:null, away_score:null, status:'scheduled' },
  { id:57, phase:'groups', group_name:'J', match_number:3, home_team_id:'ARG', away_team_id:'AUT', home_placeholder:null, away_placeholder:null, match_date:'2026-06-22T17:00:00Z', stadium_id:2,  home_score:null, away_score:null, status:'scheduled' },
  { id:58, phase:'groups', group_name:'J', match_number:4, home_team_id:'JOR', away_team_id:'ALG', home_placeholder:null, away_placeholder:null, match_date:'2026-06-23T03:00:00Z', stadium_id:4,  home_score:null, away_score:null, status:'scheduled' },
  { id:59, phase:'groups', group_name:'J', match_number:5, home_team_id:'JOR', away_team_id:'ARG', home_placeholder:null, away_placeholder:null, match_date:'2026-06-28T02:00:00Z', stadium_id:2,  home_score:null, away_score:null, status:'scheduled' },
  { id:60, phase:'groups', group_name:'J', match_number:6, home_team_id:'ALG', away_team_id:'AUT', home_placeholder:null, away_placeholder:null, match_date:'2026-06-28T02:00:00Z', stadium_id:5,  home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO K — Portugal · Congo DR · Uzbekistán · Colombia
  // ═══════════════════════════════════════════════════
  { id:61, phase:'groups', group_name:'K', match_number:1, home_team_id:'POR', away_team_id:'COD', home_placeholder:null, away_placeholder:null, match_date:'2026-06-17T17:00:00Z', stadium_id:10, home_score:null, away_score:null, status:'scheduled' },
  { id:62, phase:'groups', group_name:'K', match_number:2, home_team_id:'UZB', away_team_id:'COL', home_placeholder:null, away_placeholder:null, match_date:'2026-06-18T02:00:00Z', stadium_id:14, home_score:null, away_score:null, status:'scheduled' },
  { id:63, phase:'groups', group_name:'K', match_number:3, home_team_id:'POR', away_team_id:'UZB', home_placeholder:null, away_placeholder:null, match_date:'2026-06-23T17:00:00Z', stadium_id:10, home_score:null, away_score:null, status:'scheduled' },
  { id:64, phase:'groups', group_name:'K', match_number:4, home_team_id:'COL', away_team_id:'COD', home_placeholder:null, away_placeholder:null, match_date:'2026-06-24T02:00:00Z', stadium_id:15, home_score:null, away_score:null, status:'scheduled' },
  { id:65, phase:'groups', group_name:'K', match_number:5, home_team_id:'COL', away_team_id:'POR', home_placeholder:null, away_placeholder:null, match_date:'2026-06-27T23:30:00Z', stadium_id:9,  home_score:null, away_score:null, status:'scheduled' },
  { id:66, phase:'groups', group_name:'K', match_number:6, home_team_id:'COD', away_team_id:'UZB', home_placeholder:null, away_placeholder:null, match_date:'2026-06-27T23:30:00Z', stadium_id:17, home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // GRUPO L — Inglaterra · Croacia · Ghana · Panamá
  // ═══════════════════════════════════════════════════
  { id:67, phase:'groups', group_name:'L', match_number:1, home_team_id:'ENG', away_team_id:'CRO', home_placeholder:null, away_placeholder:null, match_date:'2026-06-17T20:00:00Z', stadium_id:2,  home_score:null, away_score:null, status:'scheduled' },
  { id:68, phase:'groups', group_name:'L', match_number:2, home_team_id:'GHA', away_team_id:'PAN', home_placeholder:null, away_placeholder:null, match_date:'2026-06-17T23:00:00Z', stadium_id:13, home_score:null, away_score:null, status:'scheduled' },
  { id:69, phase:'groups', group_name:'L', match_number:3, home_team_id:'ENG', away_team_id:'GHA', home_placeholder:null, away_placeholder:null, match_date:'2026-06-23T20:00:00Z', stadium_id:6,  home_score:null, away_score:null, status:'scheduled' },
  { id:70, phase:'groups', group_name:'L', match_number:4, home_team_id:'PAN', away_team_id:'CRO', home_placeholder:null, away_placeholder:null, match_date:'2026-06-23T23:00:00Z', stadium_id:13, home_score:null, away_score:null, status:'scheduled' },
  { id:71, phase:'groups', group_name:'L', match_number:5, home_team_id:'PAN', away_team_id:'ENG', home_placeholder:null, away_placeholder:null, match_date:'2026-06-27T21:00:00Z', stadium_id:1,  home_score:null, away_score:null, status:'scheduled' },
  { id:72, phase:'groups', group_name:'L', match_number:6, home_team_id:'CRO', away_team_id:'GHA', home_placeholder:null, away_placeholder:null, match_date:'2026-06-27T21:00:00Z', stadium_id:7,  home_score:null, away_score:null, status:'scheduled' },
  // ═══════════════════════════════════════════════════
  // RONDA DE 32
  // Fuente: calendario oficial FIFA / NBC Sports schedule
  // "3er mejor (X/Y/Z)" → el mejor 3er clasificado proveniente de uno de esos grupos
  // según la matriz del Anexo C del Reglamento FIFA 2026 (495 combinaciones posibles)
  // ═══════════════════════════════════════════════════
  { id:73,  phase:'r32', group_name:null, match_number:1,  home_team_id:null, away_team_id:null, home_placeholder:'2º Grupo A',          away_placeholder:'2º Grupo B',          match_date:'2026-06-28T19:00:00Z', stadium_id:3,  home_score:null, away_score:null, status:'scheduled' },
  { id:74,  phase:'r32', group_name:null, match_number:2,  home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo E',          away_placeholder:'3er mejor (A/B/C/D/F)', match_date:'2026-06-29T20:30:00Z', stadium_id:6,  home_score:null, away_score:null, status:'scheduled' },
  { id:75,  phase:'r32', group_name:null, match_number:3,  home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo F',          away_placeholder:'2º Grupo C',          match_date:'2026-06-30T01:00:00Z', stadium_id:16, home_score:null, away_score:null, status:'scheduled' },
  { id:76,  phase:'r32', group_name:null, match_number:4,  home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo C',          away_placeholder:'2º Grupo F',          match_date:'2026-06-29T17:00:00Z', stadium_id:10, home_score:null, away_score:null, status:'scheduled' },
  { id:77,  phase:'r32', group_name:null, match_number:5,  home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo I',          away_placeholder:'3er mejor (C/D/F/G/H)', match_date:'2026-06-30T21:00:00Z', stadium_id:1,  home_score:null, away_score:null, status:'scheduled' },
  { id:78,  phase:'r32', group_name:null, match_number:6,  home_team_id:null, away_team_id:null, home_placeholder:'2º Grupo E',          away_placeholder:'2º Grupo I',          match_date:'2026-06-30T17:00:00Z', stadium_id:2,  home_score:null, away_score:null, status:'scheduled' },
  { id:79,  phase:'r32', group_name:null, match_number:7,  home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo A',          away_placeholder:'3er mejor (C/E/F/H/I)', match_date:'2026-07-01T01:00:00Z', stadium_id:14, home_score:null, away_score:null, status:'scheduled' },
  { id:80,  phase:'r32', group_name:null, match_number:8,  home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo L',          away_placeholder:'3er mejor (E/H/I/J/K)', match_date:'2026-07-01T16:00:00Z', stadium_id:17, home_score:null, away_score:null, status:'scheduled' },
  { id:81,  phase:'r32', group_name:null, match_number:9,  home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo D',          away_placeholder:'3er mejor (B/E/F/I/J)', match_date:'2026-07-02T00:00:00Z', stadium_id:4,  home_score:null, away_score:null, status:'scheduled' },
  { id:82,  phase:'r32', group_name:null, match_number:10, home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo G',          away_placeholder:'3er mejor (A/E/H/I/J)', match_date:'2026-07-01T20:00:00Z', stadium_id:11, home_score:null, away_score:null, status:'scheduled' },
  { id:83,  phase:'r32', group_name:null, match_number:11, home_team_id:null, away_team_id:null, home_placeholder:'2º Grupo K',          away_placeholder:'2º Grupo L',          match_date:'2026-07-02T23:00:00Z', stadium_id:13, home_score:null, away_score:null, status:'scheduled' },
  { id:84,  phase:'r32', group_name:null, match_number:12, home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo H',          away_placeholder:'2º Grupo J',          match_date:'2026-07-02T19:00:00Z', stadium_id:3,  home_score:null, away_score:null, status:'scheduled' },
  { id:85,  phase:'r32', group_name:null, match_number:13, home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo B',          away_placeholder:'3er mejor (E/F/G/I/J)', match_date:'2026-07-03T03:00:00Z', stadium_id:12, home_score:null, away_score:null, status:'scheduled' },
  { id:86,  phase:'r32', group_name:null, match_number:14, home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo J',          away_placeholder:'2º Grupo H',          match_date:'2026-07-03T22:00:00Z', stadium_id:9,  home_score:null, away_score:null, status:'scheduled' },
  { id:87,  phase:'r32', group_name:null, match_number:15, home_team_id:null, away_team_id:null, home_placeholder:'1º Grupo K',          away_placeholder:'3er mejor (D/E/I/J/L)', match_date:'2026-07-04T01:30:00Z', stadium_id:5,  home_score:null, away_score:null, status:'scheduled' },
  { id:88,  phase:'r32', group_name:null, match_number:16, home_team_id:null, away_team_id:null, home_placeholder:'2º Grupo D',          away_placeholder:'2º Grupo G',          match_date:'2026-07-03T18:00:00Z', stadium_id:2,  home_score:null, away_score:null, status:'scheduled' },
  // OCTAVOS DE FINAL
  // Cruces según bracket oficial FIFA Art.12.7: 74v77, 73v75, 76v78, 79v80, 83v84, 81v82, 86v88, 85v87
  { id:89,  phase:'r16', group_name:null, match_number:1, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P74', away_placeholder:'Gan. P77', match_date:'2026-07-04T17:00:00Z', stadium_id:10, home_score:null, away_score:null, status:'scheduled' },
  { id:90,  phase:'r16', group_name:null, match_number:2, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P73', away_placeholder:'Gan. P75', match_date:'2026-07-04T21:00:00Z', stadium_id:7,  home_score:null, away_score:null, status:'scheduled' },
  { id:91,  phase:'r16', group_name:null, match_number:3, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P76', away_placeholder:'Gan. P78', match_date:'2026-07-05T20:00:00Z', stadium_id:1,  home_score:null, away_score:null, status:'scheduled' },
  { id:92,  phase:'r16', group_name:null, match_number:4, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P79', away_placeholder:'Gan. P80', match_date:'2026-07-06T00:00:00Z', stadium_id:14, home_score:null, away_score:null, status:'scheduled' },
  { id:93,  phase:'r16', group_name:null, match_number:5, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P83', away_placeholder:'Gan. P84', match_date:'2026-07-06T19:00:00Z', stadium_id:2,  home_score:null, away_score:null, status:'scheduled' },
  { id:94,  phase:'r16', group_name:null, match_number:6, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P81', away_placeholder:'Gan. P82', match_date:'2026-07-07T00:00:00Z', stadium_id:11, home_score:null, away_score:null, status:'scheduled' },
  { id:95,  phase:'r16', group_name:null, match_number:7, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P86', away_placeholder:'Gan. P88', match_date:'2026-07-07T16:00:00Z', stadium_id:17, home_score:null, away_score:null, status:'scheduled' },
  { id:96,  phase:'r16', group_name:null, match_number:8, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P85', away_placeholder:'Gan. P87', match_date:'2026-07-07T20:00:00Z', stadium_id:12, home_score:null, away_score:null, status:'scheduled' },
  // CUARTOS DE FINAL
  { id:97,  phase:'qf', group_name:null, match_number:1, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P89', away_placeholder:'Gan. P90', match_date:'2026-07-09T20:00:00Z', stadium_id:6,  home_score:null, away_score:null, status:'scheduled' },
  { id:98,  phase:'qf', group_name:null, match_number:2, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P93', away_placeholder:'Gan. P94', match_date:'2026-07-10T19:00:00Z', stadium_id:3,  home_score:null, away_score:null, status:'scheduled' },
  { id:99,  phase:'qf', group_name:null, match_number:3, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P91', away_placeholder:'Gan. P92', match_date:'2026-07-11T21:00:00Z', stadium_id:9,  home_score:null, away_score:null, status:'scheduled' },
  { id:100, phase:'qf', group_name:null, match_number:4, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P95', away_placeholder:'Gan. P96', match_date:'2026-07-12T01:00:00Z', stadium_id:5,  home_score:null, away_score:null, status:'scheduled' },
  // SEMIFINALES
  { id:101, phase:'sf', group_name:null, match_number:1, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P97',  away_placeholder:'Gan. P98',  match_date:'2026-07-14T19:00:00Z', stadium_id:2,  home_score:null, away_score:null, status:'scheduled' },
  { id:102, phase:'sf', group_name:null, match_number:2, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P99',  away_placeholder:'Gan. P100', match_date:'2026-07-15T19:00:00Z', stadium_id:17, home_score:null, away_score:null, status:'scheduled' },
  // TERCER PUESTO
  { id:103, phase:'third_place', group_name:null, match_number:1, home_team_id:null, away_team_id:null, home_placeholder:'Perdedor P101', away_placeholder:'Perdedor P102', match_date:'2026-07-18T21:00:00Z', stadium_id:9,  home_score:null, away_score:null, status:'scheduled' },
  // FINAL
  { id:104, phase:'final', group_name:null, match_number:1, home_team_id:null, away_team_id:null, home_placeholder:'Gan. P101', away_placeholder:'Gan. P102', match_date:'2026-07-19T19:00:00Z', stadium_id:1,  home_score:null, away_score:null, status:'scheduled' },
]

export const MATCHES = S

export const GROUP_STAGE_MATCHES   = MATCHES.filter((m) => m.phase === 'groups')
export const KNOCKOUT_STAGE_MATCHES = MATCHES.filter((m) => m.phase !== 'groups')

export const PHASE_LABELS: Record<string, string> = {
  groups:      'Fase de Grupos',
  r32:         'Ronda de 32',
  r16:         'Octavos de Final',
  qf:          'Cuartos de Final',
  sf:          'Semifinales',
  third_place: 'Tercer Puesto',
  final:       'Final',
}
