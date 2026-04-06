"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Image as ImageIcon, Trash2, X, Play, FileText, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaUpload } from "@/components/media/media-upload";
import type { Media } from "@/lib/db/schema";

interface MediaWithPersons extends Media {
  persons: { mediaId: string; personId: string; firstName: string; lastName: string }[];
}

interface MediaOverviewProps {
  treeId: string;
  media: MediaWithPersons[];
  allPersons: { id: string; firstName: string; lastName: string }[];
  canEdit: boolean;
}

export function MediaOverview({
  treeId,
  media: initialMedia,
  allPersons,
  canEdit,
}: MediaOverviewProps) {
  const [mediaList, setMediaList] = useState(initialMedia);
  const [lightbox, setLightbox] = useState<MediaWithPersons | null>(null);
  const [filter, setFilter] = useState<string>("all");

  async function handleDelete(mediaId: string) {
    if (!confirm("Datei wirklich löschen?")) return;

    const res = await fetch(`/api/trees/${treeId}/media/${mediaId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
    }
  }

  const filtered =
    filter === "all" ? mediaList : mediaList.filter((m) => m.type === filter);

  const counts = {
    all: mediaList.length,
    image: mediaList.filter((m) => m.type === "image").length,
    video: mediaList.filter((m) => m.type === "video").length,
    audio: mediaList.filter((m) => m.type === "audio").length,
    document: mediaList.filter((m) => m.type === "document").length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Medien ({mediaList.length})</h1>
          <p className="text-muted-foreground text-sm">
            Fotos, Videos, Audio und Dokumente
          </p>
        </div>
      </div>

      {canEdit && allPersons.length > 0 && (
        <div className="mb-6">
          <MediaUpload
            treeId={treeId}
            personId={allPersons[0].id}
            allPersons={allPersons}
            onMediaUploaded={(m) =>
              setMediaList((prev) => [...prev, { ...m, persons: [] }])
            }
          />
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["all", "image", "video", "audio", "document"] as const).map((t) => {
          const labels: Record<string, string> = {
            all: "Alle",
            image: "Fotos",
            video: "Videos",
            audio: "Audio",
            document: "Dokumente",
          };
          return (
            <Button
              key={t}
              variant={filter === t ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(t)}
            >
              {labels[t]} ({counts[t]})
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Keine Medien</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="group relative rounded-lg border overflow-hidden"
            >
              {m.type === "image" ? (
                <button
                  onClick={() => setLightbox(m)}
                  className="relative aspect-square w-full"
                >
                  <Image
                    src={m.url}
                    alt={m.caption || m.originalFilename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </button>
              ) : (
                <div className="flex items-center justify-center aspect-square bg-muted">
                  {m.type === "video" && <Play className="h-8 w-8 text-muted-foreground" />}
                  {m.type === "audio" && <Music className="h-8 w-8 text-muted-foreground" />}
                  {m.type === "document" && <FileText className="h-8 w-8 text-muted-foreground" />}
                </div>
              )}

              <div className="p-2">
                <p className="text-xs truncate">{m.caption || m.originalFilename}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {m.persons.map((p) => (
                    <Link key={p.personId} href={`/tree/${treeId}/person/${p.personId}`}>
                      <Badge variant="secondary" className="text-[10px] cursor-pointer">
                        {p.firstName}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              {canEdit && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(m.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightbox(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox.url}
              alt={lightbox.caption || lightbox.originalFilename}
              width={1200}
              height={800}
              className="object-contain max-h-[90vh]"
            />
            {lightbox.caption && (
              <p className="text-center text-white mt-2">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
