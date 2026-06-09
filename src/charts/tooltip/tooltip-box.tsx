import { motion, useSpring } from "motion/react";
import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULT_SPRING = { stiffness: 280, damping: 28, mass: 0.5 };

export interface TooltipBoxProps {
  x: number;
  y: number;
  visible: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  containerWidth: number;
  containerHeight: number;
  offset?: number;
  className?: string;
  children: React.ReactNode;
  /** Inline styles for the tooltip panel */
  panelStyle?: React.CSSProperties;
}

export function TooltipBox(props: TooltipBoxProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = props.containerRef.current;
  if (!(mounted && container) || !props.visible) {
    return null;
  }
  return <TooltipBoxInner {...props} container={container} />;
}

function TooltipBoxInner({
  x,
  y,
  containerWidth,
  containerHeight,
  offset = 16,
  className = "",
  children,
  panelStyle,
  container,
}: Omit<TooltipBoxProps, "visible" | "containerRef"> & {
  container: HTMLElement;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipWidthRef = useRef(180);
  const tooltipHeightRef = useRef(80);

  // The portal renders with position:absolute, so the container must be a
  // positioning context. If it isn't, adopt it (and restore on unmount).
  useLayoutEffect(() => {
    const computed = getComputedStyle(container);
    if (computed.position === "static") {
      const prev = container.style.position;
      container.style.position = "relative";
      return () => {
        container.style.position = prev;
      };
    }
  }, [container]);

  const tw = tooltipWidthRef.current;
  const th = tooltipHeightRef.current;
  const shouldFlipX = x + tw + offset > containerWidth;
  const targetX = shouldFlipX ? x - offset - tw : x + offset;
  const targetY = Math.max(
    offset,
    Math.min(y - th / 2, containerHeight - th - offset)
  );

  const animatedLeft = useSpring(targetX, DEFAULT_SPRING);
  const animatedTop = useSpring(targetY, DEFAULT_SPRING);

  animatedLeft.set(targetX);
  animatedTop.set(targetY);

  useLayoutEffect(() => {
    if (!tooltipRef.current) return;
    const el = tooltipRef.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0) tooltipWidthRef.current = w;
    if (h > 0) tooltipHeightRef.current = h;
    const flip = x + tooltipWidthRef.current + offset > containerWidth;
    const tx = flip
      ? x - offset - tooltipWidthRef.current
      : x + offset;
    const ty = Math.max(
      offset,
      Math.min(y - tooltipHeightRef.current / 2, containerHeight - tooltipHeightRef.current - offset)
    );
    animatedLeft.set(tx);
    animatedTop.set(ty);
  }, [x, y, containerWidth, containerHeight, offset, animatedLeft, animatedTop]);

  const [flipKey, setFlipKey] = useState(0);
  const prevFlipRef = useRef(shouldFlipX);
  useEffect(() => {
    if (prevFlipRef.current !== shouldFlipX) {
      setFlipKey((k) => k + 1);
      prevFlipRef.current = shouldFlipX;
    }
  }, [shouldFlipX]);

  const transformOrigin = shouldFlipX ? "right top" : "left top";

  return createPortal(
    <motion.div
      animate={{ opacity: 1 }}
      className={className}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      ref={tooltipRef}
      style={{
        position: "absolute",
        pointerEvents: "none",
        zIndex: 50,
        left: animatedLeft,
        top: animatedTop,
      }}
      transition={{ duration: 0.1 }}
    >
      <motion.div
        animate={{ scale: 1, opacity: 1, x: 0 }}
        initial={{ scale: 0.85, opacity: 0, x: shouldFlipX ? 20 : -20 }}
        key={flipKey}
        style={{
          transformOrigin,
          minWidth: 140,
          overflow: "hidden",
          borderRadius: 8,
          background: "var(--chart-tooltip-background, rgba(15,23,42,0.92))",
          color: "var(--chart-tooltip-foreground, #f1f5f9)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          ...panelStyle,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {children}
      </motion.div>
    </motion.div>,
    container
  );
}

TooltipBox.displayName = "TooltipBox";
export default TooltipBox;
