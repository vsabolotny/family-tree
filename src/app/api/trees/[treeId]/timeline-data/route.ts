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
    return NextResponse.json({ items: [], groups: [] });
  }

  const events = await db
    .select()
    .from(lifeEvents)
    .where(inArray(lifeEvents.personId, personIds));

  const locationIds = events
    .map((e) => e.locationId)
    .filter(Boolean) as string[];

  const locs =
    locationIds.length > 0
      ? await db.select().from(locations).where(inArray(locations.id, locationIds))
      : [];

  const locationMap = new Map(locs.map((l) => [l.id, l]));

  // Groups = persons (each person is a row in the timeline)
  const groups = treePersons.map((p) => ({
    id: p.id,
    content: `${p.firstName} ${p.lastName}`,
  }));

  // Items = life events + lifespan bars
  const items: Array<{
    id: string;
    group: string;
    content: string;
    start: string;
    end?: string;
    type: string;
    className?: string;
    title?: string;
  }> = [];

  // Lifespan bars for each person
  for (const person of treePersons) {
    if (person.birthDate) {
      items.push({
        id: `lifespan-${person.id}`,
        group: person.id,
        content: `${person.firstName} ${person.lastName}`,
        start: person.birthDate,
        end: person.deathDate || (person.isLiving ? new Date().toISOString().split("T")[0] : undefined),
        type: person.deathDate || person.isLiving ? "range" : "point",
        className: "lifespan",
      });
    }
  }

  // Life events
  const eventTypeLabels: Record<string, string> = {
    residence: "Wohnort",
    birth: "Geburt",
    death: "Tod",
    education: "Ausbildung",
    occupation: "Beruf",
    migration: "Migration",
    military: "Militär",
    custom: "Ereignis",
  };

  for (const event of events) {
    const loc = event.locationId ? locationMap.get(event.locationId) : null;
    const label = event.title || eventTypeLabels[event.type] || event.type;
    const locationLabel = loc ? ` (${loc.name})` : "";

    if (event.startDate) {
      items.push({
        id: event.id,
        group: event.personId,
        content: `${label}${locationLabel}`,
        start: event.startDate,
        end: event.endDate || undefined,
        type: event.endDate ? "range" : "point",
        className: `event-${event.type}`,
        title: event.description || undefined,
      });
    }
  }

  return NextResponse.json({ items, groups });
}
