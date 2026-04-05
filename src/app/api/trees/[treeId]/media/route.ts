import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { media, mediaPersons, persons } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

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

  const allMedia = await db
    .select()
    .from(media)
    .where(eq(media.familyTreeId, treeId))
    .orderBy(media.createdAt);

  const mediaIds = allMedia.map((m) => m.id);
  const linkedPersons =
    mediaIds.length > 0
      ? await db
          .select({
            mediaId: mediaPersons.mediaId,
            personId: mediaPersons.personId,
            firstName: persons.firstName,
            lastName: persons.lastName,
          })
          .from(mediaPersons)
          .innerJoin(persons, eq(mediaPersons.personId, persons.id))
          .where(inArray(mediaPersons.mediaId, mediaIds))
      : [];

  const mediaWithPersons = allMedia.map((m) => ({
    ...m,
    persons: linkedPersons.filter((lp) => lp.mediaId === m.id),
  }));

  return NextResponse.json(mediaWithPersons);
}

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
  const caption = formData.get("caption") as string | null;
  const dateTaken = formData.get("dateTaken") as string | null;
  const personIds = formData.getAll("personIds") as string[];

  if (!file) {
    return NextResponse.json({ error: "Keine Datei hochgeladen." }, { status: 400 });
  }

  // Determine media type from mime
  let mediaType: "image" | "video" | "audio" | "document" = "document";
  if (file.type.startsWith("image/")) mediaType = "image";
  else if (file.type.startsWith("video/")) mediaType = "video";
  else if (file.type.startsWith("audio/")) mediaType = "audio";

  // Save file locally
  const uploadDir = join(process.cwd(), "public", "uploads", treeId);
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadDir, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  const url = `/uploads/${treeId}/${filename}`;

  const [mediaRecord] = await db
    .insert(media)
    .values({
      familyTreeId: treeId,
      type: mediaType,
      url,
      originalFilename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      caption: caption || null,
      dateTaken: dateTaken || null,
      uploadedBy: session.user.id,
    })
    .returning();

  if (personIds.length > 0) {
    await db.insert(mediaPersons).values(
      personIds.map((personId) => ({
        mediaId: mediaRecord.id,
        personId,
      }))
    );
  }

  return NextResponse.json(mediaRecord, { status: 201 });
}
