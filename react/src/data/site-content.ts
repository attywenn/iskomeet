export const APP_NAME = 'Iskomeet'
export const UI_NAME = 'wellfleet'

export const STATS = {
  universities: 48,
  conversations: 1420,
  sparks: 3890,
}

export const GENDERS = [
  { id: 1, name: 'Female' },
  { id: 2, name: 'Male' },
  { id: 3, name: 'Non-binary' },
]

export const UNIVERSITIES = [
  { id: 1, name: 'University of the Philippines Diliman', location: 'Quezon City' },
  { id: 2, name: 'Polytechnic University of the Philippines', location: 'Manila' },
  { id: 3, name: 'Philippine Normal University', location: 'Manila' },
  { id: 4, name: 'Technological University of the Philippines', location: 'Manila' },
  { id: 5, name: 'University of the Philippines Manila', location: 'Manila' },
  { id: 6, name: 'Batangas State University', location: 'Batangas' },
  { id: 7, name: 'Cavite State University', location: 'Cavite' },
]

export const SUCS = UNIVERSITIES.map((u) => u.name)

export const SUC_COLORS: Record<string, { bg: string; text: string; badge: string; short: string }> = {
  'University of the Philippines Diliman': { bg: 'bg-[#7B1113]/10', text: 'text-[#7B1113]', badge: 'bg-[#7B1113] text-white', short: 'UPD' },
  'Polytechnic University of the Philippines': { bg: 'bg-[#800000]/10', text: 'text-[#800000]', badge: 'bg-[#800000] text-amber-300', short: 'PUP' },
  'Philippine Normal University': { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-700 text-white', short: 'PNU' },
  'Technological University of the Philippines': { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-700 text-white', short: 'TUP' },
  'University of the Philippines Manila': { bg: 'bg-[#7B1113]/10', text: 'text-[#7B1113]', badge: 'bg-[#7B1113] text-white', short: 'UPM' },
  'Batangas State University': { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-700 text-white', short: 'BatStateU' },
  'Cavite State University': { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-700 text-white', short: 'CvSU' },
}

export const INTERESTS = ['Reading', 'Music', 'Coffee', 'Movies', 'Travel', 'Books', 'Coding', 'Sports']