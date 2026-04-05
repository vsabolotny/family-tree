# Stammbaum-App: Produktkonzept

## Vision

**"Jede Familie hat eine Geschichte, die es wert ist, erzählt zu werden -- wir geben ihr einen Ort."**

Moderne, datenschutzkonforme Web-App für Familien, die ihre Geschichte visuell, geografisch und narrativ dokumentieren wollen. Kein trockenes Formular -- ein lebendiges digitales Familienarchiv mit Karten, Zeitstrahlen und Geschichten.

**Positionierung:** "Instagram/Notion für Familiengeschichte" -- visuell, emotional, mit Weltkarte und Zeitstrahl als Killer-Feature.

**Zielgruppe:** Deutschsprachige Familien (25-65 J.), besonders mit Migrationsgeschichte, die Lebenswege über Kontinente visualisieren wollen.

---

## Features (Phase 1 -- MVP)

### Auth & Benutzerverwaltung
- Registrierung & Login (E-Mail + Google OAuth)
- Einladungssystem: Familienmitglieder per Link einladen (Lese-/Bearbeitungszugriff)
- DSGVO-konformes Consent-Management

### Familienprofile
- Name, Geburtsname, Geschlecht, Geburts-/Sterbedatum (mit Precision: exakt/Jahr/Jahrzehnt)
- Kurzbio, Profilbild
- "Ist diese Person informiert?"-Toggle für lebende Nicht-Nutzer

### Relationen
- Eltern-Kind und Partner-Beziehungen speichern
- Geschwister, Onkel, Cousin etc. werden abgeleitet
- Subtypen: biologisch, adoptiert, Stief-

### Stammbaum-Visualisierung
- Interaktiver, zoombarer Graph (React Flow)
- Custom Nodes mit Bild, Name, Datum
- Auto-Layout (hierarchisch)
- Person direkt aus dem Baum hinzufügen

### Geschichten & Texte
- Rich-Text-Editor (TipTap) für Geschichten zu Personen
- Personen in Geschichten taggen (M:N)
- Fotos in Geschichten einbetten

### Medien (Fotos, Videos, Audio, Dokumente)
- Multi-Upload mit Drag & Drop
- Galerie mit Lightbox
- Pro Datei: Beschreibung, Datum, Personen taggen
- Video-Upload
- Audio-Aufnahmen (Interviews)

### Geodaten & Weltkarte
- Lebensereignisse pro Person: Wohnorte, Geburt, Tod, Ausbildung, Beruf, Migration
- Ortssuche mit Geocoding (Mapbox)
- Weltkarte mit Marker-Cluster
- Zeitraum-Filter
- Animation: "Reise durch die Familiengeschichte"

### Zeitstrahl
- Horizontale Timeline mit Lebensspannen aller Personen
- Farbcodiert nach Region/Wohnort
- Zoom: Jahrzehnt / Jahrhundert / Gesamt

### Kollaboration
- Kommentar-Funktion an Profilen und Geschichten
- Aktivitäts-Feed
- Rollen: Owner, Editor, Viewer

### Import/Export
- GEDCOM-Import (Ancestry/MyHeritage-Daten)
- GEDCOM-Export
- PDF-Export (Stammbaum-Ausdruck)
- JSON-Datenexport (DSGVO Art. 20)

---

## Datenmodell

```
User ──1:N──> FamilyTreeMember (role) ──N:1──> FamilyTree
                                                    │ 1:N
                                                    ▼
                                                 Person
                                              /  |  |  \
                                    Relation Story Media LifeEvent → Location
```

### Kernentitäten

- **Person:** first_name, last_name, birth_name, gender (m/f/d/unknown), birth/death_date + precision, is_living, bio, profile_image_url
- **Relation:** person_a → person_b, type (PARENT_CHILD | SPOUSE), subtype (biological/adopted/step), start/end_date
- **Story:** title, content (JSONB Rich-Text), author, verknüpft mit Personen (M:N via StoryPerson)
- **Media:** type (IMAGE/VIDEO/AUDIO/DOCUMENT), url, thumbnail_url, caption, date_taken, verknüpft mit Personen (M:N via MediaPerson)
- **LifeEvent:** type (RESIDENCE/BIRTH/DEATH/EDUCATION/OCCUPATION/MIGRATION/CUSTOM), title, description, start/end_date, location_id
- **Location:** name, lat/lng, country, country_code, region, city, formatted_address

**DB: PostgreSQL** -- rekursive CTEs für Graph-Traversierung, PostGIS für Geodaten. Kein Graph-DB-Overhead nötig.

---

## Tech-Stack

### Frontend
| Bereich | Technologie |
|---|---|
| Framework | Next.js 15 (App Router, SSR) |
| UI | shadcn/ui + Tailwind CSS 4 |
| State | TanStack Query |
| Stammbaum | React Flow |
| Karte | Mapbox GL JS (react-map-gl) |
| Zeitstrahl | vis-timeline |
| Rich-Text | TipTap |
| Formulare | React Hook Form + Zod |

### Backend
| Bereich | Technologie |
|---|---|
| Runtime | Next.js Server Actions + API Routes |
| ORM | Drizzle ORM |
| DB | PostgreSQL 16 (Supabase, Frankfurt) |
| Auth | NextAuth.js v5 |
| Storage | Supabase Storage |
| Geocoding | Mapbox Geocoding API |
| E-Mail | Resend |
| Hosting | Vercel + Supabase |

---

## Architektur

- **Monolith-First:** Next.js als Fullstack-Monolith
- **Type-Safety:** TypeScript + Zod + Drizzle (End-to-End)
- **Privacy-by-Design:** Row Level Security, EU-Hosting
- **Web-First:** Responsive Design, Mobile App später

### DSGVO
- EU-Hosting (Supabase Frankfurt)
- Recht auf Löschung + Datenexport
- Signierte/temporäre URLs für Medien
- Toggle für "Person informiert" bei lebenden Nicht-Nutzern
- Nur technisch notwendige Cookies, Analytics nur mit Opt-in

---

## Monetarisierung (Freemium)

| Tier | Preis | Limits |
|---|---|---|
| Kostenlos | 0 EUR | 1 Baum, 50 Personen, 500 MB |
| Premium | 9,99 EUR/Mon | Unbegrenzt, 50 GB, Karte+Timeline, GEDCOM |
| Familie | 14,99 EUR/Mon | 10 Editoren, 200 GB, Audio, unbegrenzt Bäume |

---

## Implementierungsplan

| Sprint | Wochen | Inhalt |
|---|---|---|
| 1 | 1-2 | Projektsetup, Auth, DB-Schema, Basis-Layout |
| 2 | 3-4 | Personen-CRUD, Relationen, Profil, Profilbild-Upload |
| 3 | 5-6 | Stammbaum (React Flow), Auto-Layout, Navigation |
| 4 | 7-8 | Geschichten (TipTap), Medien-Upload/Galerie, Einladungen |
| 5 | 9-10 | LifeEvents, Locations, Weltkarte (Mapbox), Zeitfilter |
| 6 | 11-12 | Zeitstrahl, Kollaboration, GEDCOM, DSGVO, PDF-Export |
