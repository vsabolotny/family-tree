"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface PersonNodeData {
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  deathDate?: string | null;
  gender: string;
  profileImageUrl?: string | null;
  isLiving: boolean;
  [key: string]: unknown;
}

function PersonNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as PersonNodeData;
  const initials =
    (nodeData.firstName?.[0] || "") + (nodeData.lastName?.[0] || "");

  const genderColors: Record<string, string> = {
    male: "border-blue-800/40",
    female: "border-rose-800/40",
    diverse: "border-purple-800/40",
    unknown: "border-amber-800/30",
  };

  const borderColor = genderColors[nodeData.gender] || genderColors.unknown;

  const formatYear = (date?: string | null) => {
    if (!date) return "?";
    return new Date(date).getFullYear().toString();
  };

  const lifespan = nodeData.isLiving
    ? `*${formatYear(nodeData.birthDate)}`
    : `${formatYear(nodeData.birthDate)} - ${formatYear(nodeData.deathDate)}`;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div
        className={`flex items-center gap-3 rounded-2xl ${borderColor} bg-card p-3 shadow-ambient min-w-[180px] cursor-pointer hover:shadow-ambient-lg transition-shadow border-l-4`}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={nodeData.profileImageUrl || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {nodeData.firstName} {nodeData.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{lifespan}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary"
      />
    </>
  );
}

export const PersonNode = memo(PersonNodeComponent);
