const fs = require('fs');
const path = require('path');

const filePath = '/Users/sagarthakur/node_project/vedic-clock/src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '// ── ClockTowerDial Component for Clock Tower View ────────────────────────────';
const endMarker = '// ─────────────────────────────────────────────────────────────────────────────\n// Main page';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const replacement = `// ── ClockTowerDial Component for Clock Tower View ────────────────────────────
function ClockTowerDial({ decimalGhati, isLive, data, panchang, tzH, simple, wallTime }: {
  decimalGhati: number;
  isLive: boolean;
  data: any;
  panchang: any;
  tzH: number;
  simple?: { hours: number, minutes: number, seconds: number };
  wallTime: Date;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  if (!mounted || !data) {
    return (
      <div className="relative select-none" style={{ width: "100%", aspectRatio: "1" }}>
        <svg viewBox="0 0 1000 1000" className="w-full h-full">
          <circle cx="500" cy="500" r="490" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="3" />
          <circle cx="500" cy="500" r="480" fill="rgba(6,5,10,0.92)" stroke="rgba(138,43,226,0.2)" strokeWidth="1" />
          <text x="500" y="500" textAnchor="middle" fill="#d4af37" fontSize="24" fontFamily="'Cinzel',serif">
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

  const fmt2 = (num: number) => String(num).padStart(2, "0");

  const legibilityStyle = { paintOrder: "stroke", stroke: "rgba(0,0,0,0.85)", strokeWidth: "6px" };

  return (
    <div className="relative select-none" style={{ width: "100%", aspectRatio: "1" }}>
      <style>{\`
        @keyframes pulseKashtha {
          0% { opacity: 1; text-shadow: 0 0 15px rgba(212,175,55,0.9); }
          50% { opacity: 0.4; text-shadow: 0 0 5px rgba(212,175,55,0.4); }
          100% { opacity: 1; text-shadow: 0 0 15px rgba(212,175,55,0.9); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinSlowRev {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      \`}</style>
      <svg viewBox="0 0 1000 1000" className="w-full h-full">
        <defs>
          <clipPath id="clockTowerClip">
            <circle cx="500" cy="500" r="490" />
          </clipPath>
          <radialGradient id="dialGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(138,43,226,0.18)" />
            <stop offset="100%" stopColor="rgba(6,5,10,0)" />
          </radialGradient>
          <path id="topTitleArch" d="M 150 250 A 430 430 0 0 1 850 250" fill="none" />
        </defs>

        {/* Background Setup */}
        <circle cx="500" cy="500" r="490" fill="#0B0C10" />
        <image
          href="/ancient_mandala_bg.png"
          x="0"
          y="0"
          width="1000"
          height="1000"
          clipPath="url(#clockTowerClip)"
          opacity="0.85"
          style={{ pointerEvents: "none", filter: "contrast(1.2) brightness(0.9)" }}
        />
        <circle cx="500" cy="500" r="490" fill="rgba(0,0,0,0.4)" style={{ pointerEvents: "none" }} />
        
        {/* Outer Glowing Bezel */}
        <circle cx="500" cy="500" r="495" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="10" style={{ filter: "drop-shadow(0 0 15px rgba(212,175,55,0.5))" }} />
        <circle cx="500" cy="500" r="485" fill="none" stroke="rgba(212,175,55,0.8)" strokeWidth="4" />
        <circle cx="500" cy="500" r="475" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="2" strokeDasharray="10, 5" />

        {/* Top Corners: Gregorian Time and Date */}
        {wallTime && (
          <>
            <text x="140" y="100" fill="white" fontSize="28" fontFamily="'Outfit',sans-serif" fontWeight="bold" style={{ ...legibilityStyle, filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8))" }}>
              {fmt2(wallTime.getHours() % 12 || 12)}:{fmt2(wallTime.getMinutes())} {wallTime.getHours() >= 12 ? "PM" : "AM"}
            </text>
            <text x="860" y="100" fill="white" fontSize="26" fontFamily="'Outfit',sans-serif" fontWeight="bold" textAnchor="end" style={{ ...legibilityStyle, filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8))" }}>
              {wallTime.getDate()} {["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"][wallTime.getMonth()]} {wallTime.getFullYear()}
            </text>
          </>
        )}

        {/* Main Title Arch */}
        <text fill="#d4af37" fontSize="56" fontWeight="900" fontFamily="'Cinzel',serif" letterSpacing="0.1em" style={{ ...legibilityStyle, filter: "drop-shadow(0 0 12px rgba(212,175,55,0.8))" }}>
          <textPath href="#topTitleArch" startOffset="50%" textAnchor="middle">
            विक्रमादित्य वैदिक घड़ी
          </textPath>
        </text>

        {panchang && (
          <>
            {/* Top Center: Surya Rashi Badge */}
            <g transform="translate(500, 200)">
              <circle cx="0" cy="0" r="60" fill="rgba(10,25,60,0.95)" stroke="#d4af37" strokeWidth="3" style={{ filter: "drop-shadow(0 0 20px rgba(0,150,255,0.6))" }} />
              <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1" strokeDasharray="4, 4" />
              <text y="-5" textAnchor="middle" fill="#d4af37" fontSize="50" fontFamily="'Cinzel',serif" fontWeight="bold">
                {RASHIS_LIST[panchang.suryaRashi.index]?.symbol}
              </text>
              <text y="30" textAnchor="middle" fill="white" fontSize="22" fontFamily="'Outfit',sans-serif" fontWeight="bold" style={{ ...legibilityStyle, filter: "drop-shadow(0 0 5px white)" }}>
                {panchang.suryaRashi.sanskrit}
              </text>
            </g>

            {/* Nakshatra text below Rashi */}
            <g transform="translate(500, 310)">
              <path d="M -120 0 L 0 -20 L 120 0 L 0 20 Z" fill="rgba(0,0,0,0.7)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.4))" }}/>
              <text y="8" textAnchor="middle" fill="#ffd700" fontSize="26" fontFamily="'Cinzel',serif" fontWeight="bold" letterSpacing="0.15em" style={legibilityStyle}>
                {data?.panchang?.nakshatra?.name || "Loading"}
              </text>
            </g>

            {/* Moon Phases Arch */}
            <g transform="translate(500, 480)">
              {[-3, -2, -1, 0, 1, 2, 3].map((idx) => {
                const px = Math.sin(idx * 0.3) * 280;
                const py = -Math.cos(idx * 0.3) * 100 - 40; 
                const isCenter = idx === 0;
                const size = isCenter ? 3.0 : 1.8 - Math.abs(idx)*0.15;
                return (
                  <g key={idx} transform={\`translate(\${px}, \${py}) scale(\${size})\`}>
                    <MoonPhaseSvg degreeDiff={(panchang.raw.degreeDiff + idx*15 + 360)%360} />
                  </g>
                );
              })}
            </g>

            {/* Tithi name & deity above huge numbers */}
            <g transform="translate(500, 460)">
               <text y="-25" textAnchor="middle" fill="white" fontSize="36" fontFamily="'Cinzel',serif" fontWeight="bold" style={{ ...legibilityStyle, filter: "drop-shadow(0 0 12px white)" }}>
                 {panchang.tithi.sanskrit}
               </text>
               <text y="8" textAnchor="middle" fill="#fbbf24" fontSize="24" fontFamily="'Outfit',sans-serif" fontWeight="bold" letterSpacing="0.1em" style={legibilityStyle}>
                 {data?.panchang?.tithi?.name || ""}
               </text>
            </g>

            {/* Left Badge: Chandra Rashi */}
            <g transform="translate(220, 600)">
              <circle cx="0" cy="0" r="75" fill="rgba(6,10,25,0.95)" stroke="rgba(0,150,255,0.6)" strokeWidth="3" style={{ filter: "drop-shadow(0 0 20px rgba(0,100,255,0.5))" }} />
              <text y="-10" textAnchor="middle" fill="white" fontSize="34" fontFamily="'Cinzel',serif" fontWeight="bold" style={{ ...legibilityStyle, filter: "drop-shadow(0 0 8px white)" }}>
                {panchang.chandraRashi.sanskrit}
              </text>
              <path d="M -45 15 L 45 15" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />
              <text y="40" textAnchor="middle" fill="#d4af37" fontSize="24" fontFamily="'Outfit',sans-serif" fontWeight="bold" style={legibilityStyle}>
                चंद्र
              </text>
            </g>

            {/* Right Badge: Karana */}
            <g transform="translate(780, 600)">
              <circle cx="0" cy="0" r="75" fill="rgba(6,10,25,0.95)" stroke="rgba(0,150,255,0.6)" strokeWidth="3" style={{ filter: "drop-shadow(0 0 20px rgba(0,100,255,0.5))" }} />
              <text y="-10" textAnchor="middle" fill="white" fontSize="34" fontFamily="'Cinzel',serif" fontWeight="bold" style={{ ...legibilityStyle, filter: "drop-shadow(0 0 8px white)" }}>
                {panchang.karana.sanskrit}
              </text>
              <path d="M -45 15 L 45 15" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />
              <text y="40" textAnchor="middle" fill="#d4af37" fontSize="24" fontFamily="'Outfit',sans-serif" fontWeight="bold" style={legibilityStyle}>
                करण
              </text>
            </g>

            {/* Center Enormous Vedic Time Display */}
            <g transform="translate(500, 620)">
              {/* Strong bounding box for glowing numbers */}
              <rect x="-240" y="-70" width="480" height="120" rx="20" fill="rgba(0,0,0,0.85)" stroke="rgba(212,175,55,0.6)" strokeWidth="3" style={{ filter: "drop-shadow(0 0 20px rgba(212,175,55,0.3))" }} />
              <text x="0" y="20" textAnchor="middle" fill="white" fontSize="90" fontWeight="900" fontFamily="'Outfit',sans-serif" style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.8))" }}>
                {String(simple?.hours ?? panchang.vedicTime.muhurta).padStart(2, '0')}
                <tspan fill="#d4af37" style={{ animation: isLive ? \`pulseKashtha \${data.vedicTime.kashthaLenSec}s infinite\` : "none" }}> : </tspan>
                {String(simple?.minutes ?? panchang.vedicTime.kaal).padStart(2, '0')}
                <tspan fill="#d4af37" style={{ animation: isLive ? \`pulseKashtha \${data.vedicTime.kashthaLenSec}s infinite\` : "none" }}> : </tspan>
                {String(simple?.seconds ?? panchang.vedicTime.kashtha).padStart(2, '0')}
              </text>
              {/* Labels under numbers */}
              <g transform="translate(0, 85)">
                <text x="-140" y="0" textAnchor="middle" fill="#ffd700" fontSize="24" fontWeight="bold" letterSpacing="0.05em" style={legibilityStyle}>मुहूर्त</text>
                <text x="0" y="0" textAnchor="middle" fill="#ffd700" fontSize="24" fontWeight="bold" letterSpacing="0.05em" style={legibilityStyle}>कला</text>
                <text x="140" y="0" textAnchor="middle" fill="#ffd700" fontSize="24" fontWeight="bold" letterSpacing="0.05em" style={legibilityStyle}>काष्ठा</text>
                <path d="M -90 -8 L -50 -8" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />
                <path d="M 50 -8 L 90 -8" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />
              </g>
            </g>

            {/* Masa | Paksha | Tithi curved bar below the numbers */}
            <g transform="translate(500, 780)">
               <rect x="-260" y="2" width="520" height="38" rx="8" fill="rgba(0,0,0,0.6)" />
               <path d="M -240 0 L 240 0" stroke="rgba(212,175,55,0.6)" strokeWidth="2" />
               <text x="0" y="30" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="'Cinzel',serif" letterSpacing="0.1em" style={legibilityStyle}>
                 {panchang.masa.sanskrit} | {panchang.paksha.sanskrit} पक्ष | {panchang.tithi.sanskrit}
               </text>
               <path d="M -240 45 L 240 45" stroke="rgba(212,175,55,0.6)" strokeWidth="2" />
            </g>

            {/* Bottom Left: Vaar */}
            <g transform="translate(200, 850)">
              <text x="0" y="0" textAnchor="middle" fill="#60a5fa" fontSize="38" fontWeight="bold" fontFamily="'Outfit',sans-serif" style={{ ...legibilityStyle, filter: "drop-shadow(0 0 15px rgba(96,165,250,0.8))" }}>
                {panchang.vaar.sanskrit}
              </text>
            </g>

            {/* Bottom Right: Location */}
            <g transform="translate(800, 850)">
              <text x="0" y="0" textAnchor="middle" fill="#60a5fa" fontSize="38" fontWeight="bold" fontFamily="'Outfit',sans-serif" style={{ ...legibilityStyle, filter: "drop-shadow(0 0 15px rgba(96,165,250,0.8))" }}>
                भोपाल
              </text>
            </g>

            {/* Bottom Center: Vikram Samvat Badge */}
            <g transform="translate(500, 890)">
               <path d="M -160 -30 L 160 -30 L 180 0 L 160 30 L -160 30 L -180 0 Z" fill="rgba(0,0,0,0.85)" stroke="rgba(212,175,55,0.8)" strokeWidth="2" style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.4))" }}/>
               <text x="0" y="10" textAnchor="middle" fill="#ffd700" fontSize="28" fontWeight="bold" fontFamily="'Cinzel',serif" letterSpacing="0.05em" style={legibilityStyle}>
                 वि. {panchang.vikramSamvat} सं.
               </text>
            </g>
          </>
        )}

        {/* Concentric Decorative Arcs/Rings to give depth */}
        <circle cx="500" cy="500" r="390" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="2" strokeDasharray="15, 10" />
        <circle cx="500" cy="500" r="280" fill="none" stroke="rgba(0,150,255,0.15)" strokeWidth="4" strokeDasharray="30, 15" />
        <circle cx="500" cy="500" r="230" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" strokeDasharray="5, 5" />
        
        {/* Optional spinning astrolabe rings if we want some motion */}
        <g transform="translate(500, 500)">
          <g style={{ animation: "spinSlow 120s linear infinite" }}>
            <circle cx="0" cy="0" r="430" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2" strokeDasharray="4, 12" />
          </g>
          <g style={{ animation: "spinSlowRev 90s linear infinite" }}>
            <circle cx="0" cy="0" r="460" fill="none" stroke="rgba(0,150,255,0.1)" strokeWidth="2" strokeDasharray="6, 10" />
          </g>
        </g>

      </svg>
    </div>
  );
}

function MoonPhaseSvg({ degreeDiff }: { degreeDiff: number }) {
  const isWaxing = degreeDiff < 180;
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1" />
      <circle cx="12" cy="12" r="8" fill="rgba(255,255,255,0.15)" />
      {degreeDiff >= 170 && degreeDiff <= 190 ? (
        <circle cx="12" cy="12" r="8" fill="#ffffff" style={{ filter: "drop-shadow(0 0 6px #ffffff)" }} />
      ) : degreeDiff < 10 || degreeDiff > 350 ? (
        <circle cx="12" cy="12" r="8" fill="rgba(255,255,255,0.05)" />
      ) : (
        <path
          d={isWaxing ? "M12 4a8 8 0 0 1 0 16 8 8 0 0 0 0-16z" : "M12 4a8 8 0 0 0 0 16 8 8 0 0 1 0-16z"}
          fill="#ffffff"
          style={{ filter: "drop-shadow(0 0 4px #ffffff)" }}
        />
      )}
    </svg>
  );
}
`;

const newContent = content.slice(0, startIndex) + replacement + content.slice(endIndex);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Fixed layout and legibility');
