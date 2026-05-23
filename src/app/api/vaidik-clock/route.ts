import { NextRequest, NextResponse } from "next/server";
import { calculateVedicData } from "@/lib/vedic-math";
import { getMuhuratScore, UserRole } from "@/lib/muhurat-rules";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      latitude, 
      longitude, 
      altitude = 0, 
      utc_time, 
      user_role = "student" 
    } = body;

    // Validate inputs
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Latitude and longitude are required." },
        { status: 400 }
      );
    }

    const parsedLat = parseFloat(latitude);
    const parsedLon = parseFloat(longitude);
    const parsedAlt = parseFloat(altitude);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      return NextResponse.json(
        { error: "Invalid coordinates provided." },
        { status: 400 }
      );
    }

    const targetTimeStr = utc_time || new Date().toISOString();
    const role = user_role as UserRole;

    // 1. Calculate Core Vedic Clock Data
    const vedicData = await calculateVedicData(parsedLat, parsedLon, parsedAlt, targetTimeStr);

    // 2. Calculate Muhurat Score for current time
    const muhuratScore = getMuhuratScore(vedicData, role);

    // 3. Compute 24-Hour Forecast Timeline (hourly scores)
    const timeline = [];
    const targetMs = new Date(targetTimeStr).getTime();
    
    for (let i = 0; i < 24; i++) {
      const hourMs = targetMs + i * 60 * 60 * 1000;
      const hourTimeStr = new Date(hourMs).toISOString();
      
      // Calculate data and score for this forecast hour
      const hourVedic = await calculateVedicData(parsedLat, parsedLon, parsedAlt, hourTimeStr);
      const hourScore = getMuhuratScore(hourVedic, role);
      
      timeline.push({
        time: hourTimeStr,
        score: hourScore.score,
        rating: hourScore.rating,
      });
    }

    // Return combined result
    return NextResponse.json({
      success: true,
      data: vedicData,
      muhurat: {
        role,
        score: muhuratScore.score,
        rating: muhuratScore.rating,
        breakdown: muhuratScore.breakdown,
      },
      timeline,
    });
  } catch (error: any) {
    console.error("API Error in vaidik-clock:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
