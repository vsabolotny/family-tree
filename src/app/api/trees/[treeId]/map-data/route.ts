import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { persons, lifeEvents, locations } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";

type RouteParams = { params: Promise<{ treeId: string }> };

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

  const treePersons = await db
    .select()
    .from(persons)
    .where(eq(persons.familyTreeId, treeId));

  const personIds = treePersons.map((p) => p.id);
  if (personIds.length === 0) {
    return NextResponse.json({ markers: [] });
  }

  const events = await db
    .select()
    .from(lifeEvents)
    .where(inArray(lifeEvents.personId, personIds));

  const locationIds = events
    .map((e) => e.locationId)
    .filter(Boolean) as string[];

  if (locationIds.length === 0) {
    return NextResponse.json({ markers: [] });
  }

  const locs = await db
    .select()
    .from(locations)
    .where(inArray(locations.id, locationIds));

  const locationMap = new Map(locs.map((l) => [l.id, l]));
  const personMap = new Map(treePersons.map((p) => [p.id, p]));

  const markers = events
    .filter((e) => e.locationId)
    .map((event) => {
      const loc = locationMap.get(event.locationId!);
      const person = personMap.get(event.personId);
      if (!loc || !person) return null;

      return {
        id: event.id,
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude),
        locationName: loc.name,
        country: loc.country,
        personId: person.id,
        personName: `${person.firstName} ${person.lastName}`,
        eventType: event.type,
        eventTitle: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ markers });
}
