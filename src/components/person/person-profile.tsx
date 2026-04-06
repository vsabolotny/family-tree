"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowLeft,
  Edit2,
  Save,
  Trash2,
  Users,
  BookOpen,
  Image as ImageIcon,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StoryEditor } from "@/components/person/story-editor";
import { MediaUpload } from "@/components/media/media-upload";
import { MediaGallery } from "@/components/media/media-gallery";
import { AddLifeEventDialog } from "@/components/person/add-life-event-dialog";
import type {
  Person,
  Relation,
  Story,
  Media,
  LifeEvent,
  Location,
} from "@/lib/db/schema";

interface PersonProfileProps {
  treeId: string;
  person: Person;
  relations: Relation[];
  relatedPersons: { id: string; firstName: string; lastName: string }[];
  stories: Story[];
  media: Media[];
  lifeEvents: LifeEvent[];
  locations: Location[];
  allPersons: { id: string; firstName: string; lastName: string }[];
  canEdit: boolean;
}

const genderLabels: Record<string, string> = {
  male: "Männlich",
  female: "Weiblich",
  diverse: "Divers",
  unknown: "Unbekannt",
};

export function PersonProfile({
  treeId,
  person,
  relations,
  relatedPersons,
  stories,
  media: initialMedia,
  lifeEvents,
  locations,
  allPersons,
  canEdit,
}: PersonProfileProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [personData, setPersonData] = useState(person);
  const [mediaList, setMediaList] = useState(initialMedia);
  const [storyList, setStoryList] = useState(stories);
  const [eventList, setEventList] = useState(lifeEvents);
  const [addEventOpen, setAddEventOpen] = useState(false);

  const initials =
    (personData.firstName?.[0] || "") + (personData.lastName?.[0] || "");

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);

    const res = await fetch(`/api/trees/${treeId}/persons/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        birthName: formData.get("birthName") || null,
        gender: formData.get("gender"),
        birthDate: formData.get("birthDate") || null,
        birthDatePrecision: formData.get("birthDate") ? "exact" : "unknown",
        deathDate: formData.get("deathDate") || null,
        deathDatePrecision: formData.get("deathDate") ? "exact" : "unknown",
        isLiving: formData.get("isLiving") === "on",
        bio: formData.get("bio") || null,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setPersonData(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Person wirklich löschen? Alle verknüpften Daten werden ebenfalls entfernt.")) return;

    const res = await fetch(`/api/trees/${treeId}/persons/${person.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push(`/tree/${treeId}`);
    }
  }

  function getRelationLabel(rel: Relation) {
    const otherId = rel.personAId === person.id ? rel.personBId : rel.personAId;
    const other = relatedPersons.find((p) => p.id === otherId);
    if (!other) return null;

    let label: string;
    if (rel.type === "spouse") {
      label = "Partner";
    } else if (rel.personAId === person.id) {
      label = "Elternteil von";
    } else {
      label = "Kind von";
    }

    return { other, label };
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "dd. MMMM yyyy", { locale: de });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/tree/${treeId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-16 w-16">
          <AvatarImage src={personData.profileImageUrl || undefined} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {personData.firstName} {personData.lastName}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{genderLabels[personData.gender]}</Badge>
            {personData.birthDate && <span>* {formatDate(personData.birthDate)}</span>}
            {personData.deathDate && <span>† {formatDate(personData.deathDate)}</span>}
            {personData.isLiving && <Badge variant="outline">Lebt</Badge>}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              {editing ? "Abbrechen" : "Bearbeiten"}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </Button>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={personData.firstName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={personData.lastName}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthName">Geburtsname</Label>
                  <Input
                    id="birthName"
                    name="birthName"
                    defaultValue={personData.birthName || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Geschlecht</Label>
                  <select
                    id="gender"
                    name="gender"
                    defaultValue={personData.gender}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  >
                    <option value="male">Männlich</option>
                    <option value="female">Weiblich</option>
                    <option value="diverse">Divers</option>
                    <option value="unknown">Unbekannt</option>
                  </select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input
                    type="checkbox"
                    id="isLiving"
                    name="isLiving"
                    defaultChecked={personData.isLiving}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isLiving">Lebt noch</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Geburtsdatum</Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    defaultValue={personData.birthDate || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deathDate">Sterbedatum</Label>
                  <Input
                    id="deathDate"
                    name="deathDate"
                    type="date"
                    defaultValue={personData.deathDate || ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biografie</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={personData.bio || ""}
                  placeholder="Erzähle etwas über diese Person..."
                />
              </div>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Wird gespeichert..." : "Speichern"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bio */}
      {personData.bio && !editing && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-sm whitespace-pre-wrap">{personData.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="relations">
        <TabsList>
          <TabsTrigger value="relations">
            <Users className="mr-2 h-4 w-4" />
            Verwandte
          </TabsTrigger>
          <TabsTrigger value="stories">
            <BookOpen className="mr-2 h-4 w-4" />
            Geschichten ({storyList.length})
          </TabsTrigger>
          <TabsTrigger value="media">
            <ImageIcon className="mr-2 h-4 w-4" />
            Medien ({mediaList.length})
          </TabsTrigger>
          <TabsTrigger value="places">
            <MapPin className="mr-2 h-4 w-4" />
            Orte ({eventList.length})
          </TabsTrigger>
        </TabsList>

        {/* Relations Tab */}
        <TabsContent value="relations" className="mt-4">
          {relations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Verwandten verknüpft.
            </p>
          ) : (
            <div className="space-y-2">
              {relations.map((rel) => {
                const info = getRelationLabel(rel);
                if (!info) return null;
                return (
                  <Link
                    key={rel.id}
                    href={`/tree/${treeId}/person/${info.other.id}`}
                    className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted transition-colors"
                  >
                    <Badge variant="secondary">{info.label}</Badge>
                    <span className="font-medium">
                      {info.other.firstName} {info.other.lastName}
                    </span>
                    {rel.subtype && rel.subtype !== "biological" && (
                      <Badge variant="outline" className="text-xs">
                        {rel.subtype}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Stories Tab */}
        <TabsContent value="stories" className="mt-4 space-y-4">
          {canEdit && (
            <StoryEditor
              treeId={treeId}
              personId={person.id}
              allPersons={allPersons}
              onStoryCreated={(story) => setStoryList((prev) => [...prev, story])}
            />
          )}
          {storyList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Geschichten.
            </p>
          ) : (
            storyList.map((story) => (
              <Card key={story.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{story.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(story.createdAt?.toISOString?.() || String(story.createdAt))}
                  </p>
                </CardHeader>
                <CardContent>
                  {story.content && typeof story.content === "object" && "html" in (story.content as Record<string, unknown>) ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: (story.content as { html: string }).html }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {JSON.stringify(story.content)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="mt-4 space-y-4">
          {canEdit && (
            <MediaUpload
              treeId={treeId}
              personId={person.id}
              allPersons={allPersons}
              onMediaUploaded={(m) => setMediaList((prev) => [...prev, m])}
            />
          )}
          <MediaGallery media={mediaList} />
        </TabsContent>

        {/* Places Tab */}
        <TabsContent value="places" className="mt-4 space-y-4">
          {canEdit && (
            <Button variant="outline" onClick={() => setAddEventOpen(true)}>
              <MapPin className="mr-2 h-4 w-4" />
              Lebensereignis hinzufügen
            </Button>
          )}
          {eventList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Lebensereignisse erfasst.
            </p>
          ) : (
            <div className="space-y-2">
              {eventList.map((event) => {
                const loc = locations.find((l) => l.id === event.locationId);
                return (
                  <div key={event.id} className="flex items-center gap-3 rounded-md border p-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {event.title || event.type}
                      </p>
                      {loc && (
                        <p className="text-xs text-muted-foreground">{loc.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {event.startDate && formatDate(event.startDate)}
                        {event.endDate && ` – ${formatDate(event.endDate)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <AddLifeEventDialog
            treeId={treeId}
            personId={person.id}
            open={addEventOpen}
            onOpenChange={setAddEventOpen}
            onEventAdded={(event) => setEventList((prev) => [...prev, event])}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
