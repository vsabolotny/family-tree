import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { TreePine, Map, Clock, BookOpen, Image, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <TreePine className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Stammbaum</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button>Kostenlos starten</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Deine Familiengeschichte,
            <br />
            <span className="text-primary">lebendig erzählt</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Dokumentiere deine Familie visuell mit interaktivem Stammbaum,
            Weltkarte, Zeitstrahl und Geschichten. Datenschutzkonform in der EU
            gehostet.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6">
                Kostenlos starten
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/30 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              Alles, was deine Familie braucht
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<TreePine className="h-8 w-8" />}
                title="Interaktiver Stammbaum"
                description="Visueller Familiengraph mit Zoom, Navigation und direktem Hinzufügen von Personen."
              />
              <FeatureCard
                icon={<Map className="h-8 w-8" />}
                title="Weltkarte"
                description="Sieh auf einer Karte, wo deine Familie gelebt hat -- mit Zeitfilter und Animationen."
              />
              <FeatureCard
                icon={<Clock className="h-8 w-8" />}
                title="Zeitstrahl"
                description="Lebensspannen aller Familienmitglieder auf einem interaktiven Zeitstrahl."
              />
              <FeatureCard
                icon={<BookOpen className="h-8 w-8" />}
                title="Geschichten"
                description="Erzähle die Geschichten deiner Familie mit einem modernen Rich-Text-Editor."
              />
              <FeatureCard
                icon={<Image className="h-8 w-8" />}
                title="Fotos & Videos"
                description="Lade Fotos, Videos und Dokumente hoch und verknüpfe sie mit Personen."
              />
              <FeatureCard
                icon={<Users className="h-8 w-8" />}
                title="Zusammenarbeit"
                description="Lade Familienmitglieder ein, gemeinsam am Familienarchiv zu arbeiten."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Stammbaum -- Dein digitales Familienarchiv. DSGVO-konform, gehostet in der EU.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
