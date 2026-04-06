import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { unlink } from "fs/promises";
import { join } from "path";

type RouteParams = { params: Promise<{ treeId: string; mediaId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { treeId, mediaId } = await params;
  const access = await checkTreeAccess(treeId, session.user.id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const [record] = await db
    .select()
    .from(media)
    .where(and(eq(media.id, mediaId), eq(media.familyTreeId, treeId)))
    .limit(1);

  if (!record) {
    return NextResponse.json({ error: "Datei nicht gefunden." }, { status: 404 });
  }

  // Delete file from disk
  try {
    const filepath = join(process.cwd(), "public", record.url);
    await unlink(filepath);
  } catch {
    // File may already be deleted
  }

  await db
    .delete(media)
    .where(and(eq(media.id, mediaId), eq(media.familyTreeId, treeId)));

  return NextResponse.json({ success: true });
}
