"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Person, Relation } from "@/lib/db/schema";

interface AddPersonDialogProps {
  treeId: string;
  persons: Person[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonAdded: (person: Person, relation?: Relation) => void;
}

export function AddPersonDialog({
  treeId,
  persons,
  open,
  onOpenChange,
  onPersonAdded,
}: AddPersonDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const personRes = await fetch(`/api/trees/${treeId}/persons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          gender: formData.get("gender"),
          birthDate: formData.get("birthDate") || undefined,
          birthDatePrecision: formData.get("birthDate") ? "exact" : "unknown",
          isLiving: formData.get("isLiving") === "on",
        }),
      });

      if (!personRes.ok) {
        setError("Fehler beim Erstellen der Person.");
        setLoading(false);
        return;
      }

      const person = await personRes.json();

      // Create relation if selected
      const relatedPersonId = formData.get("relatedPerson") as string;
      const relationType = formData.get("relationType") as string;

      let relation: Relation | undefined;

      if (relatedPersonId && relationType) {
        const isParent = relationType === "parent";
        const isChild = relationType === "child";
        const isSpouse = relationType === "spouse";

        const relationData = {
          personAId: isChild ? person.id : relatedPersonId,
          personBId: isChild ? relatedPersonId : person.id,
          type: isSpouse ? "spouse" : "parent_child",
        };

        if (isParent) {
          relationData.personAId = person.id;
          relationData.personBId = relatedPersonId;
        }

        const relRes = await fetch(`/api/trees/${treeId}/relations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(relationData),
        });

        if (relRes.ok) {
          relation = await relRes.json();
        }
      }

      onPersonAdded(person, relation);
      onOpenChange(false);
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Person hinzufügen</DialogTitle>
          <DialogDescription>
            Füge eine neue Person zum Familienbaum hinzu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Vorname</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nachname</Label>
              <Input id="lastName" name="lastName" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Geschlecht</Label>
              <select
                id="gender"
                name="gender"
                className="flex h-9 w-full rounded-sm border-0 border-b-2 border-on-surface-variant/30 bg-surface-high/40 px-3 py-1 text-sm"
                defaultValue="unknown"
              >
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
                <option value="diverse">Divers</option>
                <option value="unknown">Unbekannt</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Geburtsdatum</Label>
              <Input id="birthDate" name="birthDate" type="date" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isLiving"
              name="isLiving"
              defaultChecked
              className="h-4 w-4"
            />
            <Label htmlFor="isLiving">Person lebt noch</Label>
          </div>

          {persons.length > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="relatedPerson">
                  Verwandt mit (optional)
                </Label>
                <select
                  id="relatedPerson"
                  name="relatedPerson"
                  className="flex h-9 w-full rounded-sm border-0 border-b-2 border-on-surface-variant/30 bg-surface-high/40 px-3 py-1 text-sm"
                >
                  <option value="">-- Keine Verknüpfung --</option>
                  {persons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationType">Beziehung</Label>
                <select
                  id="relationType"
                  name="relationType"
                  className="flex h-9 w-full rounded-sm border-0 border-b-2 border-on-surface-variant/30 bg-surface-high/40 px-3 py-1 text-sm"
                >
                  <option value="child">Ist Kind von</option>
                  <option value="parent">Ist Elternteil von</option>
                  <option value="spouse">Ist Partner von</option>
                </select>
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Wird erstellt..." : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
