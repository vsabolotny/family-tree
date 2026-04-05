"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PersonNode } from "./person-node";
import { AddPersonDialog } from "@/components/person/add-person-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Person, Relation } from "@/lib/db/schema";

interface FamilyTreeViewProps {
  treeId: string;
  initialPersons: Person[];
  initialRelations: Relation[];
}

function layoutTree(persons: Person[], relations: Relation[]) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Build adjacency: parent → children
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();
  const spouseMap = new Map<string, string[]>();

  for (const rel of relations) {
    if (rel.type === "parent_child") {
      const children = childrenMap.get(rel.personAId) || [];
      children.push(rel.personBId);
      childrenMap.set(rel.personAId, children);

      const parents = parentMap.get(rel.personBId) || [];
      parents.push(rel.personAId);
      parentMap.set(rel.personBId, parents);

      edges.push({
        id: `e-${rel.id}`,
        source: rel.personAId,
        target: rel.personBId,
        type: "smoothstep",
      });
    } else if (rel.type === "spouse") {
      const spousesA = spouseMap.get(rel.personAId) || [];
      spousesA.push(rel.personBId);
      spouseMap.set(rel.personAId, spousesA);

      const spousesB = spouseMap.get(rel.personBId) || [];
      spousesB.push(rel.personAId);
      spouseMap.set(rel.personBId, spousesB);

      edges.push({
        id: `e-${rel.id}`,
        source: rel.personAId,
        target: rel.personBId,
        type: "straight",
        style: { strokeDasharray: "5,5" },
      });
    }
  }

  // Find roots (persons without parents)
  const roots = persons.filter((p) => !parentMap.has(p.id));
  if (roots.length === 0 && persons.length > 0) {
    roots.push(persons[0]);
  }

  // BFS to assign levels
  const levelMap = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; level: number }[] = [];

  for (const root of roots) {
    if (!visited.has(root.id)) {
      queue.push({ id: root.id, level: 0 });
      visited.add(root.id);
    }
  }

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    levelMap.set(id, level);

    const children = childrenMap.get(id) || [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push({ id: childId, level: level + 1 });
      }
    }
  }

  // Place unvisited persons
  for (const p of persons) {
    if (!visited.has(p.id)) {
      levelMap.set(p.id, 0);
    }
  }

  // Group by level for x positioning
  const levelGroups = new Map<number, string[]>();
  for (const [id, level] of levelMap) {
    const group = levelGroups.get(level) || [];
    group.push(id);
    levelGroups.set(level, group);
  }

  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 100;
  const X_GAP = 40;
  const Y_GAP = 120;

  const personMap = new Map(persons.map((p) => [p.id, p]));

  for (const [level, ids] of levelGroups) {
    const totalWidth = ids.length * NODE_WIDTH + (ids.length - 1) * X_GAP;
    const startX = -totalWidth / 2;

    ids.forEach((id, index) => {
      const person = personMap.get(id);
      if (!person) return;

      nodes.push({
        id,
        type: "person",
        position: {
          x: startX + index * (NODE_WIDTH + X_GAP),
          y: level * (NODE_HEIGHT + Y_GAP),
        },
        data: {
          firstName: person.firstName,
          lastName: person.lastName,
          birthDate: person.birthDate,
          deathDate: person.deathDate,
          gender: person.gender,
          profileImageUrl: person.profileImageUrl,
          isLiving: person.isLiving,
        },
      });
    });
  }

  return { nodes, edges };
}

export function FamilyTreeView({
  treeId,
  initialPersons,
  initialRelations,
}: FamilyTreeViewProps) {
  const [persons, setPersons] = useState(initialPersons);
  const [relations, setRelations] = useState(initialRelations);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutTree(persons, relations),
    [persons, relations]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = layoutTree(persons, relations);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [persons, relations, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ person: PersonNode }), []);

  const handlePersonAdded = useCallback(
    (person: Person, relation?: Relation) => {
      setPersons((prev) => [...prev, person]);
      if (relation) {
        setRelations((prev) => [...prev, relation]);
      }
    },
    []
  );

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        className="bg-background"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { gender?: string };
            switch (data?.gender) {
              case "male":
                return "#60a5fa";
              case "female":
                return "#f472b6";
              case "diverse":
                return "#a78bfa";
              default:
                return "#9ca3af";
            }
          }}
        />
      </ReactFlow>

      <div className="absolute top-4 right-4 z-10">
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Person hinzufügen
        </Button>
      </div>

      <AddPersonDialog
        treeId={treeId}
        persons={persons}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onPersonAdded={handlePersonAdded}
      />
    </div>
  );
}
