import React, { useCallback, useMemo, useRef, useState } from "react";
import { PieChart } from "../../src/charts/pie-chart";
import { PieSlice } from "../../src/charts/pie-slice";

// ── Audio ──────────────────────────────────────────────────────────────────────

// Pentatonic scale — each segment index maps to a distinct note
const PENTATONIC_HZ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
let _audioCtx: AudioContext | null = null;

function playTone(segmentIndex: number, duration = 0.38) {
  try {
    if (!_audioCtx) _audioCtx = new AudioContext();
    const ctx = _audioCtx;
    const freq = PENTATONIC_HZ[segmentIndex % PENTATONIC_HZ.length]!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {
    // audio blocked until first user interaction — safe to ignore
  }
}

// ── Polygon clip-path generation ───────────────────────────────────────────────

// Stable per-level hash so shape is consistent within a level
function seededRand(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Number of levels that share the same base shape before switching */
const SUBDIVISIONS = 3;

/**
 * Generates a CSS polygon() clip-path driven by a stage seed.
 * Fixed vertex count (16) enables smooth CSS transitions between shapes.
 *
 * Every SUBDIVISIONS levels a new base symmetry (triangle / quad / pentagon …)
 * is used. Within a stage, angularity and noise grow with each sub-level so
 * the shape becomes progressively more complex before the next stage begins.
 */
function buildPolygonClip(targetLevel: number, stageSeed: number): string {
  const VERTS    = 16;
  const subIndex  = (targetLevel - 1) % SUBDIVISIONS;                  // 0 | 1 | 2
  const stageIdx  = Math.floor((targetLevel - 1) / SUBDIVISIONS);
  const subT      = SUBDIVISIONS > 1 ? subIndex / (SUBDIVISIONS - 1) : 1; // 0 → 0.5 → 1

  // Base symmetry from stageSeed — consistent across all sub-levels of the stage
  const SHAPES   = [3, 3, 4, 4, 5, 5, 6, 7, 8];
  const symmetry = SHAPES[Math.floor(seededRand(stageSeed * 0.17) * SHAPES.length)]!;

  // Angularity: sub-level 0 = clean base shape; grows within stage and across stages
  const angularity = Math.min(0.42 + stageIdx * 0.04 + subT * 0.15, 0.82);

  // Noise: sub-level 0 is crisp; added detail accumulates with each subdivision
  const noise = Math.min(0.02 + subT * 0.14 + stageIdx * 0.015, 0.28);

  // Fixed rotation per stage so orientation stays consistent across sub-levels
  const phaseOffset = seededRand(stageSeed * 2.37) * Math.PI * 2;

  const pts: string[] = [];
  for (let i = 0; i < VERTS; i++) {
    const angle  = (i / VERTS) * Math.PI * 2 - Math.PI / 2;
    const tipness = (Math.cos(symmetry * (angle + phaseOffset)) + 1) / 2;
    const baseR  = (1 - angularity) + tipness * angularity;
    const vNoise = (seededRand(stageSeed + i * 0.713) - 0.5) * noise;
    const r      = Math.max(0.18, Math.min(1.0, baseR + vNoise));
    const x = (50 + r * 47 * Math.cos(angle)).toFixed(1);
    const y = (50 + r * 47 * Math.sin(angle)).toFixed(1);
    pts.push(`${x}% ${y}%`);
  }
  return `polygon(${pts.join(", ")})`;
}

// ── Game constants ─────────────────────────────────────────────────────────────

const COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6",
];

type Phase = "idle" | "showing" | "waiting" | "success" | "fail";

interface Segment { label: string; value: number; color: string; }

function zonesForLevel(level: number) { return Math.min(3 + Math.floor((level - 1) / 2), 8); }

function makeSegments(n: number): Segment[] {
  return Array.from({ length: n }, (_, i) => ({
    label: String(i),
    value: 0.5 + Math.random() * 1.5,   // random arc widths → irregular polygon look
    color: COLORS[i % COLORS.length]!,
  }));
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

// ── Component ──────────────────────────────────────────────────────────────────

export function SimonGame() {
  const [level,       setLevel]       = useState(1);
  const [sequence,    setSequence]    = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [phase,       setPhase]       = useState<Phase>("idle");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [segments,    setSegments]    = useState<Segment[]>(() => makeSegments(3));
  const [highScore,    setHighScore]   = useState(0);
  const [shapeSeed,    setShapeSeed]   = useState(() => Math.random() * 1000);
  // shapeTarget tracks the level we're transitioning TO so the CSS morph
  // can run during the success/start pause rather than during the demo.
  const [shapeTarget,  setShapeTarget] = useState(1);

  // Refs so async / timeout callbacks always see the latest values
  const abortRef      = useRef(false);
  const phaseRef      = useRef<Phase>("idle");
  const seqRef        = useRef<number[]>([]);
  const inputRef      = useRef<number[]>([]);
  const levelRef      = useRef(1);
  const segmentsRef   = useRef(segments);
  const shapeSeedRef  = useRef(shapeSeed);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  phaseRef.current    = phase;
  seqRef.current      = sequence;
  inputRef.current    = playerInput;
  levelRef.current    = level;
  segmentsRef.current = segments;
  shapeSeedRef.current = shapeSeed;

  // Recompute clip-path when shapeTarget / seed change (not `level`, which lags behind)
  const clipPath = useMemo(() => buildPolygonClip(shapeTarget, shapeSeed), [shapeTarget, shapeSeed]);

  // ── Sequence playback ────────────────────────────────────────────────────────

  const runSequence = useCallback(async (seq: number[]) => {
    abortRef.current = false;
    setPhase("showing");
    setActiveIndex(null);
    const onMs  = Math.max(240, 600 - seq.length * 20);
    const offMs = Math.max(110, onMs * 0.38);

    for (const idx of seq) {
      if (abortRef.current) return;
      await sleep(offMs);
      if (abortRef.current) return;
      setActiveIndex(idx);
      playTone(idx, onMs / 1000);
      await sleep(onMs);
      if (abortRef.current) return;
      setActiveIndex(null);
    }

    await sleep(500);
    if (!abortRef.current) {
      setActiveIndex(null);
      setPhase("waiting");
    }
  }, []);

  // ── Level transitions ────────────────────────────────────────────────────────

  const startLevel = useCallback(
    (lvl: number, prevSeq: number[], segs: Segment[], seed: number) => {
      const n    = zonesForLevel(lvl);
      const step = Math.floor(Math.random() * n);
      const seq  = [...prevSeq, step];
      setLevel(lvl);
      setShapeTarget(lvl);   // idempotent for success path (already set early)
      setSegments(segs);
      setShapeSeed(seed);    // idempotent for success path (already set early)
      setSequence(seq);
      setPlayerInput([]);
      inputRef.current = [];
      runSequence(seq);
    },
    [runSequence]
  );

  const startGame = useCallback(() => {
    abortRef.current = true;
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    const seed = Math.random() * 1000;
    // Update shape immediately so CSS transition runs before the demo starts
    setShapeTarget(1);
    setShapeSeed(seed);
    startTimerRef.current = setTimeout(() => {
      startTimerRef.current = null;
      startLevel(1, [], makeSegments(zonesForLevel(1)), seed);
    }, 750);
  }, [startLevel]);

  // ── Click handler ────────────────────────────────────────────────────────────

  const handleClick = useCallback(
    (idx: number) => {
      if (phaseRef.current !== "waiting") return;

      const curInput = inputRef.current;
      const curSeq   = seqRef.current;
      const curLevel = levelRef.current;
      const expected = curSeq[curInput.length];

      // Tone + brief flash for every tap
      playTone(idx, 0.28);
      setActiveIndex(idx);
      setTimeout(() => setActiveIndex((p) => (p === idx ? null : p)), 270);

      if (idx !== expected) {
        phaseRef.current = "fail";
        setPhase("fail");
        setHighScore((h) => Math.max(h, curLevel - 1));
        return;
      }

      const newInput = [...curInput, idx];
      inputRef.current = newInput;
      setPlayerInput(newInput);

      if (newInput.length === curSeq.length) {
        phaseRef.current = "success";
        setPhase("success");

        const nextLvl      = curLevel + 1;
        const curN         = zonesForLevel(curLevel);
        const nextN        = zonesForLevel(nextLvl);
        const nextSegs     = nextN !== curN ? makeSegments(nextN) : segmentsRef.current;

        // Only regenerate seed at stage boundaries; within a stage keep the same one
        const nextStageIdx = Math.floor((nextLvl - 1) / SUBDIVISIONS);
        const curStageIdx  = Math.floor((curLevel - 1) / SUBDIVISIONS);
        const nextSeed     = nextStageIdx !== curStageIdx
          ? Math.random() * 1000
          : shapeSeedRef.current;

        // Advance shape state immediately so the 700ms CSS transition runs
        // during the 920ms success pause — demo starts with shape already settled
        setShapeTarget(nextLvl);
        setShapeSeed(nextSeed);

        setTimeout(() => startLevel(nextLvl, curSeq, nextSegs, nextSeed), 920);
      }
    },
    [startLevel]
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  const isInteractive = phase === "waiting";

  const statusText: Record<Phase, string> = {
    idle:    "Press Start to play",
    showing: "Watch the sequence…",
    waiting: `Your turn — ${sequence.length - playerInput.length} step${sequence.length - playerInput.length === 1 ? "" : "s"} left`,
    success: "Correct! Next level…",
    fail:    `Wrong zone — you reached level ${level}`,
  };

  const statusColor: Record<Phase, string> = {
    idle:    "#64748b",
    showing: "#94a3b8",
    waiting: "#e2e8f0",
    success: "#10b981",
    fail:    "#ef4444",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 28, fontSize: 12, color: "#475569" }}>
        <span>Level&nbsp;<strong style={{ color: "#e2e8f0" }}>{level}</strong></span>
        <span>Sequence&nbsp;<strong style={{ color: "#e2e8f0" }}>{sequence.length}</strong></span>
        <span>Zones&nbsp;<strong style={{ color: "#e2e8f0" }}>{zonesForLevel(level)}</strong></span>
        {highScore > 0 && (
          <span>Best&nbsp;<strong style={{ color: "#8b5cf6" }}>{highScore}</strong></span>
        )}
      </div>

      {/* Status line */}
      <div style={{
        fontSize: 13,
        color: statusColor[phase],
        minHeight: 18,
        transition: "color 0.2s ease",
      }}>
        {statusText[phase]}
      </div>

      {/* Game board — polygon clip wraps PieChart */}
      <div style={{ clipPath, pointerEvents: isInteractive ? undefined : "none", transition: "clip-path 0.7s ease-in-out" }}>
        <PieChart
          data={segments}
          size={320}
          padAngle={0.055}
          cornerRadius={10}
          selectedIndex={activeIndex}
          hoveredIndex={isInteractive ? undefined : null}
          hoverOffset={14}
        >
          {segments.map((_, i) => (
            <PieSlice
              key={i}
              index={i}
              hoverEffect="none"
              showGlow
              onClick={isInteractive ? handleClick : undefined}
            />
          ))}
        </PieChart>
      </div>

      {/* Progress dots */}
      {phase === "waiting" && sequence.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: -4 }}>
          {sequence.map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: i < playerInput.length ? "#10b981" : "#1e2535",
              transition: "background 0.12s ease",
            }} />
          ))}
        </div>
      )}

      {/* CTA */}
      {(phase === "idle" || phase === "fail") && (
        <button
          onClick={startGame}
          style={{
            marginTop: 6,
            padding: "9px 28px",
            background: "#8b5cf6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          {phase === "idle" ? "Start" : "Play Again"}
        </button>
      )}
    </div>
  );
}
