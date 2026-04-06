/**
 * Seed script: Populates the database with the "Sabolotny" family data.
 * Uses the existing user (x@x.com) and tree (Sabolotny).
 *
 * Run: npx tsx scripts/seed.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding database...");

  // Get existing user
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "x@x.com"))
    .limit(1);
  if (!user) throw new Error("User x@x.com not found. Register first.");

  // Get existing tree
  const [tree] = await db
    .select()
    .from(schema.familyTrees)
    .limit(1);
  if (!tree) throw new Error("No family tree found. Create one first.");

  const treeId = tree.id;
  const userId = user.id;

  console.log(`Using tree: ${tree.name} (${treeId})`);
  console.log(`Using user: ${user.email} (${userId})`);

  // Clean existing data (in order to avoid foreign key issues)
  await db.delete(schema.lifeEvents).where(eq(schema.lifeEvents.personId, schema.lifeEvents.personId));
  await db.delete(schema.mediaPersons);
  await db.delete(schema.media).where(eq(schema.media.familyTreeId, treeId));
  await db.delete(schema.storyPersons);
  await db.delete(schema.stories).where(eq(schema.stories.familyTreeId, treeId));
  await db.delete(schema.relations).where(eq(schema.relations.familyTreeId, treeId));
  await db.delete(schema.comments).where(eq(schema.comments.familyTreeId, treeId));
  await db.delete(schema.activityLog).where(eq(schema.activityLog.familyTreeId, treeId));
  await db.delete(schema.persons).where(eq(schema.persons.familyTreeId, treeId));
  await db.delete(schema.locations).where(eq(schema.locations.familyTreeId, treeId));

  console.log("Cleaned existing data.");

  // === PERSONS ===
  const personData = [
    {
      firstName: "Wilhelm",
      lastName: "Sabolotny",
      gender: "male" as const,
      birthDate: "1842-03-15",
      deathDate: "1912-11-22",
      isLiving: false,
      bio: "Patriarch der Familie. Wanderte 1842 aus Odessa nach Hamburg aus. Begann als Händler und baute ein kleines Textilgeschäft auf.",
      profileImageUrl: "/seed-images/portrait-1.jpg",
    },
    {
      firstName: "Martha",
      lastName: "Sabolotny",
      birthName: "Kessler",
      gender: "female" as const,
      birthDate: "1848-07-02",
      deathDate: "1920-04-18",
      isLiving: false,
      bio: "Geborene Kessler aus Hamburg. Heiratete Wilhelm 1865. Mutter von vier Kindern.",
      profileImageUrl: "/seed-images/portrait-2.jpg",
    },
    {
      firstName: "Friedrich",
      lastName: "Sabolotny",
      gender: "male" as const,
      birthDate: "1866-09-10",
      deathDate: "1944-02-03",
      isLiving: false,
      bio: "Ältester Sohn. Übernahm das Familiengeschäft in Hamburg und expandierte nach Berlin.",
      profileImageUrl: "/seed-images/portrait-3.jpg",
    },
    {
      firstName: "Anna",
      lastName: "Sabolotny",
      birthName: "Weber",
      gender: "female" as const,
      birthDate: "1870-12-25",
      deathDate: "1952-08-14",
      isLiving: false,
      bio: "Friedrichs Ehefrau. Stammte aus einer Berliner Kaufmannsfamilie.",
      profileImageUrl: "/seed-images/portrait-4.jpg",
    },
    {
      firstName: "Julian",
      lastName: "Sabolotny",
      gender: "male" as const,
      birthDate: "1888-05-20",
      deathDate: "1918-11-10",
      isLiving: false,
      bio: "Zweiter Sohn von Friedrich und Anna. Fiel im Ersten Weltkrieg an der Westfront bei Verdun.",
      profileImageUrl: "/seed-images/portrait-5.jpg",
    },
    {
      firstName: "Helene",
      lastName: "Sabolotny",
      gender: "female" as const,
      birthDate: "1892-01-08",
      deathDate: "1978-06-30",
      isLiving: false,
      bio: "Tochter von Friedrich und Anna. Emigrierte 1933 nach Paris und später nach London.",
      profileImageUrl: "/seed-images/portrait-6.jpg",
    },
    {
      firstName: "Karl",
      lastName: "Sabolotny",
      gender: "male" as const,
      birthDate: "1920-04-12",
      deathDate: "2001-09-05",
      isLiving: false,
      bio: "Sohn von Julian (posthum). Wuchs bei seiner Mutter in Berlin auf. Wanderte 1955 nach Amerika aus.",
      profileImageUrl: "/seed-images/portrait-7.jpg",
    },
    {
      firstName: "Elena",
      lastName: "Sabolotny",
      birthName: "Petrov",
      gender: "female" as const,
      birthDate: "1955-08-22",
      isLiving: true,
      bio: "Tochter von Karl. Lebt in Portland, Oregon. Familienhistorikerin und Archivarin.",
      profileImageUrl: "/seed-images/portrait-8.jpg",
    },
  ];

  const insertedPersons = await db
    .insert(schema.persons)
    .values(
      personData.map((p) => ({
        familyTreeId: treeId,
        ...p,
      }))
    )
    .returning();

  const personMap = new Map(
    insertedPersons.map((p) => [`${p.firstName}-${p.lastName}`, p])
  );

  const P = (first: string, last: string = "Sabolotny") =>
    personMap.get(`${first}-${last}`)!;

  console.log(`Created ${insertedPersons.length} persons.`);

  // === RELATIONS ===
  const relationsData = [
    // Wilhelm + Martha = spouse
    { personAId: P("Wilhelm").id, personBId: P("Martha").id, type: "spouse" as const, startDate: "1865-06-15" },
    // Wilhelm & Martha -> Friedrich (parent_child)
    { personAId: P("Wilhelm").id, personBId: P("Friedrich").id, type: "parent_child" as const },
    { personAId: P("Martha").id, personBId: P("Friedrich").id, type: "parent_child" as const },
    // Friedrich + Anna = spouse
    { personAId: P("Friedrich").id, personBId: P("Anna").id, type: "spouse" as const, startDate: "1887-04-20" },
    // Friedrich & Anna -> Julian, Helene
    { personAId: P("Friedrich").id, personBId: P("Julian").id, type: "parent_child" as const },
    { personAId: P("Anna").id, personBId: P("Julian").id, type: "parent_child" as const },
    { personAId: P("Friedrich").id, personBId: P("Helene").id, type: "parent_child" as const },
    { personAId: P("Anna").id, personBId: P("Helene").id, type: "parent_child" as const },
    // Julian -> Karl
    { personAId: P("Julian").id, personBId: P("Karl").id, type: "parent_child" as const },
    // Karl -> Elena
    { personAId: P("Karl").id, personBId: P("Elena").id, type: "parent_child" as const },
  ];

  await db.insert(schema.relations).values(
    relationsData.map((r) => ({ familyTreeId: treeId, ...r }))
  );
  console.log(`Created ${relationsData.length} relations.`);

  // === LOCATIONS ===
  const locationData = [
    { name: "Odessa", latitude: "46.4825", longitude: "30.7233", country: "Ukraine", countryCode: "UA", city: "Odessa", region: "Odessa Oblast" },
    { name: "Hamburg", latitude: "53.5511", longitude: "9.9937", country: "Deutschland", countryCode: "DE", city: "Hamburg", region: "Hamburg" },
    { name: "Berlin", latitude: "52.5200", longitude: "13.4050", country: "Deutschland", countryCode: "DE", city: "Berlin", region: "Berlin" },
    { name: "Verdun", latitude: "49.1600", longitude: "5.3833", country: "Frankreich", countryCode: "FR", city: "Verdun", region: "Lothringen" },
    { name: "Paris", latitude: "48.8566", longitude: "2.3522", country: "Frankreich", countryCode: "FR", city: "Paris", region: "Île-de-France" },
    { name: "London", latitude: "51.5074", longitude: "-0.1278", country: "Vereinigtes Königreich", countryCode: "GB", city: "London", region: "Greater London" },
    { name: "New York", latitude: "40.7128", longitude: "-74.0060", country: "USA", countryCode: "US", city: "New York", region: "New York" },
    { name: "Portland", latitude: "45.5152", longitude: "-122.6784", country: "USA", countryCode: "US", city: "Portland", region: "Oregon" },
    { name: "Lancaster, PA", latitude: "40.0379", longitude: "-76.3055", country: "USA", countryCode: "US", city: "Lancaster", region: "Pennsylvania" },
  ];

  const insertedLocations = await db
    .insert(schema.locations)
    .values(locationData.map((l) => ({ familyTreeId: treeId, ...l })))
    .returning();

  const locMap = new Map(insertedLocations.map((l) => [l.name, l]));
  const L = (name: string) => locMap.get(name)!;

  console.log(`Created ${insertedLocations.length} locations.`);

  // === LIFE EVENTS ===
  const eventsData = [
    // Wilhelm
    { personId: P("Wilhelm").id, type: "birth" as const, title: "Geburt in Odessa", startDate: "1842-03-15", locationId: L("Odessa").id },
    { personId: P("Wilhelm").id, type: "migration" as const, title: "Ankunft in Hamburg", description: "Wilhelm wanderte mit seiner Familie aus Odessa nach Hamburg aus, per Schiff über das Schwarze Meer und die Nordsee.", startDate: "1842-05-12", locationId: L("Hamburg").id },
    { personId: P("Wilhelm").id, type: "occupation" as const, title: "Gründung Textilhandel", description: "Eröffnung eines kleinen Textilgeschäfts im Hamburger Hafen.", startDate: "1860-03-01", endDate: "1912-11-22", locationId: L("Hamburg").id },
    { personId: P("Wilhelm").id, type: "residence" as const, title: "Wohnsitz Hamburg", startDate: "1842-05-12", endDate: "1912-11-22", locationId: L("Hamburg").id },
    { personId: P("Wilhelm").id, type: "death" as const, title: "Tod in Hamburg", startDate: "1912-11-22", locationId: L("Hamburg").id },

    // Martha
    { personId: P("Martha").id, type: "birth" as const, title: "Geburt in Hamburg", startDate: "1848-07-02", locationId: L("Hamburg").id },
    { personId: P("Martha").id, type: "residence" as const, title: "Wohnsitz Hamburg", startDate: "1848-07-02", endDate: "1920-04-18", locationId: L("Hamburg").id },
    { personId: P("Martha").id, type: "death" as const, title: "Tod in Hamburg", startDate: "1920-04-18", locationId: L("Hamburg").id },

    // Friedrich
    { personId: P("Friedrich").id, type: "birth" as const, title: "Geburt in Hamburg", startDate: "1866-09-10", locationId: L("Hamburg").id },
    { personId: P("Friedrich").id, type: "education" as const, title: "Handelsakademie Hamburg", startDate: "1882-09-01", endDate: "1886-06-30", locationId: L("Hamburg").id },
    { personId: P("Friedrich").id, type: "migration" as const, title: "Umzug nach Berlin", description: "Friedrich expandierte das Familiengeschäft und zog nach Berlin.", startDate: "1890-04-01", locationId: L("Berlin").id },
    { personId: P("Friedrich").id, type: "residence" as const, title: "Wohnsitz Berlin", startDate: "1890-04-01", endDate: "1944-02-03", locationId: L("Berlin").id },
    { personId: P("Friedrich").id, type: "occupation" as const, title: "Textilmanufaktur Berlin", startDate: "1890-04-01", endDate: "1940-01-01", locationId: L("Berlin").id },
    { personId: P("Friedrich").id, type: "death" as const, title: "Tod in Berlin", startDate: "1944-02-03", locationId: L("Berlin").id },

    // Anna
    { personId: P("Anna").id, type: "birth" as const, title: "Geburt in Berlin", startDate: "1870-12-25", locationId: L("Berlin").id },
    { personId: P("Anna").id, type: "residence" as const, title: "Wohnsitz Berlin", startDate: "1870-12-25", endDate: "1952-08-14", locationId: L("Berlin").id },

    // Julian
    { personId: P("Julian").id, type: "birth" as const, title: "Geburt in Berlin", startDate: "1888-05-20", locationId: L("Berlin").id },
    { personId: P("Julian").id, type: "education" as const, title: "Studium der Geschichte", startDate: "1906-10-01", endDate: "1910-06-30", locationId: L("Berlin").id },
    { personId: P("Julian").id, type: "military" as const, title: "Erster Weltkrieg - Westfront", description: "Julian wurde 1914 eingezogen und an die Westfront geschickt.", startDate: "1914-08-01", endDate: "1918-11-10", locationId: L("Verdun").id },
    { personId: P("Julian").id, type: "death" as const, title: "Gefallen bei Verdun", description: "Julian fiel am letzten Tag des Krieges bei Verdun.", startDate: "1918-11-10", locationId: L("Verdun").id },

    // Helene
    { personId: P("Helene").id, type: "birth" as const, title: "Geburt in Berlin", startDate: "1892-01-08", locationId: L("Berlin").id },
    { personId: P("Helene").id, type: "residence" as const, title: "Jugend in Berlin", startDate: "1892-01-08", endDate: "1933-06-01", locationId: L("Berlin").id },
    { personId: P("Helene").id, type: "migration" as const, title: "Emigration nach Paris", description: "Helene floh vor dem Nationalsozialismus nach Paris.", startDate: "1933-06-01", locationId: L("Paris").id },
    { personId: P("Helene").id, type: "residence" as const, title: "Leben in Paris", startDate: "1933-06-01", endDate: "1940-05-01", locationId: L("Paris").id },
    { personId: P("Helene").id, type: "migration" as const, title: "Flucht nach London", description: "Vor der deutschen Besatzung nach London geflohen.", startDate: "1940-05-01", locationId: L("London").id },
    { personId: P("Helene").id, type: "residence" as const, title: "Leben in London", startDate: "1940-05-01", endDate: "1978-06-30", locationId: L("London").id },
    { personId: P("Helene").id, type: "death" as const, title: "Tod in London", startDate: "1978-06-30", locationId: L("London").id },

    // Karl
    { personId: P("Karl").id, type: "birth" as const, title: "Geburt in Berlin (posthum)", startDate: "1920-04-12", locationId: L("Berlin").id },
    { personId: P("Karl").id, type: "residence" as const, title: "Jugend in Berlin", startDate: "1920-04-12", endDate: "1955-03-01", locationId: L("Berlin").id },
    { personId: P("Karl").id, type: "migration" as const, title: "Auswanderung nach Amerika", description: "Karl wanderte 1955 in die USA aus und ließ sich in New York nieder.", startDate: "1955-03-01", locationId: L("New York").id },
    { personId: P("Karl").id, type: "residence" as const, title: "Leben in New York", startDate: "1955-03-01", endDate: "1980-01-01", locationId: L("New York").id },
    { personId: P("Karl").id, type: "migration" as const, title: "Umzug nach Portland", startDate: "1980-01-01", locationId: L("Portland").id },
    { personId: P("Karl").id, type: "residence" as const, title: "Leben in Portland", startDate: "1980-01-01", endDate: "2001-09-05", locationId: L("Portland").id },
    { personId: P("Karl").id, type: "death" as const, title: "Tod in Portland", startDate: "2001-09-05", locationId: L("Portland").id },

    // Elena
    { personId: P("Elena").id, type: "birth" as const, title: "Geburt in New York", startDate: "1955-08-22", locationId: L("New York").id },
    { personId: P("Elena").id, type: "education" as const, title: "Studium der Archivwissenschaft", startDate: "1973-09-01", endDate: "1977-06-30", locationId: L("New York").id },
    { personId: P("Elena").id, type: "residence" as const, title: "Wohnsitz Portland", startDate: "1980-01-01", locationId: L("Portland").id },
    { personId: P("Elena").id, type: "occupation" as const, title: "Archivarin & Familienhistorikerin", startDate: "1978-01-01", locationId: L("Portland").id },
  ];

  await db.insert(schema.lifeEvents).values(eventsData);
  console.log(`Created ${eventsData.length} life events.`);

  // === MEDIA ===
  const mediaData = [
    { type: "image" as const, url: "/seed-images/ship-manifest.jpg", originalFilename: "schiffsmanifest-1842.jpg", mimeType: "image/jpeg", sizeBytes: 59043, caption: "Schiffsmanifest der Überfahrt von Odessa, 1842", dateTaken: "1842-05-12" },
    { type: "image" as const, url: "/seed-images/old-farmhouse.jpg", originalFilename: "hamburger-kontor.jpg", mimeType: "image/jpeg", sizeBytes: 68913, caption: "Das Textilkontor der Familie Sabolotny in Hamburg, ca. 1870", dateTaken: "1870-01-01" },
    { type: "image" as const, url: "/seed-images/landscape-2.jpg", originalFilename: "berlin-charlottenburg.jpg", mimeType: "image/jpeg", sizeBytes: 148110, caption: "Charlottenburg, Berlin -- Wohngegend der Familie ab 1890", dateTaken: "1895-01-01" },
    { type: "image" as const, url: "/seed-images/train-tracks.jpg", originalFilename: "bahnhof-berlin.jpg", mimeType: "image/jpeg", sizeBytes: 47619, caption: "Bahnhof in Berlin, Ausgangspunkt vieler Familienreisen", dateTaken: "1910-01-01" },
    { type: "image" as const, url: "/seed-images/landscape-4.jpg", originalFilename: "paris-1933.jpg", mimeType: "image/jpeg", sizeBytes: 85425, caption: "Paris, 1933 -- Helenes neue Heimat nach der Emigration", dateTaken: "1933-06-01" },
    { type: "image" as const, url: "/seed-images/landscape-3.jpg", originalFilename: "london-1940.jpg", mimeType: "image/jpeg", sizeBytes: 146194, caption: "London, 1940 -- Helene floh vor der Besatzung hierher", dateTaken: "1940-05-01" },
    { type: "image" as const, url: "/seed-images/globe-antique.jpg", originalFilename: "familien-globus.jpg", mimeType: "image/jpeg", sizeBytes: 112295, caption: "Antiker Globus aus dem Familienbesitz", dateTaken: "1900-01-01" },
    { type: "image" as const, url: "/seed-images/landscape-1.jpg", originalFilename: "portland-oregon.jpg", mimeType: "image/jpeg", sizeBytes: 91062, caption: "Portland, Oregon -- Die letzte Station der Familie", dateTaken: "1980-01-01" },
  ];

  const insertedMedia = await db
    .insert(schema.media)
    .values(mediaData.map((m) => ({ familyTreeId: treeId, uploadedBy: userId, ...m })))
    .returning();

  // Tag media with persons
  const mediaTagging = [
    { mediaId: insertedMedia[0].id, personId: P("Wilhelm").id },
    { mediaId: insertedMedia[1].id, personId: P("Wilhelm").id },
    { mediaId: insertedMedia[1].id, personId: P("Martha").id },
    { mediaId: insertedMedia[2].id, personId: P("Friedrich").id },
    { mediaId: insertedMedia[2].id, personId: P("Anna").id },
    { mediaId: insertedMedia[3].id, personId: P("Julian").id },
    { mediaId: insertedMedia[4].id, personId: P("Helene").id },
    { mediaId: insertedMedia[5].id, personId: P("Helene").id },
    { mediaId: insertedMedia[6].id, personId: P("Friedrich").id },
    { mediaId: insertedMedia[7].id, personId: P("Karl").id },
    { mediaId: insertedMedia[7].id, personId: P("Elena").id },
  ];

  await db.insert(schema.mediaPersons).values(mediaTagging);
  console.log(`Created ${insertedMedia.length} media with ${mediaTagging.length} tags.`);

  // === STORIES ===
  const storiesData = [
    {
      title: "Die Überfahrt von Odessa",
      content: {
        html: "<h2>Die große Reise</h2><p>Im Mai 1842 bestieg der junge Wilhelm Sabolotny ein Handelsschiff im Hafen von Odessa. Er war gerade 17 Jahre alt und trug nichts als einen kleinen Koffer und die Adresse eines entfernten Verwandten in Hamburg.</p><p>Die Überfahrt dauerte sechs Wochen -- über das Schwarze Meer, durch die Dardanellen, quer durch das Mittelmeer und schließlich die Nordsee hinauf bis Hamburg.</p><p><em>\"Die See war rau, aber mein Herz war ruhig\"</em> -- so schrieb Wilhelm später in seinem Tagebuch.</p>",
      },
      personIds: [P("Wilhelm").id],
    },
    {
      title: "Helenes Flucht nach Paris",
      content: {
        html: "<h2>1933: Ein neues Kapitel</h2><p>Als Helene 1933 Berlin verließ, wusste sie nicht, ob sie ihre Eltern jemals wiedersehen würde. Die politische Lage hatte sich so verschlechtert, dass ein Bleiben unmöglich schien.</p><p>In Paris fand sie Zuflucht bei einer Gemeinschaft von Emigranten. Sie arbeitete als Übersetzerin und baute sich ein neues Leben auf.</p><p>1940 musste sie erneut fliehen -- diesmal nach London, wo sie den Rest ihres Lebens verbrachte.</p>",
      },
      personIds: [P("Helene").id],
    },
    {
      title: "Der Weltkrieg und seine Folgen",
      content: {
        html: "<h2>1914-1918: Die globale Zerstreuung</h2><p>Der Erste Weltkrieg verstreute die vierte Generation der Sabolotny-Familie über europäische Fronten. Julian fiel bei Verdun am letzten Tag des Krieges. Sein Sohn Karl wurde posthum geboren.</p><p>Diese Periode markiert die erste dauerhafte Trennung der Familienzweige -- einige blieben in Berlin, andere flohen nach Frankreich und England.</p>",
      },
      personIds: [P("Julian").id, P("Karl").id, P("Helene").id],
    },
  ];

  for (const story of storiesData) {
    const [inserted] = await db
      .insert(schema.stories)
      .values({
        familyTreeId: treeId,
        title: story.title,
        content: story.content,
        authorUserId: userId,
      })
      .returning();

    await db.insert(schema.storyPersons).values(
      story.personIds.map((pid) => ({ storyId: inserted.id, personId: pid }))
    );
  }
  console.log(`Created ${storiesData.length} stories.`);

  console.log("\nSeed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
