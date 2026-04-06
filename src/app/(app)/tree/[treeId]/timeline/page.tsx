import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { db } from "@/lib/db";
import { persons, lifeEvents, locations } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { FamilyTimeline } from "@/components/timeline/family-timeline";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ treeId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) notFound();

  const treePersons = await db
    .select()
    .from(persons)
    .where(eq(persons.familyTreeId, treeId));

  const personIds = treePersons.map((p) => p.id);

  const groups = treePersons.map((p) => ({
    id: p.id,
    content: `${p.firstName} ${p.lastName}`,
  }));

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

  // Lifespan bars
  for (const person of treePersons) {
    if (person.birthDate) {
      items.push({
        id: `lifespan-${person.id}`,
        group: person.id,
        content: `${person.firstName} ${person.lastName}`,
        start: person.birthDate,
        end:
          person.deathDate ||
          (person.isLiving
            ? new Date().toISOString().split("T")[0]
            : undefined),
        type: person.deathDate || person.isLiving ? "range" : "point",
        className: "lifespan",
      });
    }
  }

  if (personIds.length > 0) {
    const events = await db
      .select()
      .from(lifeEvents)
      .where(inArray(lifeEvents.personId, personIds));

    const locationIds = events
      .map((e) => e.locationId)
      .filter(Boolean) as string[];

    const locs =
      locationIds.length > 0
        ? await db
            .select()
            .from(locations)
            .where(inArray(locations.id, locationIds))
        : [];

    const locationMap = new Map(locs.map((l) => [l.id, l]));

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
      if (!event.startDate) continue;
      const loc = event.locationId
        ? locationMap.get(event.locationId)
        : null;
      const label =
        event.title || eventTypeLabels[event.type] || event.type;
      const locationLabel = loc ? ` (${loc.name})` : "";

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

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Zeitstrahl</h1>
        <p className="text-sm text-muted-foreground">
          Lebensspannen und Ereignisse deiner Familie
        </p>
      </div>
      <div className="flex-1 p-4">
        <FamilyTimeline items={items} groups={groups} />
      </div>
    </div>
  );
}
