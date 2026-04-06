"use client";

import { useState, useMemo, useCallback } from "react";
import MapGL, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  locationName: string;
  country: string | null;
  personId: string;
  personName: string;
  eventType: string;
  eventTitle: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface FamilyMapProps {
  treeId: string;
  markers: MapMarker[];
  mapboxToken: string;
}

const eventTypeLabels: Record<string, string> = {
  residence: "Wohnort",
  birth: "Geburt",
  death: "Tod",
  education: "Ausbildung",
  occupation: "Beruf",
  migration: "Migration",
  military: "Militär",
  custom: "Ereignis",
};

const eventTypeColors: Record<string, string> = {
  residence: "#775a19",
  birth: "#5a7a3a",
  death: "#6b5c50",
  education: "#6b4c8a",
  occupation: "#b8860b",
  migration: "#8b3a3a",
  military: "#5c6b5c",
  custom: "#3c6b6b",
};

export function FamilyMap({ treeId, markers, mapboxToken }: FamilyMapProps) {
  const [popup, setPopup] = useState<MapMarker | null>(null);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const filteredMarkers = useMemo(() => {
    if (!yearFrom && !yearTo) return markers;

    return markers.filter((m) => {
      const start = m.startDate ? parseInt(m.startDate.substring(0, 4)) : null;
      const end = m.endDate ? parseInt(m.endDate.substring(0, 4)) : start;

      if (yearFrom && start && end && end < parseInt(yearFrom)) return false;
      if (yearTo && start && start > parseInt(yearTo)) return false;
      return true;
    });
  }, [markers, yearFrom, yearTo]);

  // Group markers by location for cluster-like display
  const groupedMarkers = useMemo(() => {
    const groups = new Map<string, MapMarker[]>();
    for (const m of filteredMarkers) {
      const key = `${m.latitude.toFixed(3)},${m.longitude.toFixed(3)}`;
      const group = groups.get(key) || [];
      group.push(m);
      groups.set(key, group);
    }
    return groups;
  }, [filteredMarkers]);

  // Center on markers or default to Europe
  const initialViewState = useMemo(() => {
    if (markers.length === 0) {
      return { longitude: 10, latitude: 50, zoom: 4 };
    }
    const avgLat =
      markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length;
    const avgLng =
      markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length;
    return { longitude: avgLng, latitude: avgLat, zoom: 4 };
  }, [markers]);

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="pt-6 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Mapbox-Token nicht konfiguriert. Trage{" "}
              <code className="bg-muted px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code>{" "}
              in <code className="bg-muted px-1 rounded">.env.local</code> ein.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <MapGL
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={mapboxToken}
      >
        <NavigationControl position="top-left" />

        {Array.from(groupedMarkers.entries()).map(([key, group]) => (
          <Marker
            key={key}
            latitude={group[0].latitude}
            longitude={group[0].longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopup(group[0]);
            }}
          >
            <div
              className="flex items-center justify-center rounded-full shadow-ambient cursor-pointer"
              style={{
                backgroundColor: eventTypeColors[group[0].eventType] || "#775a19",
                width: Math.min(20 + group.length * 4, 40),
                height: Math.min(20 + group.length * 4, 40),
              }}
            >
              <span className="text-primary-foreground text-xs font-bold">
                {group.length > 1 ? group.length : ""}
              </span>
            </div>
          </Marker>
        ))}

        {popup && (
          <Popup
            latitude={popup.latitude}
            longitude={popup.longitude}
            anchor="bottom"
            onClose={() => setPopup(null)}
            closeOnClick={false}
          >
            <div className="p-1 max-w-[250px]">
              <p className="font-medium text-sm">{popup.locationName}</p>
              {popup.country && (
                <p className="text-xs text-on-surface-variant">{popup.country}</p>
              )}
              <hr className="my-1" />
              {groupedMarkers
                .get(
                  `${popup.latitude.toFixed(3)},${popup.longitude.toFixed(3)}`
                )
                ?.map((m) => (
                  <div key={m.id} className="py-1 text-xs">
                    <Link
                      href={`/tree/${treeId}/person/${m.personId}`}
                      className="text-secondary-foreground hover:underline font-medium"
                    >
                      {m.personName}
                    </Link>
                    <span className="text-on-surface-variant ml-1">
                      {eventTypeLabels[m.eventType] || m.eventType}
                    </span>
                    {m.startDate && (
                      <span className="text-muted-foreground ml-1">
                        {m.startDate.substring(0, 4)}
                        {m.endDate && `–${m.endDate.substring(0, 4)}`}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </Popup>
        )}
      </MapGL>

      {/* Time Filter */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="w-64">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Zeitfilter
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Von Jahr</Label>
                <Input
                  type="number"
                  placeholder="z.B. 1900"
                  value={yearFrom}
                  onChange={(e) => setYearFrom(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Bis Jahr</Label>
                <Input
                  type="number"
                  placeholder="z.B. 2000"
                  value={yearTo}
                  onChange={(e) => setYearTo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredMarkers.length} von {markers.length} Ereignissen
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
