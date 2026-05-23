export interface RasiPosition {
  signName: string;
  signSanskrit: string;
  degreeInSign: number;
  signIndex: number;
}

export const RASIS = [
  { name: "Aries",       sanskrit: "Mesha",      lord: "Mars"    },
  { name: "Taurus",      sanskrit: "Vrishabha",  lord: "Venus"   },
  { name: "Gemini",      sanskrit: "Mithuna",    lord: "Mercury" },
  { name: "Cancer",      sanskrit: "Karka",      lord: "Moon"    },
  { name: "Leo",         sanskrit: "Simha",      lord: "Sun"     },
  { name: "Virgo",       sanskrit: "Kanya",      lord: "Mercury" },
  { name: "Libra",       sanskrit: "Tula",       lord: "Venus"   },
  { name: "Scorpio",     sanskrit: "Vrishchika", lord: "Mars"    },
  { name: "Sagittarius", sanskrit: "Dhanu",      lord: "Jupiter" },
  { name: "Capricorn",   sanskrit: "Makara",     lord: "Saturn"  },
  { name: "Aquarius",    sanskrit: "Kumbha",     lord: "Saturn"  },
  { name: "Pisces",      sanskrit: "Meena",      lord: "Jupiter" },
];

// Solar months (based on Sun sidereal longitude)
export const SOLAR_MONTHS = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha",
  "Shravana", "Bhadrapada", "Ashvina", "Kartika",
  "Margashirsha", "Pausha", "Magha", "Phalguna",
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

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
  "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
  "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
  "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati",
];

export const YOGAS = [
  "Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Sobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
  "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva",
  "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti",
];

export const TITHIS = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashti",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Purnima",
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashti",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Amavasya",
];

export const VAARAS = [
  { name: "Sunday",    sanskrit: "Ravivara",    planet: "Sun"     },
  { name: "Monday",    sanskrit: "Somavara",    planet: "Moon"    },
  { name: "Tuesday",   sanskrit: "Mangalavara", planet: "Mars"    },
  { name: "Wednesday", sanskrit: "Budhavara",   planet: "Mercury" },
  { name: "Thursday",  sanskrit: "Guruvara",    planet: "Jupiter" },
  { name: "Friday",    sanskrit: "Shukravara",  planet: "Venus"   },
  { name: "Saturday",  sanskrit: "Shanivara",   planet: "Saturn"  },
];

// ── Festival & Vrat ──────────────────────────────────────────────────────────
export interface FestivalInfo {
  name: string;
  sanskrit: string;
  type: "festival" | "vrat" | "ekadashi" | "purnima" | "amavasya";
  significance: string;
  rituals: string[];
  color: string; // CSS accent color
}

/** Detect active festival/vrat from panchang values.
 *  lunarMonth: 1=Chaitra … 12=Phalguna (based on Sun longitude)  */
export function detectFestival(
  tithiIndex: number,   // 1–30
  paksha: "Shukla" | "Krishna",
  lunarMonth: number,   // 1–12
  weekday: number       // 0 Sun – 6 Sat
): FestivalInfo | null {
  const t = tithiIndex;
  const p = paksha;
  const m = lunarMonth;

  // ── Major Festivals ──────────────────────────────────────────────────────
  if (m === 1 && p === "Shukla" && t === 9)
    return { name: "Rama Navami", sanskrit: "राम नवमी", type: "festival",
      significance: "Birth anniversary of Lord Rama, the seventh avatar of Vishnu.",
      rituals: ["Fast from sunrise to sunset", "Read Ramcharitmanas", "Offer Tulsi and flowers to Lord Rama"],
      color: "#f97316" };

  if (m === 1 && p === "Shukla" && t === 13)
    return { name: "Mahavir Jayanti", sanskrit: "महावीर जयंती", type: "festival",
      significance: "Birth anniversary of Lord Mahavira, the 24th Tirthankara of Jainism.",
      rituals: ["Procession with idol of Mahavira", "Prayer and meditation", "Acts of charity"],
      color: "#a3e635" };

  if (m === 5 && p === "Krishna" && t === 8)
    return { name: "Janmashtami", sanskrit: "जन्माष्टमी", type: "festival",
      significance: "Birth of Lord Krishna, eighth avatar of Vishnu. Celebrated at midnight.",
      rituals: ["Fast until midnight", "Decorate Krishna's cradle", "Sing bhajans", "Dahi Handi ceremony"],
      color: "#60a5fa" };

  if (m === 5 && p === "Shukla" && t === 4)
    return { name: "Ganesh Chaturthi", sanskrit: "गणेश चतुर्थी", type: "festival",
      significance: "Celebration of Lord Ganesha's birth. 10-day festival beginning today.",
      rituals: ["Install Ganesha idol", "Offer modak and durva grass", "Chant Ganesh Atharvashirsha"],
      color: "#fbbf24" };

  if (m === 7 && p === "Shukla" && t === 10)
    return { name: "Vijayadashami (Dussehra)", sanskrit: "विजयदशमी", type: "festival",
      significance: "Victory of Rama over Ravana; triumph of good over evil.",
      rituals: ["Burn Ravana effigy", "Worship of Shami tree", "Commence new ventures"],
      color: "#f59e0b" };

  if (m === 8 && p === "Krishna" && t === 30) // Amavasya of Kartika
    return { name: "Diwali (Deepavali)", sanskrit: "दीपावली", type: "festival",
      significance: "Festival of lights celebrating Rama's return to Ayodhya and victory over darkness.",
      rituals: ["Light diyas and candles", "Worship Lakshmi and Ganesha", "Burst fireworks", "Exchange sweets"],
      color: "#fcd34d" };

  if (m === 11 && p === "Shukla" && t === 15) // Phalguna Purnima
    return { name: "Holi", sanskrit: "होली", type: "festival",
      significance: "Festival of colors celebrating Prahlad's devotion and the arrival of spring.",
      rituals: ["Holika Dahan on the eve", "Play with colors", "Offer coconut to fire"],
      color: "#ec4899" };

  if (m === 11 && p === "Krishna" && t === 14) // Phalguna Krishna Chaturdashi
    return { name: "Maha Shivratri", sanskrit: "महाशिवरात्रि", type: "festival",
      significance: "The great night of Shiva. Most sacred night for Lord Shiva worship.",
      rituals: ["All-night vigil (jaagran)", "Fast for 24 hours", "Abhishek with milk, honey, curd", "Chant Om Namah Shivaya"],
      color: "#c084fc" };

  // ── Recurring Vrats ──────────────────────────────────────────────────────
  if (t === 11 || t === 26)
    return { name: `${p} Ekadashi`, sanskrit: `${p === "Shukla" ? "शुक्ल" : "कृष्ण"} एकादशी`, type: "ekadashi",
      significance: "Sacred day of Lord Vishnu. Fasting on Ekadashi purifies body and soul.",
      rituals: ["Complete fast or fruit diet", "Read Vishnu Sahasranama", "Stay awake at night", "Donate to Brahmins"],
      color: "#34d399" };

  if (t === 15 && p === "Shukla")
    return { name: "Purnima Vrat", sanskrit: "पूर्णिमा व्रत", type: "purnima",
      significance: "Full Moon day – auspicious for Satyanarayan Puja and ancestor rites.",
      rituals: ["Satyanarayan Puja", "Moon gazing", "Offer milk to the Moon", "Donate white items"],
      color: "#e2e8f0" };

  if (t === 30)
    return { name: "Amavasya Vrat", sanskrit: "अमावस्या व्रत", type: "amavasya",
      significance: "New Moon – sacred day for Pitru Tarpan and ancestor worship.",
      rituals: ["Offer water to ancestors (Tarpan)", "Light sesame oil lamp", "Visit sacred river or temple"],
      color: "#94a3b8" };

  if (t === 13) // Pradosh – Shukla or Krishna
    return { name: `${p} Pradosh Vrat`, sanskrit: "प्रदोष व्रत", type: "vrat",
      significance: "Trayodashi Pradosh – evening worship of Shiva and Parvati.",
      rituals: ["Fast until sunset", "Shiva abhishek at dusk", "Light lamp with sesame oil"],
      color: "#818cf8" };

  if (t === 4 && p === "Krishna") // Sankashti Chaturthi
    return { name: "Sankashti Chaturthi", sanskrit: "संकष्टी चतुर्थी", type: "vrat",
      significance: "Monthly fast for Lord Ganesha. Moon sighting ends the fast.",
      rituals: ["Fast until moonrise", "Worship Ganesha with modak", "Chant Ganesh Stotra"],
      color: "#fb923c" };

  if (t === 4 && p === "Shukla") // Vinayaka Chaturthi
    return { name: "Vinayaka Chaturthi", sanskrit: "विनायक चतुर्थी", type: "vrat",
      significance: "Monthly Shukla Chaturthi fast for Lord Ganesha – removes obstacles.",
      rituals: ["Fast or one meal", "Offer 21 modak to Ganesha", "Do not look at the Moon"],
      color: "#fbbf24" };

  // ── Weekday devotional vrats as fallback ────────────────────────────────
  const weeklyVrats: FestivalInfo[] = [
    { name: "Ravivara Vrat", sanskrit: "रविवार व्रत", type: "vrat",
      significance: "Sunday fast dedicated to Surya (Sun God) for health and vitality.",
      rituals: ["Single meal before sunset", "Worship Sun at sunrise", "Offer water with red flowers"],
      color: "#f97316" },
    { name: "Somavara Vrat", sanskrit: "सोमवार व्रत", type: "vrat",
      significance: "Monday fast dedicated to Lord Shiva for blessings and spiritual growth.",
      rituals: ["Fast the whole day or one meal", "Offer Bilva leaves to Shiva", "Chant Shiva Panchakshara"],
      color: "#94a3b8" },
    { name: "Mangalavara Vrat", sanskrit: "मंगलवार व्रत", type: "vrat",
      significance: "Tuesday fast for Lord Hanuman and Goddess Durga for strength and courage.",
      rituals: ["Red offerings to Hanuman", "Recite Hanuman Chalisa", "Wear red"],
      color: "#ef4444" },
    { name: "Budhavara Vrat", sanskrit: "बुधवार व्रत", type: "vrat",
      significance: "Wednesday fast for Lord Ganesha and Mercury for intellect and business.",
      rituals: ["Green offerings", "Worship Ganesha", "Chant Mercury beej mantra"],
      color: "#22c55e" },
    { name: "Guruvara Vrat", sanskrit: "गुरुवार व्रत", type: "vrat",
      significance: "Thursday fast for Lord Vishnu and Guru (Jupiter) for wisdom and prosperity.",
      rituals: ["Yellow flowers to Vishnu", "Read Vishnu Sahasranama", "Donate turmeric and yellow items"],
      color: "#eab308" },
    { name: "Shukravara Vrat", sanskrit: "शुक्रवार व्रत", type: "vrat",
      significance: "Friday fast for Goddess Lakshmi and Venus for beauty, love, and wealth.",
      rituals: ["White and pink flowers to Lakshmi", "Recite Shri Sukta", "Light ghee lamp"],
      color: "#f0abfc" },
    { name: "Shanivara Vrat", sanskrit: "शनिवार व्रत", type: "vrat",
      significance: "Saturday fast for Lord Shani (Saturn) to reduce Shani dosha.",
      rituals: ["Sesame oil lamp under Peepal tree", "Feed black sesame to birds", "Recite Shani Chalisa"],
      color: "#78716c" },
  ];

  return weeklyVrats[weekday];
}

// ── Prominent Muhurat types ───────────────────────────────────────────────────
export interface ProminentMuhurat {
  name: string;
  sanskrit: string;
  startTime: string;  // ISO
  endTime: string;    // ISO
  isActive: boolean;
  type: "auspicious" | "inauspicious";
  description: string;
}

export interface VedicCalendarData {
  vikramiSamvat: number;
  solarMonthName: string;
  solarMonthIndex: number;
  lunarMonthIndex: number;  // 1–12
}

// ── Planet / Shadow types (unchanged) ────────────────────────────────────────
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
  tithi: { index: number; name: string; paksha: "Shukla" | "Krishna"; degreeDiff: number };
  vaara: { index: number; name: string; sanskrit: string; lord: string };
  nakshatra: { index: number; name: string; longitude: number };
  yoga: { index: number; name: string; degreeSum: number };
  karana: { index: number; name: string };
  lagna: { longitude: number; rasi: RasiPosition };
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
  index: number;
  name: string;
  sanskrit: string;
  isDay: boolean;
  startTime: string;
  endTime: string;
  progress: number;
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

  // ── New fields ─────────────────────────────────────────────────────────
  vedicCalendar: VedicCalendarData;
  prominentMuhurats: ProminentMuhurat[];
  festival: FestivalInfo | null;
}
