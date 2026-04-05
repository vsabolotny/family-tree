import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      name,
      email,
      hashedPassword,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}
