import { tryCatch } from '@activepieces/core-utils';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Shared "AI lock delta stream" machinery for a live channel gated on an AI/agent
 * lock: while the lock is held, deltas arrive over a socket and are applied
 * incrementally; on both edges of the lock a fresh snapshot is fetched and
 * reconciled so the client never drifts from server state.
 *
 * Owns:
 * - a staggered apply queue (`enqueueApply`) so a burst of deltas cascades in one
 *   after another instead of landing in a single frame,
 * - the lock-edge effect: on the rising edge (lock first observed, e.g. the
 *   resource is opened mid-run) deltas that arrive during the snapshot fetch are
 *   buffered via `bufferDelta` and drained through the same staggered queue once
 *   the snapshot lands; on the falling edge a final snapshot is reconciled so the
 *   client settles on authoritative state even if some deltas were never seen.
 *
 * Callers own the delta type, the snapshot fetch/reconcile, and how a delta is
 * applied to their store. `isAiActiveRef` and `readyRef` are exposed so the
 * caller's own socket-subscription effect can decide, per incoming event,
 * whether to buffer it or hand it to `enqueueApply` (e.g. to special-case a
 * delta kind before it joins the queue).
 */
function useAiLockDeltaStream<TDelta, TSnapshot>({
  isAiActive,
  staggerMs,
  staggerMaxQueue,
  fetchSnapshot,
  reconcile,
  applyDelta,
}: UseAiLockDeltaStreamParams<TDelta, TSnapshot>) {
  const isAiActiveRef = useRef(isAiActive);
  const readyRef = useRef(true);
  const bufferRef = useRef<TDelta[]>([]);

  // A burst of deltas from one agent write is emitted back-to-back and would
  // otherwise land in a single frame. Drain them through a small stagger so they
  // cascade in one after another: the first applies immediately (responsive), the
  // rest follow ~staggerMs apart, optionally capped so a large burst never feels
  // sluggish.
  const streamQueueRef = useRef<TDelta[]>([]);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enqueueApply = useCallback(
    (delta: TDelta) => {
      const drain = () => {
        const overCap =
          staggerMaxQueue !== undefined &&
          streamQueueRef.current.length > staggerMaxQueue;
        const next = streamQueueRef.current.shift();
        if (next === undefined) {
          streamTimerRef.current = null;
          return;
        }
        applyDelta(next);
        streamTimerRef.current = setTimeout(drain, overCap ? 0 : staggerMs);
      };
      streamQueueRef.current.push(delta);
      if (streamTimerRef.current === null) {
        drain();
      }
    },
    [applyDelta, staggerMs, staggerMaxQueue],
  );

  const bufferDelta = useCallback((delta: TDelta) => {
    bufferRef.current.push(delta);
  }, []);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current !== null) {
        clearTimeout(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const wasActive = isAiActiveRef.current;
    isAiActiveRef.current = isAiActive;
    if (isAiActive === wasActive) {
      return;
    }
    let cancelled = false;
    if (isAiActive) {
      readyRef.current = false;
      bufferRef.current = [];
    }
    void (async () => {
      const { data } = await tryCatch(fetchSnapshot);
      if (!cancelled && data !== null) {
        reconcile(data);
      }
      if (isAiActive) {
        readyRef.current = true;
        const buffered = bufferRef.current;
        bufferRef.current = [];
        buffered.forEach(enqueueApply);
      }
      // On turn end we DON'T abruptly clear anything else: the snapshot above is
      // authoritative, so callers with their own in-flight timers (e.g. a delete
      // exit animation) can let those finish cleanly instead of snapping away.
    })();
    return () => {
      cancelled = true;
    };
  }, [isAiActive, fetchSnapshot, reconcile, enqueueApply]);

  return { enqueueApply, bufferDelta, isAiActiveRef, readyRef };
}

export { useAiLockDeltaStream };

type UseAiLockDeltaStreamParams<TDelta, TSnapshot> = {
  isAiActive: boolean;
  staggerMs: number;
  staggerMaxQueue?: number;
  fetchSnapshot: () => Promise<TSnapshot>;
  reconcile: (snapshot: TSnapshot) => void;
  applyDelta: (delta: TDelta) => void;
};
