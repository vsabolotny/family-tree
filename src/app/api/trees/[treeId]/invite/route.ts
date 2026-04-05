import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users, familyTreeMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { z } from "zod";

type RouteParams = { params: Promise<{ treeId: string }> };

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]).default("viewer"),
});

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id, "owner");
  if (!access) {
    return NextResponse.json({ error: "Nur der Besitzer kann einladen." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Find user by email
  const [invitedUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!invitedUser) {
    return NextResponse.json(
      { error: "Benutzer mit dieser E-Mail nicht gefunden. Die Person muss sich zuerst registrieren." },
      { status: 404 }
    );
  }

  // Check if already member
  const [existing] = await db
    .select()
    .from(familyTreeMembers)
    .where(
      and(
        eq(familyTreeMembers.familyTreeId, treeId),
        eq(familyTreeMembers.userId, invitedUser.id)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Diese Person ist bereits Mitglied." },
      { status: 409 }
    );
  }

  const [member] = await db
    .insert(familyTreeMembers)
    .values({
      familyTreeId: treeId,
      userId: invitedUser.id,
      role: parsed.data.role,
      invitedBy: session.user.id,
    })
    .returning();

  return NextResponse.json(
    { success: true, member: { ...member, email: invitedUser.email, name: invitedUser.name } },
    { status: 201 }
  );
}

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

  return NextResponse.json(members);
}
