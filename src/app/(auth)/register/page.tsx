"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registrierung fehlgeschlagen.");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <TreePine className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Konto erstellen</CardTitle>
          <CardDescription>
            Starte dein digitales Familienarchiv
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Maria Müller"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="maria@beispiel.de"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={8}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird erstellt..." : "Registrieren"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Bereits ein Konto?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Anmelden
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
