import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { locations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { z } from "zod";

type RouteParams = { params: Promise<{ treeId: string }> };

const createLocationSchema = z.object({
  name: z.string().min(1).max(500),
  formattedAddress: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  country: z.string().optional(),
  countryCode: z.string().max(2).optional(),
  region: z.string().optional(),
  city: z.string().optional(),
});

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const allLocations = await db
    .select()
    .from(locations)
    .where(eq(locations.familyTreeId, treeId));

  return NextResponse.json(allLocations);
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createLocationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [location] = await db
    .insert(locations)
    .values({
      familyTreeId: treeId,
      name: parsed.data.name,
      formattedAddress: parsed.data.formattedAddress || null,
      latitude: parsed.data.latitude.toString(),
      longitude: parsed.data.longitude.toString(),
      country: parsed.data.country || null,
      countryCode: parsed.data.countryCode || null,
      region: parsed.data.region || null,
      city: parsed.data.city || null,
    })
    .returning();

  return NextResponse.json(location, { status: 201 });
}
