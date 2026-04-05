"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Media } from "@/lib/db/schema";

interface MediaUploadProps {
  treeId: string;
  personId: string;
  allPersons: { id: string; firstName: string; lastName: string }[];
  onMediaUploaded: (media: Media) => void;
}

export function MediaUpload({
  treeId,
  personId,
  allPersons,
  onMediaUploaded,
}: MediaUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [dateTaken, setDateTaken] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([personId]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function togglePerson(id: string) {
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleUpload() {
    setUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      if (caption) formData.append("caption", caption);
      if (dateTaken) formData.append("dateTaken", dateTaken);
      selectedPersonIds.forEach((id) => formData.append("personIds", id));

      const res = await fetch(`/api/trees/${treeId}/media`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const media = await res.json();
        onMediaUploaded(media);
      }
    }

    setFiles([]);
    setCaption("");
    setDateTaken("");
    setUploading(false);
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Dateien hierher ziehen oder klicken zum Auswählen
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Fotos, Videos, Audio, Dokumente
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span className="truncate">{file.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button onClick={() => removeFile(i)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Beschreibung</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTaken">Aufnahmedatum</Label>
                <Input
                  id="dateTaken"
                  type="date"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                />
              </div>
            </div>

            {/* Person tagging */}
            <div className="space-y-2">
              <Label>Verknüpfte Personen</Label>
              <div className="flex flex-wrap gap-2">
                {allPersons.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePerson(p.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      selectedPersonIds.includes(p.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleUpload} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading
                ? "Wird hochgeladen..."
                : `${files.length} Datei${files.length > 1 ? "en" : ""} hochladen`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
