import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { comments, users, activityLog } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { z } from "zod";

type RouteParams = { params: Promise<{ treeId: string }> };

const createCommentSchema = z.object({
  targetType: z.enum(["person", "story"]),
  targetId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const url = new URL(request.url);
  const targetType = url.searchParams.get("targetType");
  const targetId = url.searchParams.get("targetId");

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "targetType und targetId erforderlich." }, { status: 400 });
  }

  const allComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      targetType: comments.targetType,
      targetId: comments.targetId,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorUserId, users.id))
    .where(
      and(
        eq(comments.familyTreeId, treeId),
        eq(comments.targetType, targetType as "person" | "story"),
        eq(comments.targetId, targetId)
      )
    )
    .orderBy(comments.createdAt);

  return NextResponse.json(allComments);
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createCommentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [comment] = await db
    .insert(comments)
    .values({
      familyTreeId: treeId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      authorUserId: session.user.id,
      content: parsed.data.content,
    })
    .returning();

  // Log activity
  await db.insert(activityLog).values({
    familyTreeId: treeId,
    userId: session.user.id,
    action: "comment_added",
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    targetLabel: parsed.data.content.substring(0, 100),
  });

  return NextResponse.json(
    { ...comment, authorName: session.user.name },
    { status: 201 }
  );
}
