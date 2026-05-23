import { FullVedicClockData } from "./vedic-types";

export interface ScoreBreakdown {
  label: string;
  score: number;
  type: "positive" | "negative" | "neutral";
}

export interface MuhuratResult {
  score: number; // 0 to 100
  rating: string; // Excellent | Good | Average | Inauspicious
  breakdown: ScoreBreakdown[];
}

export type UserRole = "student" | "businessman" | "traveler" | "wedding" | "doctor";

// Favorable/Unfavorable mappings per role
interface RoleRules {
  favorableNakshatras: Set<string>;
  unfavorableNakshatras: Set<string>;
  favorableTithis: Set<string>;
  unfavorableTithis: Set<string>;
  favorableYogas: Set<string>;
  unfavorableYogas: Set<string>;
  favorableLagnas: Set<string>;
}

const ROLE_RULES: Record<UserRole, RoleRules> = {
  student: {
    favorableNakshatras: new Set([
      "Rohini", "Mrigashira", "Punarvasu", "Pushya", "Hasta", "Chitra", "Swati", "Anuradha", "Shravana", "Dhanishta", "Shatabhisha", "Revati"
    ]),
    unfavorableNakshatras: new Set([
      "Bharani", "Krittika", "Ashlesha", "Jyeshtha", "Mula", "Magha"
    ]),
    favorableTithis: new Set([
      "Dwitiya", "Tritiya", "Panchami", "Saptami", "Dashami", "Ekadashi", "Trayodashi"
    ]),
    unfavorableTithis: new Set([
      "Chaturthi", "Navami", "Chaturdashi", "Amavasya"
    ]),
    favorableYogas: new Set([
      "Ayushman", "Saubhagya", "Sobhana", "Sukarma", "Harshana", "Siddhi", "Shiva", "Siddha", "Sadhya", "Shubha"
    ]),
    unfavorableYogas: new Set([
      "Atiganda", "Vyaghata", "Vajra", "Vyatipata", "Parigha", "Vaidhriti", "Ganda", "Shoola"
    ]),
    favorableLagnas: new Set(["Gemini", "Virgo", "Libra", "Sagittarius", "Pisces"])
  },
  businessman: {
    favorableNakshatras: new Set([
      "Rohini", "Pushya", "Uttara Phalguni", "Hasta", "Chitra", "Anuradha", "Uttara Ashadha", "Shravana", "Dhanishta", "Uttara Bhadrapada", "Revati"
    ]),
    unfavorableNakshatras: new Set([
      "Bharani", "Ardra", "Ashlesha", "Jyeshtha", "Shatabhisha"
    ]),
    favorableTithis: new Set([
      "Pratipada", "Dwitiya", "Tritiya", "Panchami", "Dashami", "Ekadashi", "Purnima"
    ]),
    unfavorableTithis: new Set([
      "Chaturthi", "Shashti", "Ashtami", "Navami", "Chaturdashi", "Amavasya"
    ]),
    favorableYogas: new Set([
      "Preeti", "Ayushman", "Saubhagya", "Sobhana", "Vriddhi", "Dhruva", "Siddhi", "Variyan", "Shiva", "Siddha", "Shubha", "Shukla"
    ]),
    unfavorableYogas: new Set([
      "Vishkumbha", "Atiganda", "Shoola", "Ganda", "Vyaghata", "Vajra", "Vyatipata", "Parigha", "Vaidhriti"
    ]),
    favorableLagnas: new Set(["Taurus", "Gemini", "Leo", "Libra", "Sagittarius"])
  },
  traveler: {
    favorableNakshatras: new Set([
      "Ashwini", "Punarvasu", "Pushya", "Hasta", "Swati", "Shravana", "Dhanishta", "Shatabhisha", "Revati"
    ]),
    unfavorableNakshatras: new Set([
      "Bharani", "Krittika", "Rohini", "Ardra", "Ashlesha", "Jyeshtha"
    ]),
    favorableTithis: new Set([
      "Dwitiya", "Tritiya", "Panchami", "Saptami", "Dashami", "Ekadashi", "Trayodashi"
    ]),
    unfavorableTithis: new Set([
      "Chaturthi", "Shashti", "Ashtami", "Navami", "Chaturdashi", "Amavasya"
    ]),
    favorableYogas: new Set([
      "Ayushman", "Saubhagya", "Sobhana", "Sukarma", "Siddhi", "Shubha", "Shukla"
    ]),
    unfavorableYogas: new Set([
      "Vyatipata", "Vaidhriti", "Vyaghata", "Atiganda", "Ganda", "Shoola"
    ]),
    favorableLagnas: new Set(["Gemini", "Cancer", "Libra", "Sagittarius", "Aquarius"])
  },
  wedding: {
    favorableNakshatras: new Set([
      "Rohini", "Mrigashira", "Uttara Phalguni", "Hasta", "Anuradha", "Uttara Ashadha", "Uttara Bhadrapada", "Revati"
    ]),
    unfavorableNakshatras: new Set([
      "Bharani", "Krittika", "Ardra", "Ashlesha", "Magha", "Jyeshtha", "Mula"
    ]),
    favorableTithis: new Set([
      "Dwitiya", "Tritiya", "Panchami", "Saptami", "Dashami", "Ekadashi", "Trayodashi"
    ]),
    unfavorableTithis: new Set([
      "Chaturthi", "Shashti", "Ashtami", "Navami", "Chaturdashi", "Amavasya"
    ]),
    favorableYogas: new Set([
      "Preeti", "Saubhagya", "Sobhana", "Sukarma", "Harshana", "Siddhi", "Variyan", "Shiva", "Siddha", "Shubha"
    ]),
    unfavorableYogas: new Set([
      "Vishkumbha", "Atiganda", "Shoola", "Ganda", "Vyaghata", "Vajra", "Vyatipata", "Vaidhriti"
    ]),
    favorableLagnas: new Set(["Taurus", "Gemini", "Cancer", "Libra", "Sagittarius", "Pisces"])
  },
  doctor: {
    favorableNakshatras: new Set([
      "Ashwini", "Rohini", "Punarvasu", "Pushya", "Hasta", "Chitra", "Anuradha", "Shravana", "Shatabhisha", "Revati"
    ]),
    unfavorableNakshatras: new Set([
      "Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha", "Mula"
    ]),
    favorableTithis: new Set([
      "Dwitiya", "Tritiya", "Panchami", "Saptami", "Dashami", "Ekadashi", "Trayodashi"
    ]),
    unfavorableTithis: new Set([
      "Chaturthi", "Navami", "Chaturdashi", "Amavasya"
    ]),
    favorableYogas: new Set([
      "Ayushman", "Saubhagya", "Sobhana", "Sukarma", "Siddhi", "Shiva", "Siddha", "Sadhya", "Shubha"
    ]),
    unfavorableYogas: new Set([
      "Shoola", "Ganda", "Atiganda", "Vyatipata", "Vaidhriti", "Vyaghata", "Vajra"
    ]),
    favorableLagnas: new Set(["Cancer", "Virgo", "Scorpio", "Pisces"])
  }
};

// Portion indices for daily timed periods (Rahu Kaal, Yama Gandam, Gulika Kaal)
// Indices correspond to Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
const RAHU_KAAL_PORTIONS = [8, 2, 7, 5, 6, 4, 3];
const YAMA_GANDAM_PORTIONS = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_KAAL_PORTIONS = [7, 6, 5, 4, 3, 2, 1];

export function getMuhuratScore(
  data: FullVedicClockData,
  role: UserRole
): MuhuratResult {
  const rules = ROLE_RULES[role] || ROLE_RULES.student;
  const breakdown: ScoreBreakdown[] = [];
  let baseScore = 50; // Starting baseline

  const tithi = data.panchang.tithi.name;
  const nakshatra = data.panchang.nakshatra.name;
  const yoga = data.panchang.yoga.name;
  const lagnaName = data.panchang.lagna.rasi.signSanskrit; // Sanskrit sign name

  // 1. Tithi Scoring
  if (rules.favorableTithis.has(tithi)) {
    baseScore += 20;
    breakdown.push({ label: `Favorable Tithi (${tithi})`, score: 20, type: "positive" });
  } else if (rules.unfavorableTithis.has(tithi)) {
    baseScore -= 30;
    breakdown.push({ label: `Inauspicious Tithi (${tithi})`, score: -30, type: "negative" });
  } else {
    breakdown.push({ label: `Neutral Tithi (${tithi})`, score: 0, type: "neutral" });
  }

  // 2. Nakshatra Scoring
  if (rules.favorableNakshatras.has(nakshatra)) {
    baseScore += 25;
    breakdown.push({ label: `Favorable Nakshatra (${nakshatra})`, score: 25, type: "positive" });
  } else if (rules.unfavorableNakshatras.has(nakshatra)) {
    baseScore -= 30;
    breakdown.push({ label: `Inauspicious Nakshatra (${nakshatra})`, score: -30, type: "negative" });
  } else {
    breakdown.push({ label: `Neutral Nakshatra (${nakshatra})`, score: 0, type: "neutral" });
  }

  // 3. Yoga Scoring
  if (rules.favorableYogas.has(yoga)) {
    baseScore += 15;
    breakdown.push({ label: `Beneficial Yoga (${yoga})`, score: 15, type: "positive" });
  } else if (rules.unfavorableYogas.has(yoga)) {
    baseScore -= 20;
    breakdown.push({ label: `Malignant Yoga (${yoga})`, score: -20, type: "negative" });
  } else {
    breakdown.push({ label: `Neutral Yoga (${yoga})`, score: 0, type: "neutral" });
  }

  // 4. Lagna (Ascendant) Rasi Scoring
  const englishLagnaName = data.panchang.lagna.rasi.signName;
  if (rules.favorableLagnas.has(englishLagnaName)) {
    baseScore += 15;
    breakdown.push({ label: `Auspicious Lagna (${lagnaName} / ${englishLagnaName})`, score: 15, type: "positive" });
  } else {
    breakdown.push({ label: `Neutral Lagna (${lagnaName} / ${englishLagnaName})`, score: 0, type: "neutral" });
  }

  // 5. Dynamic Daily Kaals (Rahu Kaal, Yama Gandam, Gulika Kaal)
  // Let's identify the current weekday (from sunrise start)
  const srDate = new Date(data.sunriseStart);
  const weekday = srDate.getUTCDay(); // 0 (Sun) to 6 (Sat)
  
  // Calculate daytime portions
  const srStart = new Date(data.sunriseStart).getTime();
  const ssStart = new Date(data.sunsetStart).getTime();
  const dinamana = ssStart - srStart;
  const portionSize = dinamana / 8;
  const targetTime = new Date(data.targetTimeUtc).getTime();

  // Rahu Kaal
  const rahuPortion = RAHU_KAAL_PORTIONS[weekday];
  const rahuStart = srStart + (rahuPortion - 1) * portionSize;
  const rahuEnd = srStart + rahuPortion * portionSize;
  
  if (targetTime >= rahuStart && targetTime < rahuEnd) {
    baseScore -= 30;
    breakdown.push({ label: `Rahu Kaal is active (highly inauspicious)`, score: -30, type: "negative" });
  }

  // Yama Gandam
  const yamaPortion = YAMA_GANDAM_PORTIONS[weekday];
  const yamaStart = srStart + (yamaPortion - 1) * portionSize;
  const yamaEnd = srStart + yamaPortion * portionSize;

  if (targetTime >= yamaStart && targetTime < yamaEnd) {
    baseScore -= 20;
    breakdown.push({ label: `Yama Gandam is active (inauspicious)`, score: -20, type: "negative" });
  }

  // Gulika Kaal
  const gulikaPortion = GULIKA_KAAL_PORTIONS[weekday];
  const gulikaStart = srStart + (gulikaPortion - 1) * portionSize;
  const gulikaEnd = srStart + gulikaPortion * portionSize;

  if (targetTime >= gulikaStart && targetTime < gulikaEnd) {
    baseScore += 10;
    breakdown.push({ label: `Gulika Kaal is active (auspicious for dynamic actions)`, score: 10, type: "positive" });
  }

  // Normalize final score to range 0 - 100
  // Lowest possible baseScore approx: 50 - 30 - 30 - 20 - 15 - 30 - 20 = -95
  // Highest possible baseScore approx: 50 + 20 + 25 + 15 + 15 + 10 = 135
  // We can clamp to 0 and 100, then map nicely
  let normalizedScore = Math.round(((baseScore + 40) / 160) * 100);
  normalizedScore = Math.min(100, Math.max(0, normalizedScore));

  // Determine Rating
  let rating = "Average";
  if (normalizedScore >= 85) {
    rating = "Excellent (Amrit)";
  } else if (normalizedScore >= 65) {
    rating = "Good (Shubh)";
  } else if (normalizedScore >= 45) {
    rating = "Average (Sama)";
  } else if (normalizedScore >= 25) {
    rating = "Inauspicious (Varjya)";
  } else {
    rating = "Highly Inauspicious (Malignant)";
  }

  return {
    score: normalizedScore,
    rating,
    breakdown,
  };
}
