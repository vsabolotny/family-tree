import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { lifeEvents, locations, persons } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { z } from "zod";

type RouteParams = { params: Promise<{ treeId: string }> };

const createLifeEventSchema = z.object({
  personId: z.string().uuid(),
  type: z.enum([
    "residence",
    "birth",
    "death",
    "education",
    "occupation",
    "migration",
    "military",
    "custom",
  ]),
  title: z.string().max(500).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // Location can be provided inline or as existing ID
  locationId: z.string().uuid().optional(),
  location: z
    .object({
      name: z.string().min(1),
      latitude: z.number(),
      longitude: z.number(),
      country: z.string().optional(),
      countryCode: z.string().max(2).optional(),
      region: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
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

  // Get all persons in tree
  const treePersons = await db
    .select({ id: persons.id })
    .from(persons)
    .where(eq(persons.familyTreeId, treeId));

  const personIds = treePersons.map((p) => p.id);
  if (personIds.length === 0) {
    return NextResponse.json([]);
  }

  const events = await db
    .select()
    .from(lifeEvents)
    .where(inArray(lifeEvents.personId, personIds));

  // Get related locations
  const locationIds = events
    .map((e) => e.locationId)
    .filter(Boolean) as string[];

  const eventLocations =
    locationIds.length > 0
      ? await db
          .select()
          .from(locations)
          .where(inArray(locations.id, locationIds))
      : [];

  // Get person names
  const eventPersons = await db
    .select({ id: persons.id, firstName: persons.firstName, lastName: persons.lastName })
    .from(persons)
    .where(inArray(persons.id, personIds));

  const locationMap = new Map(eventLocations.map((l) => [l.id, l]));
  const personMap = new Map(eventPersons.map((p) => [p.id, p]));

  const enriched = events.map((event) => ({
    ...event,
    location: event.locationId ? locationMap.get(event.locationId) || null : null,
    person: personMap.get(event.personId) || null,
  }));

  return NextResponse.json(enriched);
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
  const parsed = createLifeEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  let locationId = parsed.data.locationId || null;

  // Create location if provided inline
  if (!locationId && parsed.data.location) {
    const [loc] = await db
      .insert(locations)
      .values({
        familyTreeId: treeId,
        name: parsed.data.location.name,
        latitude: parsed.data.location.latitude.toString(),
        longitude: parsed.data.location.longitude.toString(),
        country: parsed.data.location.country || null,
        countryCode: parsed.data.location.countryCode || null,
        region: parsed.data.location.region || null,
        city: parsed.data.location.city || null,
      })
      .returning();
    locationId = loc.id;
  }

  const [event] = await db
    .insert(lifeEvents)
    .values({
      personId: parsed.data.personId,
      type: parsed.data.type,
      title: parsed.data.title || null,
      description: parsed.data.description || null,
      startDate: parsed.data.startDate || null,
      endDate: parsed.data.endDate || null,
      locationId,
    })
    .returning();

  return NextResponse.json(event, { status: 201 });
}
