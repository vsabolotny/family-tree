"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Bold, Italic, List, Heading2 } from "lucide-react";
import type { Story } from "@/lib/db/schema";

interface StoryEditorProps {
  treeId: string;
  personId: string;
  allPersons: { id: string; firstName: string; lastName: string }[];
  onStoryCreated: (story: Story) => void;
}

export function StoryEditor({
  treeId,
  personId,
  allPersons,
  onStoryCreated,
}: StoryEditorProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([personId]);
  const [loading, setLoading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Erzähle eine Geschichte...",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring prose prose-sm max-w-none",
      },
    },
  });

  async function handleSubmit() {
    if (!editor || !title.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/trees/${treeId}/stories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content: { html: editor.getHTML(), json: editor.getJSON() },
        personIds: selectedPersonIds,
      }),
    });

    if (res.ok) {
      const story = await res.json();
      onStoryCreated(story);
      setTitle("");
      editor.commands.clearContent();
      setOpen(false);
      setSelectedPersonIds([personId]);
    }
    setLoading(false);
  }

  function togglePerson(id: string) {
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Geschichte hinzufügen
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Neue Geschichte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="story-title">Titel</Label>
          <Input
            id="story-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Wie Opa den Krieg überlebte"
          />
        </div>

        {/* Toolbar */}
        <div className="flex gap-1 border rounded-md p-1 w-fit">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <EditorContent editor={editor} />

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

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading ? "Wird gespeichert..." : "Speichern"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
