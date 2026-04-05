import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { familyTrees, familyTreeMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TreePine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateTreeDialog } from "@/components/create-tree-dialog";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const trees = await db
    .select({
      id: familyTrees.id,
      name: familyTrees.name,
      description: familyTrees.description,
      role: familyTreeMembers.role,
      createdAt: familyTrees.createdAt,
    })
    .from(familyTreeMembers)
    .innerJoin(familyTrees, eq(familyTreeMembers.familyTreeId, familyTrees.id))
    .where(eq(familyTreeMembers.userId, session.user.id));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Deine Familienbäume</h1>
          <p className="text-muted-foreground mt-1">
            Wähle einen Familienbaum oder erstelle einen neuen.
          </p>
        </div>
        <CreateTreeDialog />
      </div>

      {trees.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center py-12">
            <TreePine className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Noch kein Familienbaum</CardTitle>
            <CardDescription className="max-w-sm">
              Erstelle deinen ersten Familienbaum und beginne, deine
              Familiengeschichte zu dokumentieren.
            </CardDescription>
            <CreateTreeDialog />
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trees.map((tree) => (
            <Link key={tree.id} href={`/tree/${tree.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TreePine className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{tree.name}</CardTitle>
                  </div>
                  {tree.description && (
                    <CardDescription>{tree.description}</CardDescription>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Rolle: {tree.role === "owner" ? "Besitzer" : tree.role === "editor" ? "Bearbeiter" : "Betrachter"}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
