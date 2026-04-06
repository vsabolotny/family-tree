import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  decimal,
  jsonb,
  integer,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "diverse",
  "unknown",
]);

export const datePrecisionEnum = pgEnum("date_precision", [
  "exact",
  "year",
  "decade",
  "unknown",
]);

export const relationTypeEnum = pgEnum("relation_type", [
  "parent_child",
  "spouse",
]);

export const relationSubtypeEnum = pgEnum("relation_subtype", [
  "biological",
  "adopted",
  "step",
  "foster",
]);

export const mediaTypeEnum = pgEnum("media_type", [
  "image",
  "video",
  "audio",
  "document",
]);

export const lifeEventTypeEnum = pgEnum("life_event_type", [
  "residence",
  "birth",
  "death",
  "education",
  "occupation",
  "migration",
  "military",
  "custom",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "editor",
  "viewer",
]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  hashedPassword: text("hashed_password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const familyTrees = pgTable("family_trees", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const familyTreeMembers = pgTable(
  "family_tree_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyTreeId: uuid("family_tree_id")
      .references(() => familyTrees.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: memberRoleEnum("role").notNull().default("viewer"),
    invitedBy: uuid("invited_by").references(() => users.id),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_tree_member").on(table.familyTreeId, table.userId),
  ]
);

export const persons = pgTable("persons", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyTreeId: uuid("family_tree_id")
    .references(() => familyTrees.id, { onDelete: "cascade" })
    .notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  birthName: varchar("birth_name", { length: 255 }),
  gender: genderEnum("gender").notNull().default("unknown"),
  birthDate: date("birth_date"),
  birthDatePrecision: datePrecisionEnum("birth_date_precision").default(
    "unknown"
  ),
  deathDate: date("death_date"),
  deathDatePrecision: datePrecisionEnum("death_date_precision").default(
    "unknown"
  ),
  isLiving: boolean("is_living").notNull().default(true),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  isInformed: boolean("is_informed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const relations = pgTable("relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyTreeId: uuid("family_tree_id")
    .references(() => familyTrees.id, { onDelete: "cascade" })
    .notNull(),
  personAId: uuid("person_a_id")
    .references(() => persons.id, { onDelete: "cascade" })
    .notNull(),
  personBId: uuid("person_b_id")
    .references(() => persons.id, { onDelete: "cascade" })
    .notNull(),
  type: relationTypeEnum("type").notNull(),
  subtype: relationSubtypeEnum("subtype").default("biological"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyTreeId: uuid("family_tree_id")
    .references(() => familyTrees.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: jsonb("content"),
  authorUserId: uuid("author_user_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storyPersons = pgTable(
  "story_persons",
  {
    storyId: uuid("story_id")
      .references(() => stories.id, { onDelete: "cascade" })
      .notNull(),
    personId: uuid("person_id")
      .references(() => persons.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    uniqueIndex("unique_story_person").on(table.storyId, table.personId),
  ]
);

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyTreeId: uuid("family_tree_id")
    .references(() => familyTrees.id, { onDelete: "cascade" })
    .notNull(),
  type: mediaTypeEnum("type").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  originalFilename: varchar("original_filename", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  caption: text("caption"),
  dateTaken: date("date_taken"),
  uploadedBy: uuid("uploaded_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaPersons = pgTable(
  "media_persons",
  {
    mediaId: uuid("media_id")
      .references(() => media.id, { onDelete: "cascade" })
      .notNull(),
    personId: uuid("person_id")
      .references(() => persons.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    uniqueIndex("unique_media_person").on(table.mediaId, table.personId),
  ]
);

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyTreeId: uuid("family_tree_id")
    .references(() => familyTrees.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  formattedAddress: text("formatted_address"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  country: varchar("country", { length: 255 }),
  countryCode: varchar("country_code", { length: 2 }),
  region: varchar("region", { length: 255 }),
  city: varchar("city", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lifeEvents = pgTable("life_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .references(() => persons.id, { onDelete: "cascade" })
    .notNull(),
  type: lifeEventTypeEnum("type").notNull(),
  title: varchar("title", { length: 500 }),
  description: text("description"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  locationId: uuid("location_id").references(() => locations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentTargetTypeEnum = pgEnum("comment_target_type", [
  "person",
  "story",
]);

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyTreeId: uuid("family_tree_id")
    .references(() => familyTrees.id, { onDelete: "cascade" })
    .notNull(),
  targetType: commentTargetTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  authorUserId: uuid("author_user_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyTreeId: uuid("family_tree_id")
    .references(() => familyTrees.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: uuid("target_id"),
  targetLabel: varchar("target_label", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Person = typeof persons.$inferSelect;
export type NewPerson = typeof persons.$inferInsert;
export type Relation = typeof relations.$inferSelect;
export type NewRelation = typeof relations.$inferInsert;
export type FamilyTree = typeof familyTrees.$inferSelect;
export type NewFamilyTree = typeof familyTrees.$inferInsert;
export type Story = typeof stories.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type LifeEvent = typeof lifeEvents.$inferSelect;
export type FamilyTreeMember = typeof familyTreeMembers.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
