import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { activityLog, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
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

  const activities = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      targetType: activityLog.targetType,
      targetId: activityLog.targetId,
      targetLabel: activityLog.targetLabel,
      createdAt: activityLog.createdAt,
      userName: users.name,
    })
    .from(activityLog)
    .innerJoin(users, eq(activityLog.userId, users.id))
    .where(eq(activityLog.familyTreeId, treeId))
    .orderBy(desc(activityLog.createdAt))
    .limit(50);

  return NextResponse.json(activities);
}
