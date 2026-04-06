import type { Person, Relation } from "@/lib/db/schema";

export function exportToGedcom(
  persons: Person[],
  relations: Relation[]
): string {
  const lines: string[] = [];

  lines.push("0 HEAD");
  lines.push("1 SOUR Stammbaum-App");
  lines.push("1 GEDC");
  lines.push("2 VERS 5.5.1");
  lines.push("2 FORM LINEAGE-LINKED");
  lines.push("1 CHAR UTF-8");

  // Individuals
  for (const person of persons) {
    lines.push(`0 @I${person.id}@ INDI`);
    lines.push(`1 NAME ${person.firstName} /${person.lastName}/`);
    lines.push(`2 GIVN ${person.firstName}`);
    lines.push(`2 SURN ${person.lastName}`);

    if (person.gender === "male") lines.push("1 SEX M");
    else if (person.gender === "female") lines.push("1 SEX F");
    else lines.push("1 SEX U");

    if (person.birthDate) {
      lines.push("1 BIRT");
      lines.push(`2 DATE ${formatGedcomDate(person.birthDate)}`);
    }

    if (person.deathDate) {
      lines.push("1 DEAT");
      lines.push(`2 DATE ${formatGedcomDate(person.deathDate)}`);
    }

    if (person.bio) {
      lines.push(`1 NOTE ${person.bio.replace(/\n/g, " ")}`);
    }

    // Family links
    const asChild = relations.filter(
      (r) => r.type === "parent_child" && r.personBId === person.id
    );
    const asSpouse = relations.filter(
      (r) =>
        r.type === "spouse" &&
        (r.personAId === person.id || r.personBId === person.id)
    );

    for (const rel of asChild) {
      const famId = getFamilyId(rel, relations, persons);
      if (famId) lines.push(`1 FAMC @F${famId}@`);
    }

    for (const rel of asSpouse) {
      lines.push(`1 FAMS @F${rel.id}@`);
    }
  }

  // Families (from spouse relations)
  const spouseRelations = relations.filter((r) => r.type === "spouse");
  for (const rel of spouseRelations) {
    lines.push(`0 @F${rel.id}@ FAM`);
    lines.push(`1 HUSB @I${rel.personAId}@`);
    lines.push(`1 WIFE @I${rel.personBId}@`);

    if (rel.startDate) {
      lines.push("1 MARR");
      lines.push(`2 DATE ${formatGedcomDate(rel.startDate)}`);
    }

    // Children
    const children = relations.filter(
      (r) =>
        r.type === "parent_child" &&
        (r.personAId === rel.personAId || r.personAId === rel.personBId)
    );
    const childIds = new Set<string>();
    for (const childRel of children) {
      if (!childIds.has(childRel.personBId)) {
        lines.push(`1 CHIL @I${childRel.personBId}@`);
        childIds.add(childRel.personBId);
      }
    }
  }

  // Families for single parents (parent_child without spouse)
  const parentChildRels = relations.filter((r) => r.type === "parent_child");
  const coveredParents = new Set<string>();
  for (const sr of spouseRelations) {
    coveredParents.add(sr.personAId);
    coveredParents.add(sr.personBId);
  }

  const singleParentGroups = new Map<string, string[]>();
  for (const rel of parentChildRels) {
    if (!coveredParents.has(rel.personAId)) {
      const group = singleParentGroups.get(rel.personAId) || [];
      group.push(rel.personBId);
      singleParentGroups.set(rel.personAId, group);
    }
  }

  for (const [parentId, childIds] of singleParentGroups) {
    const famId = `SP_${parentId.substring(0, 8)}`;
    const parent = persons.find((p) => p.id === parentId);
    lines.push(`0 @F${famId}@ FAM`);
    if (parent?.gender === "male") {
      lines.push(`1 HUSB @I${parentId}@`);
    } else {
      lines.push(`1 WIFE @I${parentId}@`);
    }
    for (const childId of childIds) {
      lines.push(`1 CHIL @I${childId}@`);
    }
  }

  lines.push("0 TRLR");
  return lines.join("\n");
}

function formatGedcomDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getFamilyId(
  childRel: Relation,
  allRelations: Relation[],
  _persons: Person[]
): string | null {
  const parentId = childRel.personAId;
  const spouseRel = allRelations.find(
    (r) =>
      r.type === "spouse" &&
      (r.personAId === parentId || r.personBId === parentId)
  );
  if (spouseRel) return spouseRel.id;
  return `SP_${parentId.substring(0, 8)}`;
}

export interface ParsedGedcomPerson {
  gedcomId: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female" | "diverse" | "unknown";
  birthDate?: string;
  deathDate?: string;
}

export interface ParsedGedcomFamily {
  husbandId?: string;
  wifeId?: string;
  childIds: string[];
  marriageDate?: string;
}

export function parseGedcom(content: string): {
  persons: ParsedGedcomPerson[];
  families: ParsedGedcomFamily[];
} {
  const lines = content.split(/\r?\n/);
  const persons: ParsedGedcomPerson[] = [];
  const families: ParsedGedcomFamily[] = [];

  let currentRecord: "INDI" | "FAM" | null = null;
  let currentPerson: ParsedGedcomPerson | null = null;
  let currentFamily: ParsedGedcomFamily | null = null;
  let currentEvent: string | null = null;

  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(@\w+@\s+)?(\w+)\s*(.*)?$/);
    if (!match) continue;

    const level = parseInt(match[1]);
    const tag = match[3];
    const value = (match[4] || "").trim();

    if (level === 0) {
      // Save previous record
      if (currentPerson) persons.push(currentPerson);
      if (currentFamily) families.push(currentFamily);
      currentPerson = null;
      currentFamily = null;
      currentEvent = null;
      currentRecord = null;

      if (tag === "INDI") {
        const id = (match[2] || "").replace(/@/g, "").trim();
        currentRecord = "INDI";
        currentPerson = {
          gedcomId: id,
          firstName: "",
          lastName: "",
          gender: "unknown",
        };
      } else if (tag === "FAM") {
        const id = (match[2] || "").replace(/@/g, "").trim();
        currentRecord = "FAM";
        currentFamily = { childIds: [] };
      }
    } else if (level === 1) {
      currentEvent = null;

      if (currentRecord === "INDI" && currentPerson) {
        if (tag === "NAME") {
          const nameMatch = value.match(/^(.*?)\s*\/(.*?)\//);
          if (nameMatch) {
            currentPerson.firstName = nameMatch[1].trim();
            currentPerson.lastName = nameMatch[2].trim();
          } else {
            currentPerson.firstName = value.replace(/\//g, "").trim();
          }
        } else if (tag === "SEX") {
          if (value === "M") currentPerson.gender = "male";
          else if (value === "F") currentPerson.gender = "female";
        } else if (tag === "BIRT") {
          currentEvent = "BIRT";
        } else if (tag === "DEAT") {
          currentEvent = "DEAT";
        }
      } else if (currentRecord === "FAM" && currentFamily) {
        if (tag === "HUSB") {
          currentFamily.husbandId = value.replace(/@/g, "");
        } else if (tag === "WIFE") {
          currentFamily.wifeId = value.replace(/@/g, "");
        } else if (tag === "CHIL") {
          currentFamily.childIds.push(value.replace(/@/g, ""));
        } else if (tag === "MARR") {
          currentEvent = "MARR";
        }
      }
    } else if (level === 2 && tag === "DATE") {
      const isoDate = parseGedcomDateToISO(value);
      if (currentRecord === "INDI" && currentPerson && isoDate) {
        if (currentEvent === "BIRT") currentPerson.birthDate = isoDate;
        else if (currentEvent === "DEAT") currentPerson.deathDate = isoDate;
      } else if (currentRecord === "FAM" && currentFamily && isoDate) {
        if (currentEvent === "MARR") currentFamily.marriageDate = isoDate;
      }
    }
  }

  if (currentPerson) persons.push(currentPerson);
  if (currentFamily) families.push(currentFamily);

  return { persons, families };
}

function parseGedcomDateToISO(dateStr: string): string | null {
  const months: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };

  // "1 JAN 2000" or "JAN 2000" or "2000"
  const full = dateStr.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (full) {
    const m = months[full[2].toUpperCase()];
    if (m) return `${full[3]}-${m}-${full[1].padStart(2, "0")}`;
  }

  const monthYear = dateStr.match(/(\w{3})\s+(\d{4})/);
  if (monthYear) {
    const m = months[monthYear[1].toUpperCase()];
    if (m) return `${monthYear[2]}-${m}-01`;
  }

  const yearOnly = dateStr.match(/(\d{4})/);
  if (yearOnly) return `${yearOnly[1]}-01-01`;

  return null;
}
