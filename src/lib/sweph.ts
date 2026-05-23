import { load, Constants } from "@fusionstrings/swiss-eph";
import fs from "fs";
import path from "path";

// Cached promise to avoid loading WASM multiple times
let cachedEphPromise: Promise<any> | null = null;

export async function getSwissEph() {
  if (!cachedEphPromise) {
    cachedEphPromise = (async () => {
      try {
        // Resolve the WASM path from node_modules dynamically
        const wasmPath = path.join(
          process.cwd(),
          "node_modules/@fusionstrings/swiss-eph/wasm/swiss_eph.wasm"
        );
        const wasmBytes = new Uint8Array(fs.readFileSync(wasmPath));
        const eph = await load({ wasmSource: wasmBytes });
        
        // Initialize the sidereal Lahiri mode globally on load
        eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);
        
        return eph;
      } catch (error) {
        console.error("Failed to load Swiss Ephemeris WASM:", error);
        throw error;
      }
    })();
  }
  return cachedEphPromise;
}

export { Constants };
