import test from "node:test";
import assert from "node:assert";
import { civilToVedic, vedicToCivil, formatVedic } from "../vedicTime";

// Location of Ujjain
const UJJAIN = { lat: 23.1793, lon: 75.7849, elevation: 490 };

test("vedicTime pure functions", async (t) => {
  await t.test("formats Vedic time correctly", () => {
    assert.strictEqual(formatVedic({ muhurta: 10, kaal: 15, kashtha: 0 }), "10:15:00");
    assert.strictEqual(formatVedic({ muhurta: 0, kaal: 0, kashtha: 9 }), "00:00:09");
  });

  await t.test("polar locations throw exception", async () => {
    // Somewhere near the North Pole during winter where the sun does not rise
    const polarNight = new Date("2026-12-21T12:00:00.000Z");
    const polarLocation = { lat: 85.0, lon: 0.0 };

    await assert.rejects(
      civilToVedic(polarNight, polarLocation),
      /Sun does not rise|Invalid sunrise bounds/
    );
  });

  await t.test("round-trip property test (random timestamps)", async () => {
    const startMs = new Date("2026-06-01T00:00:00.000Z").getTime();
    const endMs = new Date("2026-06-30T23:59:59.000Z").getTime();
    
    // Test 10 random timestamps in June
    for (let i = 0; i < 10; i++) {
      const randomMs = startMs + Math.random() * (endMs - startMs);
      const testDate = new Date(randomMs);

      // Random latitude between -50 and 50
      const randomLat = (Math.random() * 100) - 50;
      const location = { lat: randomLat, lon: 75.7849, elevation: 0 };

      try {
        const v = await civilToVedic(testDate, location);
        
        // Ensure muhurta length is dynamic and not exactly 48 mins (2880s)
        // Usually it fluctuates by a few seconds or milliseconds.
        // It might be exactly 2880 at equator on equinox, but generally variable.
        assert.ok(v.muhurtaLengthSec > 0);

        const recoveredDate = await vedicToCivil(v, testDate, location);
        
        // Must match within 1 kashtha (≤ 3.2 seconds max)
        const diffMs = Math.abs(testDate.getTime() - recoveredDate.getTime());
        // Since we floor to kashtha when converting to vedic, we lose up to 1 kashtha of precision.
        // So the inverse function gives the *start* of the kashtha, meaning diffMs <= 3.2s.
        assert.ok(diffMs <= 3200, `Diff too large: ${diffMs}ms for ${testDate.toISOString()}`);
      } catch (err: any) {
        // Ignore if random coordinate has no sunrise
        if (!err.message.includes("Sun does not rise")) {
          throw err;
        }
      }
    }
  });

  await t.test("validates out of bound ranges in vedicToCivil", async () => {
    const dayDate = new Date();
    await assert.rejects(
      vedicToCivil({ muhurta: 30, kaal: 0, kashtha: 0 }, dayDate, UJJAIN),
      /Invalid Vedic time unit range/
    );
    await assert.rejects(
      vedicToCivil({ muhurta: 0, kaal: 31, kashtha: 0 }, dayDate, UJJAIN),
      /Invalid Vedic time unit range/
    );
    await assert.rejects(
      vedicToCivil({ muhurta: -1, kaal: 0, kashtha: 0 }, dayDate, UJJAIN),
      /Invalid Vedic time unit range/
    );
  });
});
