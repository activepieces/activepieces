export function evaluateFanIn({
  cur,
  state,
  nowMs,
}: EvaluateFanInParams): FanInVerdict {
  const succeeded = cur.succeeded - state.baselineSucceeded;
  const failed = cur.failed - state.baselineFailed;
  const terminalDelta = succeeded + failed;

  const done = terminalDelta >= state.batchesDispatched && cur.nonTerminal === 0;
  const timedOut = !done && nowMs > state.deadline;
  const stillRunning = timedOut
    ? state.batchesDispatched - succeeded - failed
    : 0;

  return { done, timedOut, succeeded, failed, stillRunning };
}

export type FanInRollup = {
  succeeded: number;
  failed: number;
  nonTerminal: number;
};

export type FanInState = {
  batchesDispatched: number;
  baselineSucceeded: number;
  baselineFailed: number;
  deadline: number;
};

export type FanInVerdict = {
  done: boolean;
  timedOut: boolean;
  succeeded: number;
  failed: number;
  stillRunning: number;
};

type EvaluateFanInParams = {
  cur: FanInRollup;
  state: FanInState;
  nowMs: number;
};
