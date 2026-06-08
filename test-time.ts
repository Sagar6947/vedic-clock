const srMs = new Date("2026-06-06T00:07:39.743Z").getTime();
const target = new Date("2026-06-06T13:41:00.000Z"); // 7:11 PM IST
const elapsedMs = target.getTime() - srMs;
const elapsedSeconds = Math.max(0, elapsedMs / 1000);
const simpleHours = Math.floor(elapsedSeconds / 2880);
const simpleRemAfterHours = elapsedSeconds % 2880;
const simpleMinutes = Math.floor(simpleRemAfterHours / 96);
const simpleRemAfterMinutes = simpleRemAfterHours % 96;
const simpleSeconds = Math.floor(simpleRemAfterMinutes / 3.2);

console.log(`${simpleHours}:${simpleMinutes}:${simpleSeconds}`);
