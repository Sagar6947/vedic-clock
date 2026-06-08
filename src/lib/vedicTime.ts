import { getSwissEph, Constants } from "./sweph";

export interface VedicTimeResult {
  muhurta: number;
  kaal: number;
  kashtha: number;
  segment: "day" | "night";
  muhurtaIndex: number;
  muhurtaLenSec: number;
  kashthaLenSec: number;
  anchors: {
    daySR: Date;
    daySS: Date;
    nextSR: Date;
  };
  model?: "uniform-fallback";
}

export interface VedicUnits {
  muhurta: number;
  kaal: number;
  kashtha: number;
}

export interface Location {
  lat: number;
  lon: number;
  elevation?: number;
}

function dateToJD(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

export async function civilToVedic(
  now: Date,
  location: Location
): Promise<VedicTimeResult> {
  const eph = await getSwissEph();
  
  const jdT = dateToJD(now);
  const lat = location.lat ?? 23.1793;
  const lon = location.lon ?? 75.7849;
  const alt = location.elevation ?? 490;
  
  const geopos = [lon, lat, alt];
  const epheflg = Constants.SEFLG_MOSEPH;
  // Default SE_CALC_RISE uses -0.833 degrees for upper limb + refraction
  const srRsmi = Constants.SE_CALC_RISE; 
  const ssRsmi = Constants.SE_CALC_SET;

  // Calculate the sunrise/sunset for the current civil day (at 00:00 UTC)
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  const jdMid = eph.swe_julday(y, m, d, 0.0, Constants.SE_GREG_CAL);

  let srToday: number, ssToday: number, nextSR: number;
  let daySR: number, daySS: number;
  
  try {
    srToday = eph.swe_rise_trans(jdMid, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0).tret;
  } catch (err) {
    // High latitude fallback
    return uniformFallback(jdT);
  }

  if (jdT >= srToday) {
    daySR = srToday;
    try {
      daySS = eph.swe_rise_trans(jdMid, Constants.SE_SUN, null, epheflg, ssRsmi, geopos, 0, 0).tret;
      // If sunset happened before sunrise (e.g. jdT > srToday, but ssToday was before srToday due to UTC day offset)
      if (daySS < daySR) {
          // This happens if 00:00 UTC sees a sunset before sunrise.
          // We must ensure daySS is the sunset AFTER daySR.
          daySS = eph.swe_rise_trans(daySR, Constants.SE_SUN, null, epheflg, ssRsmi, geopos, 0, 0).tret;
      }
      nextSR = eph.swe_rise_trans(daySS, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0).tret;
    } catch (err) {
      return uniformFallback(jdT);
    }
  } else {
    // Before today's sunrise -> use previous day
    try {
      // Find the sunrise before srToday
      daySR = eph.swe_rise_trans(jdMid - 1.0, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0).tret;
      daySS = eph.swe_rise_trans(daySR, Constants.SE_SUN, null, epheflg, ssRsmi, geopos, 0, 0).tret;
      nextSR = srToday;
    } catch (err) {
      return uniformFallback(jdT);
    }
  }

  const nowSec = jdT * 86400;
  const srSec = daySR * 86400;
  const ssSec = daySS * 86400;
  const nsrSec = nextSR * 86400;

  if (ssSec <= srSec || nsrSec <= ssSec) {
    return uniformFallback(jdT);
  }

  let muhurtaLen: number;
  let M: number;
  let segment: "day" | "night";

  if (nowSec < ssSec) {
    // DAYTIME
    segment = "day";
    muhurtaLen = (ssSec - srSec) / 15;
    M = (nowSec - srSec) / muhurtaLen;
  } else {
    // NIGHTTIME
    segment = "night";
    muhurtaLen = (nsrSec - ssSec) / 15;
    M = 15 + (nowSec - ssSec) / muhurtaLen;
  }

  // Safety cap just in case of float precision exactly on nextSR
  if (M >= 30) {
    M = 29.999999999;
  } else if (M < 0) {
    M = 0;
  }

  const muhurta = Math.floor(M);
  const fk = (M - muhurta) * 30;
  const kala = Math.floor(fk);
  const kashtha = Math.floor((fk - kala) * 30);

  return {
    muhurta,
    kaal: kala,
    kashtha,
    segment,
    muhurtaIndex: muhurta + 1,
    muhurtaLenSec: muhurtaLen,
    kashthaLenSec: muhurtaLen / 900,
    anchors: {
      daySR: jdToDate(daySR),
      daySS: jdToDate(daySS),
      nextSR: jdToDate(nextSR)
    }
  };
}

function uniformFallback(jdT: number): VedicTimeResult {
  const midnight = Math.floor(jdT) - 0.5;
  const daySR = midnight + 0.25; 
  const daySS = midnight + 0.75; 
  const nextSR = daySR + 1.0;
  
  const nowSec = jdT * 86400;
  const srSec = daySR * 86400;
  const nsrSec = nextSR * 86400;
  const total = nsrSec - srSec;
  
  let f = (nowSec - srSec) / total;
  if (f < 0) f = 0;
  if (f >= 1) f = 0.999999;
  
  const M = f * 30;
  const muhurta = Math.floor(M);
  const fk = (M - muhurta) * 30;
  const kala = Math.floor(fk);
  const kashtha = Math.floor((fk - kala) * 30);
  
  const muhurtaLen = total / 30;
  
  return {
    muhurta,
    kaal: kala,
    kashtha,
    segment: muhurta < 15 ? "day" : "night",
    muhurtaIndex: muhurta + 1,
    muhurtaLenSec: muhurtaLen,
    kashthaLenSec: muhurtaLen / 900,
    anchors: {
      daySR: jdToDate(daySR),
      daySS: jdToDate(daySS),
      nextSR: jdToDate(nextSR)
    },
    model: "uniform-fallback"
  };
}

export async function vedicToCivil(
  vedic: VedicUnits,
  dayDate: Date,
  location: Location
): Promise<Date> {
  const { muhurta, kaal, kashtha } = vedic;

  if (
    muhurta < 0 || muhurta > 29 ||
    kaal < 0 || kaal > 29 ||
    kashtha < 0 || kashtha > 29
  ) {
    throw new Error("Invalid Vedic time unit range. Each must be 0-29.");
  }

  const refVedic = await civilToVedic(dayDate, location);
  
  const { daySR, daySS, nextSR } = refVedic.anchors;
  const srSec = daySR.getTime() / 1000;
  const ssSec = daySS.getTime() / 1000;
  const nsrSec = nextSR.getTime() / 1000;
  
  let targetSec: number;
  
  if (muhurta < 15) {
    // Daytime
    const muhurtaLen = (ssSec - srSec) / 15;
    const M = muhurta + (kaal / 30) + (kashtha / 900);
    targetSec = srSec + (M * muhurtaLen);
  } else {
    // Nighttime
    const muhurtaLen = (nsrSec - ssSec) / 15;
    const M = (muhurta - 15) + (kaal / 30) + (kashtha / 900);
    targetSec = ssSec + (M * muhurtaLen);
  }

  return new Date(targetSec * 1000);
}

export function formatVedic(v: VedicUnits): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(v.muhurta)}:${pad(v.kaal)}:${pad(v.kashtha)}`;
}
