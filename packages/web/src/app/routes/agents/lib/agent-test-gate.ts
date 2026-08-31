import { isNil } from '@activepieces/core-utils';
import { AgentConfig } from '@activepieces/shared';

function blockedReason({
  draft,
}: {
  draft: Partial<AgentConfig> | undefined;
}): TestGateReason | null {
  if (isNil(draft?.modelName) || isNil(draft?.provider)) {
    return 'model';
  }
  if ((draft.instructions ?? '').trim().length === 0) {
    return 'instructions';
  }
  return null;
}

export const agentTestGate = { blockedReason };
export type TestGateReason = 'model' | 'instructions';
