import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { db } from "@/lib/db";
import {
  persons,
  lifeEvents,
  locations,
  media,
  mediaPersons,
  familyTrees,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  HeritageTimeline,
  type TimelineEntry,
} from "@/components/timeline/heritage-timeline";

function formatDateDisplay(startDate: string, endDate?: string | null): string {
  const start = new Date(startDate);
  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];

  if (endDate) {
    const end = new Date(endDate);
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    if (startYear === endYear) {
      return `${startYear}`;
    }
    return `${startYear} – ${endYear}`;
  }

  const month = months[start.getMonth()];
  const day = start.getDate();
  const year = start.getFullYear();
  return `${day}. ${month} ${year}`;
}

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

  const [tree] = await db
    .select()
    .from(familyTrees)
    .where(eq(familyTrees.id, treeId))
    .limit(1);

  const treePersons = await db
    .select()
    .from(persons)
    .where(eq(persons.familyTreeId, treeId));

  const personIds = treePersons.map((p) => p.id);
  const personMap = new Map(treePersons.map((p) => [p.id, p]));

  if (personIds.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-12 bg-background">
        <HeritageTimeline
          treeId={treeId}
          entries={[]}
          treeName={tree?.name || "Zeitstrahl"}
          treeDescription={tree?.description}
        />
      </div>
    );
  }

  // Fetch events, locations, and media
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

  // Fetch all media for persons
  const allMedia = await db
    .select()
    .from(media)
    .where(eq(media.familyTreeId, treeId));

  const allMediaPersons = await db.select().from(mediaPersons);

  // Build a map: personId -> media[]
  const personMediaMap = new Map<string, typeof allMedia>();
  for (const mp of allMediaPersons) {
    const m = allMedia.find((am) => am.id === mp.mediaId);
    if (m && m.type === "image") {
      const existing = personMediaMap.get(mp.personId) || [];
      existing.push(m);
      personMediaMap.set(mp.personId, existing);
    }
  }

  // Group significant events for timeline entries
  // We pick: migrations, births (of first gen), deaths, military, education -- the "story-worthy" ones
  const significantTypes = new Set([
    "migration",
    "birth",
    "death",
    "military",
    "education",
    "occupation",
  ]);

  // Collect significant events
  const significantEvents = events
    .filter((e) => e.startDate && significantTypes.has(e.type))
    .sort((a, b) => (a.startDate! > b.startDate! ? 1 : -1));

  // Merge events close in time and location into timeline entries
  const entries: TimelineEntry[] = [];
  const usedEventIds = new Set<string>();

  // First: create "breakout" entries for major periods (wars, mass migrations)
  const militaryEvents = significantEvents.filter(
    (e) => e.type === "military" && e.endDate
  );
  for (const me of militaryEvents) {
    const person = personMap.get(me.personId);
    const loc = me.locationId ? locationMap.get(me.locationId) : null;

    // Find related events in same period
    const relatedEvents = significantEvents.filter(
      (e) =>
        e.id !== me.id &&
        e.startDate &&
        me.startDate &&
        me.endDate &&
        e.startDate >= me.startDate &&
        e.startDate <= me.endDate
    );

    const allPersonIds = [
      me.personId,
      ...relatedEvents.map((e) => e.personId),
    ].filter((v, i, a) => a.indexOf(v) === i);

    const locationTags = [loc?.city, ...relatedEvents.map((e) => {
      const l = e.locationId ? locationMap.get(e.locationId) : null;
      return l?.city;
    })].filter((v, i, a) => v && a.indexOf(v) === i) as string[];

    entries.push({
      id: me.id,
      date: me.startDate!,
      dateDisplay: formatDateDisplay(me.startDate!, me.endDate),
      title: me.title || "Militärdienst",
      description: me.description || `${person?.firstName} ${person?.lastName} im Militärdienst.`,
      locationTags,
      personIds: allPersonIds,
      personNames: allPersonIds.map((pid) => {
        const p = personMap.get(pid);
        return p ? `${p.firstName} ${p.lastName}` : "";
      }),
      personAvatars: allPersonIds.map(
        (pid) => personMap.get(pid)?.profileImageUrl || ""
      ),
      eventType: me.type,
      imageUrl: "/seed-images/globe-antique.jpg",
      imageCaption: null,
      isBreakout: true,
    });
    usedEventIds.add(me.id);
    relatedEvents.forEach((e) => usedEventIds.add(e.id));
  }

  // Then: create standard entries for remaining events
  for (const event of significantEvents) {
    if (usedEventIds.has(event.id)) continue;

    const person = personMap.get(event.personId);
    if (!person) continue;
    const loc = event.locationId ? locationMap.get(event.locationId) : null;

    // Find a relevant image
    const personMedia = personMediaMap.get(event.personId);
    let imageUrl: string | null = null;
    let imageCaption: string | null = null;
    if (personMedia && personMedia.length > 0) {
      // Pick the media closest in time to the event
      const closest = personMedia.sort((a, b) => {
        const da = a.dateTaken
          ? Math.abs(
              new Date(a.dateTaken).getTime() -
                new Date(event.startDate!).getTime()
            )
          : Infinity;
        const db2 = b.dateTaken
          ? Math.abs(
              new Date(b.dateTaken).getTime() -
                new Date(event.startDate!).getTime()
            )
          : Infinity;
        return da - db2;
      })[0];
      imageUrl = closest.url;
      imageCaption = closest.caption;
    }

    entries.push({
      id: event.id,
      date: event.startDate!,
      dateDisplay: formatDateDisplay(event.startDate!, event.endDate),
      title: event.title || event.type,
      description:
        event.description ||
        `${person.firstName} ${person.lastName} -- ${event.type}.`,
      locationTags: loc?.city ? [loc.city] : [],
      personIds: [person.id],
      personNames: [`${person.firstName} ${person.lastName}`],
      personAvatars: [person.profileImageUrl || ""],
      eventType: event.type,
      imageUrl,
      imageCaption,
      isBreakout: false,
    });
  }

  // Sort entries by date
  entries.sort((a, b) => (a.date > b.date ? 1 : -1));

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-background">
      <HeritageTimeline
        treeId={treeId}
        entries={entries}
        treeName={`Die ${tree?.name || ""} Migrationen`}
        treeDescription="Eine chronologische Aufzeichnung unserer Familie über Kontinente und Jahrzehnte, zusammengestellt aus Tagebüchern, Schiffsmanifesten und Archivdokumenten."
      />
    </div>
  );
}
