"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Compass, 
  Clock, 
  MapPin, 
  User, 
  HelpCircle, 
  Award, 
  ArrowRight, 
  Calendar, 
  Play, 
  Pause, 
  TrendingUp, 
  Activity,
  Layers,
  Moon,
  Sun,
  ShieldAlert
} from "lucide-react";
import { FullVedicClockData, RASIS, NAKSHATRAS, getRasiPosition } from "@/lib/vedic-types";

const PRESETS = [
  { name: "Bhopal, IN", lat: 23.2599, lon: 77.4126, alt: 527 },
  { name: "New Delhi, IN", lat: 28.6139, lon: 77.2090, alt: 216 },
  { name: "London, UK", lat: 51.5074, lon: -0.1278, alt: 11 },
  { name: "New York, US", lat: 40.7128, lon: -74.0060, alt: 10 },
  { name: "Tokyo, JP", lat: 35.6762, lon: 139.6503, alt: 44 },
];

const ROLES = [
  { id: "student", label: "Student", desc: "Academics & Concentration" },
  { id: "businessman", label: "Businessman", desc: "Commerce & Negotiations" },
  { id: "traveler", label: "Traveler", desc: "Journeys & Safeness" },
  { id: "wedding", label: "Wedding", desc: "Harmony & Marriage" },
  { id: "doctor", label: "Doctor", desc: "Healing & Health" },
];

export default function Home() {
  // Coordinates & Settings State
  const [lat, setLat] = useState(23.2599);
  const [lon, setLon] = useState(77.4126);
  const [alt, setAlt] = useState(527);
  const [role, setRole] = useState("student");
  
  // Time Travel / Live State
  const [isLive, setIsLive] = useState(true);
  const [travelTime, setTravelTime] = useState("");
  
  // Calculated Core Data state
  const [data, setData] = useState<FullVedicClockData | null>(null);
  const [muhurat, setMuhurat] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Smooth client-side ticking state
  const [tickingTime, setTickingTime] = useState<Date | null>(null);
  const [clientVedicTime, setClientVedicTime] = useState({ ghati: 0, pala: 0, vipala: 0, decimalGhati: 0 });

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync initial calendar time
  useEffect(() => {
    setTravelTime(new Date().toISOString().slice(0, 16));
  }, []);

  // Fetch complete Vedic Data from Backend API
  const fetchData = async (targetTimeStr: string) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("/api/vaidik-clock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          altitude: alt,
          utc_time: targetTimeStr,
          user_role: role,
        }),
      });

      const res = await response.json();
      if (res.success) {
        setData(res.data);
        setMuhurat(res.muhurat);
        setTimeline(res.timeline);
      } else {
        setError(res.error || "Failed to fetch Vedic Clock data.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever settings or travel time changes
  useEffect(() => {
    let targetTime = new Date().toISOString();
    if (!isLive && travelTime) {
      targetTime = new Date(travelTime).toISOString();
    }
    fetchData(targetTime);
  }, [lat, lon, alt, role, isLive, travelTime]);

  // Handle preset selection
  const selectPreset = (p: typeof PRESETS[0]) => {
    setLat(p.lat);
    setLon(p.lon);
    setAlt(p.alt);
  };

  // Real-time ticking logic
  useEffect(() => {
    if (!isLive) return;

    const timer = setInterval(() => {
      setTickingTime(new Date());
    }, 400); // Ticks roughly every Vipala (400ms)

    return () => clearInterval(timer);
  }, [isLive]);

  // Interpolate Vedic Time smoothly on the client
  useEffect(() => {
    if (!data) return;

    const currentLocalTime = isLive ? (tickingTime || new Date()) : new Date(travelTime || data.targetTimeUtc);
    const jdT = currentLocalTime.getTime() / (86400 * 1000) + 2440587.5;

    const srStart = new Date(data.sunriseStart).getTime() / (86400 * 1000) + 2440587.5;
    const srEnd = new Date(data.sunriseEnd).getTime() / (86400 * 1000) + 2440587.5;

    const ahoratraSeconds = (srEnd - srStart) * 86400;
    const elapsedSeconds = (jdT - srStart) * 86400;

    const ghatiSeconds = ahoratraSeconds / 60;
    const palaSeconds = ghatiSeconds / 60;
    const vipalaSeconds = palaSeconds / 60;

    const decimalGhati = (elapsedSeconds / ghatiSeconds) % 60;
    const normDecimalGhati = decimalGhati < 0 ? decimalGhati + 60 : decimalGhati;

    const ghati = Math.floor(normDecimalGhati);
    const remainingSeconds = (elapsedSeconds % ghatiSeconds + ghatiSeconds) % ghatiSeconds;
    const pala = Math.floor(remainingSeconds / palaSeconds);
    const vipala = Math.floor((remainingSeconds % palaSeconds) / vipalaSeconds);

    setClientVedicTime({
      ghati,
      pala,
      vipala,
      decimalGhati: normDecimalGhati
    });
  }, [data, tickingTime, travelTime, isLive]);

  // Periodic background data sync every 8 seconds to correct drift
  useEffect(() => {
    if (!isLive) return;

    const syncTimer = setInterval(() => {
      fetchData(new Date().toISOString());
    }, 8000);

    return () => clearInterval(syncTimer);
  }, [isLive, lat, lon, alt, role]);

  // Canvas drawing: Premium Circular Rasi Kundli
  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 25;

    // Clear Canvas
    ctx.clearRect(0, 0, W, H);

    // Draw Background Zodiac Ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10, 8, 18, 0.9)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(138, 43, 226, 0.4)";
    ctx.stroke();

    // Draw Rasi sectors (30 degrees each, offset so Aries starts at East/0)
    for (let i = 0; i < 12; i++) {
      const angleStart = (i * 30 * Math.PI) / 180;
      const angleEnd = ((i + 1) * 30 * Math.PI) / 180;

      // Draw dividing lines
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(angleStart), cy + R * Math.sin(angleStart));
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(138, 43, 226, 0.25)";
      ctx.stroke();

      // Write Sign Name (Sanskrit / English)
      const labelAngle = angleStart + Math.PI / 12;
      const labelRadius = R - 20;
      const lx = cx + labelRadius * Math.cos(labelAngle);
      const ly = cy + labelRadius * Math.sin(labelAngle);

      ctx.save();
      ctx.translate(lx, ly);
      // Align text rotation nicely
      let textRot = labelAngle + Math.PI / 2;
      if (labelAngle > Math.PI / 2 && labelAngle < (3 * Math.PI) / 2) {
        textRot -= Math.PI;
      }
      ctx.rotate(textRot);
      ctx.font = "8px 'Cinzel', serif";
      ctx.fillStyle = "rgba(212, 175, 55, 0.75)";
      ctx.textAlign = "center";
      ctx.fillText(RASIS[i].sanskrit.toUpperCase(), 0, 0);
      ctx.restore();
    }

    // Highlight Ascendant / Lagna Sector
    const lagnaLong = data.panchang.lagna.longitude;
    const lagnaAngle = (lagnaLong * Math.PI) / 180;
    
    // Draw Ascendant Needle
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(lagnaAngle), cy + R * Math.sin(lagnaAngle));
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#e91e63"; // Deep pink/red for Lagna line
    ctx.stroke();

    // Label Lagna Line End
    const lagX = cx + (R + 10) * Math.cos(lagnaAngle);
    const lagY = cy + (R + 10) * Math.sin(lagnaAngle);
    ctx.font = "9px 'Outfit', sans-serif";
    ctx.fillStyle = "#e91e63";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LAGNA", lagX, lagY);

    // Plot Planets
    const plottedPlanets = [...data.planets];
    
    // Include Mandi and Gulika as custom items
    plottedPlanets.push({
      name: "Gulika",
      sanskrit: "Gu",
      longitude: data.mandiGulika.gulikaLongitude,
      latitude: 0,
      distance: 0,
      speed: 0,
      isRetrograde: false,
      rasi: data.mandiGulika.gulikaRasi
    } as any);

    plottedPlanets.push({
      name: "Mandi",
      sanskrit: "Ma",
      longitude: data.mandiGulika.mandiLongitude,
      latitude: 0,
      distance: 0,
      speed: 0,
      isRetrograde: false,
      rasi: data.mandiGulika.mandiRasi
    } as any);

    // Render planets dots with collision avoidance (spread close ones radially)
    const planetMap: Record<number, number> = {}; // map floor angle to count
    
    plottedPlanets.forEach((p) => {
      const pAngle = (p.longitude * Math.PI) / 180;
      const degFloor = Math.floor(p.longitude / 4) * 4; // 4 degree bin
      
      // Calculate radial depth to prevent overlap
      const overlapCount = planetMap[degFloor] || 0;
      planetMap[degFloor] = overlapCount + 1;

      const radialDist = R - 40 - (overlapCount * 14);
      const px = cx + radialDist * Math.cos(pAngle);
      const py = cy + radialDist * Math.sin(pAngle);

      // Color scheme based on planet type
      let color = "white";
      if (p.name === "Sun") color = "#ffd700"; // gold
      else if (p.name === "Moon") color = "#e0e0ff"; // silver
      else if (p.name === "Rahu" || p.name === "Ketu") color = "#ff5722"; // shadow nodes red
      else if (p.name === "Gulika" || p.name === "Mandi") color = "#9c27b0"; // purple
      
      // Draw planet dot
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Draw Text label
      ctx.font = "bold 9px 'Outfit', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      
      // If retrograde, wrap name in square brackets or asterisk
      const label = p.isRetrograde ? `[${p.sanskrit.slice(0, 2)}]` : p.sanskrit.slice(0, 2);
      ctx.fillText(label, px, py - 6);
    });

  }, [data]);

  // Color picker helper for score rating
  const getRatingColor = (score: number) => {
    if (score >= 85) return { border: "border-[#d4af37]", text: "text-[#d4af37]", glow: "shadow-[#d4af37]/20" }; // Amrit gold
    if (score >= 65) return { border: "border-green-500", text: "text-green-400", glow: "shadow-green-500/20" }; // Shubh green
    if (score >= 45) return { border: "border-blue-400", text: "text-blue-300", glow: "shadow-blue-400/20" }; // Sama blue
    if (score >= 25) return { border: "border-orange-500", text: "text-orange-400", glow: "shadow-orange-500/20" }; // Varjya orange
    return { border: "border-red-500", text: "text-red-400", glow: "shadow-red-500/20" }; // Malignant red
  };

  const ratingColor = getRatingColor(muhurat?.score || 50);

  return (
    <div className="flex flex-col min-h-screen py-6 px-4 md:px-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center glass-panel p-5 rounded-2xl border-purple-900/50">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="w-12 h-12 rounded-full border border-[#d4af37] flex items-center justify-center bg-gradient-to-br from-[#d4af37]/10 to-purple-900/30 shadow-lg shadow-[#d4af37]/10">
            <Compass className="w-6 h-6 text-[#d4af37] animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wider uppercase text-[#d4af37] gold-glow-text">
              Vaidik Samaya
            </h1>
            <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase">
              High-Precision Panchang & Muhurat Dashboard
            </p>
          </div>
        </div>

        {/* Live Controller / Preset Selection */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-full bg-black/60 p-1 border border-purple-950">
            <button
              onClick={() => setIsLive(true)}
              className={`flex items-center px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
                isLive
                  ? "bg-gradient-to-r from-purple-800 to-[#d4af37]/80 text-white shadow-md shadow-purple-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Play className="w-3 h-3 mr-1.5 fill-current" />
              LIVE TICK
            </button>
            <button
              onClick={() => setIsLive(false)}
              className={`flex items-center px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
                !isLive
                  ? "bg-gradient-to-r from-purple-800 to-[#d4af37]/80 text-white shadow-md shadow-purple-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Pause className="w-3 h-3 mr-1.5 fill-current" />
              TRAVEL TIME
            </button>
          </div>

          <div className="flex items-center space-x-1 glass-panel p-1 rounded-full border-purple-950 bg-black/40">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => selectPreset(p)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all duration-300 ${
                  Math.abs(lat - p.lat) < 0.01 && Math.abs(lon - p.lon) < 0.01
                    ? "bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {p.name.split(",")[0]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Controls (L/R) */}
        <section className="xl:col-span-3 space-y-6">
          {/* Coordinates Panel */}
          <div className="glass-panel p-5 rounded-2xl bg-black/40">
            <h2 className="text-sm font-bold tracking-wider text-[#d4af37] mb-4 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              GEOGRAPHIC COORDINATES
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 bg-black/60 border border-purple-950 rounded-xl text-sm focus:outline-none focus:border-[#d4af37] text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lon}
                  onChange={(e) => setLon(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 bg-black/60 border border-purple-950 rounded-xl text-sm focus:outline-none focus:border-[#d4af37] text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Elevation / Altitude (m)
                </label>
                <input
                  type="number"
                  value={alt}
                  onChange={(e) => setAlt(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 bg-black/60 border border-purple-950 rounded-xl text-sm focus:outline-none focus:border-[#d4af37] text-white"
                />
              </div>
            </div>
          </div>

          {/* Time Travel Picker */}
          {!isLive && (
            <div className="glass-panel p-5 rounded-2xl bg-black/40 border-[#d4af37]/30 shadow-lg shadow-[#d4af37]/5 animate-pulse-slow">
              <h2 className="text-sm font-bold tracking-wider text-[#d4af37] mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                TEMPORAL CALIBRATOR
              </h2>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Target Date & Time (Local)
                </label>
                <input
                  type="datetime-local"
                  value={travelTime}
                  onChange={(e) => setTravelTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-black/60 border border-purple-950 rounded-xl text-sm focus:outline-none focus:border-[#d4af37] text-white"
                />
              </div>
            </div>
          )}

          {/* Muhurat Target Role Selection */}
          <div className="glass-panel p-5 rounded-2xl bg-black/40">
            <h2 className="text-sm font-bold tracking-wider text-[#d4af37] mb-4 flex items-center">
              <User className="w-4 h-4 mr-2" />
              MUHURAT TARGET ROLE
            </h2>
            <div className="space-y-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-300 flex justify-between items-center ${
                    role === r.id
                      ? "bg-purple-950/40 border-[#d4af37] text-white shadow-md shadow-purple-950"
                      : "bg-black/40 border-purple-950 text-zinc-400 hover:bg-black/60 hover:text-white"
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">{r.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{r.desc}</p>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 ${role === r.id ? "text-[#d4af37]" : "text-zinc-600"}`} />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Center Clock Widget (L/R) */}
        <section className="xl:col-span-5 space-y-6">
          {/* Circular Vedic Clock Card */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center bg-gradient-to-br from-black/80 to-purple-950/20 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute w-64 h-64 rounded-full bg-purple-600/10 blur-3xl -top-10 -left-10 animate-pulse-slow"></div>
            <div className="absolute w-64 h-64 rounded-full bg-[#d4af37]/5 blur-3xl -bottom-10 -right-10 animate-pulse-slow"></div>

            <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4 z-10">
              VAIDIK HOROLOGE (GHATI DIAL)
            </h2>

            {/* Glowing Clock Circle */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center z-10">
              {/* Outer Decorative Dial */}
              <div className="absolute inset-0 rounded-full border border-purple-900/60 p-2">
                <div className="w-full h-full rounded-full border border-dashed border-[#d4af37]/30 animate-spin-slow"></div>
              </div>

              {/* Dynamic Day/Night Shading Ring */}
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Dynamic night arc could go here, or standard SVG circles */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(138, 43, 226, 0.15)"
                  strokeWidth="6"
                />
                {/* Glowing Sunrise marker */}
                <line x1="50" y1="8" x2="50" y2="14" stroke="#d4af37" strokeWidth="1.5" />
              </svg>

              {/* Clock Ghati Numbers 0 to 60 */}
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                {[0, 10, 20, 30, 40, 50].map((num) => {
                  // Angle in degrees (60 divisions total, so 1 Ghati = 6 degrees)
                  const gAngle = (num * 6 - 90) * (Math.PI / 180);
                  const radiusOffset = 90; // Adjust for positioning
                  const style = {
                    left: `calc(50% + ${radiusOffset * Math.cos(gAngle)}px - 10px)`,
                    top: `calc(50% + ${radiusOffset * Math.sin(gAngle)}px - 10px)`,
                  };
                  return (
                    <span
                      key={num}
                      style={style}
                      className="absolute w-5 h-5 flex items-center justify-center text-[10px] font-bold text-zinc-400 bg-black/60 rounded-full border border-purple-900/40"
                    >
                      {num}
                    </span>
                  );
                })}
              </div>

              {/* Clock Center Pin */}
              <div className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-[#d4af37] to-[#ffd700] z-20 shadow-md shadow-[#d4af37]/50 border border-black"></div>

              {/* Rotating Gold Ghati Needle Pointer */}
              <div
                style={{
                  transform: `rotate(${(clientVedicTime.decimalGhati * 6 - 90)}deg)`,
                  transition: isLive ? "transform 0.4s linear" : "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                className="absolute w-1/2 h-2 flex items-center justify-end origin-left z-10"
              >
                <div className="w-4/5 h-1 bg-gradient-to-r from-transparent via-[#d4af37]/80 to-[#d4af37] rounded-full relative">
                  <div className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-yellow-400 border border-black shadow-lg shadow-yellow-500/50"></div>
                </div>
              </div>
            </div>

            {/* Digital Vedic Clock Timer */}
            <div className="mt-6 text-center z-10 bg-black/80 px-6 py-3 rounded-2xl border border-purple-900/50 shadow-inner">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                Vedic Sidereal Chronometer
              </p>
              <div className="text-3xl font-bold tracking-widest text-[#d4af37] mt-1 font-cinzel gold-glow-text">
                {String(clientVedicTime.ghati).padStart(2, "0")} :{" "}
                {String(clientVedicTime.pala).padStart(2, "0")} :{" "}
                {String(clientVedicTime.vipala).padStart(2, "0")}
              </div>
              <p className="text-[9px] text-[#8a2be2] font-semibold tracking-widest uppercase mt-1">
                Ghati : Pala : Vipala
              </p>
            </div>
          </div>

          {/* Sunrise / Sunset dynamic markers */}
          {data && (
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-2xl bg-black/40 flex items-center space-x-3">
                <Sun className="w-8 h-8 text-yellow-400 animate-pulse" />
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Sunrise (Vedic Start)</p>
                  <p className="text-sm font-semibold tracking-wider font-cinzel">
                    {new Date(data.sunriseStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="glass-panel p-4 rounded-2xl bg-black/40 flex items-center space-x-3">
                <Moon className="w-8 h-8 text-purple-400 animate-pulse" />
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Sunset (Day End)</p>
                  <p className="text-sm font-semibold tracking-wider font-cinzel">
                    {new Date(data.sunsetStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active Prahar card and progress */}
          {data && (
            <div className="glass-panel p-5 rounded-2xl bg-black/40 relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                    {data.prahar.isDay ? "DAY WATCH" : "NIGHT WATCH"} DIVISION
                  </p>
                  <h3 className="text-base font-bold text-white tracking-wider flex items-center font-cinzel">
                    <Clock className="w-4.5 h-4.5 mr-2 text-[#d4af37]" />
                    {data.prahar.sanskrit} ({data.prahar.index}/8)
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800 text-[10px] font-bold text-purple-300">
                  {data.prahar.isDay ? "Day Prahar" : "Night Prahar"}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                  <span>Start: {new Date(data.prahar.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>End: {new Date(data.prahar.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {/* Glowing Progress Bar */}
                <div className="w-full h-2.5 bg-black/70 rounded-full overflow-hidden border border-purple-950 p-[1.5px]">
                  <div
                    style={{ width: `${data.prahar.progress}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-[#d4af37] shadow-inner transition-all duration-500"
                  ></div>
                </div>
                <p className="text-[9px] text-[#d4af37] text-right font-bold uppercase tracking-widest mt-1">
                  {Math.round(data.prahar.progress)}% COMPLETED
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Right Columns: Rasi chart & Muhurat panel (L/R) */}
        <section className="xl:col-span-4 space-y-6">
          {/* Muhurat Score Circular ring */}
          {muhurat && (
            <div className="glass-panel p-6 rounded-3xl bg-black/40 flex flex-col items-center justify-center relative overflow-hidden">
              <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                MUHURAT AUSPICIOUSNESS RING
              </h2>

              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* SVG Progress Arc Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Outer Background ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.03)"
                    strokeWidth="10"
                  />
                  {/* Dynamic glow score ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={
                      muhurat.score >= 85 ? "#d4af37" :
                      muhurat.score >= 65 ? "#22c55e" :
                      muhurat.score >= 45 ? "#3b82f6" :
                      muhurat.score >= 25 ? "#f97316" : "#ef4444"
                    }
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - muhurat.score / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center score display */}
                <div className="absolute text-center">
                  <span className="text-4xl font-extrabold font-cinzel text-white tracking-tighter">
                    {muhurat.score}%
                  </span>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">
                    Auspicity
                  </p>
                </div>
              </div>

              {/* Rating संस्कृत Title Container */}
              <div className={`mt-5 px-5 py-2 rounded-2xl border bg-black/60 shadow-lg text-center ${ratingColor.border} ${ratingColor.glow}`}>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Time Evaluation</p>
                <p className={`text-sm font-extrabold uppercase font-cinzel ${ratingColor.text} tracking-wider`}>
                  {muhurat.rating}
                </p>
              </div>

              {/* Explanatory Factors list */}
              <div className="w-full mt-6 space-y-2 border-t border-purple-950 pt-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">
                  CRITICAL METRIC BREAKDOWN
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                  {muhurat.breakdown.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className={`text-xs p-2 rounded-xl flex justify-between items-center ${
                        item.type === "positive"
                          ? "bg-green-950/20 border border-green-900/40 text-green-300"
                          : item.type === "negative"
                          ? "bg-red-950/20 border border-red-900/40 text-red-300"
                          : "bg-zinc-950/40 border border-zinc-900 text-zinc-400"
                      }`}
                    >
                      <span className="font-semibold">{item.label}</span>
                      <span className="font-mono font-bold">{item.score > 0 ? `+${item.score}` : item.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rasi Circular Kundli Chart */}
          <div className="glass-panel p-5 rounded-3xl bg-black/40 flex flex-col items-center justify-center">
            <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4 flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              SIDEREAL ZODIAC (RASI KUNDLI)
            </h2>
            <div className="w-full aspect-square max-w-[280px] md:max-w-[320px] flex items-center justify-center relative">
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <p className="text-[9px] text-zinc-500 mt-2 uppercase font-medium tracking-widest text-center">
              Chitra Paksha / Lahiri Ayanamsa Enforced
            </p>
          </div>
        </section>

      </main>

      {/* 24 Hour Muhurat timeline */}
      {timeline.length > 0 && (
        <section className="glass-panel p-6 rounded-3xl bg-black/40">
          <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4 flex items-center">
            <TrendingUp className="w-4.5 h-4.5 mr-2" />
            24-HOUR AUSPICITY FORECAST TIMELINE
          </h2>
          <p className="text-xs text-zinc-400 mb-4 font-medium -mt-2">
            Click any hour slot below to "Time Travel" to that specific hour and inspect the planetary alignment and Panchang dynamics!
          </p>

          <div className="flex overflow-x-auto pb-4 space-x-3 pt-2">
            {timeline.map((hour: any, idx: number) => {
              const hDate = new Date(hour.time);
              const hourLabel = hDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isSelected = !isLive && travelTime && Math.abs(new Date(travelTime).getTime() - hDate.getTime()) < 1800000;
              const hRatingColor = getRatingColor(hour.score);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setIsLive(false);
                    // Match picker input format
                    setTravelTime(new Date(hDate.getTime() - hDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                  }}
                  className={`flex-shrink-0 w-24 p-3 rounded-2xl border text-center transition-all duration-300 ${
                    isSelected
                      ? "bg-[#d4af37]/20 border-[#d4af37] scale-105 shadow-md shadow-[#d4af37]/10"
                      : "bg-black/60 border-purple-950/60 hover:border-purple-800"
                  }`}
                >
                  <p className="text-[10px] font-bold text-zinc-400">{hourLabel}</p>
                  
                  {/* Miniature progress bar */}
                  <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden my-2 border border-purple-950">
                    <div
                      style={{ width: `${hour.score}%` }}
                      className={`h-full rounded-full ${
                        hour.score >= 85 ? "bg-[#d4af37]" :
                        hour.score >= 65 ? "bg-green-500" :
                        hour.score >= 45 ? "bg-blue-400" :
                        hour.score >= 25 ? "bg-orange-500" : "bg-red-500"
                      }`}
                    ></div>
                  </div>

                  <p className="text-sm font-extrabold tracking-tighter text-white font-cinzel">
                    {hour.score}%
                  </p>
                  <p className={`text-[8px] font-bold uppercase truncate mt-0.5 ${hRatingColor.text}`}>
                    {hour.rating.split(" ")[0]}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Grid: Panchang Panels and Planets coordinates table */}
      {data && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panchang Elements Widget grid */}
          <div className="lg:col-span-6 glass-panel p-5 rounded-3xl bg-black/40">
            <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4 flex items-center">
              <Layers className="w-4.5 h-4.5 mr-2" />
              PANCHANG METRICS (VIVECHANA)
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Tithi */}
              <div className="glass-panel p-4 rounded-2xl bg-black/60 border-purple-950 flex flex-col justify-between">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">TITHI (LUNAR DAY)</span>
                <span className="text-lg font-bold text-white tracking-wide font-cinzel mt-2">{data.panchang.tithi.name}</span>
                <div className="flex justify-between items-center mt-2 text-[10px]">
                  <span className="text-zinc-400 font-semibold uppercase">{data.panchang.tithi.paksha} Paksha</span>
                  <span className="text-zinc-600 font-bold">Index: {data.panchang.tithi.index}/30</span>
                </div>
              </div>

              {/* Nakshatra */}
              <div className="glass-panel p-4 rounded-2xl bg-black/60 border-purple-950 flex flex-col justify-between">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">NAKSHATRA (CONSTELLATION)</span>
                <span className="text-lg font-bold text-white tracking-wide font-cinzel mt-2">{data.panchang.nakshatra.name}</span>
                <div className="flex justify-between items-center mt-2 text-[10px]">
                  <span className="text-zinc-400 font-semibold uppercase">Moon Mansion</span>
                  <span className="text-zinc-600 font-bold">Index: {data.panchang.nakshatra.index}/27</span>
                </div>
              </div>

              {/* Yoga */}
              <div className="glass-panel p-4 rounded-2xl bg-black/60 border-purple-950 flex flex-col justify-between">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">YOGA (SOLAR-LUNAR UNION)</span>
                <span className="text-lg font-bold text-white tracking-wide font-cinzel mt-2">{data.panchang.yoga.name}</span>
                <div className="flex justify-between items-center mt-2 text-[10px]">
                  <span className="text-zinc-400 font-semibold uppercase">Mathematical Union</span>
                  <span className="text-zinc-600 font-bold">Index: {data.panchang.yoga.index}/27</span>
                </div>
              </div>

              {/* Karana */}
              <div className="glass-panel p-4 rounded-2xl bg-black/60 border-purple-950 flex flex-col justify-between">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">KARANA (HALF TITHI)</span>
                <span className="text-lg font-bold text-white tracking-wide font-cinzel mt-2 truncate">{data.panchang.karana.name.split(" ")[0]}</span>
                <div className="flex justify-between items-center mt-2 text-[10px]">
                  <span className="text-zinc-400 font-semibold uppercase">{data.panchang.karana.name.includes("Fixed") ? "Dhruva / Fixed" : "Chara / Repeating"}</span>
                  <span className="text-zinc-600 font-bold">Index: {data.panchang.karana.index}/60</span>
                </div>
              </div>

              {/* Vaara */}
              <div className="glass-panel p-4 rounded-2xl bg-black/60 border-purple-950 flex flex-col justify-between">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">VAARA (SOLAR DAY LORD)</span>
                <span className="text-lg font-bold text-white tracking-wide font-cinzel mt-2">{data.panchang.vaara.sanskrit}</span>
                <div className="flex justify-between items-center mt-2 text-[10px]">
                  <span className="text-zinc-400 font-semibold uppercase">{data.panchang.vaara.name}</span>
                  <span className="text-yellow-400 font-bold">Lord: {data.panchang.vaara.lord}</span>
                </div>
              </div>

              {/* Lagna */}
              <div className="glass-panel p-4 rounded-2xl bg-black/60 border-purple-950 flex flex-col justify-between">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">LAGNA (ASCENDANT SIGN)</span>
                <span className="text-lg font-bold text-white tracking-wide font-cinzel mt-2">{data.panchang.lagna.rasi.signSanskrit}</span>
                <div className="flex justify-between items-center mt-2 text-[10px]">
                  <span className="text-zinc-400 font-semibold uppercase">{data.panchang.lagna.rasi.signName}</span>
                  <span className="text-[#e91e63] font-bold">Deg: {Math.round(data.panchang.lagna.rasi.degreeInSign)}°</span>
                </div>
              </div>
            </div>
          </div>

          {/* Planetary Sidereal coordinates table */}
          <div className="lg:col-span-6 glass-panel p-5 rounded-3xl bg-black/40 overflow-hidden flex flex-col">
            <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4 flex items-center">
              <Compass className="w-4.5 h-4.5 mr-2" />
              SIDEREAL LEDGER (LAHIRI AYANAMSA)
            </h2>

            <div className="flex-grow overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-purple-950/80 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                    <th className="pb-3 pl-2">Graha</th>
                    <th className="pb-3">Sanskrit</th>
                    <th className="pb-3 text-right">Longitude</th>
                    <th className="pb-3 text-right">Zodiac Sign</th>
                    <th className="pb-3 text-right pr-2">Motion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/40">
                  {data.planets.map((p) => (
                    <tr key={p.name} className="hover:bg-purple-950/10 transition-colors duration-200">
                      <td className="py-2.5 pl-2 font-bold text-white">{p.name}</td>
                      <td className="py-2.5 font-medium text-purple-300 font-cinzel">{p.sanskrit}</td>
                      <td className="py-2.5 text-right font-mono text-zinc-300">
                        {Math.floor(p.longitude)}° {Math.round((p.longitude % 1) * 60)}'
                      </td>
                      <td className="py-2.5 text-right text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                        {p.rasi.degreeInSign.toFixed(1)}° {p.rasi.signSanskrit}
                      </td>
                      <td className="py-2.5 text-right pr-2">
                        {p.isRetrograde ? (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-red-950/40 border border-red-900/60 text-red-400">
                            Retro
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-green-950/40 border border-green-900/60 text-green-400">
                            Direct
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Mandi/Gulika & Aprakasha detailed widget */}
      {data && (
        <section className="glass-panel p-6 rounded-3xl bg-black/40">
          <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4 flex items-center">
            <ShieldAlert className="w-4.5 h-4.5 mr-2" />
            SHADOW MATHEMATICS (APRAKASHA & SATURNIAN PARTS)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aprakasha Grahas */}
            <div className="glass-panel p-5 rounded-2xl bg-black/60 border-purple-950/50">
              <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-4 font-cinzel">
                APRAKASHA SHADOW GRAHAS
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-black/40 border border-purple-950 p-3 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-purple-300 uppercase">Dhooma</p>
                  <p className="text-xs font-mono text-zinc-300 mt-2">
                    {Math.floor(data.aprakasha.dhooma)}°
                  </p>
                  <p className="text-[8px] text-zinc-500 font-bold truncate mt-1">
                    {getRasiPosition(data.aprakasha.dhooma).signSanskrit}
                  </p>
                </div>
                <div className="bg-black/40 border border-purple-950 p-3 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-purple-300 uppercase">Vyatipata</p>
                  <p className="text-xs font-mono text-zinc-300 mt-2">
                    {Math.floor(data.aprakasha.vyatipata)}°
                  </p>
                  <p className="text-[8px] text-zinc-500 font-bold truncate mt-1">
                    {getRasiPosition(data.aprakasha.vyatipata).signSanskrit}
                  </p>
                </div>
                <div className="bg-black/40 border border-purple-950 p-3 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-purple-300 uppercase">Parivesha</p>
                  <p className="text-xs font-mono text-zinc-300 mt-2">
                    {Math.floor(data.aprakasha.parivesha)}°
                  </p>
                  <p className="text-[8px] text-zinc-500 font-bold truncate mt-1">
                    {getRasiPosition(data.aprakasha.parivesha).signSanskrit}
                  </p>
                </div>
                <div className="bg-black/40 border border-purple-950 p-3 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-purple-300 uppercase">Indrachapa</p>
                  <p className="text-xs font-mono text-zinc-300 mt-2">
                    {Math.floor(data.aprakasha.indrachapa)}°
                  </p>
                  <p className="text-[8px] text-zinc-500 font-bold truncate mt-1">
                    {getRasiPosition(data.aprakasha.indrachapa).signSanskrit}
                  </p>
                </div>
                <div className="bg-black/40 border border-purple-950 p-3 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-purple-300 uppercase">Upaketu</p>
                  <p className="text-xs font-mono text-zinc-300 mt-2">
                    {Math.floor(data.aprakasha.upaketu)}°
                  </p>
                  <p className="text-[8px] text-zinc-500 font-bold truncate mt-1">
                    {getRasiPosition(data.aprakasha.upaketu).signSanskrit}
                  </p>
                </div>
              </div>
            </div>

            {/* Mandi & Gulika */}
            <div className="glass-panel p-5 rounded-2xl bg-black/60 border-purple-950/50 grid grid-cols-2 gap-4">
              {/* Gulika */}
              <div className="border border-purple-950/80 p-4 rounded-xl flex flex-col justify-between bg-black/30">
                <div>
                  <span className="text-[9px] text-[#9c27b0] font-extrabold uppercase tracking-widest">
                    GULIKA (SATURN START PORTION)
                  </span>
                  <h4 className="text-base font-bold text-white tracking-wide font-cinzel mt-1">
                    {data.mandiGulika.gulikaRasi.signSanskrit} Sign
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Deg: {data.mandiGulika.gulikaLongitude.toFixed(2)}°
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-purple-950/40 text-[9px] text-zinc-400">
                  <span className="font-semibold uppercase tracking-wider block">Calculated Rise Time:</span>
                  <span className="font-mono font-bold text-zinc-300">
                    {new Date(data.mandiGulika.gulikaTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Mandi */}
              <div className="border border-purple-950/80 p-4 rounded-xl flex flex-col justify-between bg-black/30">
                <div>
                  <span className="text-[9px] text-[#9c27b0] font-extrabold uppercase tracking-widest">
                    MANDI (SATURN END PORTION)
                  </span>
                  <h4 className="text-base font-bold text-white tracking-wide font-cinzel mt-1">
                    {data.mandiGulika.mandiRasi.signSanskrit} Sign
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Deg: {data.mandiGulika.mandiLongitude.toFixed(2)}°
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-purple-950/40 text-[9px] text-zinc-400">
                  <span className="font-semibold uppercase tracking-wider block">Calculated Rise Time:</span>
                  <span className="font-mono font-bold text-zinc-300">
                    {new Date(data.mandiGulika.mandiTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
