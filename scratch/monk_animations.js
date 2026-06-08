const fs = require('fs');

const filePath = '/Users/sagarthakur/node_project/vedic-clock/src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add new keyframes to the <style> block
const styleSearch = `          \`}} />
          <clipPath id="clockTowerClip">`;

const styleReplace = `            @keyframes pranayama-breathe {
              0% { transform: rotate(0deg) scale(1); filter: contrast(1.2) brightness(0.8); }
              50% { transform: rotate(180deg) scale(1.12); filter: contrast(1.4) brightness(1.1); }
              100% { transform: rotate(360deg) scale(1); filter: contrast(1.2) brightness(0.8); }
            }
            .spin-and-breathe { animation: pranayama-breathe 240s ease-in-out infinite; transform-origin: 500px 500px; }
            
            @keyframes sound-ripple {
              0% { r: 150px; opacity: 0.8; stroke-width: 4px; }
              100% { r: 500px; opacity: 0; stroke-width: 0.5px; }
            }
            .om-ripple { animation: sound-ripple 16s cubic-bezier(0.25, 1, 0.5, 1) infinite; fill: none; stroke: rgba(212,175,55,1); pointer-events: none; }
            .om-ripple-delayed-1 { animation-delay: 5.33s; }
            .om-ripple-delayed-2 { animation-delay: 10.66s; }

            @keyframes mystic-aura {
              0%, 100% { filter: drop-shadow(0 0 10px rgba(212,175,55,0.6)); fill: #d4af37; }
              50% { filter: drop-shadow(0 0 25px rgba(255,255,255,0.8)); fill: #fff1a0; }
            }
            .title-mystic-aura { animation: mystic-aura 8s ease-in-out infinite; }

            @keyframes twinkle-dust {
              0%, 100% { opacity: 0.1; filter: drop-shadow(0 0 2px rgba(212,175,55,0.2)); transform: translateY(0px); }
              50% { opacity: 0.9; filter: drop-shadow(0 0 8px rgba(212,175,55,1)); transform: translateY(-15px); }
            }
            .cosmic-dust-1 { animation: twinkle-dust 7s ease-in-out infinite; }
            .cosmic-dust-2 { animation: twinkle-dust 5s ease-in-out infinite; animation-delay: 2s; }
            .cosmic-dust-3 { animation: twinkle-dust 9s ease-in-out infinite; animation-delay: 4s; }
          \`}} />
          <clipPath id="clockTowerClip">`;

content = content.replace(styleSearch, styleReplace);

// 2. Change background image class to spin-and-breathe
const imgSearch = `<g className="spin-slow">
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
const imgReplace = `<g className="spin-and-breathe">
          <image
            href="/ancient_mandala_bg.png"
            x="0"
            y="0"
            width="1000"
            height="1000"
            clipPath="url(#clockTowerClip)"
            opacity="0.85"
            style={{ pointerEvents: "none" }}
          />
        </g>`;
content = content.replace(imgSearch, imgReplace);

// 3. Add OM ripples right after the background
const bgCircleSearch = `<circle cx="500" cy="500" r="490" fill="rgba(0,0,0,0.4)" style={{ pointerEvents: "none" }} />`;
const bgCircleReplace = `<circle cx="500" cy="500" r="490" fill="rgba(0,0,0,0.4)" style={{ pointerEvents: "none" }} />
        
        {/* Om Resonance Ripples */}
        <circle cx="500" cy="500" className="om-ripple" />
        <circle cx="500" cy="500" className="om-ripple om-ripple-delayed-1" />
        <circle cx="500" cy="500" className="om-ripple om-ripple-delayed-2" />
        
        {/* Cosmic Gold Dust */}
        <g fill="#d4af37" style={{ pointerEvents: "none" }}>
          <circle cx="350" cy="200" r="2" className="cosmic-dust-1" />
          <circle cx="650" cy="220" r="1.5" className="cosmic-dust-2" />
          <circle cx="250" cy="400" r="2.5" className="cosmic-dust-3" />
          <circle cx="750" cy="420" r="2" className="cosmic-dust-1" style={{animationDelay: '1s'}} />
          <circle cx="450" cy="300" r="1.5" className="cosmic-dust-2" style={{animationDelay: '3s'}} />
          <circle cx="550" cy="750" r="2" className="cosmic-dust-3" style={{animationDelay: '2s'}} />
          <circle cx="300" cy="650" r="2.5" className="cosmic-dust-1" style={{animationDelay: '5s'}} />
          <circle cx="700" cy="680" r="1.5" className="cosmic-dust-2" style={{animationDelay: '0.5s'}} />
          <circle cx="400" cy="800" r="2" className="cosmic-dust-3" style={{animationDelay: '4.5s'}} />
        </g>`;
content = content.replace(bgCircleSearch, bgCircleReplace);

// 4. Main Title Aura
const titleSearch = `<text fill="#d4af37" fontSize="44" fontWeight="900" fontFamily="'Cinzel',serif" letterSpacing="0.1em" style={{ ...legibilityStyle, filter: "drop-shadow(0 0 12px rgba(212,175,55,0.8))" }}>
          <textPath href="#topTitleArch" startOffset="50%" textAnchor="middle">
            विक्रमादित्य वैदिक घड़ी
          </textPath>
        </text>`;
const titleReplace = `<text fontSize="44" fontWeight="900" fontFamily="'Cinzel',serif" letterSpacing="0.1em" className="title-mystic-aura" style={legibilityStyle}>
          <textPath href="#topTitleArch" startOffset="50%" textAnchor="middle">
            विक्रमादित्य वैदिक घड़ी
          </textPath>
        </text>`;
content = content.replace(titleSearch, titleReplace);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully injected mystical monk animations into Premium theme!');
