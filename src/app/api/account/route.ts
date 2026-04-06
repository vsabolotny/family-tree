import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  users,
  familyTreeMembers,
  familyTrees,
  comments,
  activityLog,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const userId = session.user.id;

  // Find trees where user is the sole owner
  const memberships = await db
    .select()
    .from(familyTreeMembers)
    .where(eq(familyTreeMembers.userId, userId));

  for (const membership of memberships) {
    if (membership.role === "owner") {
      // Check if there are other owners
      const otherOwners = await db
        .select()
        .from(familyTreeMembers)
        .where(
          and(
            eq(familyTreeMembers.familyTreeId, membership.familyTreeId),
            eq(familyTreeMembers.role, "owner")
          )
        );

      if (otherOwners.length <= 1) {
        // Sole owner -> delete entire tree (cascades to persons, relations, etc.)
        await db
          .delete(familyTrees)
          .where(eq(familyTrees.id, membership.familyTreeId));
      }
    }
  }

  // Delete user's comments and activity
  await db.delete(comments).where(eq(comments.authorUserId, userId));
  await db.delete(activityLog).where(eq(activityLog.userId, userId));

  // Remove remaining memberships
  await db.delete(familyTreeMembers).where(eq(familyTreeMembers.userId, userId));

  // Delete user account
  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
