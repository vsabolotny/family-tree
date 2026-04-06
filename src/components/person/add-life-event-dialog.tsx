"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LifeEvent } from "@/lib/db/schema";

interface AddLifeEventDialogProps {
  treeId: string;
  personId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventAdded: (event: LifeEvent) => void;
}

const eventTypes = [
  { value: "residence", label: "Wohnort" },
  { value: "birth", label: "Geburt" },
  { value: "death", label: "Tod" },
  { value: "education", label: "Ausbildung" },
  { value: "occupation", label: "Beruf" },
  { value: "migration", label: "Migration" },
  { value: "military", label: "Militär" },
  { value: "custom", label: "Sonstiges" },
];

export function AddLifeEventDialog({
  treeId,
  personId,
  open,
  onOpenChange,
  onEventAdded,
}: AddLifeEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const locationName = formData.get("locationName") as string;
    const lat = parseFloat(formData.get("latitude") as string);
    const lng = parseFloat(formData.get("longitude") as string);

    const body: Record<string, unknown> = {
      personId,
      type: formData.get("type"),
      title: formData.get("title") || undefined,
      description: formData.get("description") || undefined,
      startDate: formData.get("startDate") || undefined,
      endDate: formData.get("endDate") || undefined,
    };

    if (locationName && !isNaN(lat) && !isNaN(lng)) {
      body.location = {
        name: locationName,
        latitude: lat,
        longitude: lng,
        country: (formData.get("country") as string) || undefined,
        city: (formData.get("city") as string) || undefined,
      };
    }

    try {
      const res = await fetch(`/api/trees/${treeId}/life-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Erstellen.");
        setLoading(false);
        return;
      }

      const event = await res.json();
      onEventAdded(event);
      onOpenChange(false);
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lebensereignis hinzufügen</DialogTitle>
          <DialogDescription>
            Erfasse ein Ereignis mit Ort und Zeitraum.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-type">Typ</Label>
              <select
                id="event-type"
                name="type"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                {eventTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-title">Titel (optional)</Label>
              <Input
                id="event-title"
                name="title"
                placeholder="z.B. Studium in Wien"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Von</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Bis</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Details zum Ereignis..."
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Ort</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationName">Ortsname</Label>
                <Input
                  id="locationName"
                  name="locationName"
                  placeholder="z.B. Berlin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Land</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="z.B. Deutschland"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input id="city" name="city" placeholder="Berlin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">Breitengrad</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  placeholder="52.52"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Längengrad</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  placeholder="13.405"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Koordinaten findest du z.B. auf Google Maps (Rechtsklick auf Ort).
            </p>
          </div>

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
