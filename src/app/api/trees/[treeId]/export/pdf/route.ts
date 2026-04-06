import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { familyTrees, persons, relations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTreeAccess } from "@/lib/db/queries/tree-access";

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

  const [tree] = await db
    .select()
    .from(familyTrees)
    .where(eq(familyTrees.id, treeId))
    .limit(1);

  const allPersons = await db
    .select()
    .from(persons)
    .where(eq(persons.familyTreeId, treeId))
    .orderBy(persons.lastName, persons.firstName);

  const allRelations = await db
    .select()
    .from(relations)
    .where(eq(relations.familyTreeId, treeId));

  // Generate a simple HTML document styled for print / PDF
  const genderSymbol: Record<string, string> = {
    male: "\u2642", female: "\u2640", diverse: "\u26A5", unknown: "?",
  };

  const personMap = new Map(allPersons.map((p) => [p.id, p]));

  let html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${tree?.name || "Stammbaum"}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: Georgia, serif; font-size: 12pt; color: #3a2a24; max-width: 800px; margin: 0 auto; background: #fcf9ef; }
  h1 { text-align: center; color: #421518; padding-bottom: 10px; }
  h2 { margin-top: 30px; color: #775a19; }
  .person { margin-bottom: 20px; page-break-inside: avoid; border-left: 3px solid #775a19; padding-left: 15px; }
  .person-name { font-size: 14pt; font-weight: bold; color: #421518; }
  .person-dates { color: #8a7a60; font-style: italic; }
  .person-bio { margin-top: 5px; }
  .relations { margin-top: 5px; font-size: 11pt; color: #524343; }
  .footer { margin-top: 40px; text-align: center; font-size: 9pt; color: #8a7a60; padding-top: 10px; }
</style>
</head>
<body>
<h1>${tree?.name || "Stammbaum"}</h1>
${tree?.description ? `<p style="text-align:center;color:#666;">${tree.description}</p>` : ""}
<p style="text-align:center;color:#999;font-size:10pt;">${allPersons.length} Personen</p>
`;

  for (const person of allPersons) {
    const dates: string[] = [];
    if (person.birthDate) dates.push(`* ${person.birthDate}`);
    if (person.deathDate) dates.push(`† ${person.deathDate}`);
    if (person.isLiving && !person.deathDate) dates.push("lebt");

    const personRelations = allRelations.filter(
      (r) => r.personAId === person.id || r.personBId === person.id
    );

    const relLabels: string[] = [];
    for (const rel of personRelations) {
      const otherId = rel.personAId === person.id ? rel.personBId : rel.personAId;
      const other = personMap.get(otherId);
      if (!other) continue;

      let label: string;
      if (rel.type === "spouse") {
        label = `Partner: ${other.firstName} ${other.lastName}`;
      } else if (rel.personAId === person.id) {
        label = `Kind: ${other.firstName} ${other.lastName}`;
      } else {
        label = `Elternteil: ${other.firstName} ${other.lastName}`;
      }
      relLabels.push(label);
    }

    html += `<div class="person">
  <div class="person-name">${genderSymbol[person.gender] || ""} ${person.firstName} ${person.lastName}${person.birthName ? ` (geb. ${person.birthName})` : ""}</div>
  <div class="person-dates">${dates.join(" &mdash; ")}</div>
  ${person.bio ? `<div class="person-bio">${person.bio}</div>` : ""}
  ${relLabels.length > 0 ? `<div class="relations">${relLabels.join(" &bull; ")}</div>` : ""}
</div>`;
  }

  html += `<div class="footer">Erstellt mit Stammbaum-App &bull; ${new Date().toLocaleDateString("de-DE")}</div>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="stammbaum.html"`,
    },
  });
}
