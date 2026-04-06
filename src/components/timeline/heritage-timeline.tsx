"use client";

import Image from "next/image";
import Link from "next/link";

export interface TimelineEntry {
  id: string;
  date: string;
  dateDisplay: string;
  title: string;
  description: string;
  locationTags: string[];
  personIds: string[];
  personNames: string[];
  personAvatars: string[];
  eventType: string;
  imageUrl?: string | null;
  imageCaption?: string | null;
  isBreakout?: boolean;
}

interface HeritageTimelineProps {
  treeId: string;
  entries: TimelineEntry[];
  treeName: string;
  treeDescription?: string | null;
}

export function HeritageTimeline({
  treeId,
  entries,
  treeName,
  treeDescription,
}: HeritageTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="inline-block p-4 bg-surface-container rounded-full mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p>Noch keine Ereignisse mit Datumsangaben vorhanden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-20 text-center">
        <h1 className="text-5xl font-black text-primary mb-4 italic leading-tight font-heading">
          {treeName}
        </h1>
        {treeDescription && (
          <p className="text-on-surface-variant max-w-xl mx-auto text-lg">
            {treeDescription}
          </p>
        )}
      </header>

      {/* Timeline */}
      <section className="max-w-5xl mx-auto relative">
        {/* Central vertical track */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 z-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(119, 90, 25, 0) 0%, rgba(119, 90, 25, 0.2) 15%, rgba(119, 90, 25, 0.2) 85%, rgba(119, 90, 25, 0) 100%)",
          }}
        />

        <div className="space-y-32 relative z-10">
          {entries.map((entry, index) => {
            if (entry.isBreakout) {
              return <BreakoutEntry key={entry.id} entry={entry} treeId={treeId} />;
            }
            const isLeft = index % 2 === 0;
            return (
              <StandardEntry
                key={entry.id}
                entry={entry}
                treeId={treeId}
                isLeft={isLeft}
              />
            );
          })}
        </div>

        {/* Bottom Decoration */}
        <div className="mt-32 flex justify-center">
          <div className="text-center">
            <div className="inline-block p-4 bg-surface-high rounded-full mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="font-heading italic text-on-surface-variant">
              Die Geschichte wird fortgeschrieben, wenn neue Erinnerungen gefunden werden...
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function GoldDot({ large = false }: { large?: boolean }) {
  const size = large ? "w-8 h-8" : "w-6 h-6";
  return (
    <div className="relative">
      <div
        className={`${size} rounded-full border-4 border-background z-20`}
        style={{
          backgroundColor: "#e9c176",
          boxShadow: "0 0 15px rgba(233, 193, 118, 0.5)",
        }}
      />
    </div>
  );
}

function StandardEntry({
  entry,
  treeId,
  isLeft,
}: {
  entry: TimelineEntry;
  treeId: string;
  isLeft: boolean;
}) {
  const textContent = (
    <div className={isLeft ? "text-right" : ""}>
      <span className="font-heading italic text-secondary-foreground text-2xl font-bold mb-2 block">
        {entry.dateDisplay}
      </span>
      <h3 className="text-2xl font-bold text-primary mb-2 font-heading">
        {entry.title}
      </h3>
      <p className="text-on-surface-variant mb-4">{entry.description}</p>
      <div className={`flex gap-2 ${isLeft ? "justify-end" : ""}`}>
        {entry.locationTags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-surface-container rounded-full text-xs font-bold text-secondary-foreground uppercase tracking-tight"
          >
            {tag}
          </span>
        ))}
      </div>
      {entry.personNames.length > 0 && (
        <div className={`mt-4 flex -space-x-2 ${isLeft ? "justify-end" : ""}`}>
          {entry.personIds.map((pid, i) => (
            <Link key={pid} href={`/tree/${treeId}/person/${pid}`}>
              {entry.personAvatars[i] ? (
                <Image
                  src={entry.personAvatars[i]}
                  alt={entry.personNames[i]}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-background object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-background bg-surface-container flex items-center justify-center text-xs font-bold text-on-surface-variant">
                  {entry.personNames[i]?.[0]}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const imageContent = entry.imageUrl ? (
    <div
      className={`bg-card p-4 rounded-xl shadow-ambient max-w-xs ${
        isLeft ? "rotate-2" : "-rotate-1"
      }`}
    >
      <Image
        src={entry.imageUrl}
        alt={entry.imageCaption || entry.title}
        width={400}
        height={300}
        className="w-full aspect-[4/3] object-cover rounded-lg mb-3 grayscale brightness-90"
        style={{ filter: "grayscale(0.6) sepia(0.3) brightness(0.9)" }}
      />
      {entry.imageCaption && (
        <p className="text-xs italic text-on-surface-variant">
          {entry.imageCaption}
        </p>
      )}
    </div>
  ) : null;

  return (
    <div className="flex items-center justify-center w-full">
      {isLeft ? (
        <>
          <div className="w-1/2 pr-16">{textContent}</div>
          <GoldDot />
          <div className="w-1/2 pl-16">{imageContent}</div>
        </>
      ) : (
        <>
          <div className="w-1/2 pr-16 flex justify-end">{imageContent}</div>
          <GoldDot />
          <div className="w-1/2 pl-16">{textContent}</div>
        </>
      )}
    </div>
  );
}

function BreakoutEntry({
  entry,
  treeId,
}: {
  entry: TimelineEntry;
  treeId: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-8">
        <GoldDot large />
      </div>
      <div className="w-full max-w-4xl bg-surface-low p-12 rounded-[2rem] shadow-ambient relative overflow-hidden">
        {/* Background watermark */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <svg className="w-[120px] h-[120px] text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <span className="font-heading italic text-secondary-foreground text-2xl font-bold mb-2 block">
              {entry.dateDisplay}
            </span>
            <h3 className="text-4xl font-black text-primary mb-4 italic font-heading">
              {entry.title}
            </h3>
            <p className="text-on-surface-variant text-lg leading-relaxed mb-6">
              {entry.description}
            </p>
            <div className="flex flex-wrap gap-3">
              {entry.locationTags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full text-sm font-bold text-primary"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {tag}
                </div>
              ))}
            </div>
          </div>
          {entry.imageUrl && (
            <div className="flex-none">
              <div className="w-64 h-64 rounded-full border-8 border-surface-container overflow-hidden shadow-ambient-lg hover:scale-105 transition-transform">
                <Image
                  src={entry.imageUrl}
                  alt={entry.title}
                  width={256}
                  height={256}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
