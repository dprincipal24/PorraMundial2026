import type { Stadium } from '@/lib/types'

export const STADIUMS: Stadium[] = [
  // USA
  { id: 1, name: 'MetLife Stadium', city: 'East Rutherford (Nueva York)', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 82500 },
  { id: 2, name: 'AT&T Stadium', city: 'Arlington (Dallas)', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 80000 },
  { id: 3, name: 'SoFi Stadium', city: 'Inglewood (Los Ángeles)', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 70240 },
  { id: 4, name: "Levi's Stadium", city: 'Santa Clara (San Francisco)', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 68500 },
  { id: 5, name: 'Arrowhead Stadium', city: 'Kansas City', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 76416 },
  { id: 6, name: 'Gillette Stadium', city: 'Foxborough (Boston)', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 65878 },
  { id: 7, name: 'Lincoln Financial Field', city: 'Filadelfia', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 68532 },
  { id: 8, name: 'Bank of America Stadium', city: 'Charlotte', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 74867 },
  { id: 9, name: 'Hard Rock Stadium', city: 'Miami Gardens (Miami)', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 64767 },
  { id: 10, name: 'NRG Stadium', city: 'Houston', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 72220 },
  { id: 11, name: 'Lumen Field', city: 'Seattle', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 69000 },
  // Canadá
  { id: 12, name: 'BC Place', city: 'Vancouver', country: 'Canadá', country_flag: '🇨🇦', capacity: 54500 },
  { id: 13, name: 'BMO Field', city: 'Toronto', country: 'Canadá', country_flag: '🇨🇦', capacity: 30000 },
  // México
  { id: 14, name: 'Estadio Azteca', city: 'Ciudad de México', country: 'México', country_flag: '🇲🇽', capacity: 87523 },
  { id: 15, name: 'Estadio Akron', city: 'Guadalajara', country: 'México', country_flag: '🇲🇽', capacity: 49850 },
  { id: 16, name: 'Estadio BBVA', city: 'Monterrey', country: 'México', country_flag: '🇲🇽', capacity: 53500 },
  { id: 17, name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'Estados Unidos', country_flag: '🇺🇸', capacity: 71000 },
]

export const STADIUMS_BY_ID = Object.fromEntries(STADIUMS.map((s) => [s.id, s]))
