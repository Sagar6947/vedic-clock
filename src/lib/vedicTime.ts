import { getSwissEph, Constants } from "./sweph";

export interface VedicTimeResult {
  muhurta: number;
  kaal: number;
  kashtha: number;
  fraction: number;
  sunrise: Date;
  nextSunrise: Date;
  muhurtaLengthSec: number;
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
  // JD = (unix ms / 86400000) + 2440587.5
  return date.getTime() / 86400000 + 2440587.5;
}

function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

export async function civilToVedic(
  date: Date,
  location: Location
): Promise<VedicTimeResult> {
  const eph = await getSwissEph();
  
  const jdT = dateToJD(date);
  // Default to Ujjain if not provided
  const lat = location.lat ?? 23.1793;
  const lon = location.lon ?? 75.7849;
  const alt = location.elevation ?? 490;
  
  const geopos = [lon, lat, alt];
  const epheflg = Constants.SEFLG_MOSEPH;
  // Default SE_CALC_RISE uses -0.833 degrees for upper limb + refraction
  const srRsmi = Constants.SE_CALC_RISE; 

  // First, calculate the sunrise for the current civil day (at 00:00 UTC)
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const jdMid = eph.swe_julday(y, m, d, 0.0, Constants.SE_GREG_CAL);

  let srTodayRes;
  try {
    srTodayRes = eph.swe_rise_trans(jdMid, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0);
  } catch (err) {
    throw new Error("Sun does not rise (polar region or ephemeris error)");
  }
  
  const srToday = srTodayRes.tret;

  let srStart: number;
  let srEnd: number;

  if (jdT < srToday) {
    // Current time is before today's UTC-calculated sunrise, 
    // so the anchor sunrise is the one prior to today's sunrise.
    const jdPrev = jdMid - 1.0;
    try {
      srStart = eph.swe_rise_trans(jdPrev, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0).tret;
      srEnd = srToday;
    } catch (err) {
      throw new Error("Sun does not rise (polar region or ephemeris error)");
    }
  } else {
    // Current time is on or after today's UTC-calculated sunrise.
    const jdNext = jdMid + 1.0;
    try {
      srStart = srToday;
      srEnd = eph.swe_rise_trans(jdNext, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0).tret;
    } catch (err) {
      throw new Error("Sun does not rise (polar region or ephemeris error)");
    }
  }

  const deltaSec = (jdT - srStart) * 86400;
  const LSec = (srEnd - srStart) * 86400;

  if (LSec <= 0) {
    throw new Error("Invalid sunrise bounds");
  }

  let f = deltaSec / LSec;
  // Math precision safety
  if (f < 0) f = 0;
  if (f >= 1) f = 0.999999999;

  const muhurta = Math.floor(f * 30);
  const kaal = Math.floor(f * 900) % 30;
  const kashtha = Math.floor(f * 27000) % 30;

  return {
    muhurta,
    kaal,
    kashtha,
    fraction: f,
    sunrise: jdToDate(srStart),
    nextSunrise: jdToDate(srEnd),
    muhurtaLengthSec: LSec / 30
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

  // To find the sunrise, we compute civilToVedic for noon (local) of dayDate
  // Using 12:00 PM local usually safely drops us in the middle of the correct Vedic day
  // Let's compute f and reverse it.
  const f = (muhurta * 900 + kaal * 30 + kashtha) / 27000;
  
  // Create a time around local noon for the given date to find that day's sunrise
  // Since we don't have the timezone easily, 06:00 UTC is usually daytime in India/Europe.
  // Actually, we can just use the exact dayDate as an anchor if it falls during that Vedic day.
  // To be perfectly robust: civilToVedic(dayDate) will give us the srStart for the Vedic day 
  // that dayDate belongs to.
  
  const refVedic = await civilToVedic(dayDate, location);
  
  const srStartJd = dateToJD(refVedic.sunrise);
  const srEndJd = dateToJD(refVedic.nextSunrise);
  const L = srEndJd - srStartJd; // in days

  const jdT = srStartJd + (f * L);
  return jdToDate(jdT);
}

export function formatVedic(v: VedicUnits): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(v.muhurta)}:${pad(v.kaal)}:${pad(v.kashtha)}`;
}
