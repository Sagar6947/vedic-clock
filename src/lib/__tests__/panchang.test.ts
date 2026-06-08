import test from "node:test";
import assert from "node:assert";
import { getFullPanchang } from "../panchang";
import { MUHURTA_NAMES } from "../muhurtaNames";

test("Vedic Clock Panchang Golden Test", async (t) => {
  await t.test("MUHURTA_NAMES[6] is विश्वेदेवा", () => {
    assert.strictEqual(MUHURTA_NAMES[6].sanskrit, "विश्वेदेवा");
  });

  await t.test("Bhopal Golden Test for 2025-09-01T11:10:00+05:30", async () => {
    const testDate = new Date("2025-09-01T11:10:00+05:30");
    const bhopal = { lat: 23.2547, lon: 77.4029, elevation: 0 };
    
    const p = await getFullPanchang(testDate, bhopal, 547.5);
    
    // Ensure calibration parameters are surfaced
    assert.ok(p.sunriseUsed);
    assert.ok(p.sunriseSource);

    // Target values
    assert.strictEqual(p.vedicTime.formatted, "06:02:13");
    assert.strictEqual(p.muhurta.sanskrit, "विश्वेदेवा");
    assert.strictEqual(p.suryaRashi.sanskrit, "सिंह");
    assert.strictEqual(p.chandraRashi.sanskrit, "वृश्चिक");
    assert.strictEqual(p.tithi.sanskrit, "नवमी");
    assert.strictEqual(p.paksha.sanskrit, "शुक्ल");
    assert.strictEqual(p.karana.sanskrit, "बालव");
    assert.strictEqual(p.masa.sanskrit, "भाद्रपद");
    assert.strictEqual(p.vaar.sanskrit, "सोमवार");
    assert.strictEqual(p.vikramSamvat, 2082);
  });
});
