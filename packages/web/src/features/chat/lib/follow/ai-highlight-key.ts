function step(name: string): string {
  return `${STEP_PREFIX}${name}`;
}

function flowName(flowId: string): string {
  return `flow-name:${flowId}`;
}

function flowStatus(flowId: string): string {
  return `flow-status:${flowId}`;
}

function stepOf(key: string): string | null {
  return key.startsWith(STEP_PREFIX) ? key.slice(STEP_PREFIX.length) : null;
}

const STEP_PREFIX = 'flow-step:';

export const aiHighlightKey = { step, flowName, flowStatus, stepOf };
