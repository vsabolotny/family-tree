import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { persons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { z } from "zod";

const createPersonSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  birthName: z.string().max(255).optional(),
  gender: z.enum(["male", "female", "diverse", "unknown"]).default("unknown"),
  birthDate: z.string().optional(),
  birthDatePrecision: z
    .enum(["exact", "year", "decade", "unknown"])
    .default("unknown"),
  deathDate: z.string().optional(),
  deathDatePrecision: z
    .enum(["exact", "year", "decade", "unknown"])
    .default("unknown"),
  isLiving: z.boolean().default(true),
  bio: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ treeId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const allPersons = await db
    .select()
    .from(persons)
    .where(eq(persons.familyTreeId, treeId));

  return NextResponse.json(allPersons);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ treeId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createPersonSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const [person] = await db
    .insert(persons)
    .values({
      familyTreeId: treeId,
      ...parsed.data,
      birthDate: parsed.data.birthDate || null,
      deathDate: parsed.data.deathDate || null,
      bio: parsed.data.bio || null,
      birthName: parsed.data.birthName || null,
    })
    .returning();

  return NextResponse.json(person, { status: 201 });
}
