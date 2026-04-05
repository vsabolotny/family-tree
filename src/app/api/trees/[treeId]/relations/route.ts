import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { relations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { z } from "zod";

const createRelationSchema = z.object({
  personAId: z.string().uuid(),
  personBId: z.string().uuid(),
  type: z.enum(["parent_child", "spouse"]),
  subtype: z
    .enum(["biological", "adopted", "step", "foster"])
    .default("biological"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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

  const allRelations = await db
    .select()
    .from(relations)
    .where(eq(relations.familyTreeId, treeId));

  return NextResponse.json(allRelations);
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
  const parsed = createRelationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const [relation] = await db
    .insert(relations)
    .values({
      familyTreeId: treeId,
      ...parsed.data,
      startDate: parsed.data.startDate || null,
      endDate: parsed.data.endDate || null,
    })
    .returning();

  return NextResponse.json(relation, { status: 201 });
}
