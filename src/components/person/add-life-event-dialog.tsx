"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
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

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
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

  // Geocoding state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeoResult | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          setSearchResults(await res.json());
        }
      } catch {
        // ignore
      }
      setSearching(false);
    }, 400);

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  function selectLocation(result: GeoResult) {
    setSelectedLocation(result);
    setSearchQuery(result.city || result.name.split(",")[0]);
    setSearchResults([]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const body: Record<string, unknown> = {
      personId,
      type: formData.get("type"),
      title: formData.get("title") || undefined,
      description: formData.get("description") || undefined,
      startDate: formData.get("startDate") || undefined,
      endDate: formData.get("endDate") || undefined,
    };

    if (selectedLocation) {
      body.location = {
        name: selectedLocation.city || selectedLocation.name.split(",")[0],
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        country: selectedLocation.country || undefined,
        countryCode: selectedLocation.countryCode || undefined,
        region: selectedLocation.region || undefined,
        city: selectedLocation.city || undefined,
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
      setSelectedLocation(null);
      setSearchQuery("");
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

          {/* Location Search */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ort suchen
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedLocation(null);
                }}
                placeholder="Ort eingeben, z.B. Berlin, Wien, Zürich..."
                className="pl-9"
              />
              {searching && (
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                  Suche...
                </span>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-1 rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectLocation(result)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                  >
                    <p className="truncate">{result.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {selectedLocation && (
              <div className="mt-2 rounded-md bg-muted p-2 text-sm">
                <p className="font-medium">{selectedLocation.city || selectedLocation.name.split(",")[0]}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedLocation.country} &bull;{" "}
                  {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                </p>
              </div>
            )}
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
