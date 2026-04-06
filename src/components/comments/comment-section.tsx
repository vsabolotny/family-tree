"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
}

interface CommentSectionProps {
  treeId: string;
  targetType: "person" | "story";
  targetId: string;
}

export function CommentSection({ treeId, targetType, targetId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/trees/${treeId}/comments?targetType=${targetType}&targetId=${targetId}`)
      .then((res) => res.json())
      .then(setComments)
      .catch(() => {});
  }, [treeId, targetType, targetId, open]);

  async function handleSubmit() {
    if (!newComment.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/trees/${treeId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, content: newComment }),
    });

    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Kommentare
      </Button>
    );
  }

  return (
    <div className="rounded-2xl bg-surface-low p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Kommentare ({comments.length})
        </h4>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Schließen
        </Button>
      </div>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">Noch keine Kommentare.</p>
      )}

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {c.authorName?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{c.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(c.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                </span>
              </div>
              <p className="text-sm mt-1">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Kommentar schreiben..."
          rows={2}
          className="text-sm"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={loading || !newComment.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
