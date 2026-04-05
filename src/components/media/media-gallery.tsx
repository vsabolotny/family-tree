"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Play, FileText, Music } from "lucide-react";
import type { Media } from "@/lib/db/schema";

interface MediaGalleryProps {
  media: Media[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [lightbox, setLightbox] = useState<Media | null>(null);

  if (media.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Noch keine Medien.</p>
    );
  }

  const images = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");
  const audio = media.filter((m) => m.type === "audio");
  const documents = media.filter((m) => m.type === "document");

  return (
    <>
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setLightbox(img)}
              className="relative aspect-square rounded-md overflow-hidden border hover:opacity-90 transition-opacity"
            >
              <Image
                src={img.url}
                alt={img.caption || img.originalFilename}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 25vw"
              />
            </button>
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Videos</p>
          {videos.map((vid) => (
            <div key={vid.id} className="rounded-md border overflow-hidden">
              <video controls className="w-full max-h-[400px]">
                <source src={vid.url} type={vid.mimeType} />
              </video>
              {vid.caption && (
                <p className="p-2 text-sm text-muted-foreground">{vid.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audio */}
      {audio.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Audio</p>
          {audio.map((aud) => (
            <div key={aud.id} className="flex items-center gap-3 rounded-md border p-3">
              <Music className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm">{aud.caption || aud.originalFilename}</p>
                <audio controls className="w-full mt-1">
                  <source src={aud.url} type={aud.mimeType} />
                </audio>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Dokumente</p>
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted transition-colors"
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{doc.originalFilename}</p>
                {doc.caption && (
                  <p className="text-xs text-muted-foreground">{doc.caption}</p>
                )}
              </div>
            </a>
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
    </>
  );
}
