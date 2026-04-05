import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { stories, storyPersons, persons } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { z } from "zod";

type RouteParams = { params: Promise<{ treeId: string }> };

const createStorySchema = z.object({
  title: z.string().min(1).max(500),
  content: z.unknown(),
  personIds: z.array(z.string().uuid()).min(1),
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

  return NextResponse.json(storiesWithPersons);
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
  const parsed = createStorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [story] = await db
    .insert(stories)
    .values({
      familyTreeId: treeId,
      title: parsed.data.title,
      content: parsed.data.content,
      authorUserId: session.user.id,
    })
    .returning();

  if (parsed.data.personIds.length > 0) {
    await db.insert(storyPersons).values(
      parsed.data.personIds.map((personId) => ({
        storyId: story.id,
        personId,
      }))
    );
  }

  return NextResponse.json(story, { status: 201 });
}
