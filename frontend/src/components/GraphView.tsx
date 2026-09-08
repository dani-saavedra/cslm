import { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MarkerType, type Edge, type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Drawer, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { GraphResponse } from '../types';

const TYPE_COLORS: Record<string, string> = {
  CERTIFICATE: '#E1251B',
  SECRET: '#6a1b9a',
  APPLICATION: '#00897b',
  ENVIRONMENT: '#ef6c00',
  LOCATION: '#546e7a',
};

function layout(graph: GraphResponse): { nodes: Node[]; edges: Edge[] } {
  const incoming = new Map<string, number>();
  graph.nodes.forEach((n) => incoming.set(n.id, 0));
  graph.edges.forEach((e) => incoming.set(e.target, (incoming.get(e.target) || 0) + 1));

  const depth = new Map<string, number>();
  const queue: string[] = [];
  graph.nodes.forEach((n) => {
    if ((incoming.get(n.id) || 0) === 0) {
      depth.set(n.id, 0);
      queue.push(n.id);
    }
  });

  const childrenByNode = new Map<string, string[]>();
  graph.edges.forEach((e) => {
    childrenByNode.set(e.source, [...(childrenByNode.get(e.source) || []), e.target]);
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = depth.get(current)!;
    for (const child of childrenByNode.get(current) || []) {
      if (!depth.has(child)) {
        depth.set(child, currentDepth + 1);
        queue.push(child);
      }
    }
  }

  const columnCounts = new Map<number, number>();
  const nodes: Node[] = graph.nodes.map((n) => {
    const d = depth.get(n.id) ?? 0;
    const rowIndex = columnCounts.get(d) || 0;
    columnCounts.set(d, rowIndex + 1);
    return {
      id: n.id,
      position: { x: d * 260, y: rowIndex * 110 },
      data: { label: n.label, type: n.type, raw: n.data },
      style: {
        border: `2px solid ${TYPE_COLORS[n.type] || '#333'}`,
        borderRadius: 8,
        padding: 8,
        background: '#fff',
        width: 200,
      },
    };
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#90a4ae' },
  }));

  return { nodes, edges };
}

export default function GraphView({ graph, height = 520 }: { graph: GraphResponse; height?: number }) {
  const { nodes, edges } = useMemo(() => layout(graph), [graph]);
  const [selected, setSelected] = useState<Node | null>(null);

  return (
    <Box sx={{ height, border: '1px solid #e0e0e0', borderRadius: 1, position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => setSelected(node)}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>

      <Drawer anchor="right" open={!!selected} onClose={() => setSelected(null)}>
        <Box sx={{ width: 320, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{selected?.data.label}</Typography>
            <IconButton size="small" onClick={() => setSelected(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Tipo: {selected?.data.type}
          </Typography>
          {selected &&
            Object.entries((selected.data.raw as Record<string, unknown>) || {}).map(([key, value]) => (
              <Box key={key} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {key}
                </Typography>
                <Typography variant="body2">{String(value)}</Typography>
              </Box>
            ))}
        </Box>
      </Drawer>
    </Box>
  );
}
