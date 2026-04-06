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
          border-radius: 6px;
          font-size: 12px;
        }
        .vis-item.lifespan {
          background-color: #421518;
          border-color: #5d2a2c;
          color: #faf5e8;
        }
        .vis-item.event-residence {
          background-color: #775a19;
          border-color: #9a7520;
          color: #faf5e8;
        }
        .vis-item.event-birth {
          background-color: #5a7a3a;
          border-color: #4a6830;
          color: #faf5e8;
        }
        .vis-item.event-death {
          background-color: #6b5c50;
          border-color: #574a40;
          color: #faf5e8;
        }
        .vis-item.event-education {
          background-color: #6b4c8a;
          border-color: #5a3d78;
          color: #faf5e8;
        }
        .vis-item.event-occupation {
          background-color: #b8860b;
          border-color: #9a7209;
          color: #faf5e8;
        }
        .vis-item.event-migration {
          background-color: #8b3a3a;
          border-color: #6d2c2c;
          color: #faf5e8;
        }
        .vis-item.event-military {
          background-color: #5c6b5c;
          border-color: #4a584a;
          color: #faf5e8;
        }
        .vis-item.event-custom {
          background-color: #3c6b6b;
          border-color: #2d5555;
          color: #faf5e8;
        }
        .vis-label {
          font-size: 13px;
          font-weight: 500;
        }
        .vis-group {
          border-bottom: 1px solid #e0d5c0;
        }
        .vis-time-axis .vis-text {
          color: #8a7a60;
        }
        .vis-time-axis .vis-grid.vis-major {
          border-color: #e0d5c0;
        }
        .vis-time-axis .vis-grid.vis-minor {
          border-color: #f0e8d4;
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
