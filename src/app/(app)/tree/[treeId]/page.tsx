import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { familyTrees, persons, relations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { FamilyTreeView } from "@/components/tree/family-tree-view";

export default async function TreePage({
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

  const [allPersons, allRelations] = await Promise.all([
    db.select().from(persons).where(eq(persons.familyTreeId, treeId)),
    db.select().from(relations).where(eq(relations.familyTreeId, treeId)),
  ]);

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-surface-low p-4">
        <h1 className="text-xl font-semibold">{tree.name}</h1>
        {tree.description && (
          <p className="text-sm text-muted-foreground">{tree.description}</p>
        )}
      </div>
      <div className="flex-1">
        <FamilyTreeView
          treeId={treeId}
          initialPersons={allPersons}
          initialRelations={allRelations}
        />
      </div>
    </div>
  );
}
