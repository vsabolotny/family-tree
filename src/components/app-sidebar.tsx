"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  TreePine,
  Users,
  Map,
  Clock,
  BookOpen,
  Image,
  Settings,
  LogOut,
  LayoutDashboard,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const treeNavigation = [
  { name: "Stammbaum", href: "", icon: TreePine },
  { name: "Personen", href: "/persons", icon: Users },
  { name: "Geschichten", href: "/stories", icon: BookOpen },
  { name: "Medien", href: "/media", icon: Image },
  { name: "Weltkarte", href: "/map", icon: Map },
  { name: "Zeitstrahl", href: "/timeline", icon: Clock },
  { name: "Einstellungen", href: "/settings", icon: Settings },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const treeIdMatch = pathname.match(/\/tree\/([^/]+)/);
  const treeId = treeIdMatch?.[1];

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="flex w-64 flex-col bg-surface-low">
      <div className="flex items-center gap-2 p-4">
        <TreePine className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold font-heading">Stammbaum</span>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}

        {treeId && (
          <>
            <Separator className="my-2" />
            <p className="px-3 py-1 text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider">
              Familienbaum
            </p>
            {treeNavigation.map((item) => {
              const href = `/tree/${treeId}${item.href}`;
              const isActive = item.href === ""
                ? pathname === `/tree/${treeId}`
                : pathname.startsWith(href);
              return (
                <Link
                  key={item.name}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <Separator />

      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          title="Konto löschen"
          onClick={async () => {
            if (
              !confirm(
                "Konto wirklich löschen? Alle deine Daten werden unwiderruflich entfernt."
              )
            )
              return;
            if (!confirm("Bist du wirklich sicher? Dies kann nicht rückgängig gemacht werden."))
              return;
            await fetch("/api/account", { method: "DELETE" });
            router.push("/");
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <form action="/api/auth/signout" method="POST">
          <Button variant="ghost" size="icon" className="h-8 w-8" type="submit">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
