import { db } from "@/lib/db";
import { familyTreeMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function checkTreeAccess(
  treeId: string,
  userId: string,
  requiredRole?: "owner" | "editor" | "viewer"
) {
  const [member] = await db
    .select()
    .from(familyTreeMembers)
    .where(
      and(
        eq(familyTreeMembers.familyTreeId, treeId),
        eq(familyTreeMembers.userId, userId)
      )
    )
    .limit(1);

  if (!member) return null;

  if (requiredRole) {
    const roleHierarchy = { owner: 3, editor: 2, viewer: 1 };
    if (roleHierarchy[member.role] < roleHierarchy[requiredRole]) {
      return null;
    }
  }

  return member;
}
