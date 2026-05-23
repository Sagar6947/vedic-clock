const { load, Constants } = require('@fusionstrings/swiss-eph');
const fs = require('fs');
const path = require('path');

async function main() {
  const wasmPath = path.join(__dirname, '../node_modules/@fusionstrings/swiss-eph/wasm/swiss_eph.wasm');
  const wasmBytes = new Uint8Array(fs.readFileSync(wasmPath));
  const eph = await load({ wasmSource: wasmBytes });

  // भोपाल Coordinates
  const lat = 23.2599;
  const lon = 77.4126;
  
  // Date: May 23, 2026 12:00 UTC
  const jd = eph.swe_julday(2026, 5, 23, 12.0, Constants.SE_GREG_CAL);
  
  // Set Lahiri Mode
  eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);
  
  console.log("Calculating Ascendant (Lagna) using swe_houses_ex2...");
  const flags = Constants.SEFLG_SIDEREAL;
  const hsys = 'P'.charCodeAt(0); // Placidus (80)
  
  const houseResult = eph.swe_houses_ex2(
    jd,
    flags,
    lat,
    lon,
    hsys
  );
  
  console.log("House Result Keys:", Object.keys(houseResult));
  console.log("Ascendant (Lagna) Longitude:", houseResult.ascmc[0]);
  console.log("MC Longitude:", houseResult.ascmc[1]);
  console.log("First Cusp (Alternative Ascendant):", houseResult.cusps[1]); // cusps is 1-indexed, size 13
}

main().catch(console.error);
