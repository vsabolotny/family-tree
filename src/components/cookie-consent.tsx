"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setShow(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass p-4 shadow-ambient-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Diese App verwendet ausschließlich technisch notwendige Cookies für die
          Session-Verwaltung. Keine Tracking-Cookies.{" "}
          <Link href="/datenschutz" className="text-secondary-foreground hover:underline">
            Datenschutzerklärung
          </Link>
        </p>
        <Button size="sm" onClick={accept}>
          Verstanden
        </Button>
      </div>
    </div>
  );
}
