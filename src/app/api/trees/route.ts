import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { familyTrees, familyTreeMembers } from "@/lib/db/schema";
import { z } from "zod";

const createTreeSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createTreeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const [tree] = await db
    .insert(familyTrees)
    .values({
      name: parsed.data.name,
      description: parsed.data.description || null,
      createdBy: session.user.id,
    })
    .returning();

  await db.insert(familyTreeMembers).values({
    familyTreeId: tree.id,
    userId: session.user.id,
    role: "owner",
  });

  return NextResponse.json({ id: tree.id }, { status: 201 });
}
