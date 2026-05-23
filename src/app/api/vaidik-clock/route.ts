import { NextRequest, NextResponse } from "next/server";
import { calculateVedicData } from "@/lib/vedic-math";
import { getMuhuratScore, UserRole } from "@/lib/muhurat-rules";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, altitude = 0, utc_time, user_role = "student" } = body;

    if (latitude === undefined || longitude === undefined)
      return NextResponse.json({ error: "Latitude and longitude are required." }, { status: 400 });

    const parsedLat = parseFloat(latitude);
    const parsedLon = parseFloat(longitude);
    const parsedAlt = parseFloat(altitude);
    if (isNaN(parsedLat) || isNaN(parsedLon))
      return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });

    const targetTimeStr = utc_time || new Date().toISOString();
    const role = user_role as UserRole;

    const vedicData   = await calculateVedicData(parsedLat, parsedLon, parsedAlt, targetTimeStr);
    const muhurat     = getMuhuratScore(vedicData, role);

    // 24-hour hourly forecast
    const targetMs = new Date(targetTimeStr).getTime();
    const timeline = [];
    for (let i = 0; i < 24; i++) {
      const hourStr  = new Date(targetMs + i*3600*1000).toISOString();
      const hourData = await calculateVedicData(parsedLat, parsedLon, parsedAlt, hourStr);
      const hourMuh  = getMuhuratScore(hourData, role);
      timeline.push({ time: hourStr, score: hourMuh.score, rating: hourMuh.rating });
    }

    return NextResponse.json({
      success: true,
      data: vedicData,
      muhurat: { role, score: muhurat.score, rating: muhurat.rating, breakdown: muhurat.breakdown },
      timeline,
    });
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
