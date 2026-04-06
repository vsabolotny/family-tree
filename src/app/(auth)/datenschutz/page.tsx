export default function DatenschutzPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 prose prose-sm">
      <h1>Datenschutzerklärung</h1>
      <p><strong>Stand:</strong> April 2026</p>

      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlich für die Datenverarbeitung auf dieser Website ist der Betreiber
        der Stammbaum-App. Kontaktdaten findest du im Impressum.
      </p>

      <h2>2. Welche Daten wir erheben</h2>
      <ul>
        <li><strong>Kontodaten:</strong> Name, E-Mail-Adresse, Passwort (gehashed)</li>
        <li><strong>Familiendaten:</strong> Namen, Geburtsdaten, Sterbedaten, Biografien,
          Beziehungen, Lebensereignisse und Geodaten von Personen im Familienbaum</li>
        <li><strong>Medien:</strong> Hochgeladene Fotos, Videos, Audio und Dokumente</li>
        <li><strong>Geschichten:</strong> Texte, die Nutzer über Familienmitglieder verfassen</li>
        <li><strong>Nutzungsdaten:</strong> Nur technisch notwendige Session-Daten</li>
      </ul>

      <h2>3. Rechtsgrundlage</h2>
      <p>
        Die Verarbeitung erfolgt auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)
        bei der Registrierung sowie zur Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).
      </p>
      <p>
        <strong>Besonderheit bei Familiendaten:</strong> Daten von Personen, die kein eigenes Konto
        haben, werden auf Grundlage des berechtigten Interesses (Art. 6 Abs. 1 lit. f DSGVO) im
        Rahmen der privaten Familienforschung verarbeitet. Wir empfehlen, lebende Personen über
        die Datenspeicherung zu informieren.
      </p>

      <h2>4. Hosting & Datenspeicherung</h2>
      <p>
        Alle Daten werden auf Servern in der Europäischen Union (Deutschland) gespeichert.
        Es findet keine Datenübertragung in Drittländer statt, sofern nicht durch den Nutzer
        explizit ein Dienst mit Drittlandsbezug aktiviert wird (z.B. Google OAuth).
      </p>

      <h2>5. Cookies</h2>
      <p>
        Wir verwenden ausschließlich technisch notwendige Cookies für die Session-Verwaltung.
        Es werden keine Tracking- oder Werbe-Cookies eingesetzt. Analytik-Dienste werden nur
        mit expliziter Einwilligung aktiviert.
      </p>

      <h2>6. Deine Rechte</h2>
      <ul>
        <li><strong>Auskunft:</strong> Du kannst jederzeit Auskunft über deine gespeicherten Daten verlangen.</li>
        <li><strong>Datenportabilität:</strong> Über die Exportfunktion kannst du alle deine Daten
          als GEDCOM- oder JSON-Datei herunterladen (Art. 20 DSGVO).</li>
        <li><strong>Löschung:</strong> Du kannst dein Konto jederzeit löschen. Dabei werden alle
          personenbezogenen Daten unwiderruflich entfernt (Art. 17 DSGVO).</li>
        <li><strong>Berichtigung:</strong> Unrichtige Daten können jederzeit über die Profilbearbeitung
          korrigiert werden (Art. 16 DSGVO).</li>
        <li><strong>Widerspruch:</strong> Du kannst der Verarbeitung deiner Daten jederzeit
          widersprechen (Art. 21 DSGVO).</li>
      </ul>

      <h2>7. Datenlöschung</h2>
      <p>
        Bei Kontolöschung werden entfernt: Nutzerkonto, Mitgliedschaften in Familienbäumen,
        hochgeladene Kommentare. Familienbäume, deren alleiniger Besitzer du bist, werden
        vollständig gelöscht inkl. aller Personen, Medien und Geschichten.
      </p>

      <h2>8. Datensicherheit</h2>
      <p>
        Alle Verbindungen sind TLS-verschlüsselt. Passwörter werden mit bcrypt gehashed.
        Mediendateien sind nur für authentifizierte Mitglieder des jeweiligen Familienbaums zugänglich.
      </p>

      <h2>9. Kontakt</h2>
      <p>
        Bei Fragen zum Datenschutz wende dich an den Betreiber der Stammbaum-App.
      </p>
    </div>
  );
}
