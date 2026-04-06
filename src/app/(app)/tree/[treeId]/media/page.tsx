import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { media, mediaPersons, persons } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { MediaOverview } from "@/components/media/media-overview";

export default async function MediaPage({
  params,
}: {
  params: Promise<{ treeId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) notFound();

  const allMedia = await db
    .select()
    .from(media)
    .where(eq(media.familyTreeId, treeId))
    .orderBy(media.createdAt);

  const mediaIds = allMedia.map((m) => m.id);
  const linkedPersons =
    mediaIds.length > 0
      ? await db
          .select({
            mediaId: mediaPersons.mediaId,
            personId: mediaPersons.personId,
            firstName: persons.firstName,
            lastName: persons.lastName,
          })
          .from(mediaPersons)
          .innerJoin(persons, eq(mediaPersons.personId, persons.id))
          .where(inArray(mediaPersons.mediaId, mediaIds))
      : [];

  const mediaWithPersons = allMedia.map((m) => ({
    ...m,
    persons: linkedPersons.filter((lp) => lp.mediaId === m.id),
  }));

  const allPersons = await db
    .select({ id: persons.id, firstName: persons.firstName, lastName: persons.lastName })
    .from(persons)
    .where(eq(persons.familyTreeId, treeId));

  return (
    <MediaOverview
      treeId={treeId}
      media={mediaWithPersons}
      allPersons={allPersons}
      canEdit={access.role === "owner" || access.role === "editor"}
    />
  );
}
