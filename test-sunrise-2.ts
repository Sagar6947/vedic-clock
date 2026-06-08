import { getSwissEph, Constants } from "./src/lib/sweph";
import { jdToDate } from "./src/lib/vedic-math";

async function run() {
  const eph = await getSwissEph();
  // 2026-06-06T00:05:00.000Z (5:35 AM IST - BEFORE SUNRISE)
  const jdT = eph.swe_julday(2026, 6, 6, 0.0 + 5/60, Constants.SE_GREG_CAL);
  const jdMid = eph.swe_julday(2026, 6, 6, 0.0, Constants.SE_GREG_CAL);
  
  const SE_BIT_DISC_CENTER = 256;
  const SE_BIT_NO_REFRACTION = 512;
  const srRsmi = Constants.SE_CALC_RISE | SE_BIT_DISC_CENTER | SE_BIT_NO_REFRACTION;
  const epheflg = Constants.SEFLG_MOSEPH;
  const geopos = [77.4126, 23.2599, 490]; // Bhopal
  
  const srTodayRes = eph.swe_rise_trans(jdMid, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0);
  const srToday = srTodayRes.tret;
  
  let srStart;
  if (jdT < srToday) {
    const jdPrev = jdMid - 1.0;
    srStart = eph.swe_rise_trans(jdPrev, Constants.SE_SUN, null, epheflg, srRsmi, geopos, 0, 0).tret;
  } else {
    srStart = srToday;
  }
  console.log("jdT:", jdToDate(jdT).toISOString());
  console.log("srToday:", jdToDate(srToday).toISOString());
  console.log("srStart:", jdToDate(srStart).toISOString());
}
run();
