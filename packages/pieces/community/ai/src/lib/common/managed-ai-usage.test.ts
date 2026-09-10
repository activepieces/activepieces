import { describe, expect, it } from 'vitest';
import { extractManagedAiCalls } from './managed-ai-usage';

function step({ id, cost, promptTokens, completionTokens }: {
  id: string;
  cost?: number;
  promptTokens?: number;
  completionTokens?: number;
}) {
  return {
    response: { id },
    providerMetadata: {
      openrouter: {
        provider: 'anthropic',
        usage: { cost, promptTokens, completionTokens },
      },
    },
  };
}

describe('extractManagedAiCalls', () => {
  it('sums every step of a multi-step call rather than reporting only the last', () => {
    const calls = extractManagedAiCalls({
      steps: [
        step({ id: 'gen-1', cost: 0.01 }),
        step({ id: 'gen-2', cost: 0.02 }),
        step({ id: 'gen-3', cost: 0.04 }),
      ],
      providerMetadata: { openrouter: { usage: { cost: 0.04 } } },
      response: { id: 'gen-3' },
    });

    expect(calls.map((call) => call.generationId)).toEqual(['gen-1', 'gen-2', 'gen-3']);
    expect(calls.reduce((sum, call) => sum + call.costUsd, 0)).toBeCloseTo(0.07);
  });

  it('reads the result itself when there are no steps, as generateImage returns', () => {
    const calls = extractManagedAiCalls(step({ id: 'gen-solo', cost: 0.005 }));

    expect(calls).toEqual([{ generationId: 'gen-solo', costUsd: 0.005, inputTokens: undefined, outputTokens: undefined }]);
  });

  it('carries the token counts through when OpenRouter reports them', () => {
    const calls = extractManagedAiCalls(step({ id: 'gen-1', cost: 0.01, promptTokens: 1200, completionTokens: 340 }));

    expect(calls[0].inputTokens).toBe(1200);
    expect(calls[0].outputTokens).toBe(340);
  });

  it('keeps a genuinely free model, which reports a real cost of zero', () => {
    const calls = extractManagedAiCalls(step({ id: 'gen-free', cost: 0 }));

    expect(calls).toHaveLength(1);
    expect(calls[0].costUsd).toBe(0);
  });

  it('skips a step with no cost attached, so the missing report is the signal', () => {
    const calls = extractManagedAiCalls({ steps: [step({ id: 'gen-1' })] });

    expect(calls).toEqual([]);
  });

  it('skips a step from a provider that is not OpenRouter', () => {
    const calls = extractManagedAiCalls({
      steps: [{ response: { id: 'gen-1' }, providerMetadata: { openai: { usage: { cost: 0.02 } } } }],
    });

    expect(calls).toEqual([]);
  });

  it('skips a step with no generation id, since there would be no idempotency key', () => {
    const calls = extractManagedAiCalls({
      steps: [{ providerMetadata: { openrouter: { usage: { cost: 0.02 } } } }],
    });

    expect(calls).toEqual([]);
  });

  it('reports nothing for a result that is not an object', () => {
    expect(extractManagedAiCalls(undefined)).toEqual([]);
    expect(extractManagedAiCalls('text')).toEqual([]);
  });
});
