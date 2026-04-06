import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { persons, relations } from "@/lib/db/schema";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { parseGedcom } from "@/lib/gedcom";

type RouteParams = { params: Promise<{ treeId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Keine Datei hochgeladen." }, { status: 400 });
  }

  const content = await file.text();
  const parsed = parseGedcom(content);

  // Map GEDCOM IDs to DB UUIDs
  const idMap = new Map<string, string>();
  let personsCreated = 0;
  let relationsCreated = 0;

  for (const gPerson of parsed.persons) {
    if (!gPerson.firstName && !gPerson.lastName) continue;

    const [created] = await db
      .insert(persons)
      .values({
        familyTreeId: treeId,
        firstName: gPerson.firstName || "Unbekannt",
        lastName: gPerson.lastName || "Unbekannt",
        gender: gPerson.gender,
        birthDate: gPerson.birthDate || null,
        birthDatePrecision: gPerson.birthDate ? "exact" : "unknown",
        deathDate: gPerson.deathDate || null,
        deathDatePrecision: gPerson.deathDate ? "exact" : "unknown",
        isLiving: !gPerson.deathDate,
      })
      .returning();

    idMap.set(gPerson.gedcomId, created.id);
    personsCreated++;
  }

  for (const family of parsed.families) {
    // Spouse relation
    if (family.husbandId && family.wifeId) {
      const aId = idMap.get(family.husbandId);
      const bId = idMap.get(family.wifeId);
      if (aId && bId) {
        await db.insert(relations).values({
          familyTreeId: treeId,
          personAId: aId,
          personBId: bId,
          type: "spouse",
          startDate: family.marriageDate || null,
        });
        relationsCreated++;
      }
    }

    // Parent-child relations
    for (const childGedcomId of family.childIds) {
      const childId = idMap.get(childGedcomId);
      if (!childId) continue;

      for (const parentGedcomId of [family.husbandId, family.wifeId]) {
        if (!parentGedcomId) continue;
        const parentId = idMap.get(parentGedcomId);
        if (parentId) {
          await db.insert(relations).values({
            familyTreeId: treeId,
            personAId: parentId,
            personBId: childId,
            type: "parent_child",
          });
          relationsCreated++;
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    personsCreated,
    relationsCreated,
  });
}
