"use client";

import { useEffect, useRef } from "react";
import { Timeline } from "vis-timeline/standalone";
import { DataSet } from "vis-data/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

interface TimelineItem {
  id: string;
  group: string;
  content: string;
  start: string;
  end?: string;
  type: string;
  className?: string;
  title?: string;
}

interface TimelineGroup {
  id: string;
  content: string;
}

interface FamilyTimelineProps {
  items: TimelineItem[];
  groups: TimelineGroup[];
}

export function FamilyTimeline({ items, groups }: FamilyTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current || items.length === 0) return;

    const dataset = new DataSet(items);
    const groupset = new DataSet(groups);

    const options = {
      stack: true,
      showMajorLabels: true,
      showMinorLabels: true,
      zoomMin: 1000 * 60 * 60 * 24 * 365, // 1 year
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 500, // 500 years
      orientation: { axis: "top" },
      margin: { item: 5, axis: 5 },
      tooltip: { followMouse: true, overflowMethod: "cap" as const },
    };

    if (timelineRef.current) {
      timelineRef.current.destroy();
    }

    timelineRef.current = new Timeline(
      containerRef.current,
      dataset,
      groupset,
      options
    );

    // Fit to content
    timelineRef.current.fit();

    return () => {
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, [items, groups]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Noch keine Ereignisse mit Datumsangaben vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <style>{`
        .vis-timeline {
          border: none;
          font-family: inherit;
        }
        .vis-item {
          border-radius: 4px;
          font-size: 12px;
        }
        .vis-item.lifespan {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--primary));
          color: white;
        }
        .vis-item.event-residence {
          background-color: #3b82f6;
          border-color: #2563eb;
          color: white;
        }
        .vis-item.event-birth {
          background-color: #22c55e;
          border-color: #16a34a;
          color: white;
        }
        .vis-item.event-death {
          background-color: #6b7280;
          border-color: #4b5563;
          color: white;
        }
        .vis-item.event-education {
          background-color: #a855f7;
          border-color: #9333ea;
          color: white;
        }
        .vis-item.event-occupation {
          background-color: #f59e0b;
          border-color: #d97706;
          color: white;
        }
        .vis-item.event-migration {
          background-color: #ef4444;
          border-color: #dc2626;
          color: white;
        }
        .vis-item.event-military {
          background-color: #78716c;
          border-color: #57534e;
          color: white;
        }
        .vis-item.event-custom {
          background-color: #06b6d4;
          border-color: #0891b2;
          color: white;
        }
        .vis-label {
          font-size: 13px;
          font-weight: 500;
        }
        .vis-group {
          border-bottom: 1px solid hsl(var(--border));
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
