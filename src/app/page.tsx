"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FullVedicClockData, ProminentMuhurat, FestivalInfo,
  RASIS, getRasiPosition,
} from "@/lib/vedic-types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────
const PRESETS = [
  { name: "Bhopal",    label: "BPL", lat: 23.2599,  lon: 77.4126,  alt: 527,  tz: 5.5  },
  { name: "New Delhi", label: "DEL", lat: 28.6139,  lon: 77.2090,  alt: 216,  tz: 5.5  },
  { name: "Mumbai",    label: "MUM", lat: 19.0760,  lon: 72.8777,  alt: 14,   tz: 5.5  },
  { name: "London",    label: "LDN", lat: 51.5074,  lon: -0.1278,  alt: 11,   tz: 1    },
  { name: "New York",  label: "NYC", lat: 40.7128,  lon: -74.0060, alt: 10,   tz: -4   },
];

const ROLES = [
  { id: "student",    label: "Student",     icon: "📚" },
  { id: "businessman",label: "Businessman", icon: "💼" },
  { id: "traveler",   label: "Traveler",    icon: "✈️" },
  { id: "wedding",    label: "Wedding",     icon: "💍" },
  { id: "doctor",     label: "Doctor",      icon: "⚕️" },
];

const NINE_PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];

const PLANET_SYMBOL: Record<string,string> = {
  Sun:"☉", Moon:"☽", Mars:"♂", Mercury:"☿", Jupiter:"♃",
  Venus:"♀", Saturn:"♄", Rahu:"☊", Ketu:"☋",
};
const PLANET_COLOR: Record<string,string> = {
  Sun:"#fcd34d", Moon:"#e0e8ff", Mars:"#f87171", Mercury:"#6ee7b7",
  Jupiter:"#fb923c", Venus:"#f0abfc", Saturn:"#94a3b8", Rahu:"#ff6b6b", Ketu:"#a78bfa",
};

function fmt2(n: number) { return String(Math.max(0,Math.floor(n))).padStart(2,"0"); }
function fmtTime(iso: string, tzH: number) {
  const d = new Date(iso);
  const ms = d.getTime() + tzH*3600*1000;
  const local = new Date(ms);
  const hh = local.getUTCHours(), mm = local.getUTCMinutes(), ss = local.getUTCSeconds();
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${fmt2(h12)}:${fmt2(mm)}:${fmt2(ss)} ${ampm}`;
}
function fmtTimeRange(startIso: string, endIso: string, tzH: number) {
  return `${fmtTime(startIso, tzH)} – ${fmtTime(endIso, tzH)}`;
}
function scoreColor(s: number) {
  if (s >= 80) return "#d4af37";
  if (s >= 60) return "#22c55e";
  if (s >= 40) return "#60a5fa";
  if (s >= 25) return "#f97316";
  return "#ef4444";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border" style={{ background: "#0d0b16", borderColor: "rgba(212,175,55,0.3)" }}>
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b" style={{ background: "#0d0b16", borderColor: "rgba(212,175,55,0.2)" }}>
          <h2 className="font-bold text-sm tracking-widest uppercase" style={{ fontFamily: "'Cinzel', serif", color: "#d4af37" }}>{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-lg leading-none">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function GhatiDial({ decimalGhati, isLive }: { decimalGhati: number; isLive: boolean }) {
  const angle = (decimalGhati % 60) * 6 - 90; // 360°/60 ghatis = 6°/ghati, offset -90° so 0 is top
  const ticks = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="relative select-none" style={{ width: "100%", aspectRatio: "1" }}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Outer bezel ring */}
        <circle cx="100" cy="100" r="97" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="3" />
        <circle cx="100" cy="100" r="91" fill="rgba(6,5,10,0.9)" stroke="rgba(138,43,226,0.2)" strokeWidth="1" />

        {/* Tick marks */}
        {ticks.map(i => {
          const ang = (i * 6 - 90) * Math.PI / 180;
          const isMajor = i % 5 === 0;
          const r1 = isMajor ? 82 : 85, r2 = 89;
          return (
            <line key={i}
              x1={100 + r1 * Math.cos(ang)} y1={100 + r1 * Math.sin(ang)}
              x2={100 + r2 * Math.cos(ang)} y2={100 + r2 * Math.sin(ang)}
              stroke={isMajor ? "rgba(212,175,55,0.7)" : "rgba(212,175,55,0.2)"}
              strokeWidth={isMajor ? 1.5 : 0.8}
            />
          );
        })}

        {/* Ghati numerals at 0,10,20,30,40,50 */}
        {[0,10,20,30,40,50].map(i => {
          const ang = (i*6-90)*Math.PI/180;
          const r = 74;
          return (
            <text key={i} x={100+r*Math.cos(ang)} y={100+r*Math.sin(ang)}
              textAnchor="middle" dominantBaseline="central"
              fill="rgba(212,175,55,0.6)" fontSize="7" fontFamily="'Cinzel',serif">
              {i}
            </text>
          );
        })}

        {/* Progress arc */}
        {(() => {
          const pct = (decimalGhati % 60) / 60;
          const r = 78, circ = 2 * Math.PI * r;
          return (
            <circle cx="100" cy="100" r={r} fill="none"
              stroke="rgba(212,175,55,0.15)" strokeWidth="6" />
          );
        })()}
        {(() => {
          const pct = (decimalGhati % 60) / 60;
          const r = 78, circ = 2 * Math.PI * r;
          return (
            <circle cx="100" cy="100" r={r} fill="none"
              stroke="#d4af37" strokeWidth="3"
              strokeDasharray={`${pct * circ} ${circ}`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              style={{ filter: "drop-shadow(0 0 4px rgba(212,175,55,0.6))" }}
            />
          );
        })()}

        {/* Needle */}
        <g transform={`rotate(${angle} 100 100)`}
          style={{ transition: isLive ? "transform 0.4s linear" : "transform 0.8s ease" }}>
          <line x1="100" y1="100" x2="100" y2="30"
            stroke="#d4af37" strokeWidth="2" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 3px #d4af37)" }} />
          <line x1="100" y1="100" x2="100" y2="115"
            stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Center jewel */}
        <circle cx="100" cy="100" r="5" fill="#d4af37"
          style={{ filter: "drop-shadow(0 0 4px #d4af37)" }} />
        <circle cx="100" cy="100" r="2.5" fill="#06050a" />
      </svg>
    </div>
  );
}

function MoonPhaseSvg({ degreeDiff }: { degreeDiff: number }) {
  const isWaxing = degreeDiff < 180;
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1" />
      <circle cx="12" cy="12" r="8" fill="#131022" />
      {degreeDiff >= 170 && degreeDiff <= 190 ? (
        <circle cx="12" cy="12" r="8" fill="#d4af37" style={{ filter: "drop-shadow(0 0 4px #d4af37)" }} />
      ) : degreeDiff < 10 || degreeDiff > 350 ? (
        <circle cx="12" cy="12" r="8" fill="#2d2a3a" />
      ) : (
        <path
          d={isWaxing ? "M12 4a8 8 0 0 1 0 16 8 8 0 0 0 0-16z" : "M12 4a8 8 0 0 0 0 16 8 8 0 0 1 0-16z"}
          fill="#d4af37"
          style={{ filter: "drop-shadow(0 0 3px #d4af37)" }}
        />
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  // location / settings
  const [preset, setPreset]   = useState(0);
  const [lat, setLat]         = useState(PRESETS[0].lat);
  const [lon, setLon]         = useState(PRESETS[0].lon);
  const [alt, setAlt]         = useState(PRESETS[0].alt);
  const [tzH, setTzH]         = useState(PRESETS[0].tz);
  const [role, setRole]       = useState("student");
  const [isLive, setIsLive]   = useState(true);
  const [travelTime, setTravelTime] = useState("");
  const [activeView, setActiveView] = useState<"clock_tower" | "app">("clock_tower");

  // server data
  const [data, setData]       = useState<FullVedicClockData | null>(null);
  const [muhurat, setMuhurat] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // live tick
  const [now, setNow]         = useState(new Date());

  // modals
  const [showMuhuratModal, setShowMuhuratModal]   = useState(false);
  const [showPlanetModal, setShowPlanetModal]     = useState(false);
  const [showFestivalModal, setShowFestivalModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // ── fetch from API ───────────────────────────────────────────────────────
  const fetchData = useCallback(async (targetISO: string) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/vaidik-clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lon, altitude: alt, utc_time: targetISO, user_role: role }),
      });
      const json = await res.json();
      if (json.success) { setData(json.data); setMuhurat(json.muhurat); setTimeline(json.timeline); }
      else setError(json.error || "Unknown error");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [lat, lon, alt, role]);

  // initial + settings change
  useEffect(() => {
    const t = isLive ? new Date().toISOString() : new Date(travelTime || Date.now()).toISOString();
    fetchData(t);
  }, [lat, lon, alt, role, isLive, travelTime]);

  // live tick every 400 ms (client side — no re-fetch)
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setNow(new Date()), 400);
    return () => clearInterval(id);
  }, [isLive]);

  // periodic re-sync from server (every 10 s)
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => fetchData(new Date().toISOString()), 10000);
    return () => clearInterval(id);
  }, [isLive, fetchData]);

  useEffect(() => {
    setTravelTime(new Date().toISOString().slice(0,16));
  }, []);

  // ── interpolated vedic time ───────────────────────────────────────────────
  const vt = (() => {
    if (!data) return { ghati:0, pala:0, vipala:0, decimalGhati:0 };
    const target = isLive ? now : new Date(travelTime || data.targetTimeUtc);
    const srMs = new Date(data.sunriseStart).getTime();
    const srEMs= new Date(data.sunriseEnd).getTime();
    const ahoratraMs = srEMs - srMs;
    const elapsedMs  = target.getTime() - srMs;
    const ghatiMs    = ahoratraMs / 60;
    const palaMs     = ghatiMs / 60;
    const vipalaMs   = palaMs / 60;
    const rawDecGhati= elapsedMs / ghatiMs;
    const norm       = ((rawDecGhati % 60) + 60) % 60;
    return {
      ghati:  Math.floor(norm),
      pala:   Math.floor(((elapsedMs % ghatiMs) + ghatiMs) % ghatiMs / palaMs),
      vipala: Math.floor((((elapsedMs % ghatiMs) + ghatiMs) % ghatiMs % palaMs) / vipalaMs),
      decimalGhati: norm,
    };
  })();

  // ── IST / Local wall-clock ────────────────────────────────────────────────
  const wallTime = isLive ? now : new Date(travelTime || now);
  const localMs  = wallTime.getTime() + tzH*3600*1000;
  const localD   = new Date(localMs);
  const hh24 = localD.getUTCHours(), mm = localD.getUTCMinutes(), ss = localD.getUTCSeconds();
  const ampm = hh24 >= 12 ? "PM" : "AM";
  const hh12 = hh24 % 12 || 12;
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const wallDateStr = `${DAYS[localD.getUTCDay()]}, ${localD.getUTCDate()} ${MONTHS[localD.getUTCMonth()]} ${localD.getUTCFullYear()}`;
  const wallTimeStr = `${fmt2(hh12)}:${fmt2(mm)}:${fmt2(ss)} ${ampm}`;

  const getUpcomingEvents = useCallback(() => {
    if (!data) return [];
    const events: { name: string; time: string; type: "sunrise" | "sunset" | "muhurat" | "prahar" }[] = [];
    const nowMs = wallTime.getTime();

    const srTime = new Date(data.sunriseStart).getTime();
    const ssTime = new Date(data.sunsetStart).getTime();
    const nextSrTime = new Date(data.sunriseEnd).getTime();

    if (srTime > nowMs) {
      events.push({ name: "Sunrise", time: data.sunriseStart, type: "sunrise" });
    } else if (ssTime > nowMs) {
      events.push({ name: "Sunset", time: data.sunsetStart, type: "sunset" });
    } else if (nextSrTime > nowMs) {
      events.push({ name: "Sunrise", time: data.sunriseEnd, type: "sunrise" });
    }

    data.prominentMuhurats.forEach(m => {
      const sMs = new Date(m.startTime).getTime();
      const eMs = new Date(m.endTime).getTime();
      if (nowMs >= sMs && nowMs < eMs) {
        events.push({ name: m.name, time: m.endTime, type: "muhurat" });
      } else if (sMs > nowMs) {
        events.push({ name: m.name, time: m.startTime, type: "muhurat" });
      }
    });

    events.push({ name: `End of ${data.prahar.name}`, time: data.prahar.endTime, type: "prahar" });

    return events
      .filter(e => new Date(e.time).getTime() > nowMs)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [data, wallTime]);

  // ── Vedic date string ─────────────────────────────────────────────────────
  const vedicDateStr = data
    ? `${data.vedicCalendar.vikramiSamvat} VS · ${data.vedicCalendar.solarMonthName} · ${data.panchang.tithi.paksha} ${data.panchang.tithi.name}`
    : "Loading...";

  // ── Nine planets ──────────────────────────────────────────────────────────
  const ninePlanets = data
    ? NINE_PLANETS.map(name => data.planets.find(p => p.name === name)).filter(Boolean)
    : [];

  // ── Muhurat score color ───────────────────────────────────────────────────
  const mScore  = muhurat?.score ?? 50;
  const mColor  = scoreColor(mScore);

  const presetBtn = (i: number) => {
    const p = PRESETS[i];
    setPreset(i); setLat(p.lat); setLon(p.lon); setAlt(p.alt); setTzH(p.tz);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#06050a", color:"#fbf9f4",
      fontFamily:"'Outfit',sans-serif", display:"flex", flexDirection:"column",
      alignItems:"center", padding:"16px 8px 32px" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{ width:"100%", maxWidth:"800px", display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:"12px" }}>
        <span style={{ fontFamily:"'Cinzel',serif", fontSize:"13px", color:"#d4af37",
          letterSpacing:"0.15em", textShadow:"0 0 8px rgba(212,175,55,0.5)" }}>
          ॐ VAIDIK SAMAYA
        </span>
        <div style={{ display:"flex", gap:"6px" }}>
          {PRESETS.map((p,i) => (
            <button key={p.label} onClick={() => presetBtn(i)}
              style={{ padding:"3px 8px", borderRadius:"6px", fontSize:"10px", fontWeight:700,
                background: preset===i ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
                border: preset===i ? "1px solid rgba(212,175,55,0.6)" : "1px solid rgba(255,255,255,0.08)",
                color: preset===i ? "#d4af37" : "#6b7280", cursor:"pointer", transition:"all 0.2s" }}>
              {p.label}
            </button>
          ))}
          <button onClick={() => setShowSettingsPanel(v=>!v)}
            style={{ padding:"3px 8px", borderRadius:"6px", fontSize:"12px",
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
              color:"#9ca3af", cursor:"pointer" }}>⚙</button>
        </div>
      </div>

      {/* ── View Switcher Tab Bar ────────────────────────────────────────── */}
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
      </div>

      {/* ── Settings panel (collapsible) ──────────────────────────────────── */}
      {showSettingsPanel && (
        <div style={{ width:"100%", maxWidth:"480px", background:"rgba(13,11,22,0.9)",
          border:"1px solid rgba(212,175,55,0.2)", borderRadius:"12px", padding:"14px",
          marginBottom:"12px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
          {[["Lat","number",lat,setLat],["Lon","number",lon,setLon],["Alt (m)","number",alt,setAlt]].map(([lbl,,val,setter]: any) => (
            <label key={lbl} style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
              <span style={{ fontSize:"9px", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.1em" }}>{lbl}</span>
              <input type="number" value={val} onChange={e=>setter(parseFloat(e.target.value)||0)}
                style={{ background:"rgba(0,0,0,0.5)", border:"1px solid rgba(138,43,226,0.3)",
                  borderRadius:"6px", padding:"4px 8px", color:"white", fontSize:"12px", width:"100%" }} />
            </label>
          ))}
          <label style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
            <span style={{ fontSize:"9px", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.1em" }}>TZ Offset (h)</span>
            <input type="number" step="0.5" value={tzH} onChange={e=>setTzH(parseFloat(e.target.value)||0)}
              style={{ background:"rgba(0,0,0,0.5)", border:"1px solid rgba(138,43,226,0.3)",
                borderRadius:"6px", padding:"4px 8px", color:"white", fontSize:"12px", width:"100%" }} />
          </label>
          <label style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
            <span style={{ fontSize:"9px", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.1em" }}>Role</span>
            <select value={role} onChange={e=>setRole(e.target.value)}
              style={{ background:"rgba(0,0,0,0.5)", border:"1px solid rgba(138,43,226,0.3)",
                borderRadius:"6px", padding:"4px 8px", color:"white", fontSize:"12px" }}>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
            </select>
          </label>
          <label style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
            <span style={{ fontSize:"9px", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.1em" }}>Mode</span>
            <div style={{ display:"flex", gap:"6px" }}>
              {["Live","Travel"].map(m => (
                <button key={m} onClick={() => setIsLive(m==="Live")}
                  style={{ flex:1, padding:"4px", borderRadius:"6px", fontSize:"10px", fontWeight:700,
                    background: (isLive===( m==="Live")) ? "rgba(212,175,55,0.2)" : "rgba(0,0,0,0.4)",
                    border:"1px solid rgba(212,175,55,0.3)", color: (isLive===(m==="Live")) ? "#d4af37" : "#6b7280",
                    cursor:"pointer" }}>
                  {m}
                </button>
              ))}
            </div>
          </label>
          {!isLive && (
            <label style={{ display:"flex", flexDirection:"column", gap:"4px", gridColumn:"span 3" }}>
              <span style={{ fontSize:"9px", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.1em" }}>Target Date & Time</span>
              <input type="datetime-local" value={travelTime} onChange={e=>setTravelTime(e.target.value)}
                style={{ background:"rgba(0,0,0,0.5)", border:"1px solid rgba(212,175,55,0.3)",
                  borderRadius:"6px", padding:"4px 8px", color:"white", fontSize:"12px" }} />
            </label>
          )}
        </div>
      )}

      {/* ── CLOCK TOWER VIEW ────────────────────────────────────────────── */}
      {activeView === "clock_tower" && (
        <div style={{
          width: "100%",
          maxWidth: "800px",
          background: "linear-gradient(145deg, #131020 0%, #0a0817 50%, #0f0d1a 100%)",
          border: "2px solid rgba(212, 175, 55, 0.25)",
          borderRadius: "24px",
          boxShadow: "0 0 0 1px rgba(212, 175, 55, 0.08), 0 0 40px rgba(138,43,226,0.15), inset 0 1px 0 rgba(212,175,55,0.1)",
          padding: "36px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "28px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* ambient glows */}
          <div style={{ position: "absolute", top: -60, left: -60, width: 200, height: 200,
            borderRadius: "50%", background: "radial-gradient(circle,rgba(138,43,226,0.12),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, right: -40, width: 180, height: 180,
            borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,0.08),transparent 70%)", pointerEvents: "none" }} />

          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(6,5,10,0.7)", borderRadius: "22px", zIndex: 10 }}>
              <span style={{ color: "#d4af37", fontSize: "13px", letterSpacing: "0.15em" }}>Calculating…</span>
            </div>
          )}

          {/* 1. Large Minimalist Ghati Clock Dial */}
          <div style={{ width: "240px", height: "240px", position: "relative" }}>
            <GhatiDial decimalGhati={vt.decimalGhati} isLive={isLive} />
          </div>

          {/* 2. Times Display Section */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "10px", zIndex: 2 }}>
            {/* Vedic Time */}
            <div>
              <span style={{ fontSize: "10px", color: "rgba(212, 175, 55, 0.6)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>
                Vaidik Samaya
              </span>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "38px",
                fontWeight: 800,
                color: "#d4af37",
                textShadow: "0 0 15px rgba(212,175,55,0.5)",
                marginTop: "4px",
                lineHeight: 1
              }}>
                {fmt2(vt.ghati)} : {fmt2(vt.pala)} : {fmt2(vt.vipala)}
              </div>
              <div style={{ fontSize: "9px", color: "rgba(212, 175, 55, 0.45)", letterSpacing: "0.1em", marginTop: "4px" }}>
                Ghati · Pala · Vipala
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: "100px", height: "1px", background: "rgba(212,175,55,0.15)", margin: "14px auto" }} />

            {/* Local Wall Clock */}
            <div>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "26px",
                fontWeight: 700,
                color: "white",
                letterSpacing: "0.04em",
                lineHeight: 1
              }}>
                {fmt2(hh12)}:{fmt2(mm)}<span style={{ fontSize: "18px", opacity: 0.8 }}>:{fmt2(ss)}</span>{" "}
                <span style={{ fontSize: "14px", color: "#9ca3af", marginLeft: "4px" }}>{ampm}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>
                {PRESETS[preset].name} Local Time · {wallDateStr}
              </div>
            </div>
          </div>

          {/* 3. Minimalist Details Cards */}
          <div style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginTop: "12px",
            zIndex: 2
          }}>
            {/* Vedic Tithi & Panchang Card */}
            <div style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(212, 175, 55, 0.15)",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}>
              <div style={{ flexShrink: 0 }}>
                {data ? <MoonPhaseSvg degreeDiff={data.panchang.tithi.degreeDiff} /> : (
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                )}
              </div>
              <div>
                <span style={{ fontSize: "8px", color: "rgba(138,43,226,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
                  Current Tithi
                </span>
                <div style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#c4b5fd",
                  fontFamily: "'Cinzel', serif",
                  marginTop: "2px"
                }}>
                  {data ? data.panchang.tithi.name : "Loading..."}
                </div>
                <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
                  {data ? `${data.panchang.tithi.paksha} Paksha` : "—"}
                </div>
              </div>
            </div>

            {/* Upcoming Details Card */}
            <div style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(212, 175, 55, 0.15)",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "4px"
            }}>
              <span style={{ fontSize: "8px", color: "#6b7280", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px", fontWeight: 700 }}>
                Upcoming Transitions
              </span>
              {data ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {getUpcomingEvents().slice(0, 2).map((ev, index) => {
                    const timeDiffMs = new Date(ev.time).getTime() - wallTime.getTime();
                    const hours = Math.floor(timeDiffMs / (3600 * 1000));
                    const minutes = Math.floor((timeDiffMs % (3600 * 1000)) / (60 * 1000));
                    const diffStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

                    return (
                      <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "#e4e4e7", fontWeight: 500 }}>
                          {ev.type === "sunrise" ? "🌅 Sunrise" : ev.type === "sunset" ? "🌇 Sunset" : ev.name}
                        </span>
                        <span style={{ fontSize: "10px", color: "#d4af37", fontFamily: "monospace" }}>
                          in {diffStr}
                        </span>
                      </div>
                    );
                  })}
                  {getUpcomingEvents().length === 0 && (
                    <span style={{ fontSize: "11px", color: "#52525b" }}>No upcoming events</span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: "11px", color: "#52525b" }}>Loading...</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── APP VIEW (DASHBOARD) ────────────────────────────────────────── */}
      {activeView === "app" && (
        <>
          {/* ── 3 Prominent Muhurats strip ────────────────────────────────────── */}
          {data && (
            <div style={{ width:"100%", maxWidth:"800px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
              gap:"8px", marginBottom:"12px" }}>
              {data.prominentMuhurats.map(mh => (
                <div key={mh.name}
                  style={{ background: mh.isActive
                    ? (mh.type==="auspicious" ? "rgba(212,175,55,0.15)" : "rgba(239,68,68,0.15)")
                    : "rgba(13,11,22,0.8)",
                    border: `1px solid ${mh.isActive ? (mh.type==="auspicious" ? "rgba(212,175,55,0.6)" : "rgba(239,68,68,0.6)") : "rgba(255,255,255,0.07)"}`,
                    borderRadius:"10px", padding:"8px", position:"relative", overflow:"hidden" }}>
                  {mh.isActive && (
                    <div style={{ position:"absolute", top:4, right:6,
                      width:6, height:6, borderRadius:"50%",
                      background: mh.type==="auspicious" ? "#d4af37" : "#ef4444",
                      boxShadow:`0 0 6px ${mh.type==="auspicious" ? "#d4af37" : "#ef4444"}`,
                      animation:"pulse 2s infinite" }} />
                  )}
                  <div style={{ fontSize:"8px", color: mh.type==="auspicious" ? "#d4af37" : "#f87171",
                    fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"2px" }}>
                    {mh.type==="auspicious" ? "✦" : "⚠"} {mh.name}
                  </div>
                  <div style={{ fontSize:"8px", color:"#a1a1aa", lineHeight:1.3 }}>
                    {fmtTimeRange(mh.startTime, mh.endTime, tzH)}
                  </div>
                  <div style={{ marginTop:"4px", fontSize:"8px",
                    color: mh.isActive ? (mh.type==="auspicious" ? "#d4af37" : "#ef4444") : "#52525b",
                    fontWeight:600 }}>
                    {mh.isActive ? (mh.type==="auspicious" ? "ACTIVE ✓" : "ACTIVE — AVOID") : "Inactive"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SQUARE CLOCK BODY ────────────────────────────────────────────── */}
          <div style={{
            width:"100%", maxWidth:"800px", aspectRatio:"1/1",
            background:"linear-gradient(145deg,#131020 0%,#0a0817 50%,#0f0d1a 100%)",
            border:"2px solid rgba(212,175,55,0.25)",
            borderRadius:"24px",
            boxShadow:"0 0 0 1px rgba(212,175,55,0.08), 0 0 40px rgba(138,43,226,0.15), inset 0 1px 0 rgba(212,175,55,0.1)",
            padding:"20px",
            display:"flex", flexDirection:"column", gap:"14px",
            position:"relative", overflow:"hidden",
          }}>
            {/* ambient glows */}
            <div style={{ position:"absolute", top:-60, left:-60, width:200, height:200,
              borderRadius:"50%", background:"radial-gradient(circle,rgba(138,43,226,0.12),transparent 70%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:-40, right:-40, width:180, height:180,
              borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,0.08),transparent 70%)", pointerEvents:"none" }} />

            {loading && (
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
                background:"rgba(6,5,10,0.7)", borderRadius:"22px", zIndex:10 }}>
                <span style={{ color:"#d4af37", fontSize:"13px", letterSpacing:"0.15em" }}>Calculating…</span>
              </div>
            )}

            {/* ── Row 1: Festival banner ──────────────────────────────────────── */}
            {data?.festival && (
              <button onClick={() => setShowFestivalModal(true)}
                style={{ background:`linear-gradient(90deg,${data.festival!.color}18,transparent)`,
                  border:`1px solid ${data.festival!.color}40`,
                  borderRadius:"10px", padding:"7px 12px",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}>
                <div>
                  <span style={{ fontSize:"8px", color: data.festival!.color,
                    fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" }}>
                    {data.festival!.type === "ekadashi" ? "🕉 Ekadashi Vrat" :
                     data.festival!.type === "festival"  ? "🪔 Festival" :
                     data.festival!.type === "vrat"       ? "🙏 Vrat" : "🌕 Vrat"} Today
                  </span>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"white",
                    fontFamily:"'Cinzel',serif", marginTop:"1px" }}>
                    {data.festival!.name}
                  </div>
                </div>
                <span style={{ fontSize:"11px", color:"#6b7280" }}>›</span>
              </button>
            )}

            {/* ── Row 2: Clock dial + time display ───────────────────────────── */}
            <div style={{ display:"flex", gap:"14px", alignItems:"center" }}>
              {/* Dial (left) */}
              <div style={{ width:"42%", flexShrink:0 }}>
                <GhatiDial decimalGhati={vt.decimalGhati} isLive={isLive} />
              </div>

              {/* Time & Date (right) */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"10px" }}>
                {/* IST Wall Clock */}
                <div>
                  <div style={{ fontSize:"9px", color:"#6b7280", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"2px" }}>
                    {PRESETS[preset].name} · IST+{tzH}
                  </div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:"28px", fontWeight:700,
                    color:"white", lineHeight:1, letterSpacing:"0.04em",
                    textShadow:"0 0 20px rgba(255,255,255,0.15)" }}>
                    {fmt2(hh12)}:{fmt2(mm)}<span style={{ fontSize:"18px" }}>:{fmt2(ss)}</span>
                    <span style={{ fontSize:"13px", color:"#9ca3af", marginLeft:"5px" }}>{ampm}</span>
                  </div>
                  <div style={{ fontSize:"10px", color:"#6b7280", marginTop:"3px" }}>{wallDateStr}</div>
                </div>

                <div style={{ height:"1px", background:"rgba(212,175,55,0.12)" }} />

                {/* Vedic Clock */}
                <div>
                  <div style={{ fontSize:"9px", color:"rgba(212,175,55,0.6)",
                    letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"3px" }}>
                    Vedic Sidereal Time
                  </div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:"22px", fontWeight:700,
                    color:"#d4af37", lineHeight:1,
                    textShadow:"0 0 12px rgba(212,175,55,0.5)" }}>
                    {fmt2(vt.ghati)} : {fmt2(vt.pala)} : {fmt2(vt.vipala)}
                  </div>
                  <div style={{ fontSize:"9px", color:"rgba(212,175,55,0.45)", marginTop:"2px", letterSpacing:"0.08em" }}>
                    Ghati · Pala · Vipala
                  </div>
                </div>

                <div style={{ height:"1px", background:"rgba(212,175,55,0.12)" }} />

                {/* Vedic Calendar Date */}
                <div>
                  <div style={{ fontSize:"9px", color:"rgba(138,43,226,0.7)",
                    letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"2px" }}>
                    Vedic Panchang
                  </div>
                  <div style={{ fontSize:"11px", color:"#c4b5fd", fontWeight:600, lineHeight:1.4 }}>
                    {data ? `${data.vedicCalendar.vikramiSamvat} VS` : "—"}
                  </div>
                  <div style={{ fontSize:"11px", color:"#a78bfa", lineHeight:1.4 }}>
                    {data ? data.vedicCalendar.solarMonthName : "—"}
                  </div>
                  <div style={{ fontSize:"11px", color:"#8b5cf6", lineHeight:1.4 }}>
                    {data ? `${data.panchang.tithi.paksha} ${data.panchang.tithi.name}` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Row 3: Panchang strip ───────────────────────────────────────── */}
            {data && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
                {[
                  { label:"Nakshatra", value: data.panchang.nakshatra.name },
                  { label:"Yoga",      value: data.panchang.yoga.name },
                  { label:"Karana",    value: data.panchang.karana.name.split(" ")[0] },
                  { label:"Vaara",     value: data.panchang.vaara.sanskrit },
                  { label:"Lagna",     value: data.panchang.lagna.rasi.signSanskrit },
                ].map(item => (
                  <div key={item.label} style={{ background:"rgba(0,0,0,0.4)",
                    border:"1px solid rgba(138,43,226,0.2)", borderRadius:"8px",
                    padding:"6px 4px", textAlign:"center" }}>
                    <div style={{ fontSize:"8px", color:"#52525b",
                      textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"2px" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize:"10px", color:"#c4b5fd", fontWeight:600,
                      fontFamily:"'Cinzel',serif", lineHeight:1.2 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Row 4: 9 Planets 3×3 grid ──────────────────────────────────── */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                <span style={{ fontSize:"9px", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:700 }}>
                  ✦ Navagraha — Sidereal Positions
                </span>
                <button onClick={() => setShowPlanetModal(true)}
                  style={{ fontSize:"9px", color:"#a78bfa", background:"none", border:"none",
                    cursor:"pointer", textDecoration:"underline", padding:0 }}>
                  Sub-Planets ›
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"6px" }}>
                {ninePlanets.map((p: any) => {
                  const col = PLANET_COLOR[p.name] || "#ffffff";
                  return (
                    <div key={p.name} style={{
                      background:"rgba(0,0,0,0.45)",
                      border:`1px solid ${col}22`,
                      borderRadius:"10px", padding:"8px 6px",
                      display:"flex", alignItems:"center", gap:"7px",
                    }}>
                      <span style={{ fontSize:"18px", lineHeight:1, filter:`drop-shadow(0 0 4px ${col})` }}>
                        {PLANET_SYMBOL[p.name]}
                      </span>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:"10px", fontWeight:700, color:col,
                          fontFamily:"'Cinzel',serif", whiteSpace:"nowrap", overflow:"hidden",
                          textOverflow:"ellipsis" }}>
                          {p.sanskrit}
                        </div>
                        <div style={{ fontSize:"9px", color:"#9ca3af", marginTop:"1px" }}>
                          {p.rasi.degreeInSign.toFixed(1)}° {p.rasi.signSanskrit}
                        </div>
                        {p.isRetrograde && (
                          <span style={{ fontSize:"7px", color:"#f87171", fontWeight:700,
                            background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)",
                            borderRadius:"4px", padding:"0 3px" }}>℞</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Row 5: Muhurat score bar + Category button ──────────────────── */}
            {muhurat && (
              <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                {/* Score ring */}
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ flexShrink:0 }}>
                  <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                  <circle cx="28" cy="28" r="23" fill="none"
                    stroke={mColor} strokeWidth="6"
                    strokeDasharray={`${2*Math.PI*23}`}
                    strokeDashoffset={`${2*Math.PI*23*(1-mScore/100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                    style={{ transition:"stroke-dashoffset 1s ease", filter:`drop-shadow(0 0 4px ${mColor})` }} />
                  <text x="28" y="28" textAnchor="middle" dominantBaseline="central"
                    fontSize="10" fontWeight="700" fill={mColor} fontFamily="'Cinzel',serif">
                    {mScore}%
                  </text>
                </svg>

                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"9px", color:"#6b7280", textTransform:"uppercase",
                    letterSpacing:"0.1em", marginBottom:"3px" }}>
                    Muhurat — {ROLES.find(r=>r.id===role)?.label}
                  </div>
                  <div style={{ fontSize:"12px", fontWeight:700, color:mColor, fontFamily:"'Cinzel',serif" }}>
                    {muhurat.rating}
                  </div>
                  <div style={{ marginTop:"5px", height:"4px", borderRadius:"2px",
                    background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${mScore}%`,
                      background:`linear-gradient(90deg,${mColor}88,${mColor})`,
                      borderRadius:"2px", transition:"width 1s ease" }} />
                  </div>
                </div>

                <button onClick={() => setShowMuhuratModal(true)}
                  style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)",
                    borderRadius:"10px", padding:"8px 12px", color:"#d4af37",
                    fontSize:"10px", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
                    letterSpacing:"0.08em" }}>
                  Category<br/>Muhurats ›
                </button>
              </div>
            )}

            {/* ── Row 6: 24-h forecast mini-bar ──────────────────────────────── */}
            {timeline.length > 0 && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                  <span style={{ fontSize:"9px", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.1em" }}>
                    24-Hour Forecast
                  </span>
                  <button onClick={() => setShowTimelineModal(true)}
                    style={{ fontSize:"9px", color:"#a78bfa", background:"none", border:"none",
                      cursor:"pointer", textDecoration:"underline", padding:0 }}>
                    View All ›
                  </button>
                </div>
                <div style={{ display:"flex", gap:"2px", height:"28px", alignItems:"flex-end",
                  background:"rgba(0,0,0,0.3)", borderRadius:"8px", padding:"4px 6px",
                  border:"1px solid rgba(255,255,255,0.06)" }}>
                  {timeline.map((h:any, i:number) => {
                    const c = scoreColor(h.score);
                    return (
                      <div key={i} title={`${h.score}% — ${new Date(h.time).getUTCHours()}:00`}
                        style={{ flex:1, background:c, borderRadius:"2px",
                          height:`${Math.max(15,(h.score/100)*100)}%`,
                          opacity:0.75, cursor:"pointer", transition:"opacity 0.2s" }}
                        onClick={() => { setIsLive(false); setTravelTime(new Date(new Date(h.time).getTime()-new Date(h.time).getTimezoneOffset()*60000).toISOString().slice(0,16)); }} />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
           MODALS
      ───────────────────────────────────────────────────────────────────── */}

      {/* Festival Modal */}
      {showFestivalModal && data?.festival && (
        <Modal title={data.festival.name} onClose={() => setShowFestivalModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ padding:"12px", borderRadius:"10px",
              background:`${data.festival.color}12`,
              border:`1px solid ${data.festival.color}30` }}>
              <div style={{ fontSize:"10px", color: data.festival.color,
                fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"6px" }}>
                {data.festival.sanskrit}
              </div>
              <p style={{ fontSize:"13px", color:"#d4d4d8", lineHeight:1.6, margin:0 }}>
                {data.festival.significance}
              </p>
            </div>
            <div>
              <div style={{ fontSize:"10px", color:"#6b7280", textTransform:"uppercase",
                letterSpacing:"0.1em", marginBottom:"8px", fontWeight:700 }}>
                Rituals & Observances
              </div>
              <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:"6px" }}>
                {data.festival.rituals.map((r,i) => (
                  <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:"8px" }}>
                    <span style={{ color: data.festival!.color, fontSize:"10px", marginTop:"2px" }}>✦</span>
                    <span style={{ fontSize:"12px", color:"#a1a1aa" }}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {/* Category Muhurat Modal */}
      {showMuhuratModal && (
        <Modal title="Category Muhurats" onClose={() => setShowMuhuratModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <p style={{ fontSize:"12px", color:"#6b7280", margin:0 }}>
              Select a role to see customised auspicious windows based on today's Panchang.
            </p>
            {/* Role picker */}
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)}
                  style={{ padding:"6px 12px", borderRadius:"8px", fontSize:"11px", fontWeight:700,
                    background: role===r.id ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)",
                    border:`1px solid ${role===r.id ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.1)"}`,
                    color: role===r.id ? "#d4af37" : "#9ca3af", cursor:"pointer" }}>
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
            {/* Score display */}
            {muhurat && (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:"14px",
                  background:"rgba(0,0,0,0.4)", border:`1px solid ${mColor}30`,
                  borderRadius:"12px", padding:"14px" }}>
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="32" cy="32" r="26" fill="none"
                      stroke={mColor} strokeWidth="7"
                      strokeDasharray={`${2*Math.PI*26}`}
                      strokeDashoffset={`${2*Math.PI*26*(1-mScore/100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 32 32)" />
                    <text x="32" y="32" textAnchor="middle" dominantBaseline="central"
                      fontSize="12" fontWeight="700" fill={mColor} fontFamily="'Cinzel',serif">
                      {mScore}%
                    </text>
                  </svg>
                  <div>
                    <div style={{ fontSize:"15px", fontWeight:700, color:mColor, fontFamily:"'Cinzel',serif" }}>{muhurat.rating}</div>
                    <div style={{ fontSize:"11px", color:"#6b7280", marginTop:"4px" }}>
                      For {ROLES.find(r=>r.id===role)?.label} activities right now
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  {muhurat.breakdown.map((item:any, idx:number) => (
                    <div key={idx} style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"center", padding:"8px 10px", borderRadius:"8px",
                      background: item.type==="positive" ? "rgba(34,197,94,0.08)" :
                                  item.type==="negative" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                      border:`1px solid ${item.type==="positive" ? "rgba(34,197,94,0.25)" : item.type==="negative" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.08)"}` }}>
                      <span style={{ fontSize:"11px",
                        color: item.type==="positive" ? "#4ade80" : item.type==="negative" ? "#f87171" : "#71717a" }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize:"11px", fontWeight:700, fontFamily:"'Cinzel',serif",
                        color: item.type==="positive" ? "#4ade80" : item.type==="negative" ? "#f87171" : "#52525b" }}>
                        {item.score > 0 ? `+${item.score}` : item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* Prominent muhurats full details */}
            {data && (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                <div style={{ fontSize:"10px", color:"#6b7280", textTransform:"uppercase",
                  letterSpacing:"0.1em", fontWeight:700 }}>Today's Key Windows</div>
                {data.prominentMuhurats.map(mh => (
                  <div key={mh.name} style={{ padding:"10px", borderRadius:"10px",
                    background: mh.type==="auspicious" ? "rgba(212,175,55,0.08)" : "rgba(239,68,68,0.08)",
                    border:`1px solid ${mh.type==="auspicious" ? "rgba(212,175,55,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                      <span style={{ fontSize:"11px", fontWeight:700, fontFamily:"'Cinzel',serif",
                        color: mh.type==="auspicious" ? "#d4af37" : "#f87171" }}>
                        {mh.name}
                      </span>
                      <span style={{ fontSize:"10px", color:"#6b7280" }}>
                        {fmtTimeRange(mh.startTime, mh.endTime, tzH)}
                      </span>
                    </div>
                    <p style={{ fontSize:"11px", color:"#71717a", margin:0, lineHeight:1.5 }}>
                      {mh.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Sub-Planets Modal */}
      {showPlanetModal && data && (
        <Modal title="Extended Planetary Ledger" onClose={() => setShowPlanetModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {/* All 12 planets */}
            <div style={{ fontSize:"10px", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>
              All Sidereal Grahas (Lahiri Ayanamsa)
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                  {["Planet","Sanskrit","Longitude","Sign","°","Status"].map(h=>(
                    <th key={h} style={{ padding:"4px 6px", textAlign:"left", color:"#52525b",
                      fontSize:"9px", textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.planets.map(p => {
                  const col = PLANET_COLOR[p.name] || "#9ca3af";
                  return (
                    <tr key={p.name} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding:"6px", color:col, fontWeight:700 }}>{p.name}</td>
                      <td style={{ padding:"6px", color:"#a78bfa", fontFamily:"'Cinzel',serif", fontSize:"10px" }}>{p.sanskrit}</td>
                      <td style={{ padding:"6px", color:"#d4d4d8", fontFamily:"monospace" }}>{p.longitude.toFixed(2)}°</td>
                      <td style={{ padding:"6px", color:"#9ca3af" }}>{p.rasi.signSanskrit}</td>
                      <td style={{ padding:"6px", color:"#6b7280", fontSize:"10px" }}>{p.rasi.degreeInSign.toFixed(1)}°</td>
                      <td style={{ padding:"6px" }}>
                        {p.isRetrograde
                          ? <span style={{ color:"#f87171", fontSize:"9px", fontWeight:700 }}>℞ Retro</span>
                          : <span style={{ color:"#4ade80", fontSize:"9px" }}>Direct</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Aprakasha Grahas */}
            <div style={{ fontSize:"10px", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, marginTop:"6px" }}>
              Aprakasha Shadow Grahas
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              {[
                { name:"Dhooma",    sanskrit:"धूम",     long: data.aprakasha.dhooma },
                { name:"Vyatipata", sanskrit:"व्यतीपात", long: data.aprakasha.vyatipata },
                { name:"Parivesha", sanskrit:"परिवेश",   long: data.aprakasha.parivesha },
                { name:"Indrachapa",sanskrit:"इन्द्रचाप", long: data.aprakasha.indrachapa },
                { name:"Upaketu",   sanskrit:"उपकेतु",   long: data.aprakasha.upaketu },
              ].map(ap => {
                const rasi = getRasiPosition(ap.long);
                return (
                  <div key={ap.name} style={{ padding:"8px 10px", borderRadius:"8px",
                    background:"rgba(0,0,0,0.4)", border:"1px solid rgba(138,43,226,0.2)" }}>
                    <div style={{ fontSize:"10px", fontWeight:700, color:"#c084fc", fontFamily:"'Cinzel',serif" }}>{ap.name}</div>
                    <div style={{ fontSize:"9px", color:"#7c3aed", marginTop:"1px" }}>{ap.sanskrit}</div>
                    <div style={{ fontSize:"11px", color:"#d4d4d8", marginTop:"4px", fontFamily:"monospace" }}>
                      {ap.long.toFixed(2)}° — {rasi.signSanskrit} {rasi.degreeInSign.toFixed(1)}°
                    </div>
                  </div>
                );
              })}

              {/* Mandi & Gulika */}
              {[
                { name:"Gulika", time: data.mandiGulika.gulikaTime, long: data.mandiGulika.gulikaLongitude, rasi: data.mandiGulika.gulikaRasi },
                { name:"Mandi",  time: data.mandiGulika.mandiTime,  long: data.mandiGulika.mandiLongitude,  rasi: data.mandiGulika.mandiRasi  },
              ].map(gm => (
                <div key={gm.name} style={{ padding:"8px 10px", borderRadius:"8px",
                  background:"rgba(0,0,0,0.4)", border:"1px solid rgba(138,43,226,0.2)" }}>
                  <div style={{ fontSize:"10px", fontWeight:700, color:"#c084fc", fontFamily:"'Cinzel',serif" }}>{gm.name}</div>
                  <div style={{ fontSize:"9px", color:"#6b7280", marginTop:"1px" }}>Rise: {fmtTime(gm.time, tzH)}</div>
                  <div style={{ fontSize:"11px", color:"#d4d4d8", marginTop:"4px", fontFamily:"monospace" }}>
                    {gm.long.toFixed(2)}° — {gm.rasi.signSanskrit} {gm.rasi.degreeInSign.toFixed(1)}°
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Timeline Modal */}
      {showTimelineModal && timeline.length > 0 && (
        <Modal title="24-Hour Muhurat Forecast" onClose={() => setShowTimelineModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {timeline.map((h:any,i:number) => {
              const hDate = new Date(new Date(h.time).getTime() + tzH*3600*1000);
              const hourLabel = `${fmt2(hDate.getUTCHours())}:00`;
              const c = scoreColor(h.score);
              return (
                <button key={i} onClick={() => { setIsLive(false);
                  setTravelTime(new Date(new Date(h.time).getTime()-new Date(h.time).getTimezoneOffset()*60000).toISOString().slice(0,16));
                  setShowTimelineModal(false); }}
                  style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 10px",
                    borderRadius:"8px", border:`1px solid ${c}22`,
                    background:`${c}0a`, cursor:"pointer", textAlign:"left" }}>
                  <span style={{ fontSize:"11px", fontWeight:700, color:"#6b7280",
                    fontFamily:"monospace", width:"36px" }}>{hourLabel}</span>
                  <div style={{ flex:1, height:"6px", borderRadius:"3px",
                    background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${h.score}%`, background:c,
                      borderRadius:"3px", transition:"width 0.5s" }} />
                  </div>
                  <span style={{ fontSize:"12px", fontWeight:700, color:c,
                    fontFamily:"'Cinzel',serif", width:"36px", textAlign:"right" }}>{h.score}%</span>
                  <span style={{ fontSize:"9px", color:"#6b7280", width:"60px", textAlign:"right" }}>
                    {h.rating.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.3); border-radius:2px }
      `}</style>
    </div>
  );
}
