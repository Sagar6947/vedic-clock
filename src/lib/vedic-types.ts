export interface RasiPosition {
  signName: string;
  signSanskrit: string;
  degreeInSign: number;
  signIndex: number; // 0 to 11
}

export const RASIS = [
  { name: "Aries", sanskrit: "Mesha", lord: "Mars" },
  { name: "Taurus", sanskrit: "Vrishabha", lord: "Venus" },
  { name: "Gemini", sanskrit: "Mithuna", lord: "Mercury" },
  { name: "Cancer", sanskrit: "Karka", lord: "Moon" },
  { name: "Leo", sanskrit: "Simha", lord: "Sun" },
  { name: "Virgo", sanskrit: "Kanya", lord: "Mercury" },
  { name: "Libra", sanskrit: "Tula", lord: "Venus" },
  { name: "Scorpio", sanskrit: "Vrishchika", lord: "Mars" },
  { name: "Sagittarius", sanskrit: "Dhanu", lord: "Jupiter" },
  { name: "Capricorn", sanskrit: "Makara", lord: "Saturn" },
  { name: "Aquarius", sanskrit: "Kumbha", lord: "Saturn" },
  { name: "Pisces", sanskrit: "Meena", lord: "Jupiter" },
];

export function getRasiPosition(longitude: number): RasiPosition {
  const normLong = (longitude % 360 + 360) % 360;
  const signIndex = Math.floor(normLong / 30);
  const degreeInSign = normLong % 30;
  return {
    signName: RASIS[signIndex].name,
    signSanskrit: RASIS[signIndex].sanskrit,
    degreeInSign,
    signIndex,
  };
}

// Nakshatra Names
export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
  "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
  "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
  "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati"
];

// Yoga Names
export const YOGAS = [
  "Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Sobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
  "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva",
  "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];

// Tithi Names
export const TITHIS = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashti",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Purnima", // Shukla
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashti",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Amavasya" // Krishna
];

// Weekday/Vaara Names
export const VAARAS = [
  { name: "Sunday", sanskrit: "Ravivara", planet: "Sun" },
  { name: "Monday", sanskrit: "Somavara", planet: "Moon" },
  { name: "Tuesday", sanskrit: "Mangalavara", planet: "Mars" },
  { name: "Wednesday", sanskrit: "Budhavara", planet: "Mercury" },
  { name: "Thursday", sanskrit: "Guruvara", planet: "Jupiter" },
  { name: "Friday", sanskrit: "Shukravara", planet: "Venus" },
  { name: "Saturday", sanskrit: "Shanivara", planet: "Saturn" },
];

export interface PlanetData {
  name: string;
  sanskrit: string;
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  isRetrograde: boolean;
  rasi: RasiPosition;
}

export interface AprakashaData {
  dhooma: number;
  vyatipata: number;
  parivesha: number;
  indrachapa: number;
  upaketu: number;
}

export interface MandiGulikaData {
  gulikaTime: string;
  gulikaLongitude: number;
  gulikaRasi: RasiPosition;
  mandiTime: string;
  mandiLongitude: number;
  mandiRasi: RasiPosition;
}

export interface PanchangData {
  tithi: {
    index: number; // 1 to 30
    name: string;
    paksha: "Shukla" | "Krishna";
    degreeDiff: number;
  };
  vaara: {
    index: number; // 0 to 6
    name: string;
    sanskrit: string;
    lord: string;
  };
  nakshatra: {
    index: number; // 1 to 27
    name: string;
    longitude: number;
  };
  yoga: {
    index: number; // 1 to 27
    name: string;
    degreeSum: number;
  };
  karana: {
    index: number; // 1 to 60
    name: string;
  };
  lagna: {
    longitude: number;
    rasi: RasiPosition;
  };
}

export interface VedicTimeData {
  ghati: number;
  pala: number;
  vipala: number;
  decimalGhati: number;
  elapsedSeconds: number;
  totalDaySeconds: number;
}

export interface PraharData {
  index: number; // 1 to 8
  name: string;
  sanskrit: string;
  isDay: boolean;
  startTime: string;
  endTime: string;
  progress: number; // 0 to 100
}

export interface FullVedicClockData {
  latitude: number;
  longitude: number;
  altitude: number;
  targetTimeUtc: string;
  timezoneOffsetHours: number;
  
  julianDay: number;
  sunriseStart: string;
  sunsetStart: string;
  sunriseEnd: string;
  
  dinamanaSeconds: number;
  ratrimanaSeconds: number;
  ahoratraSeconds: number;
  
  vedicTime: VedicTimeData;
  prahar: PraharData;
  planets: PlanetData[];
  aprakasha: AprakashaData;
  mandiGulika: MandiGulikaData;
  panchang: PanchangData;
}
