"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Settings, UserPlus, Crown, Edit2, Eye, Download, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { FamilyTree } from "@/lib/db/schema";

interface Member {
  id: string;
  role: string;
  joinedAt: Date;
  userId: string;
  name: string;
  email: string;
}

interface TreeSettingsProps {
  tree: FamilyTree;
  members: Member[];
  isOwner: boolean;
}

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-4 w-4 text-amber-500" />,
  editor: <Edit2 className="h-4 w-4 text-blue-500" />,
  viewer: <Eye className="h-4 w-4 text-gray-500" />,
};

const roleLabels: Record<string, string> = {
  owner: "Besitzer",
  editor: "Bearbeiter",
  viewer: "Betrachter",
};

export function TreeSettings({ tree, members, isOwner }: TreeSettingsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [memberList, setMemberList] = useState(members);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    const res = await fetch(`/api/trees/${tree.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    const data = await res.json();

    if (res.ok) {
      setInviteSuccess(`${data.member.name} wurde als ${roleLabels[inviteRole]} eingeladen.`);
      setMemberList((prev) => [
        ...prev,
        {
          id: data.member.id,
          role: inviteRole,
          joinedAt: new Date(),
          userId: data.member.userId,
          name: data.member.name,
          email: inviteEmail,
        },
      ]);
      setInviteEmail("");
    } else {
      setInviteError(data.error);
    }

    setInviting(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Einstellungen</h1>
      </div>

      {/* Tree Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Familienbaum</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            <span className="font-medium">Name:</span> {tree.name}
          </p>
          {tree.description && (
            <p className="text-sm mt-1">
              <span className="font-medium">Beschreibung:</span>{" "}
              {tree.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mitglieder ({memberList.length})</CardTitle>
          <CardDescription>
            Personen, die Zugriff auf diesen Familienbaum haben.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {memberList.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                {roleIcons[member.role]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                <Badge variant="secondary">{roleLabels[member.role]}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>
              <UserPlus className="inline mr-2 h-5 w-5" />
              Mitglied einladen
            </CardTitle>
            <CardDescription>
              Die Person muss bereits ein Konto haben.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">E-Mail-Adresse</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="person@beispiel.de"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Rolle</Label>
                  <select
                    id="inviteRole"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "editor" | "viewer")
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  >
                    <option value="editor">Bearbeiter</option>
                    <option value="viewer">Betrachter</option>
                  </select>
                </div>
              </div>
              {inviteError && (
                <p className="text-sm text-destructive">{inviteError}</p>
              )}
              {inviteSuccess && (
                <p className="text-sm text-green-600">{inviteSuccess}</p>
              )}
              <Button type="submit" disabled={inviting}>
                {inviting ? "Wird eingeladen..." : "Einladen"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Import / Export */}
      <Card>
        <CardHeader>
          <CardTitle>Import / Export</CardTitle>
          <CardDescription>
            GEDCOM-Dateien importieren oder den Stammbaum exportieren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <a href={`/api/trees/${tree.id}/export/gedcom`} download>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                GEDCOM exportieren
              </Button>
            </a>
            <a href={`/api/trees/${tree.id}/export/pdf`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                PDF / Druckansicht
              </Button>
            </a>
          </div>

          {isOwner && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">GEDCOM importieren</p>
              <p className="text-xs text-muted-foreground mb-3">
                Importiere Personen und Relationen aus einer .ged Datei (Ancestry, MyHeritage etc.).
                Die importierten Daten werden zum bestehenden Baum hinzugefügt.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ged,.gedcom"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImporting(true);
                  setImportResult(null);

                  const formData = new FormData();
                  formData.append("file", file);

                  const res = await fetch(`/api/trees/${tree.id}/import/gedcom`, {
                    method: "POST",
                    body: formData,
                  });

                  const data = await res.json();
                  if (res.ok) {
                    setImportResult(
                      `Erfolgreich importiert: ${data.personsCreated} Personen, ${data.relationsCreated} Relationen.`
                    );
                    router.refresh();
                  } else {
                    setImportResult(`Fehler: ${data.error}`);
                  }
                  setImporting(false);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <Upload className="mr-2 h-4 w-4" />
                {importing ? "Wird importiert..." : "GEDCOM-Datei auswählen"}
              </Button>
              {importResult && (
                <p className={`text-sm mt-2 ${importResult.startsWith("Fehler") ? "text-destructive" : "text-green-600"}`}>
                  {importResult}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
