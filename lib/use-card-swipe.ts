"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, type PanInfo } from "framer-motion";

const COMMIT_OFFSET = 110;
const COMMIT_VELOCITY = 520;
const HINT_START = 24;
const EDGE_ZONE = 28;
const DRAG_ELASTIC = 0.55;

type DragEvent = MouseEvent | TouchEvent | PointerEvent;

export function useCardSwipe({
  cardId,
  enabled,
  leftEnabled,
  onCommitRight,
  onCommitLeft,
}: {
  cardId: string;
  enabled: boolean;
  leftEnabled: boolean;
  onCommitRight: () => void;
  onCommitLeft: () => void;
}) {
  const x = useMotionValue(0);
  const rightOpacity = useTransform(x, [HINT_START, COMMIT_OFFSET], [0, 1]);
  const leftOpacity = useTransform(x, [-HINT_START, -COMMIT_OFFSET], [0, 1]);

  const didDrag = useRef(false);
  const committed = useRef(false);
  const edgeStart = useRef(false);

  useEffect(() => {
    x.set(0);
    didDrag.current = false;
    committed.current = false;
    edgeStart.current = false;
  }, [cardId, x]);

  function onDragStart(_event: DragEvent, info: PanInfo) {
    didDrag.current = true;
    const width = typeof window !== "undefined" ? window.innerWidth : 0;
    edgeStart.current = info.point.x <= EDGE_ZONE || info.point.x >= width - EDGE_ZONE;
  }

  function onDragEnd(_event: DragEvent, info: PanInfo) {
    if (edgeStart.current || committed.current || !enabled) return;
    const commitRight = info.offset.x > COMMIT_OFFSET || info.velocity.x > COMMIT_VELOCITY;
    const commitLeft = info.offset.x < -COMMIT_OFFSET || info.velocity.x < -COMMIT_VELOCITY;
    if (commitRight) {
      committed.current = true;
      onCommitRight();
    } else if (commitLeft && leftEnabled) {
      committed.current = true;
      onCommitLeft();
    }
  }

  function consumeDrag() {
    if (didDrag.current) {
      didDrag.current = false;
      return true;
    }
    return false;
  }

  return {
    rightOpacity,
    leftOpacity,
    consumeDrag,
    dragProps: {
      drag: enabled ? ("x" as const) : false,
      dragDirectionLock: true,
      dragElastic: DRAG_ELASTIC,
      dragConstraints: { left: 0, right: 0 },
      onDragStart,
      onDragEnd,
      style: { x },
    },
  };
}
