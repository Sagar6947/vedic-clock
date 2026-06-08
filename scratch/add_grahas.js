const fs = require('fs');

const filePath = '/Users/sagarthakur/node_project/vedic-clock/src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state and logic to PremiumClockTowerDial
const premiumStateHookStr = `  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);`;

const premiumStateHookReplacement = `  const [mounted, setMounted] = React.useState(false);
  const [hoveredGraha, setHoveredGraha] = React.useState<any>(null);

  React.useEffect(() => { setMounted(true); }, []);

  const GRAHAS_CONFIG: Record<string, { symbol: string, color: string, sanskrit: string }> = React.useMemo(() => ({
    "Venus": { symbol: "♀", color: "#f8fafc", sanskrit: "शुक्र" },
    "Mercury": { symbol: "☿", color: "#4ade80", sanskrit: "बुध" },
    "Mars": { symbol: "♂", color: "#f87171", sanskrit: "मंगल" },
    "Jupiter": { symbol: "♃", color: "#fbbf24", sanskrit: "गुरु" },
    "Saturn": { symbol: "♄", color: "#818cf8", sanskrit: "शनि" }
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
        radius: 390
      };
    });

    mapped.sort((a: any, b: any) => a.longitude - b.longitude);
    for (let i = 0; i < mapped.length; i++) {
      for (let j = i + 1; j < mapped.length; j++) {
        const diff = Math.abs(mapped[i].longitude - mapped[j].longitude);
        const shortestDiff = Math.min(diff, 360 - diff);
        if (shortestDiff < 5.5) {
          if (mapped[i].radius === 390) mapped[j].radius = 420;
          else if (mapped[i].radius === 420) mapped[j].radius = 360;
          else mapped[j].radius = 390;
        }
      }
    }
    return mapped;
  }, [data?.planets, GRAHAS_CONFIG]);`;

// Since we have multiple components with `const [mounted, setMounted] = React.useState(false);`, 
// we only want to replace the one inside PremiumClockTowerDial.
const premiumDefIdx = content.indexOf('function PremiumClockTowerDial');
if (premiumDefIdx !== -1) {
  const substr1 = content.slice(0, premiumDefIdx);
  const substr2 = content.slice(premiumDefIdx);
  content = substr1 + substr2.replace(premiumStateHookStr, premiumStateHookReplacement);
}

// 2. Add Muhurat Name
const muhuratSearchStr = `{/* Center Enormous Vedic Time Display */}
            <g transform="translate(500, 620)">`;

const muhuratReplaceStr = `{/* Muhurat Name */}
            <g transform="translate(500, 520)">
               <rect x="-120" y="-20" width="240" height="40" rx="20" fill="rgba(212,175,55,0.15)" stroke="rgba(212,175,55,0.8)" strokeWidth="2" style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.3))" }}/>
               <text x="0" y="6" textAnchor="middle" fill="#ffd700" fontSize="22" fontWeight="bold" fontFamily="'Cinzel',serif" letterSpacing="0.05em" style={legibilityStyle}>
                 {panchang.muhurta.sanskrit}
               </text>
            </g>

            {/* Center Enormous Vedic Time Display */}
            <g transform="translate(500, 620)">`;

content = content.replace(muhuratSearchStr, muhuratReplaceStr);

// 3. Add Planet Transits (Grahas)
const planetsSearchStr = `{/* Concentric Decorative Arcs/Rings to give depth */}
        <circle cx="500" cy="500" r="390" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="2" strokeDasharray="15, 10" />`;

const planetsReplaceStr = `{/* Concentric Decorative Arcs/Rings to give depth */}
        <circle cx="500" cy="500" r="390" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="2" strokeDasharray="15, 10" />

        {/* Planet Transits (Grahas) */}
        {grahas.map((p: any) => {
          const gx = 500 + p.radius * Math.cos(p.angleRad);
          const gy = 500 + p.radius * Math.sin(p.angleRad);
          const col = p.config.color;
          const isHovered = hoveredGraha?.name === p.name;

          return (
            <g
              key={p.name}
              onMouseEnter={() => setHoveredGraha(p)}
              onMouseLeave={() => setHoveredGraha(null)}
              style={{ cursor: "pointer", pointerEvents: "all" }}
            >
              {p.radius !== 390 && (
                <line 
                  x1={gx} y1={gy} 
                  x2={500 + 390 * Math.cos(p.angleRad)} y2={500 + 390 * Math.sin(p.angleRad)} 
                  stroke={col} strokeWidth="1" strokeOpacity="0.4" 
                />
              )}
              <circle cx={gx} cy={gy} r={isHovered ? "18" : "14"} fill="rgba(6,5,10,0.95)" stroke={col} strokeWidth="2" style={{ filter: \`drop-shadow(0 0 \${isHovered ? '12px' : '6px'} \${col})\` }} />
              <text x={gx} y={gy + (isHovered ? -2 : 0)} textAnchor="middle" dominantBaseline="central" fill={col} fontSize={isHovered ? "20" : "16"} fontWeight="bold" style={{ pointerEvents: "none" }}>
                {p.config.symbol}
              </text>
              {isHovered && (
                 <text x={gx} y={gy + 28} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="16" fontFamily="'Outfit', sans-serif" fontWeight="bold" style={{ ...legibilityStyle, pointerEvents: "none" }}>
                   {p.config.sanskrit}
                 </text>
              )}
            </g>
          );
        })}`;

content = content.replace(planetsSearchStr, planetsReplaceStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully injected Muhurat Name and Grahas logic to PremiumClockTowerDial');
