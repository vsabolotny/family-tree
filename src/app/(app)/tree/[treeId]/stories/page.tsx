import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { stories, storyPersons, persons } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { StoriesOverview } from "@/components/stories/stories-overview";

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ treeId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) notFound();

  const allStories = await db
    .select()
    .from(stories)
    .where(eq(stories.familyTreeId, treeId))
    .orderBy(stories.createdAt);

  const storyIds = allStories.map((s) => s.id);
  const linkedPersons =
    storyIds.length > 0
      ? await db
          .select({
            storyId: storyPersons.storyId,
            personId: storyPersons.personId,
            firstName: persons.firstName,
            lastName: persons.lastName,
          })
          .from(storyPersons)
          .innerJoin(persons, eq(storyPersons.personId, persons.id))
          .where(inArray(storyPersons.storyId, storyIds))
      : [];

  const storiesWithPersons = allStories.map((story) => ({
    ...story,
    persons: linkedPersons.filter((lp) => lp.storyId === story.id),
  }));

  const allPersons = await db
    .select({ id: persons.id, firstName: persons.firstName, lastName: persons.lastName })
    .from(persons)
    .where(eq(persons.familyTreeId, treeId));

  return (
    <StoriesOverview
      treeId={treeId}
      stories={storiesWithPersons}
      allPersons={allPersons}
      canEdit={access.role === "owner" || access.role === "editor"}
    />
  );
}
