import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { db } from "@/lib/db";
import { persons, lifeEvents, locations } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { FamilyMap } from "@/components/map/family-map";

export default async function MapPage({
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

  let markers: Array<{
    id: string;
    latitude: number;
    longitude: number;
    locationName: string;
    country: string | null;
    personId: string;
    personName: string;
    eventType: string;
    eventTitle: string | null;
    startDate: string | null;
    endDate: string | null;
  }> = [];

  if (personIds.length > 0) {
    const events = await db
      .select()
      .from(lifeEvents)
      .where(inArray(lifeEvents.personId, personIds));

    const locationIds = events
      .map((e) => e.locationId)
      .filter(Boolean) as string[];

    if (locationIds.length > 0) {
      const locs = await db
        .select()
        .from(locations)
        .where(inArray(locations.id, locationIds));

      const locationMap = new Map(locs.map((l) => [l.id, l]));
      const personMap = new Map(treePersons.map((p) => [p.id, p]));

      markers = events
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
        .filter(Boolean) as typeof markers;
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-surface-low p-4">
        <h1 className="text-xl font-semibold">Weltkarte</h1>
        <p className="text-sm text-muted-foreground">
          Orte, an denen deine Familie gelebt hat
        </p>
      </div>
      <div className="flex-1">
        <FamilyMap
          treeId={treeId}
          markers={markers}
          mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
        />
      </div>
    </div>
  );
}
