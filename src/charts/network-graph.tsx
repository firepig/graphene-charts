import useMeasure from "react-use-measure";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { cn } from "../lib/utils";

// ── Public types ─────────────────────────────────────────────────────────────

export interface NetworkNode {
  id: string;
  label?: string;
  size?: number;
  color?: string;
  group?: string | number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight?: number;
  label?: string;
  color?: string;
}

export interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  size?: number;
  aspectRatio?: string;
  className?: string;
  colorRange?: string[];
  showLabels?: boolean;
  showEdgeLabels?: boolean;
  chargeStrength?: number;
  linkDistance?: number;
  animated?: boolean;
}

// ── Internal types ────────────────────────────────────────────────────────────

interface SimNode extends SimulationNodeDatum {
  id: string;
  label?: string;
  size: number;
  color: string;
  group?: string | number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  weight: number;
  label?: string;
  color?: string;
  // After simulation resolves, source/target become SimNode objects
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_COLOR_RANGE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const PADDING = 40;

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveColor(
  node: NetworkNode,
  groupColorMap: Map<string | number, string>,
  colorRange: string[],
  nodeIndex: number
): string {
  if (node.color) return node.color;
  if (node.group != null) {
    const c = groupColorMap.get(node.group);
    if (c) return c;
  }
  return colorRange[nodeIndex % colorRange.length];
}

function buildGroupColorMap(
  nodes: NetworkNode[],
  colorRange: string[]
): Map<string | number, string> {
  const groups: (string | number)[] = [];
  for (const n of nodes) {
    if (n.group != null && !groups.includes(n.group)) groups.push(n.group);
  }
  const map = new Map<string | number, string>();
  groups.forEach((g, i) => map.set(g, colorRange[i % colorRange.length]));
  return map;
}

// ── Inner component (receives resolved width/height) ─────────────────────────

interface NetworkGraphInnerProps extends NetworkGraphProps {
  width: number;
  height: number;
}

function NetworkGraphInner({
  nodes,
  edges,
  width,
  height,
  colorRange = DEFAULT_COLOR_RANGE,
  showLabels = true,
  showEdgeLabels = false,
  chargeStrength = -120,
  linkDistance = 60,
  animated = true,
}: NetworkGraphInnerProps) {
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  const tickCountRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);

  const [nodePositions, setNodePositions] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);
  const [simStarted, setSimStarted] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const groupColorMap = useMemo(
    () => buildGroupColorMap(nodes, colorRange),
    [nodes, colorRange]
  );

  // Build stable sim nodes once per nodes/edges change
  useEffect(() => {
    if (width < 10 || height < 10) return;

    // Stop any existing simulation
    if (simRef.current) {
      simRef.current.stop();
      simRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    tickCountRef.current = 0;
    setSimStarted(false);

    const builtSimNodes: SimNode[] = nodes.map((n, i) => ({
      ...n,
      size: n.size ?? 8,
      color: resolveColor(n, groupColorMap, colorRange, i),
      // Spread initial positions within padded bounds
      x: PADDING + Math.random() * (width - PADDING * 2),
      y: PADDING + Math.random() * (height - PADDING * 2),
    }));

    const builtSimLinks: SimLink[] = edges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight ?? 1,
      label: e.label,
      color: e.color,
    }));

    const sim = forceSimulation<SimNode>(builtSimNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(builtSimLinks)
          .id((d) => d.id)
          .distance(linkDistance)
      )
      .force("charge", forceManyBody<SimNode>().strength(chargeStrength))
      .force("center", forceCenter(width / 2, height / 2))
      .force(
        "collide",
        forceCollide<SimNode>().radius((d) => d.size + 2)
      );

    simRef.current = sim;

    const scheduleUpdate = () => {
      if (pendingUpdateRef.current) return;
      pendingUpdateRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        pendingUpdateRef.current = false;
        setNodePositions([...builtSimNodes]);
        // Grab resolved links (source/target become node objects after first tick)
        const resolvedLinks = sim.force<ReturnType<typeof forceLink>>("link");
        if (resolvedLinks) {
          setSimLinks(resolvedLinks.links() as SimLink[]);
        }
      });
    };

    sim.on("tick", () => {
      tickCountRef.current += 1;
      if (!simStarted) setSimStarted(true);
      // Throttle: update every 3 ticks
      if (tickCountRef.current % 3 === 0) {
        scheduleUpdate();
      }
    });

    sim.on("end", () => {
      setNodePositions([...builtSimNodes]);
      const resolvedLinks = sim.force<ReturnType<typeof forceLink>>("link");
      if (resolvedLinks) {
        setSimLinks(resolvedLinks.links() as SimLink[]);
      }
      setSimStarted(true);
    });

    // Kick off first render
    setNodePositions([...builtSimNodes]);
    setSimLinks(builtSimLinks as SimLink[]);
    setSimStarted(true);

    return () => {
      sim.stop();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // We intentionally stringify nodes/edges to detect structural changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nodes,
    edges,
    width,
    height,
    chargeStrength,
    linkDistance,
    groupColorMap,
    colorRange,
  ]);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, nodeId: string) => {
      e.preventDefault();
      setDraggedId(nodeId);
      const sim = simRef.current;
      if (!sim) return;
      const node = (sim.nodes() as SimNode[]).find((n) => n.id === nodeId);
      if (!node) return;
      node.fx = node.x;
      node.fy = node.y;
      sim.alphaTarget(0.3).restart();
    },
    []
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!draggedId) return;
      const sim = simRef.current;
      if (!sim) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const node = (sim.nodes() as SimNode[]).find((n) => n.id === draggedId);
      if (!node) return;
      node.fx = x;
      node.fy = y;
    },
    [draggedId]
  );

  const handleSvgMouseUp = useCallback(() => {
    if (!draggedId) return;
    const sim = simRef.current;
    if (sim) {
      const node = (sim.nodes() as SimNode[]).find((n) => n.id === draggedId);
      if (node) {
        node.fx = undefined;
        node.fy = undefined;
      }
      sim.alphaTarget(0);
    }
    setDraggedId(null);
  }, [draggedId]);

  // ── Derived highlight sets ─────────────────────────────────────────────────

  const connectedNodeIds = useMemo<Set<string>>(() => {
    if (!hoveredId) return new Set();
    const ids = new Set<string>([hoveredId]);
    for (const link of simLinks) {
      const srcId =
        typeof link.source === "object"
          ? (link.source as SimNode).id
          : (link.source as string);
      const tgtId =
        typeof link.target === "object"
          ? (link.target as SimNode).id
          : (link.target as string);
      if (srcId === hoveredId) ids.add(tgtId);
      if (tgtId === hoveredId) ids.add(srcId);
    }
    return ids;
  }, [hoveredId, simLinks]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const nodeById = useMemo(() => {
    const m = new Map<string, SimNode>();
    for (const n of nodePositions) m.set(n.id, n);
    return m;
  }, [nodePositions]);

  return (
    <svg
      width={width}
      height={height}
      style={{ contain: "layout style paint", cursor: draggedId ? "grabbing" : "default" }}
      onMouseMove={handleSvgMouseMove}
      onMouseUp={handleSvgMouseUp}
      onMouseLeave={handleSvgMouseUp}
    >
      {/* Edges */}
      <g>
        {simLinks.map((link, i) => {
          const src =
            typeof link.source === "object"
              ? (link.source as SimNode)
              : nodeById.get(link.source as string);
          const tgt =
            typeof link.target === "object"
              ? (link.target as SimNode)
              : nodeById.get(link.target as string);

          if (!src || !tgt || src.x == null || src.y == null || tgt.x == null || tgt.y == null)
            return null;

          const srcId = typeof link.source === "object" ? (link.source as SimNode).id : (link.source as string);
          const tgtId = typeof link.target === "object" ? (link.target as SimNode).id : (link.target as string);

          let opacity = 0.6;
          if (hoveredId) {
            const isConnected = connectedNodeIds.has(srcId) && connectedNodeIds.has(tgtId);
            opacity = isConnected ? 0.9 : 0.2;
          }

          const mx = (src.x! + tgt.x!) / 2;
          const my = (src.y! + tgt.y!) / 2;

          return (
            <g key={i}>
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={link.color ?? "var(--chart-axis)"}
                strokeWidth={link.weight ?? 1}
                strokeOpacity={opacity}
                style={{ transition: animated ? "stroke-opacity 0.2s" : undefined }}
              />
              {showEdgeLabels && link.label && (
                <text
                  x={mx}
                  y={my}
                  fontSize={9}
                  fill="var(--chart-label)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {link.label}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Nodes */}
      <g>
        {nodePositions.map((node, i) => {
          if (node.x == null || node.y == null) return null;

          const isHovered = hoveredId === node.id;
          const isDimmed = hoveredId != null && !connectedNodeIds.has(node.id);
          const r = isHovered ? node.size * 1.3 : node.size;

          const nodeOpacity = isDimmed ? 0.4 : 1;
          const transitionDelay = animated ? `${i * 20}ms` : "0ms";
          const enterOpacity = simStarted ? nodeOpacity : 0;

          return (
            <g
              key={node.id}
              style={{
                opacity: enterOpacity,
                transition: animated
                  ? `opacity 0.4s ease ${transitionDelay}`
                  : undefined,
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={node.color}
                style={{
                  cursor: "grab",
                  transition: animated ? "r 0.15s ease, filter 0.15s ease" : undefined,
                  filter: isHovered
                    ? `drop-shadow(0 0 6px ${node.color})`
                    : undefined,
                }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              />
              {showLabels && node.label && (
                <text
                  x={node.x}
                  y={node.y! + node.size + 12}
                  fontSize={10}
                  fill="var(--chart-foreground-muted)"
                  textAnchor="middle"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.label}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function NetworkGraph({
  size: fixedSize,
  aspectRatio = "1 / 1",
  className,
  ...rest
}: NetworkGraphProps) {
  const [measureRef, { width, height }] = useMeasure({ debounce: 10 });

  if (fixedSize != null) {
    return (
      <div
        className={cn("relative", className)}
        style={{ width: fixedSize, height: fixedSize }}
      >
        <NetworkGraphInner width={fixedSize} height={fixedSize} {...rest} />
      </div>
    );
  }

  return (
    <div
      ref={measureRef}
      className={cn("relative w-full", className)}
      style={{ aspectRatio }}
    >
      {width > 0 && height > 0 && (
        <NetworkGraphInner width={width} height={height} {...rest} />
      )}
    </div>
  );
}

NetworkGraph.displayName = "NetworkGraph";
