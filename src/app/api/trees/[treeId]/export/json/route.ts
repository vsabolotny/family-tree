import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  familyTrees,
  persons,
  relations,
  stories,
  storyPersons,
  media,
  mediaPersons,
  lifeEvents,
  locations,
  comments,
} from "@/lib/db/schema";
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

  const [tree] = await db.select().from(familyTrees).where(eq(familyTrees.id, treeId)).limit(1);
  const allPersons = await db.select().from(persons).where(eq(persons.familyTreeId, treeId));
  const allRelations = await db.select().from(relations).where(eq(relations.familyTreeId, treeId));
  const allStories = await db.select().from(stories).where(eq(stories.familyTreeId, treeId));
  const allMedia = await db.select().from(media).where(eq(media.familyTreeId, treeId));
  const allLocations = await db.select().from(locations).where(eq(locations.familyTreeId, treeId));
  const allComments = await db.select().from(comments).where(eq(comments.familyTreeId, treeId));

  const personIds = allPersons.map((p) => p.id);
  const allLifeEvents = personIds.length > 0
    ? await db.select().from(lifeEvents).where(inArray(lifeEvents.personId, personIds))
    : [];

  const storyIds = allStories.map((s) => s.id);
  const allStoryPersons = storyIds.length > 0
    ? await db.select().from(storyPersons).where(inArray(storyPersons.storyId, storyIds))
    : [];

  const mediaIds = allMedia.map((m) => m.id);
  const allMediaPersons = mediaIds.length > 0
    ? await db.select().from(mediaPersons).where(inArray(mediaPersons.mediaId, mediaIds))
    : [];

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportVersion: "1.0",
    tree,
    persons: allPersons,
    relations: allRelations,
    stories: allStories,
    storyPersons: allStoryPersons,
    media: allMedia,
    mediaPersons: allMediaPersons,
    lifeEvents: allLifeEvents,
    locations: allLocations,
    comments: allComments,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="stammbaum-export.json"`,
    },
  });
}
