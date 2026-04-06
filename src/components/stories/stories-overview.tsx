"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StoryEditor } from "@/components/person/story-editor";
import type { Story } from "@/lib/db/schema";

interface StoryWithPersons extends Story {
  persons: { storyId: string; personId: string; firstName: string; lastName: string }[];
}

interface StoriesOverviewProps {
  treeId: string;
  stories: StoryWithPersons[];
  allPersons: { id: string; firstName: string; lastName: string }[];
  canEdit: boolean;
}

export function StoriesOverview({
  treeId,
  stories: initialStories,
  allPersons,
  canEdit,
}: StoriesOverviewProps) {
  const router = useRouter();
  const [storyList, setStoryList] = useState(initialStories);

  async function handleDelete(storyId: string) {
    if (!confirm("Geschichte wirklich löschen?")) return;

    const res = await fetch(`/api/trees/${treeId}/stories/${storyId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setStoryList((prev) => prev.filter((s) => s.id !== storyId));
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Geschichten ({storyList.length})</h1>
          <p className="text-muted-foreground text-sm">
            Erzählungen und Erinnerungen deiner Familie
          </p>
        </div>
      </div>

      {canEdit && allPersons.length > 0 && (
        <div className="mb-6">
          <StoryEditor
            treeId={treeId}
            personId={allPersons[0].id}
            allPersons={allPersons}
            onStoryCreated={(story) => {
              setStoryList((prev) => [...prev, { ...story, persons: [] }]);
              router.refresh();
            }}
          />
        </div>
      )}

      {storyList.length === 0 ? (
        <Card className="bg-surface-container/50">
          <CardHeader className="items-center text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Noch keine Geschichten</CardTitle>
            <p className="text-sm text-muted-foreground max-w-sm">
              Erzähle die Geschichten deiner Familie. Gehe zum Profil einer
              Person und schreibe die erste Geschichte.
            </p>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {storyList.map((story) => (
            <Card key={story.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {story.persons.map((p) => (
                        <Link
                          key={p.personId}
                          href={`/tree/${treeId}/person/${p.personId}`}
                        >
                          <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
                            {p.firstName} {p.lastName}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(story.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {story.content &&
                typeof story.content === "object" &&
                "html" in (story.content as Record<string, unknown>) ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: (story.content as { html: string }).html,
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {String(story.content || "")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
