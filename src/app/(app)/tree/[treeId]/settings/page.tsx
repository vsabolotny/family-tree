import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { familyTrees, familyTreeMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { TreeSettings } from "@/components/tree/tree-settings";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ treeId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) notFound();

  const [tree] = await db
    .select()
    .from(familyTrees)
    .where(eq(familyTrees.id, treeId))
    .limit(1);

  if (!tree) notFound();

  const members = await db
    .select({
      id: familyTreeMembers.id,
      role: familyTreeMembers.role,
      joinedAt: familyTreeMembers.joinedAt,
      userId: familyTreeMembers.userId,
      name: users.name,
      email: users.email,
    })
    .from(familyTreeMembers)
    .innerJoin(users, eq(familyTreeMembers.userId, users.id))
    .where(eq(familyTreeMembers.familyTreeId, treeId));

  return (
    <TreeSettings
      tree={tree}
      members={members}
      isOwner={access.role === "owner"}
    />
  );
}
