import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { persons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function PersonsListPage({
  params,
}: {
  params: Promise<{ treeId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) notFound();

  const allPersons = await db
    .select()
    .from(persons)
    .where(eq(persons.familyTreeId, treeId))
    .orderBy(persons.lastName, persons.firstName);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Personen ({allPersons.length})
      </h1>

      {allPersons.length === 0 ? (
        <p className="text-muted-foreground">
          Noch keine Personen im Familienbaum. Gehe zum{" "}
          <Link href={`/tree/${treeId}`} className="text-primary hover:underline">
            Stammbaum
          </Link>{" "}
          um Personen hinzuzufügen.
        </p>
      ) : (
        <div className="space-y-2">
          {allPersons.map((person) => {
            const initials =
              (person.firstName?.[0] || "") + (person.lastName?.[0] || "");
            return (
              <Link
                key={person.id}
                href={`/tree/${treeId}/person/${person.id}`}
                className="flex items-center gap-4 rounded-md border p-4 hover:bg-muted transition-colors"
              >
                <Avatar>
                  <AvatarImage src={person.profileImageUrl || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {person.firstName} {person.lastName}
                    {person.birthName && (
                      <span className="text-muted-foreground">
                        {" "}
                        (geb. {person.birthName})
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {person.birthDate && <span>* {person.birthDate}</span>}
                    {person.deathDate && <span>† {person.deathDate}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {person.isLiving && (
                    <Badge variant="outline">Lebt</Badge>
                  )}
                  <Badge variant="secondary">
                    {person.gender === "male"
                      ? "M"
                      : person.gender === "female"
                        ? "W"
                        : person.gender === "diverse"
                          ? "D"
                          : "?"}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
