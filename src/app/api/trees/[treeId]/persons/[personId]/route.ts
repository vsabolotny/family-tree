import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { persons, relations, storyPersons, mediaPersons, lifeEvents } from "@/lib/db/schema";
import { and, eq, or } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { z } from "zod";

type RouteParams = { params: Promise<{ treeId: string; personId: string }> };

const updatePersonSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  birthName: z.string().max(255).nullable().optional(),
  gender: z.enum(["male", "female", "diverse", "unknown"]).optional(),
  birthDate: z.string().nullable().optional(),
  birthDatePrecision: z.enum(["exact", "year", "decade", "unknown"]).optional(),
  deathDate: z.string().nullable().optional(),
  deathDatePrecision: z.enum(["exact", "year", "decade", "unknown"]).optional(),
  isLiving: z.boolean().optional(),
  bio: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  isInformed: z.boolean().optional(),
});

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId, personId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const [person] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, personId), eq(persons.familyTreeId, treeId)))
    .limit(1);

  if (!person) {
    return NextResponse.json({ error: "Person nicht gefunden." }, { status: 404 });
  }

  const personRelations = await db
    .select()
    .from(relations)
    .where(
      and(
        eq(relations.familyTreeId, treeId),
        or(eq(relations.personAId, personId), eq(relations.personBId, personId))
      )
    );

  return NextResponse.json({ ...person, relations: personRelations });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId, personId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updatePersonSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [updated] = await db
    .update(persons)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(persons.id, personId), eq(persons.familyTreeId, treeId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Person nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId, personId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  await db
    .delete(persons)
    .where(and(eq(persons.id, personId), eq(persons.familyTreeId, treeId)));

  return NextResponse.json({ success: true });
}
