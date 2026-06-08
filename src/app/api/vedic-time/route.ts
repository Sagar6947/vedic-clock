import { NextRequest, NextResponse } from "next/server";
import { civilToVedic, formatVedic } from "@/lib/vedicTime";
import { getFullPanchang } from "@/lib/panchang";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lonStr = searchParams.get("lon");
    const altStr = searchParams.get("elevation");
    const atStr = searchParams.get("at");

    if (!latStr || !lonStr) {
      return NextResponse.json({ error: "lat and lon query parameters are required" }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    const elevation = altStr ? parseFloat(altStr) : 490; // Default elevation to 490 (Ujjain) if not provided

    if (isNaN(lat) || isNaN(lon) || isNaN(elevation)) {
      return NextResponse.json({ error: "Invalid coordinates provided" }, { status: 400 });
    }

    const targetTime = atStr ? new Date(atStr) : new Date();

    if (isNaN(targetTime.getTime())) {
      return NextResponse.json({ error: "Invalid 'at' timestamp provided" }, { status: 400 });
    }

    // Pass configuration location to module
    const location = { lat, lon, elevation };

    try {
      const vedicTime = await civilToVedic(targetTime, location);
      const panchang = await getFullPanchang(targetTime, location);
      
      // Calculate IST and GMT strings for reference
      // IST is UTC + 5:30
      const istDate = new Date(targetTime.getTime() + 5.5 * 3600 * 1000);
      const istStr = istDate.toISOString().replace("Z", "+05:30");
      const gmtStr = targetTime.toISOString();

      return NextResponse.json({
        success: true,
        data: {
          ...vedicTime,
          formatted: formatVedic(vedicTime)
        },
        panchang,
        reference: {
          ist: istStr,
          gmt: gmtStr
        }
      });
    } catch (e: any) {
      // Graceful error handling for polar / missing sunrise cases
      return NextResponse.json({ error: e.message || "Failed to calculate Vedic time" }, { status: 400 });
    }

  } catch (err: any) {
    console.error("API Error in /api/vedic-time:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
