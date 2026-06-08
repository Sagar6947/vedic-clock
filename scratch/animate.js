const fs = require('fs');

const filePath = '/Users/sagarthakur/node_project/vedic-clock/src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add <style> inside <defs>
const defsSearch = `<defs>
          <clipPath id="clockTowerClip">`;

const defsReplace = `<defs>
          <style dangerouslySetInnerHTML={{__html: \`
            @keyframes astrolabe-spin { 100% { transform: rotate(360deg); } }
            @keyframes astrolabe-spin-reverse { 100% { transform: rotate(-360deg); } }
            .spin-slow { animation: astrolabe-spin 360s linear infinite; transform-origin: 500px 500px; }
            .spin-slow-reverse { animation: astrolabe-spin-reverse 300s linear infinite; transform-origin: 500px 500px; }
            .spin-medium { animation: astrolabe-spin 180s linear infinite; transform-origin: 500px 500px; }
            .spin-medium-reverse { animation: astrolabe-spin-reverse 120s linear infinite; transform-origin: 500px 500px; }
            .spin-fast { animation: astrolabe-spin 60s linear infinite; transform-origin: 500px 500px; }
            .spin-fast-reverse { animation: astrolabe-spin-reverse 45s linear infinite; transform-origin: 500px 500px; }
            .spin-center-slow { animation: astrolabe-spin 240s linear infinite; transform-origin: 0px 0px; }
            .spin-center-slow-reverse { animation: astrolabe-spin-reverse 180s linear infinite; transform-origin: 0px 0px; }
          \`}} />
          <clipPath id="clockTowerClip">`;

content = content.replace(defsSearch, defsReplace);

// 2. Wrap image with spin-slow
const imgSearch = `<image
          href="/ancient_mandala_bg.png"
          x="0"
          y="0"
          width="1000"
          height="1000"
          clipPath="url(#clockTowerClip)"
          opacity="0.85"
          style={{ pointerEvents: "none", filter: "contrast(1.2) brightness(0.9)" }}
        />`;

const imgReplace = `<g className="spin-slow">
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
        </g>`;

content = content.replace(imgSearch, imgReplace);

// 3. Update inner decorative rings (Line 747)
const line747Search = `<circle cx="500" cy="500" r="475" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="2" strokeDasharray="10, 5" />`;
const line747Replace = `<circle cx="500" cy="500" r="475" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="2" strokeDasharray="10, 5" className="spin-medium" />`;
content = content.replace(line747Search, line747Replace);

// 4. Planet ring background (Line 911 approx - actually wait, the script for add_grahas put it somewhere. Let's just use string replace on the exact element)
const planetRingSearch = `<circle cx="500" cy="500" r="390" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="2" strokeDasharray="15, 10" />`;
const planetRingReplace = `<circle cx="500" cy="500" r="390" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="2" strokeDasharray="15, 10" className="spin-slow-reverse" />`;
content = content.replace(planetRingSearch, planetRingReplace);

// 5. Inner rings (Lines 944, 945)
const innerRing1Search = `<circle cx="500" cy="500" r="280" fill="none" stroke="rgba(0,150,255,0.15)" strokeWidth="4" strokeDasharray="30, 15" />`;
const innerRing1Replace = `<circle cx="500" cy="500" r="280" fill="none" stroke="rgba(0,150,255,0.15)" strokeWidth="4" strokeDasharray="30, 15" className="spin-medium" />`;
content = content.replace(innerRing1Search, innerRing1Replace);

const innerRing2Search = `<circle cx="500" cy="500" r="230" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" strokeDasharray="5, 5" />`;
const innerRing2Replace = `<circle cx="500" cy="500" r="230" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" strokeDasharray="5, 5" className="spin-medium-reverse" />`;
content = content.replace(innerRing2Search, innerRing2Replace);

// 6. Deep inner geometric rings (Lines 950, 953 inside translate(500,500))
// We'll use spin-center-slow because they have cx=0 cy=0
const deepRing1Search = `<circle cx="0" cy="0" r="430" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2" strokeDasharray="4, 12" />`;
const deepRing1Replace = `<circle cx="0" cy="0" r="430" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2" strokeDasharray="4, 12" className="spin-center-slow" />`;
content = content.replace(deepRing1Search, deepRing1Replace);

const deepRing2Search = `<circle cx="0" cy="0" r="460" fill="none" stroke="rgba(0,150,255,0.1)" strokeWidth="2" strokeDasharray="6, 10" />`;
const deepRing2Replace = `<circle cx="0" cy="0" r="460" fill="none" stroke="rgba(0,150,255,0.1)" strokeWidth="2" strokeDasharray="6, 10" className="spin-center-slow-reverse" />`;
content = content.replace(deepRing2Search, deepRing2Replace);

// Write changes
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully injected CSS animations into Premium theme!');
