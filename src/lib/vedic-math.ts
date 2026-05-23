import { getSwissEph, Constants } from "./sweph";
import {
  FullVedicClockData,
  RasiPosition,
  PlanetData,
  AprakashaData,
  MandiGulikaData,
  PanchangData,
  VedicTimeData,
  PraharData,
  RASIS,
  NAKSHATRAS,
  YOGAS,
  TITHIS,
  VAARAS,
  getRasiPosition
} from "./vedic-types";

// Conversion utilities between Julian Day and JS Date/Unix time
export function jdToMs(jd: number): number {
  return (jd - 2440587.5) * 86400 * 1000;
}

export function msToJd(ms: number): number {
  return ms / (86400 * 1000) + 2440587.5;
}

export function jdToDate(jd: number): Date {
  return new Date(jdToMs(jd));
}

export async function calculateVedicData(
  latitude: number,
  longitude: number,
  altitude: number = 0,
  utcTimeStr: string
): Promise<FullVedicClockData> {
  const eph = await getSwissEph();
  
  const dateUTC = new Date(utcTimeStr);
  const y = dateUTC.getUTCFullYear();
  const m = dateUTC.getUTCMonth() + 1;
  const d = dateUTC.getUTCDate();
  
  const hourDec = 
    dateUTC.getUTCHours() + 
    dateUTC.getUTCMinutes() / 60 + 
    dateUTC.getUTCSeconds() / 3600 + 
    dateUTC.getUTCMilliseconds() / 3600000;
    
  const jdT = eph.swe_julday(y, m, d, hourDec, Constants.SE_GREG_CAL);
  const jdMid = eph.swe_julday(y, m, d, 0.0, Constants.SE_GREG_CAL);

  // Sunrise/Sunset Flags: Geometric Center, No Refraction
  const SE_BIT_DISC_CENTER = 256;
  const SE_BIT_NO_REFRACTION = 512;
  const sunriseRsmi = Constants.SE_CALC_RISE | SE_BIT_DISC_CENTER | SE_BIT_NO_REFRACTION;
  const sunsetRsmi = Constants.SE_CALC_SET | SE_BIT_DISC_CENTER | SE_BIT_NO_REFRACTION;
  const epheflag = Constants.SEFLG_MOSEPH;
  const geopos = [longitude, latitude, altitude];

  // 1. Calculate today's Sunrise & Sunset
  const srTodayRes = eph.swe_rise_trans(jdMid, Constants.SE_SUN, null, epheflag, sunriseRsmi, geopos, 0, 0);
  const ssTodayRes = eph.swe_rise_trans(jdMid, Constants.SE_SUN, null, epheflag, sunsetRsmi, geopos, 0, 0);
  
  const srToday = srTodayRes.tret;
  const ssToday = ssTodayRes.tret;

  let srStart: number;
  let ssStart: number;
  let srEnd: number;

  // Decide current Vedic Day starting sunrise
  if (jdT < srToday) {
    // Current time is before today's sunrise: the Vedic day started yesterday
    const jdPrev = jdMid - 1.0;
    const srPrevRes = eph.swe_rise_trans(jdPrev, Constants.SE_SUN, null, epheflag, sunriseRsmi, geopos, 0, 0);
    const ssPrevRes = eph.swe_rise_trans(jdPrev, Constants.SE_SUN, null, epheflag, sunsetRsmi, geopos, 0, 0);
    
    srStart = srPrevRes.tret;
    ssStart = ssPrevRes.tret;
    srEnd = srToday;
  } else {
    // Current time is after today's sunrise: the Vedic day started today
    const jdNext = jdMid + 1.0;
    const srNextRes = eph.swe_rise_trans(jdNext, Constants.SE_SUN, null, epheflag, sunriseRsmi, geopos, 0, 0);
    
    srStart = srToday;
    ssStart = ssToday;
    srEnd = srNextRes.tret;
  }

  // 2. Compute Vedic Day/Night Durations (in seconds)
  const dinamana = ssStart - srStart;
  const ratrimana = srEnd - ssStart;
  const ahoratra = srEnd - srStart;

  const dinamanaSeconds = dinamana * 86400;
  const ratrimanaSeconds = ratrimana * 86400;
  const ahoratraSeconds = ahoratra * 86400;

  // 3. Compute Vedic Time (Ghati, Pala, Vipala) since sunrise
  const elapsedDays = jdT - srStart;
  const elapsedSeconds = elapsedDays * 86400;

  const ghatiSeconds = ahoratraSeconds / 60;
  const palaSeconds = ghatiSeconds / 60;
  const vipalaSeconds = palaSeconds / 60;

  const decimalGhati = elapsedSeconds / ghatiSeconds;
  const ghati = Math.floor(decimalGhati);
  const remainingSeconds = elapsedSeconds % ghatiSeconds;
  const pala = Math.floor(remainingSeconds / palaSeconds);
  const vipala = Math.floor((remainingSeconds % palaSeconds) / vipalaSeconds);

  // 4. Compute Prahars
  let praharIndex = 1;
  let isDay = true;
  let praharStart = 0;
  let praharEnd = 0;
  let praharProgress = 0;

  if (jdT < ssStart) {
    // Day Prahars (1-4)
    isDay = true;
    const praharDuration = dinamana / 4;
    const elapsedDayDays = jdT - srStart;
    praharIndex = Math.floor(elapsedDayDays / praharDuration) + 1;
    praharIndex = Math.min(4, Math.max(1, praharIndex)); // Clamp 1 to 4
    
    praharStart = srStart + (praharIndex - 1) * praharDuration;
    praharEnd = srStart + praharIndex * praharDuration;
    praharProgress = ((jdT - praharStart) / praharDuration) * 100;
  } else {
    // Night Prahars (5-8)
    isDay = false;
    const praharDuration = ratrimana / 4;
    const elapsedNightDays = jdT - ssStart;
    praharIndex = Math.floor(elapsedNightDays / praharDuration) + 5;
    praharIndex = Math.min(8, Math.max(5, praharIndex)); // Clamp 5 to 8
    
    praharStart = ssStart + (praharIndex - 5) * praharDuration;
    praharEnd = ssStart + (praharIndex - 4) * praharDuration;
    praharProgress = ((jdT - praharStart) / praharDuration) * 100;
  }

  const praharNames = [
    "Prathama Prahar (Sunrise)",
    "Dwitiya Prahar (Mid-Morning)",
    "Tritiya Prahar (Midday)",
    "Chaturtha Prahar (Afternoon)",
    "Panchama Prahar (Sunset/Pradosh)",
    "Shashtha Prahar (Midnight)",
    "Saptama Prahar (Deep Night)",
    "Ashtama Prahar (Brahma Muhurat)"
  ];
  
  const praharSanskrit = [
    "प्रथम प्रहर", "द्वितीय प्रहर", "तृतीय प्रहर", "चतुर्थ प्रहर",
    "पंचम प्रहर", "षष्ठ प्रहर", "सप्तम प्रहर", "अष्टम प्रहर"
  ];

  const prahar: PraharData = {
    index: praharIndex,
    name: praharNames[praharIndex - 1],
    sanskrit: praharSanskrit[praharIndex - 1],
    isDay,
    startTime: jdToDate(praharStart).toISOString(),
    endTime: jdToDate(praharEnd).toISOString(),
    progress: Math.min(100, Math.max(0, praharProgress)),
  };

  // 5. Sidereal Planetary Positions (Lahiri Ayanamsa)
  eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);
  const planetFlags = Constants.SEFLG_SIDEREAL | Constants.SEFLG_SPEED;

  const PLANET_IDS = [
    { id: Constants.SE_SUN, name: "Sun", sanskrit: "Surya" },
    { id: Constants.SE_MOON, name: "Moon", sanskrit: "Chandra" },
    { id: Constants.SE_MERCURY, name: "Mercury", sanskrit: "Budha" },
    { id: Constants.SE_VENUS, name: "Venus", sanskrit: "Shukra" },
    { id: Constants.SE_MARS, name: "Mars", sanskrit: "Mangala" },
    { id: Constants.SE_JUPITER, name: "Jupiter", sanskrit: "Guru" },
    { id: Constants.SE_SATURN, name: "Saturn", sanskrit: "Shani" },
    { id: Constants.SE_URANUS, name: "Uranus", sanskrit: "Aruna" },
    { id: Constants.SE_NEPTUNE, name: "Neptune", sanskrit: "Varuna" },
    { id: Constants.SE_PLUTO, name: "Pluto", sanskrit: "Yama" },
    { id: Constants.SE_TRUE_NODE, name: "Rahu", sanskrit: "Rahu" },
  ];

  const planets: PlanetData[] = PLANET_IDS.map((p) => {
    const res = eph.swe_calc_ut(jdT, p.id, planetFlags);
    const longitude = res.xx[0];
    const latitude = res.xx[1];
    const distance = res.xx[2];
    const speed = res.xx[3];
    const isRetrograde = speed < 0;
    
    return {
      name: p.name,
      sanskrit: p.sanskrit,
      longitude,
      latitude,
      distance,
      speed,
      isRetrograde,
      rasi: getRasiPosition(longitude),
    };
  });

  // Add True Ketu (Rahu + 180 mod 360)
  const rahu = planets.find((p) => p.name === "Rahu")!;
  const ketuLong = (rahu.longitude + 180) % 360;
  planets.push({
    name: "Ketu",
    sanskrit: "Ketu",
    longitude: ketuLong,
    latitude: -rahu.latitude, 
    distance: rahu.distance,
    speed: rahu.speed,
    isRetrograde: rahu.isRetrograde,
    rasi: getRasiPosition(ketuLong),
  });

  // 6. Aprakasha Grahas (Shadow Planets)
  const sunLong = planets.find((p) => p.name === "Sun")!.longitude;
  
  const dhooma = (sunLong + 133.33333) % 360;
  const vyatipata = (360 - dhooma) % 360;
  const parivesha = (vyatipata + 180) % 360;
  const indrachapa = (360 - parivesha) % 360;
  const upaketu = (indrachapa + 16.66667) % 360;

  const aprakasha: AprakashaData = {
    dhooma,
    vyatipata,
    parivesha,
    indrachapa,
    upaketu,
  };

  // 7. Mandi & Gulika (Saturnian Portions)
  const srDate = jdToDate(srStart);
  const weekday = srDate.getUTCDay() + 1; // 1 to 7

  // Day portion indices
  const daySaturnIndex = ((8 - weekday) % 7) || 7;
  const dayPortionSize = dinamana / 8;
  const dayGulikaStart = srStart + (daySaturnIndex - 1) * dayPortionSize;
  const dayMandiEnd = srStart + daySaturnIndex * dayPortionSize;

  // Night portion indices
  const nightRulerStart = ((weekday + 4) % 7) || 7;
  const nightSaturnIndex = ((8 - nightRulerStart) % 7) || 7;
  const nightPortionSize = ratrimana / 8;
  const nightGulikaStart = ssStart + (nightSaturnIndex - 1) * nightPortionSize;
  const nightMandiEnd = ssStart + nightSaturnIndex * nightPortionSize;

  // Check if current time is day or night to compute Gulika and Mandi Lagnas
  const isTimeDay = jdT < ssStart;
  const gulikaTimeJd = isTimeDay ? dayGulikaStart : nightGulikaStart;
  const mandiTimeJd = isTimeDay ? dayMandiEnd : nightMandiEnd;

  const houseFlags = Constants.SEFLG_SIDEREAL;
  const hsys = "P".charCodeAt(0);

  // Gulika Lagna
  const gulikaHouses = eph.swe_houses_ex2(gulikaTimeJd, houseFlags, latitude, longitude, hsys);
  const gulikaLongitude = gulikaHouses.ascmc[0];

  // Mandi Lagna
  const mandiHouses = eph.swe_houses_ex2(mandiTimeJd, houseFlags, latitude, longitude, hsys);
  const mandiLongitude = mandiHouses.ascmc[0];

  const mandiGulika: MandiGulikaData = {
    gulikaTime: jdToDate(gulikaTimeJd).toISOString(),
    gulikaLongitude,
    gulikaRasi: getRasiPosition(gulikaLongitude),
    mandiTime: jdToDate(mandiTimeJd).toISOString(),
    mandiLongitude,
    mandiRasi: getRasiPosition(mandiLongitude),
  };

  // 8. Panchang Elements
  const moonLong = planets.find((p) => p.name === "Moon")!.longitude;
  
  // Tithi
  const degreeDiff = (moonLong - sunLong + 360) % 360;
  const tithiIndex = Math.floor(degreeDiff / 12) + 1; // 1 to 30
  const isShukla = tithiIndex <= 15;
  const paksha = isShukla ? "Shukla" : "Krishna";
  const tithiName = TITHIS[tithiIndex - 1];

  // Vaara
  const vaaraIndex = srDate.getUTCDay(); // 0 (Sunday) to 6 (Saturday)
  const vaara = {
    index: vaaraIndex,
    name: VAARAS[vaaraIndex].name,
    sanskrit: VAARAS[vaaraIndex].sanskrit,
    lord: VAARAS[vaaraIndex].planet,
  };

  // Nakshatra
  const nakshatraIndex = Math.floor(moonLong / (360 / 27)) + 1; // 1 to 27
  const nakshatraName = NAKSHATRAS[nakshatraIndex - 1];

  // Yoga
  const degreeSum = (sunLong + moonLong) % 360;
  const yogaIndex = Math.floor(degreeSum / (360 / 27)) + 1; // 1 to 27
  const yogaName = YOGAS[yogaIndex - 1];

  // Karana
  const karanaIndex = Math.floor(degreeDiff / 6) + 1; // 1 to 60
  
  // Determine Karana Name
  let karanaName = "";
  if (karanaIndex === 1) {
    karanaName = "Kintughna (Fixed)";
  } else if (karanaIndex >= 58) {
    const fixedKaranas = ["Shakuni", "Chatushpada", "Naga"];
    karanaName = `${fixedKaranas[karanaIndex - 58]} (Fixed)`;
  } else {
    const repeatingKaranas = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"];
    const repSeq = (karanaIndex - 2) % 7;
    karanaName = `${repeatingKaranas[repSeq]} (Repeating)`;
  }

  // Lagna (Ascendant for exact current time jdT)
  const currentHouses = eph.swe_houses_ex2(jdT, houseFlags, latitude, longitude, hsys);
  const lagnaLongitude = currentHouses.ascmc[0];

  const panchang: PanchangData = {
    tithi: {
      index: tithiIndex,
      name: tithiName,
      paksha,
      degreeDiff,
    },
    vaara,
    nakshatra: {
      index: nakshatraIndex,
      name: nakshatraName,
      longitude: moonLong,
    },
    yoga: {
      index: yogaIndex,
      name: yogaName,
      degreeSum,
    },
    karana: {
      index: karanaIndex,
      name: karanaName,
    },
    lagna: {
      longitude: lagnaLongitude,
      rasi: getRasiPosition(lagnaLongitude),
    },
  };

  const vedicTime: VedicTimeData = {
    ghati,
    pala,
    vipala,
    decimalGhati,
    elapsedSeconds,
    totalDaySeconds: ahoratraSeconds,
  };

  return {
    latitude,
    longitude,
    altitude,
    targetTimeUtc: dateUTC.toISOString(),
    timezoneOffsetHours: 0,
    
    julianDay: jdT,
    sunriseStart: jdToDate(srStart).toISOString(),
    sunsetStart: jdToDate(ssStart).toISOString(),
    sunriseEnd: jdToDate(srEnd).toISOString(),
    
    dinamanaSeconds,
    ratrimanaSeconds,
    ahoratraSeconds,
    
    vedicTime,
    prahar,
    planets,
    aprakasha,
    mandiGulika,
    panchang,
  };
}
