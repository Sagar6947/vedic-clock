import { getSwissEph, Constants } from "./sweph";
import {
  FullVedicClockData, RasiPosition, PlanetData, AprakashaData,
  MandiGulikaData, PanchangData, VedicTimeData, PraharData,
  ProminentMuhurat, VedicCalendarData,
  RASIS, NAKSHATRAS, YOGAS, TITHIS, VAARAS, SOLAR_MONTHS,
  getRasiPosition, detectFestival,
} from "./vedic-types";

export function jdToMs(jd: number): number { return (jd - 2440587.5) * 86400 * 1000; }
export function jdToDate(jd: number): Date  { return new Date(jdToMs(jd)); }

export async function calculateVedicData(
  latitude: number, longitude: number, altitude: number = 0, utcTimeStr: string
): Promise<FullVedicClockData> {
  const eph = await getSwissEph();
  const dateUTC = new Date(utcTimeStr);
  const y = dateUTC.getUTCFullYear();
  const m = dateUTC.getUTCMonth() + 1;
  const d = dateUTC.getUTCDate();
  const hourDec = dateUTC.getUTCHours() + dateUTC.getUTCMinutes()/60 +
                  dateUTC.getUTCSeconds()/3600 + dateUTC.getUTCMilliseconds()/3600000;

  const jdT   = eph.swe_julday(y, m, d, hourDec, Constants.SE_GREG_CAL);
  const jdMid = eph.swe_julday(y, m, d, 0.0,     Constants.SE_GREG_CAL);

  // ── Sunrise / Sunset ─────────────────────────────────────────────────────
  const SE_BIT_DISC_CENTER   = 256;
  const SE_BIT_NO_REFRACTION = 512;
  const srRsmi  = Constants.SE_CALC_RISE | SE_BIT_DISC_CENTER | SE_BIT_NO_REFRACTION;
  const ssRsmi  = Constants.SE_CALC_SET  | SE_BIT_DISC_CENTER | SE_BIT_NO_REFRACTION;
  const epheflg = Constants.SEFLG_MOSEPH;
  const geopos  = [longitude, latitude, altitude];

  const srTodayRes = eph.swe_rise_trans(jdMid, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0);
  const ssTodayRes = eph.swe_rise_trans(jdMid, Constants.SE_SUN, null, epheflg, ssRsmi, geopos, 0, 0);
  const srToday = srTodayRes.tret;
  const ssToday = ssTodayRes.tret;

  let srStart: number, ssStart: number, srEnd: number;
  if (jdT < srToday) {
    const jdPrev = jdMid - 1.0;
    srStart = eph.swe_rise_trans(jdPrev, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0).tret;
    ssStart = eph.swe_rise_trans(jdPrev, Constants.SE_SUN, null, epheflg, ssRsmi, geopos, 0, 0).tret;
    srEnd   = srToday;
  } else {
    const jdNext = jdMid + 1.0;
    srStart = srToday;
    ssStart = ssToday;
    srEnd   = eph.swe_rise_trans(jdNext, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0).tret;
  }

  const dinamana        = ssStart - srStart;
  const ratrimana       = srEnd   - ssStart;
  const ahoratra        = srEnd   - srStart;
  const dinamanaSeconds = dinamana  * 86400;
  const ratrimanaSeconds= ratrimana * 86400;
  const ahoratraSeconds = ahoratra  * 86400;

  // ── Vedic Time ───────────────────────────────────────────────────────────
  const elapsedDays    = jdT - srStart;
  const elapsedSeconds = elapsedDays * 86400;
  const ghatiSeconds   = ahoratraSeconds / 60;
  const palaSeconds    = ghatiSeconds / 60;
  const vipalaSeconds  = palaSeconds / 60;
  const decimalGhati   = elapsedSeconds / ghatiSeconds;
  const ghati          = Math.floor(decimalGhati);
  const rem            = elapsedSeconds % ghatiSeconds;
  const pala           = Math.floor(rem / palaSeconds);
  const vipala         = Math.floor((rem % palaSeconds) / vipalaSeconds);

  // ── Prahars ──────────────────────────────────────────────────────────────
  const praharNames = [
    "Prathama Prahar","Dwitiya Prahar","Tritiya Prahar","Chaturtha Prahar",
    "Panchama Prahar","Shashtha Prahar","Saptama Prahar","Ashtama Prahar",
  ];
  const praharSanskrit = [
    "प्रथम प्रहर","द्वितीय प्रहर","तृतीय प्रहर","चतुर्थ प्रहर",
    "पंचम प्रहर","षष्ठ प्रहर","सप्तम प्रहर","अष्टम प्रहर",
  ];
  let praharIndex=1, isDay=true, praharStart=0, praharEnd=0, praharProgress=0;
  if (jdT < ssStart) {
    isDay = true;
    const dur = dinamana / 4;
    praharIndex    = Math.min(4, Math.max(1, Math.floor((jdT-srStart)/dur)+1));
    praharStart    = srStart + (praharIndex-1)*dur;
    praharEnd      = srStart + praharIndex*dur;
    praharProgress = ((jdT-praharStart)/dur)*100;
  } else {
    isDay = false;
    const dur = ratrimana / 4;
    praharIndex    = Math.min(8, Math.max(5, Math.floor((jdT-ssStart)/dur)+5));
    praharStart    = ssStart + (praharIndex-5)*dur;
    praharEnd      = ssStart + (praharIndex-4)*dur;
    praharProgress = ((jdT-praharStart)/dur)*100;
  }
  const prahar: PraharData = {
    index: praharIndex, name: praharNames[praharIndex-1],
    sanskrit: praharSanskrit[praharIndex-1], isDay,
    startTime: jdToDate(praharStart).toISOString(),
    endTime:   jdToDate(praharEnd).toISOString(),
    progress:  Math.min(100, Math.max(0, praharProgress)),
  };

  // ── Planets ───────────────────────────────────────────────────────────────
  eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);
  const pFlags = Constants.SEFLG_SIDEREAL | Constants.SEFLG_SPEED;
  const PLANET_IDS = [
    { id: Constants.SE_SUN,     name:"Sun",     sanskrit:"Surya"   },
    { id: Constants.SE_MOON,    name:"Moon",    sanskrit:"Chandra" },
    { id: Constants.SE_MERCURY, name:"Mercury", sanskrit:"Budha"   },
    { id: Constants.SE_VENUS,   name:"Venus",   sanskrit:"Shukra"  },
    { id: Constants.SE_MARS,    name:"Mars",    sanskrit:"Mangala" },
    { id: Constants.SE_JUPITER, name:"Jupiter", sanskrit:"Guru"    },
    { id: Constants.SE_SATURN,  name:"Saturn",  sanskrit:"Shani"   },
    { id: Constants.SE_URANUS,  name:"Uranus",  sanskrit:"Aruna"   },
    { id: Constants.SE_NEPTUNE, name:"Neptune", sanskrit:"Varuna"  },
    { id: Constants.SE_PLUTO,   name:"Pluto",   sanskrit:"Yama"    },
    { id: Constants.SE_TRUE_NODE, name:"Rahu",  sanskrit:"Rahu"    },
  ];
  const planets: PlanetData[] = PLANET_IDS.map(p => {
    const r = eph.swe_calc_ut(jdT, p.id, pFlags);
    return {
      name: p.name, sanskrit: p.sanskrit,
      longitude: r.xx[0], latitude: r.xx[1],
      distance: r.xx[2], speed: r.xx[3],
      isRetrograde: r.xx[3] < 0,
      rasi: getRasiPosition(r.xx[0]),
    };
  });
  const rahu = planets.find(p=>p.name==="Rahu")!;
  const ketuLong = (rahu.longitude+180)%360;
  planets.push({ name:"Ketu", sanskrit:"Ketu", longitude:ketuLong,
    latitude:-rahu.latitude, distance:rahu.distance, speed:rahu.speed,
    isRetrograde:rahu.isRetrograde, rasi:getRasiPosition(ketuLong) });

  // ── Aprakasha ─────────────────────────────────────────────────────────────
  const sunLong    = planets.find(p=>p.name==="Sun")!.longitude;
  const dhooma     = (sunLong+133.33333)%360;
  const vyatipata  = (360-dhooma)%360;
  const parivesha  = (vyatipata+180)%360;
  const indrachapa = (360-parivesha)%360;
  const upaketu    = (indrachapa+16.66667)%360;
  const aprakasha: AprakashaData = { dhooma, vyatipata, parivesha, indrachapa, upaketu };

  // ── Mandi & Gulika ────────────────────────────────────────────────────────
  const srDate  = jdToDate(srStart);
  const weekday = srDate.getUTCDay()+1;
  const daySaturnIdx   = ((8-weekday)%7)||7;
  const dayPortSize    = dinamana/8;
  const dayGulikaStart = srStart+(daySaturnIdx-1)*dayPortSize;
  const dayMandiEnd    = srStart+daySaturnIdx*dayPortSize;
  const nightRulerStart = ((weekday+4)%7)||7;
  const nightSaturnIdx  = ((8-nightRulerStart)%7)||7;
  const nightPortSize   = ratrimana/8;
  const nightGulikaStart= ssStart+(nightSaturnIdx-1)*nightPortSize;
  const nightMandiEnd   = ssStart+nightSaturnIdx*nightPortSize;
  const isTimeDay       = jdT < ssStart;
  const gulikaTimeJd    = isTimeDay ? dayGulikaStart   : nightGulikaStart;
  const mandiTimeJd     = isTimeDay ? dayMandiEnd       : nightMandiEnd;
  const hFlags = Constants.SEFLG_SIDEREAL;
  const hsys   = "P".charCodeAt(0);
  const gulikaHouses = eph.swe_houses_ex2(gulikaTimeJd, hFlags, latitude, longitude, hsys);
  const mandiHouses  = eph.swe_houses_ex2(mandiTimeJd,  hFlags, latitude, longitude, hsys);
  const gulikaLong   = gulikaHouses.ascmc[0];
  const mandiLong    = mandiHouses.ascmc[0];
  const mandiGulika: MandiGulikaData = {
    gulikaTime: jdToDate(gulikaTimeJd).toISOString(), gulikaLongitude: gulikaLong, gulikaRasi: getRasiPosition(gulikaLong),
    mandiTime:  jdToDate(mandiTimeJd).toISOString(),  mandiLongitude:  mandiLong,  mandiRasi:  getRasiPosition(mandiLong),
  };

  // ── Panchang ──────────────────────────────────────────────────────────────
  const moonLong     = planets.find(p=>p.name==="Moon")!.longitude;
  const degreeDiff   = (moonLong-sunLong+360)%360;
  const tithiIndex   = Math.floor(degreeDiff/12)+1;
  const paksha       = tithiIndex<=15 ? "Shukla" : "Krishna";
  const tithiName    = TITHIS[tithiIndex-1];
  const vaaraIndex   = srDate.getUTCDay();
  const vaara = { index:vaaraIndex, name:VAARAS[vaaraIndex].name, sanskrit:VAARAS[vaaraIndex].sanskrit, lord:VAARAS[vaaraIndex].planet };
  const nakshatraIndex = Math.floor(moonLong/(360/27))+1;
  const degreeSum      = (sunLong+moonLong)%360;
  const yogaIndex      = Math.floor(degreeSum/(360/27))+1;
  const karanaIndex    = Math.floor(degreeDiff/6)+1;
  let karanaName = "";
  if (karanaIndex===1) karanaName = "Kintughna (Fixed)";
  else if (karanaIndex>=58) {
    const fk = ["Shakuni","Chatushpada","Naga"];
    karanaName = `${fk[karanaIndex-58]} (Fixed)`;
  } else {
    const rk = ["Bava","Balava","Kaulava","Taitila","Gara","Vanija","Vishti"];
    karanaName = `${rk[(karanaIndex-2)%7]} (Repeating)`;
  }
  const curHouses  = eph.swe_houses_ex2(jdT, hFlags, latitude, longitude, hsys);
  const lagnaLong  = curHouses.ascmc[0];
  const panchang: PanchangData = {
    tithi:     { index:tithiIndex, name:tithiName, paksha, degreeDiff },
    vaara,
    nakshatra: { index:nakshatraIndex, name:NAKSHATRAS[nakshatraIndex-1], longitude:moonLong },
    yoga:      { index:yogaIndex, name:YOGAS[yogaIndex-1], degreeSum },
    karana:    { index:karanaIndex, name:karanaName },
    lagna:     { longitude:lagnaLong, rasi:getRasiPosition(lagnaLong) },
  };

  // ── Vedic Calendar ────────────────────────────────────────────────────────
  const vikramiSamvat   = y + 57;  // approximate
  const solarMonthIndex = Math.floor(sunLong/30);        // 0–11
  const lunarMonthIndex = solarMonthIndex + 1;           // 1–12 (approx)
  const vedicCalendar: VedicCalendarData = {
    vikramiSamvat,
    solarMonthName:  SOLAR_MONTHS[solarMonthIndex],
    solarMonthIndex: solarMonthIndex+1,
    lunarMonthIndex,
  };

  // ── Prominent Muhurats ────────────────────────────────────────────────────
  const now       = dateUTC.getTime();
  const srStartMs = jdToMs(srStart);
  const ssStartMs = jdToMs(ssStart);
  const srEndMs   = jdToMs(srEnd);
  const dinamanaMs= ssStartMs - srStartMs;

  // Brahma Muhurat: 96 min before SR to 48 min before SR
  const brahmStart = srStartMs - 96*60*1000;
  const brahmEnd   = srStartMs - 48*60*1000;

  // Abhijit Muhurat: daytime split into 15 portions; 7th–8th portion (centred on solar noon)
  const portionMs  = dinamanaMs / 15;
  const abhijitStart = srStartMs + 7*portionMs;
  const abhijitEnd   = srStartMs + 8*portionMs;

  // Rahu Kaal (daytime 8 portions indexed by weekday 0=Sun)
  const RAHU_IDX = [8,2,7,5,6,4,3];
  const rahuPortionMs  = dinamanaMs / 8;
  const rahuStart = srStartMs + (RAHU_IDX[vaaraIndex]-1)*rahuPortionMs;
  const rahuEnd   = srStartMs + RAHU_IDX[vaaraIndex]*rahuPortionMs;

  // Amrit Kaal (Abhijit is also called Amrit – we add it as a 4th but show top 3)
  const prominentMuhurats: ProminentMuhurat[] = [
    {
      name:"Brahma Muhurat", sanskrit:"ब्रह्म मुहूर्त",
      startTime: new Date(brahmStart).toISOString(),
      endTime:   new Date(brahmEnd).toISOString(),
      isActive: now>=brahmStart && now<brahmEnd,
      type:"auspicious",
      description:"Most sacred 48-minute window before sunrise — ideal for meditation, yoga and study.",
    },
    {
      name:"Abhijit Muhurat", sanskrit:"अभिजीत मुहूर्त",
      startTime: new Date(abhijitStart).toISOString(),
      endTime:   new Date(abhijitEnd).toISOString(),
      isActive: now>=abhijitStart && now<abhijitEnd,
      type:"auspicious",
      description:"The most powerful solar noon window — excellent for starting important work.",
    },
    {
      name:"Rahu Kaal", sanskrit:"राहु काल",
      startTime: new Date(rahuStart).toISOString(),
      endTime:   new Date(rahuEnd).toISOString(),
      isActive: now>=rahuStart && now<rahuEnd,
      type:"inauspicious",
      description:"Period ruled by Rahu — avoid starting new ventures during this window.",
    },
  ];

  // ── Festival ──────────────────────────────────────────────────────────────
  const festival = detectFestival(tithiIndex, paksha, lunarMonthIndex, vaaraIndex);

  const vedicTime: VedicTimeData = { ghati, pala, vipala, decimalGhati, elapsedSeconds, totalDaySeconds:ahoratraSeconds };

  return {
    latitude, longitude, altitude,
    targetTimeUtc: dateUTC.toISOString(),
    timezoneOffsetHours: 0,
    julianDay: jdT,
    sunriseStart: jdToDate(srStart).toISOString(),
    sunsetStart:  jdToDate(ssStart).toISOString(),
    sunriseEnd:   jdToDate(srEnd).toISOString(),
    dinamanaSeconds, ratrimanaSeconds, ahoratraSeconds,
    vedicTime, prahar, planets, aprakasha, mandiGulika, panchang,
    vedicCalendar, prominentMuhurats, festival,
  };
}
