"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import dagre from "dagre";
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

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

function layoutTree(persons: Person[], relations: Relation[]) {
  const edges: Edge[] = [];

  for (const rel of relations) {
    if (rel.type === "parent_child") {
      edges.push({
        id: `e-${rel.id}`,
        source: rel.personAId,
        target: rel.personBId,
        type: "smoothstep",
      });
    } else if (rel.type === "spouse") {
      edges.push({
        id: `e-${rel.id}`,
        source: rel.personAId,
        target: rel.personBId,
        type: "straight",
        style: { strokeDasharray: "5,5" },
      });
    }
  }

  // Use dagre for hierarchical layout
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 100, nodesep: 40 });

  for (const person of persons) {
    g.setNode(person.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const nodes: Node[] = persons.map((person) => {
    const pos = g.node(person.id);
    return {
      id: person.id,
      type: "person",
      position: {
        x: (pos?.x ?? 0) - NODE_WIDTH / 2,
        y: (pos?.y ?? 0) - NODE_HEIGHT / 2,
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
    };
  });

  return { nodes, edges };
}

export function FamilyTreeView({
  treeId,
  initialPersons,
  initialRelations,
}: FamilyTreeViewProps) {
  const router = useRouter();
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
        onNodeDoubleClick={(_event, node) => {
          router.push(`/tree/${treeId}/person/${node.id}`);
        }}
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
