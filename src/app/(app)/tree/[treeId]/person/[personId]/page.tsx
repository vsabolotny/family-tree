import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  persons,
  relations,
  stories,
  storyPersons,
  media,
  mediaPersons,
  lifeEvents,
  locations,
} from "@/lib/db/schema";
import { and, eq, or, inArray } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { PersonProfile } from "@/components/person/person-profile";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ treeId: string; personId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { treeId, personId } = await params;

  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) notFound();

  const [person] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, personId), eq(persons.familyTreeId, treeId)))
    .limit(1);

  if (!person) notFound();

  // Fetch relations with person names
  const personRelations = await db
    .select()
    .from(relations)
    .where(
      and(
        eq(relations.familyTreeId, treeId),
        or(eq(relations.personAId, personId), eq(relations.personBId, personId))
      )
    );

  const relatedIds = personRelations.flatMap((r) =>
    [r.personAId, r.personBId].filter((id) => id !== personId)
  );
  const relatedPersons =
    relatedIds.length > 0
      ? await db
          .select({ id: persons.id, firstName: persons.firstName, lastName: persons.lastName })
          .from(persons)
          .where(inArray(persons.id, relatedIds))
      : [];

  // Fetch stories linked to this person
  const storyLinks = await db
    .select({ storyId: storyPersons.storyId })
    .from(storyPersons)
    .where(eq(storyPersons.personId, personId));

  const personStories =
    storyLinks.length > 0
      ? await db
          .select()
          .from(stories)
          .where(inArray(stories.id, storyLinks.map((sl) => sl.storyId)))
      : [];

  // Fetch media linked to this person
  const mediaLinks = await db
    .select({ mediaId: mediaPersons.mediaId })
    .from(mediaPersons)
    .where(eq(mediaPersons.personId, personId));

  const personMedia =
    mediaLinks.length > 0
      ? await db
          .select()
          .from(media)
          .where(inArray(media.id, mediaLinks.map((ml) => ml.mediaId)))
      : [];

  // Fetch life events with locations
  const events = await db
    .select()
    .from(lifeEvents)
    .where(eq(lifeEvents.personId, personId));

  const locationIds = events.map((e) => e.locationId).filter(Boolean) as string[];
  const eventLocations =
    locationIds.length > 0
      ? await db.select().from(locations).where(inArray(locations.id, locationIds))
      : [];

  // All persons for tagging in stories/media
  const allPersons = await db
    .select({ id: persons.id, firstName: persons.firstName, lastName: persons.lastName })
    .from(persons)
    .where(eq(persons.familyTreeId, treeId));

  return (
    <PersonProfile
      treeId={treeId}
      person={person}
      relations={personRelations}
      relatedPersons={relatedPersons}
      stories={personStories}
      media={personMedia}
      lifeEvents={events}
      locations={eventLocations}
      allPersons={allPersons}
      canEdit={access.role === "owner" || access.role === "editor"}
    />
  );
}
