const fs = require('fs');
const path = require('path');

const filePath = '/Users/sagarthakur/node_project/vedic-clock/src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The original Classic ClockTowerDial code
const classicClockTowerDial = `
// ── ClassicClockTowerDial Component (Previous Layout) ──────────────────────
function ClassicClockTowerDial({ decimalGhati, isLive, data, panchang, tzH, simple, wallTime }: {
  decimalGhati: number;
  isLive: boolean;
  data: any;
  panchang: any;
  tzH: number;
  simple?: { hours: number, minutes: number, seconds: number };
  wallTime: Date;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [isMuhurtaView, setIsMuhurtaView] = React.useState(true);
  const [hoveredGraha, setHoveredGraha] = React.useState<any>(null);
  const [activeRashiDetail, setActiveRashiDetail] = React.useState<number | null>(null);

  React.useEffect(() => { setMounted(true); }, []);

  const angle = (decimalGhati % 60) * 6;

  const GRAHAS_CONFIG: Record<string, { symbol: string, color: string }> = React.useMemo(() => ({
    "Venus": { symbol: "♀", color: "#f8fafc" },
    "Mercury": { symbol: "☿", color: "#4ade80" },
    "Mars": { symbol: "♂", color: "#f87171" },
    "Jupiter": { symbol: "♃", color: "#fbbf24" },
    "Saturn": { symbol: "♄", color: "#818cf8" }
  }), []);

  const grahas = React.useMemo(() => {
    if (!data?.planets) return [];
    const selected = data.planets.filter((p: any) => Object.keys(GRAHAS_CONFIG).includes(p.name));

    const mapped = selected.map((p: any) => {
      const angleDeg = p.longitude - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      return {
        ...p,
        angleDeg,
        angleRad,
        config: GRAHAS_CONFIG[p.name],
        radius: 153
      };
    });

    mapped.sort((a: any, b: any) => a.longitude - b.longitude);
    for (let i = 0; i < mapped.length; i++) {
      for (let j = i + 1; j < mapped.length; j++) {
        const diff = Math.abs(mapped[i].longitude - mapped[j].longitude);
        const shortestDiff = Math.min(diff, 360 - diff);
        if (shortestDiff < 5.5) {
          if (mapped[i].radius === 153) mapped[j].radius = 161;
          else if (mapped[i].radius === 161) mapped[j].radius = 145;
          else mapped[j].radius = 153;
        }
      }
    }
    return mapped;
  }, [data?.planets, GRAHAS_CONFIG]);

  if (!mounted || !data) {
    return (
      <div className="relative select-none" style={{ width: "100%", aspectRatio: "1" }}>
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <circle cx="200" cy="200" r="196" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="3" />
          <circle cx="200" cy="200" r="188" fill="rgba(6,5,10,0.92)" stroke="rgba(138,43,226,0.2)" strokeWidth="1" />
          <text x="200" y="200" textAnchor="middle" fill="#d4af37" fontSize="16" fontFamily="'Cinzel',serif">
            CALCULATING...
          </text>
        </svg>
      </div>
    );
  }

  const RASHIS_LIST = [
    { symbol: "♈", sanskrit: "मेष", name: "Mesha" },
    { symbol: "♉", sanskrit: "वृषभ", name: "Vrishabha" },
    { symbol: "♊", sanskrit: "मिथुन", name: "Mithuna" },
    { symbol: "♋", sanskrit: "कर्क", name: "Karka" },
    { symbol: "♌", sanskrit: "सिंह", name: "Simha" },
    { symbol: "♍", sanskrit: "कन्या", name: "Kanya" },
    { symbol: "♎", sanskrit: "तुला", name: "Tula" },
    { symbol: "♏", sanskrit: "वृश्चिक", name: "Vrishchika" },
    { symbol: "♐", sanskrit: "धनु", name: "Dhanu" },
    { symbol: "♑", sanskrit: "मकर", name: "Makara" },
    { symbol: "♒", sanskrit: "कुंभ", name: "Kumbha" },
    { symbol: "♓", sanskrit: "मीन", name: "Meena" },
  ];

  const NAKSHATRAS_LIST = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
    "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
    "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
    "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
    "Uttara Bhadrapada", "Revati"
  ];

  const currentRashiIndex = panchang ? panchang.suryaRashi.index : 0;
  const currentNakshatraIndex = panchang ? panchang.chandraRashi.index : 0;

  const fmt2 = (num: number) => String(num).padStart(2, "0");
  const ghatiVal = Math.floor(decimalGhati);
  const palaVal = Math.floor((decimalGhati - ghatiVal) * 60);
  const vipalaVal = Math.floor((((decimalGhati - ghatiVal) * 60) - palaVal) * 60);

  const ticks = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="relative select-none" style={{ width: "100%", aspectRatio: "1" }}>
      <style>{\`
        @keyframes pulseKashthaClassic {
          0% { opacity: 1; text-shadow: 0 0 8px rgba(212,175,55,0.8); }
          50% { opacity: 0.3; text-shadow: 0 0 2px rgba(212,175,55,0.3); }
          100% { opacity: 1; text-shadow: 0 0 8px rgba(212,175,55,0.8); }
        }
      \`}</style>
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
          <clipPath id="clockTowerClipClassic">
            <circle cx="200" cy="200" r="188" />
          </clipPath>
          <radialGradient id="dialGlowClassic" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(138,43,226,0.18)" />
            <stop offset="100%" stopColor="rgba(6,5,10,0)" />
          </radialGradient>
        </defs>

        {/* Outer Bezel rings */}
        <circle cx="200" cy="200" r="196" fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="4" />
        <circle cx="200" cy="200" r="188" fill="rgba(6,5,10,0.96)" stroke="rgba(138,43,226,0.25)" strokeWidth="1.5" />

        {/* Ambient background glow */}
        <circle cx="200" cy="200" r="188" fill="url(#dialGlowClassic)" />

        {/* Watermarked background image */}
        <image
          href="/vikramaditya.png"
          x="12"
          y="12"
          width="376"
          height="376"
          clipPath="url(#clockTowerClipClassic)"
          opacity="0.14"
          style={{ pointerEvents: "none" }}
        />

        {/* 1. Rashi Ring */}
        {RASHIS_LIST.map((r, i) => {
          const angleDeg = i * 30 - 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const rx = 200 + 168 * Math.cos(angleRad);
          const ry = 200 + 168 * Math.sin(angleRad);
          const isActive = i === currentRashiIndex;

          return (
            <g
              key={r.name}
              onClick={() => setActiveRashiDetail(activeRashiDetail === i ? null : i)}
              style={{ cursor: "pointer", pointerEvents: "all" }}
            >
              {isActive && (
                <>
                  <circle cx={rx} cy={ry} r="15" fill="rgba(212,175,55,0.07)" stroke="rgba(212,175,55,0.2)" strokeWidth="0.5" />
                  <circle cx={rx} cy={ry} r="2.5" fill="#d4af37" style={{ filter: "drop-shadow(0 0 3px #d4af37)" }} />
                </>
              )}
              <text
                x={rx}
                y={ry + (isActive ? -5 : -1)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? "#d4af37" : "rgba(255,255,255,0.3)"}
                fontSize={isActive ? "10" : "8"}
                fontWeight={isActive ? "800" : "500"}
                fontFamily="'Outfit', sans-serif"
              >
                {r.symbol}
              </text>
              <text
                x={rx}
                y={ry + 7}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? "#d4af37" : "rgba(255,255,255,0.16)"}
                fontSize="5.5"
                fontWeight={isActive ? "bold" : "normal"}
                fontFamily="'Cinzel', serif"
              >
                {r.sanskrit}
              </text>
            </g>
          );
        })}

        {/* Outer Ring separator */}
        <circle cx="200" cy="200" r="154" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="1" strokeDasharray="3,3" />

        {/* 1.5 NEW: Graha Ring (Radius ~153 staggered) */}
        {grahas.map((p: any) => {
          const gx = 200 + p.radius * Math.cos(p.angleRad);
          const gy = 200 + p.radius * Math.sin(p.angleRad);
          const rx = 200 + 168 * Math.cos(p.angleRad); 
          const ry = 200 + 168 * Math.sin(p.angleRad);
          const col = p.config.color;
          const isHovered = hoveredGraha?.name === p.name;

          return (
            <g
              key={p.name}
              onMouseEnter={() => setHoveredGraha(p)}
              onMouseLeave={() => setHoveredGraha(null)}
              style={{ cursor: "pointer", pointerEvents: "all" }}
            >
              <line x1={gx} y1={gy} x2={rx} y2={ry} stroke={col} strokeWidth="0.5" strokeOpacity="0.4" />
              <circle cx={gx} cy={gy} r={isHovered ? "9" : "7"} fill="rgba(6,5,10,0.85)" stroke={col} strokeWidth="1" style={{ filter: \`drop-shadow(0 0 \${isHovered ? '6px' : '3px'} \${col})\` }} />
              <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" fill={col} fontSize={isHovered ? "11" : "9"} fontWeight="bold">
                {p.config.symbol}
              </text>
            </g>
          );
        })}

        {/* 2. Nakshatra Ring (Radius ~144) */}
        {NAKSHATRAS_LIST.map((name, i) => {
          const angleDeg = i * (360 / 27) - 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const nx = 200 + 144 * Math.cos(angleRad);
          const ny = 200 + 144 * Math.sin(angleRad);
          const isActive = i === currentNakshatraIndex;

          return (
            <g key={name}>
              {isActive ? (
                <text
                  x={nx}
                  y={ny}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#d4af37"
                  fontSize="12"
                  fontWeight="bold"
                  style={{ filter: "drop-shadow(0 0 5px #d4af37)" }}
                >
                  ✦
                </text>
              ) : (
                <circle cx={nx} cy={ny} r="1.5" fill="rgba(212,175,55,0.2)" />
              )}
            </g>
          );
        })}

        {/* Middle Ring separator */}
        <circle cx="200" cy="200" r="134" fill="none" stroke="rgba(138,43,226,0.12)" strokeWidth="1" />

        {/* 3. Ghati Ticks & Numbers (Radius ~120 to 127) */}
        {ticks.map(i => {
          const ang = (i * 6 - 90) * Math.PI / 180;
          const isMajor = i % 5 === 0;
          const r1 = isMajor ? 116 : 121, r2 = 127;
          return (
            <line key={i}
              x1={200 + r1 * Math.cos(ang)} y1={200 + r1 * Math.sin(ang)}
              x2={200 + r2 * Math.cos(ang)} y2={200 + r2 * Math.sin(ang)}
              stroke={isMajor ? "rgba(212,175,55,0.65)" : "rgba(212,175,55,0.16)"}
              strokeWidth={isMajor ? 1.5 : 0.8}
            />
          );
        })}

        {/* Ghati numerals at 0,10,20,30,40,50 */}
        {[0, 10, 20, 30, 40, 50].map(i => {
          const ang = (i * 6 - 90) * Math.PI / 180;
          const r = 106;
          return (
            <text key={i} x={200 + r * Math.cos(ang)} y={200 + r * Math.sin(ang)}
              textAnchor="middle" dominantBaseline="central"
              fill="rgba(212,175,55,0.5)" fontSize="9.5" fontFamily="'Cinzel',serif" fontWeight="bold">
              {i}
            </text>
          );
        })}

        {/* 4. Active Progress Arc (Radius ~112) */}
        <circle cx="200" cy="200" r="112" fill="none" stroke="rgba(212,175,55,0.05)" strokeWidth="4" />
        {(() => {
          const pct = (decimalGhati % 60) / 60;
          const r = 112, circ = 2 * Math.PI * r;
          return (
            <circle cx="200" cy="200" r={r} fill="none"
              stroke="#d4af37" strokeWidth="2.5"
              strokeDasharray={\`\${pct * circ} \${circ}\`}
              strokeLinecap="round"
              transform="rotate(-90 200 200)"
              style={{ filter: "drop-shadow(0 0 3.5px rgba(212,175,55,0.45))" }}
            />
          );
        })()}

        {/* ── CENTRAL DIGITAL DATA ── */}
        {wallTime && (
          <text x="70" y="70" fill="white" fontSize="10" fontFamily="'Outfit',sans-serif" fontWeight="bold">
            {fmt2(wallTime.getHours() % 12 || 12)}:{fmt2(wallTime.getMinutes())} {wallTime.getHours() >= 12 ? "PM" : "AM"}
          </text>
        )}
        {wallTime && (
          <text x="330" y="70" fill="white" fontSize="9" fontFamily="'Outfit',sans-serif" fontWeight="bold" textAnchor="end">
            {wallTime.getDate()} {["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"][wallTime.getMonth()]} {wallTime.getFullYear()}
          </text>
        )}

        {panchang && (
          <>
            <g transform="translate(200, 80)">
              <text y="-5" textAnchor="middle" fill="#d4af37" fontSize="16" fontFamily="'Cinzel',serif" fontWeight="bold">
                {RASHIS_LIST[panchang.suryaRashi.index]?.symbol}
              </text>
              <text y="8" textAnchor="middle" fill="white" fontSize="10" fontFamily="'Outfit',sans-serif" fontWeight="bold">
                सूर्य — {panchang.suryaRashi.sanskrit}
              </text>
            </g>

            <g transform="translate(184, 105)">
              <MoonPhaseSvg degreeDiff={panchang.raw.degreeDiff} />
            </g>

            <text x="200" y="160" textAnchor="middle" fill="#fbbf24" fontSize="16" fontWeight="bold" fontFamily="'Cinzel',serif" letterSpacing="0.05em">
              {panchang.muhurta.sanskrit}
            </text>

            <g transform="translate(110, 200)">
              <text x="0" y="-8" textAnchor="middle" fill="rgba(212,175,55,0.7)" fontSize="9" fontWeight="bold" fontFamily="'Outfit',sans-serif">
                चंद्र
              </text>
              <text x="0" y="5" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="'Cinzel',serif">
                {panchang.chandraRashi.sanskrit}
              </text>
            </g>

            <g transform="translate(290, 200)">
              <text x="0" y="-8" textAnchor="middle" fill="rgba(212,175,55,0.7)" fontSize="9" fontWeight="bold" fontFamily="'Outfit',sans-serif">
                करण
              </text>
              <text x="0" y="5" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="'Cinzel',serif">
                {panchang.karana.sanskrit}
              </text>
            </g>

            <g transform="translate(200, 240)">
              <rect x="-85" y="-20" width="170" height="40" rx="6" fill="rgba(0,0,0,0.6)" stroke="rgba(212,175,55,0.2)" strokeWidth="1" />
              <text x="0" y="5" textAnchor="middle" fill="#d4af37" fontSize="24" fontWeight="800" fontFamily="'Cinzel',serif" style={{ filter: "drop-shadow(0 0 6px rgba(212,175,55,0.5))" }}>
                {String(simple?.hours ?? panchang.vedicTime.muhurta).padStart(2, '0')}
                <tspan fill="rgba(212,175,55,0.5)" style={{ animation: isLive ? \`pulseKashthaClassic \${data.vedicTime.kashthaLenSec}s infinite\` : "none" }}> : </tspan>
                {String(simple?.minutes ?? panchang.vedicTime.kaal).padStart(2, '0')}
                <tspan fill="rgba(212,175,55,0.5)" style={{ animation: isLive ? \`pulseKashthaClassic \${data.vedicTime.kashthaLenSec}s infinite\` : "none" }}> : </tspan>
                {String(simple?.seconds ?? panchang.vedicTime.kashtha).padStart(2, '0')}
              </text>
              <text x="0" y="32" textAnchor="middle" fill="rgba(212,175,55,0.6)" fontSize="8" fontWeight="bold" letterSpacing="0.1em">
                मुहूर्त | कला | काष्ठा
              </text>
            </g>

            <text x="200" y="285" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="'Cinzel',serif">
              {panchang.masa.sanskrit} | {panchang.paksha.sanskrit} पक्ष | {panchang.tithi.sanskrit}
            </text>

            <text x="90" y="325" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="'Outfit',sans-serif">
              {panchang.vaar.sanskrit}
            </text>

            <text x="200" y="325" textAnchor="middle" fill="rgba(212,175,55,0.8)" fontSize="11" fontWeight="bold" fontFamily="'Outfit',sans-serif">
              {panchang.vikramSamvat} विक्रम संवत
            </text>

            <text x="310" y="325" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="'Outfit',sans-serif">
              भोपाल
            </text>
          </>
        )}

        <g transform={\`rotate(\${angle} 200 200)\`}
          style={{ transition: isLive ? "transform 0.4s linear" : "transform 0.8s ease" }}>
          <line x1="200" y1="200" x2="200" y2="88"
            stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px #d4af37)" }} />
          <polygon points="200,76 195,90 205,90" fill="#d4af37" style={{ filter: "drop-shadow(0 0 4px #d4af37)" }} />
          <line x1="200" y1="200" x2="200" y2="226"
            stroke="rgba(212,175,55,0.4)" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        <circle cx="200" cy="200" r="6" fill="#d4af37" style={{ filter: "drop-shadow(0 0 4px #d4af37)" }} />
        <circle cx="200" cy="200" r="2.5" fill="#06050a" />

      </svg>
    </div>
  );
}
`;

// Rename existing ClockTowerDial to PremiumClockTowerDial
content = content.replace('function ClockTowerDial({', 'function PremiumClockTowerDial({');

// Insert ClassicClockTowerDial right above PremiumClockTowerDial
content = content.replace('function PremiumClockTowerDial({', classicClockTowerDial + '\n// ── PremiumClockTowerDial Component (New Layout) ───────────────────────\nfunction PremiumClockTowerDial({');

// Add clockTheme state to Home
content = content.replace(
  'const [activeView, setActiveView] = useState<"clock_tower" | "app">("clock_tower");',
  'const [activeView, setActiveView] = useState<"clock_tower" | "app">("clock_tower");\n  const [clockTheme, setClockTheme] = useState<"premium" | "classic">("premium");'
);

// Add Theme Switcher in the UI
const viewSwitcherCode = `      {/* ── View Switcher Tab Bar ────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", zIndex: 10 }}>
        <div style={{
          display: "flex",
          background: "rgba(13, 11, 22, 0.8)",
          border: "1px solid rgba(212, 175, 55, 0.25)",
          borderRadius: "12px",
          padding: "4px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)"
        }}>
          <button
            onClick={() => setActiveView("clock_tower")}
            style={{
              padding: "6px 18px",
              borderRadius: "8px",
              fontSize: "10px",
              fontWeight: 700,
              background: activeView === "clock_tower" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeView === "clock_tower" ? "#d4af37" : "#a1a1aa",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.08em"
            }}
          >
            🏰 Clock Tower
          </button>
          <button
            onClick={() => setActiveView("app")}
            style={{
              padding: "6px 18px",
              borderRadius: "8px",
              fontSize: "10px",
              fontWeight: 700,
              background: activeView === "app" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeView === "app" ? "#d4af37" : "#a1a1aa",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.08em"
            }}
          >
            📱 App Dashboard
          </button>
        </div>
      </div>`;

const updatedViewSwitcher = `      {/* ── View Switcher Tab Bar ────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", zIndex: 10, gap: "12px" }}>
        <div style={{
          display: "flex",
          background: "rgba(13, 11, 22, 0.8)",
          border: "1px solid rgba(212, 175, 55, 0.25)",
          borderRadius: "12px",
          padding: "4px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)"
        }}>
          <button
            onClick={() => setActiveView("clock_tower")}
            style={{
              padding: "6px 18px",
              borderRadius: "8px",
              fontSize: "10px",
              fontWeight: 700,
              background: activeView === "clock_tower" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeView === "clock_tower" ? "#d4af37" : "#a1a1aa",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.08em"
            }}
          >
            🏰 Clock Tower
          </button>
          <button
            onClick={() => setActiveView("app")}
            style={{
              padding: "6px 18px",
              borderRadius: "8px",
              fontSize: "10px",
              fontWeight: 700,
              background: activeView === "app" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeView === "app" ? "#d4af37" : "#a1a1aa",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.08em"
            }}
          >
            📱 App Dashboard
          </button>
        </div>
        
        {activeView === "clock_tower" && (
          <div style={{
            display: "flex",
            background: "rgba(13, 11, 22, 0.8)",
            border: "1px solid rgba(138, 43, 226, 0.25)",
            borderRadius: "12px",
            padding: "4px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)"
          }}>
            <button
              onClick={() => setClockTheme("premium")}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "10px",
                fontWeight: 700,
                background: clockTheme === "premium" ? "rgba(138, 43, 226, 0.2)" : "transparent",
                color: clockTheme === "premium" ? "#c4b5fd" : "#a1a1aa",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Premium Theme
            </button>
            <button
              onClick={() => setClockTheme("classic")}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "10px",
                fontWeight: 700,
                background: clockTheme === "classic" ? "rgba(138, 43, 226, 0.2)" : "transparent",
                color: clockTheme === "classic" ? "#c4b5fd" : "#a1a1aa",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Classic Theme
            </button>
          </div>
        )}
      </div>`;

content = content.replace(viewSwitcherCode, updatedViewSwitcher);

const clockRenderCode = '<PremiumClockTowerDial decimalGhati={vt.decimalGhati} isLive={isLive} data={data} panchang={panchang} tzH={tzH} simple={vt.simple} wallTime={wallTime} />';
const replacedClockRenderCode = `
              {clockTheme === "premium" ? (
                <PremiumClockTowerDial decimalGhati={vt.decimalGhati} isLive={isLive} data={data} panchang={panchang} tzH={tzH} simple={vt.simple} wallTime={wallTime} />
              ) : (
                <ClassicClockTowerDial decimalGhati={vt.decimalGhati} isLive={isLive} data={data} panchang={panchang} tzH={tzH} simple={vt.simple} wallTime={wallTime} />
              )}
`;

content = content.replace(clockRenderCode, replacedClockRenderCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Added theme toggler and classic layout successfully.");
