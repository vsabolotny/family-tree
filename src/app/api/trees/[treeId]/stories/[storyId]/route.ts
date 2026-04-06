import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { stories, storyPersons } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { z } from "zod";

type RouteParams = { params: Promise<{ treeId: string; storyId: string }> };

const updateStorySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.unknown().optional(),
  personIds: z.array(z.string().uuid()).optional(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId, storyId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateStorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.title) updateData.title = parsed.data.title;
  if (parsed.data.content !== undefined) updateData.content = parsed.data.content;

  const [updated] = await db
    .update(stories)
    .set(updateData)
    .where(and(eq(stories.id, storyId), eq(stories.familyTreeId, treeId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Geschichte nicht gefunden." }, { status: 404 });
  }

  if (parsed.data.personIds) {
    await db.delete(storyPersons).where(eq(storyPersons.storyId, storyId));
    if (parsed.data.personIds.length > 0) {
      await db.insert(storyPersons).values(
        parsed.data.personIds.map((personId) => ({ storyId, personId }))
      );
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId, storyId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  await db
    .delete(stories)
    .where(and(eq(stories.id, storyId), eq(stories.familyTreeId, treeId)));

  return NextResponse.json({ success: true });
}
