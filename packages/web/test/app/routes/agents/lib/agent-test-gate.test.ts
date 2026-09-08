import { AIProviderName } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { agentTestGate } from '@/app/routes/agents/lib/agent-test-gate';

const runnable = {
  instructions: 'Triage the inbox.',
  provider: AIProviderName.ANTHROPIC,
  modelName: 'claude-sonnet-4-6',
  tools: [],
  structuredOutput: [],
  maxSteps: 20,
};

describe('agentTestGate.blockedReason', () => {
  it('lets a runnable draft through', () => {
    expect(agentTestGate.blockedReason({ draft: runnable })).toBeNull();
  });

  it('blocks on a missing model, because the run cannot resolve one', () => {
    expect(
      agentTestGate.blockedReason({ draft: { ...runnable, modelName: null } }),
    ).toBe('model');
    expect(
      agentTestGate.blockedReason({ draft: { ...runnable, provider: null } }),
    ).toBe('model');
  });

  it.each([
    ['empty', ''],
    ['spaces', '   '],
    ['tabs', '\t\t'],
    ['newlines', '\n\n'],
  ])(
    'blocks %s instructions, so testing never overwrites the draft with an unrunnable one',
    (_kind, instructions) => {
      expect(
        agentTestGate.blockedReason({ draft: { ...runnable, instructions } }),
      ).toBe('instructions');
    },
  );

  it('reports the missing model first, so the fix order matches the panel', () => {
    expect(
      agentTestGate.blockedReason({
        draft: { ...runnable, modelName: null, instructions: '' },
      }),
    ).toBe('model');
  });

  it('blocks an absent draft rather than staging nothing', () => {
    expect(agentTestGate.blockedReason({ draft: undefined })).toBe('model');
  });
});
