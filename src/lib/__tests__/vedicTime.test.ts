import test from "node:test";
import assert from "node:assert";
import { civilToVedic, vedicToCivil, formatVedic } from "../vedicTime";

// Location of Ujjain
const UJJAIN = { lat: 23.1793, lon: 75.7849, elevation: 490 };

// Location of Bhopal for acceptance tests
const BHOPAL = { lat: 23.2599, lon: 77.4126, elevation: 527 };

test("vedicTime pure functions", async (t) => {
  await t.test("formats Vedic time correctly", () => {
    assert.strictEqual(formatVedic({ muhurta: 10, kaal: 15, kashtha: 0 }), "10:15:00");
    assert.strictEqual(formatVedic({ muhurta: 0, kaal: 0, kashtha: 9 }), "00:00:09");
  });

  await t.test("polar locations use uniform fallback", async () => {
    // Somewhere near the North Pole during winter where the sun does not rise
    const polarNight = new Date("2026-12-21T12:00:00.000Z");
    const polarLocation = { lat: 85.0, lon: 0.0 };

    const result = await civilToVedic(polarNight, polarLocation);
    assert.strictEqual(result.model, "uniform-fallback");
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

      const v = await civilToVedic(testDate, location);
      assert.ok(v.muhurtaLenSec > 0);

      const recoveredDate = await vedicToCivil(v, testDate, location);
      
      // Must match within 1 kashtha (~3.6s max for daytime summer)
      const diffMs = Math.abs(testDate.getTime() - recoveredDate.getTime());
      assert.ok(diffMs <= 4000, `Diff too large: ${diffMs}ms for ${testDate.toISOString()}`);
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

test("Bhopal Acceptance Tests (Seasonal Model)", async (t) => {
  const tests = [
    { date: "2026-06-06T09:43:00+05:30", expected: "04:18:09", note: "daytime" },
    { date: "2026-06-06T11:02:00+05:30", expected: "06:02:06", note: "daytime" },
    { date: "2026-06-06T19:04:16+05:30", expected: "15:00:00", note: "exact sunset → must be 15:00:00" },
    { date: "2026-06-06T22:12:00+05:30", expected: "19:14:06", note: "nighttime" },
    { date: "2026-06-07T05:33:51+05:30", expected: "00:00:00", note: "sunrise reset" },
    { date: "2026-06-07T05:55:00+05:30", expected: "00:11:22", note: "daytime, just after sunrise" },
    { date: "2026-06-07T06:02:00+05:30", expected: "00:15:19", note: "daytime" },
    { date: "2026-06-07T11:03:30+05:30", expected: "06:02:29", note: "daytime" },
  ];

  for (const { date, expected, note } of tests) {
    await t.test(`Computes ${expected} at ${date} (${note})`, async () => {
      const utcDate = new Date(date);
      const v = await civilToVedic(utcDate, BHOPAL);
      
      const [expM, expK, expKas] = expected.split(":").map(Number);
      const expectedTotalKashtha = expM * 900 + expK * 30 + expKas;
      const actualTotalKashtha = v.muhurta * 900 + v.kaal * 30 + v.kashtha;

      // Tolerance of ±4 kashtha (approx 12s)
      const diff = Math.abs(actualTotalKashtha - expectedTotalKashtha);
      const isWithinTolerance = diff <= 4;

      if (!isWithinTolerance) {
        throw new Error(`Expected ${expected} but got ${formatVedic(v)} (diff: ${diff} kashtha)`);
      }
      assert.ok(true);
    });
  }
});
