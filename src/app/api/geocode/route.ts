import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  // Use OpenStreetMap Nominatim (free, no API key required)
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&accept-language=de`;

  const res = await fetch(nominatimUrl, {
    headers: {
      "User-Agent": "Stammbaum-App/1.0",
    },
  });

  if (!res.ok) {
    return NextResponse.json([]);
  }

  const data = await res.json();

  const results = data.map(
    (item: {
      display_name: string;
      lat: string;
      lon: string;
      address?: {
        country?: string;
        country_code?: string;
        state?: string;
        city?: string;
        town?: string;
        village?: string;
      };
    }) => ({
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      country: item.address?.country || null,
      countryCode: item.address?.country_code?.toUpperCase() || null,
      region: item.address?.state || null,
      city:
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        null,
    })
  );

  return NextResponse.json(results);
}
