const fs = require('fs');

const filePath = '/Users/sagarthakur/node_project/vedic-clock/src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add new keyframes to the <style> block
const styleSearch = `          \`}} />
          <clipPath id="clockTowerClip">`;

const styleReplace = `            @keyframes pulse-gold { 0% { filter: drop-shadow(0 0 10px rgba(212,175,55,0.3)); } 100% { filter: drop-shadow(0 0 30px rgba(212,175,55,1)); } }
            @keyframes pulse-blue { 0% { filter: drop-shadow(0 0 10px rgba(0,100,255,0.3)); } 100% { filter: drop-shadow(0 0 25px rgba(0,150,255,0.8)); } }
            .animate-pulse-gold { animation: pulse-gold 3s ease-in-out infinite alternate; }
            .animate-pulse-blue { animation: pulse-blue 4s ease-in-out infinite alternate; }
            .hover-scale { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .hover-scale:hover { transform: scale(1.05); }
          \`}} />
          <clipPath id="clockTowerClip">`;

content = content.replace(styleSearch, styleReplace);

// 2. Outer Glowing Bezel
const outerBezelSearch = `<circle cx="500" cy="500" r="495" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="10" style={{ filter: "drop-shadow(0 0 15px rgba(212,175,55,0.5))" }} />`;
const outerBezelReplace = `<circle cx="500" cy="500" r="495" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="10" className="animate-pulse-gold" />`;
content = content.replace(outerBezelSearch, outerBezelReplace);

// 3. Rashi Active Highlight
const rashiActiveSearch = `<circle cx={rx} cy={ry} r="25" fill="rgba(212,175,55,0.15)" stroke="rgba(212,175,55,0.8)" strokeWidth="2" style={{ filter: "drop-shadow(0 0 15px rgba(212,175,55,0.8))" }} />`;
const rashiActiveReplace = `<circle cx={rx} cy={ry} r="25" fill="rgba(212,175,55,0.15)" stroke="rgba(212,175,55,0.8)" strokeWidth="2" className="animate-pulse-gold" />`;
content = content.replace(rashiActiveSearch, rashiActiveReplace);

// 4. Muhurat Badge
const muhuratBadgeSearch = `<rect x="-120" y="-20" width="240" height="40" rx="20" fill="rgba(212,175,55,0.15)" stroke="rgba(212,175,55,0.8)" strokeWidth="2" style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.3))" }}/>`;
const muhuratBadgeReplace = `<rect x="-120" y="-20" width="240" height="40" rx="20" fill="rgba(212,175,55,0.15)" stroke="rgba(212,175,55,0.8)" strokeWidth="2" className="animate-pulse-gold" />`;
content = content.replace(muhuratBadgeSearch, muhuratBadgeReplace);

// 5. Date/Time/Vaar/Location Badges
// We replace all 4 globally since they use the exact same rect design!
const blueBadgeSearch = `<rect x="-80" y="-20" width="160" height="40" rx="20" fill="rgba(10,25,60,0.85)" stroke="rgba(212,175,55,0.6)" strokeWidth="2" style={{ filter: "drop-shadow(0 0 10px rgba(0,100,255,0.4))" }}/>`;
const blueBadgeReplace = `<rect x="-80" y="-20" width="160" height="40" rx="20" fill="rgba(10,25,60,0.85)" stroke="rgba(212,175,55,0.6)" strokeWidth="2" className="animate-pulse-blue" />`;
content = content.split(blueBadgeSearch).join(blueBadgeReplace);

// The date badge has width 200, so we replace that specifically:
const dateBadgeSearch = `<rect x="-100" y="-20" width="200" height="40" rx="20" fill="rgba(10,25,60,0.85)" stroke="rgba(212,175,55,0.6)" strokeWidth="2" style={{ filter: "drop-shadow(0 0 10px rgba(0,100,255,0.4))" }}/>`;
const dateBadgeReplace = `<rect x="-100" y="-20" width="200" height="40" rx="20" fill="rgba(10,25,60,0.85)" stroke="rgba(212,175,55,0.6)" strokeWidth="2" className="animate-pulse-blue" />`;
content = content.replace(dateBadgeSearch, dateBadgeReplace);

// 6. Planet hover scale
const planetHoverSearch = `style={{ cursor: "pointer", pointerEvents: "all" }}`;
const planetHoverReplace = `style={{ cursor: "pointer", pointerEvents: "all", transformOrigin: \`\${gx}px \${gy}px\`, transform: isHovered ? "scale(1.2)" : "scale(1)", transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}`;
content = content.replace(planetHoverSearch, planetHoverReplace);

// 7. Rashi hover scale
const rashiHoverSearch = `style={{ cursor: "pointer", pointerEvents: "all" }}`;
const rashiHoverReplace = `style={{ cursor: "pointer", pointerEvents: "all", transformOrigin: \`\${rx}px \${ry}px\`, transform: (activeRashiDetail === i) ? "scale(1.15)" : "scale(1)", transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}`;
content = content.replace(rashiHoverSearch, rashiHoverReplace); // Applies to Rashi since it's the first match in PremiumDial

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully injected advanced animations into Premium theme!');
