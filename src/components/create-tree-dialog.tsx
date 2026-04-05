"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateTreeDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/trees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOpen(false);
        router.push(`/tree/${data.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Familienbaum
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Familienbaum erstellen</DialogTitle>
          <DialogDescription>
            Gib deinem Familienbaum einen Namen. Du kannst ihn später ändern.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tree-name">Name</Label>
            <Input
              id="tree-name"
              name="name"
              placeholder="z.B. Familie Müller"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tree-description">
              Beschreibung (optional)
            </Label>
            <Input
              id="tree-description"
              name="description"
              placeholder="Eine kurze Beschreibung..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
