import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { persons, relations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { exportToGedcom } from "@/lib/gedcom";

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

  const [allPersons, allRelations] = await Promise.all([
    db.select().from(persons).where(eq(persons.familyTreeId, treeId)),
    db.select().from(relations).where(eq(relations.familyTreeId, treeId)),
  ]);

  const gedcom = exportToGedcom(allPersons, allRelations);

  return new NextResponse(gedcom, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="stammbaum.ged"`,
    },
  });
}
