import { describe, expect, it } from 'vitest';

import { agentEditState } from '@/app/routes/agents/lib/agent-edit-state';

const config = (over: Record<string, unknown> = {}) => ({
  displayName: 'Inbox agent',
  description: '',
  icon: 'BOT',
  color: 'PURPLE',
  draft: { instructions: 'Sort it.', modelName: 'gpt-5', provider: 'OPENAI' },
  ...over,
});

describe('sameConfig', () => {
  it('treats an identical shape as unchanged', () => {
    expect(agentEditState.sameConfig({ left: config(), right: config() })).toBe(
      true,
    );
  });

  it.each([
    ['a changed instruction', { draft: { instructions: 'Other.' } }],
    ['a changed name', { displayName: 'Renamed' }],
    [
      'a changed model',
      { draft: { instructions: 'Sort it.', modelName: 'x' } },
    ],
  ])('sees %s as changed', (_label, over) => {
    expect(
      agentEditState.sameConfig({ left: config(), right: config(over) }),
    ).toBe(false);
  });

  it('does not confuse null with undefined, so a cleared field counts as an edit', () => {
    expect(
      agentEditState.sameConfig({
        left: { modelName: null },
        right: { modelName: undefined },
      }),
    ).toBe(false);
  });

  it('sees an added empty description as a change, since the server stores it', () => {
    expect(
      agentEditState.sameConfig({ left: {}, right: { description: '' } }),
    ).toBe(false);
  });

  it('is order-sensitive on arrays, because tool order is meaningful', () => {
    expect(
      agentEditState.sameConfig({
        left: { tools: ['a', 'b'] },
        right: { tools: ['b', 'a'] },
      }),
    ).toBe(false);
  });
});

describe('createWriteLock', () => {
  it('lets the first claim through', () => {
    expect(agentEditState.createWriteLock().claim()).toBe(true);
  });

  it('refuses a second claim while the first is held, which is the race guard', () => {
    const lock = agentEditState.createWriteLock();
    expect(lock.claim()).toBe(true);
    expect(lock.claim()).toBe(false);
    expect(lock.claim()).toBe(false);
  });

  it('lets the next writer in after a release', () => {
    const lock = agentEditState.createWriteLock();
    lock.claim();
    lock.release();
    expect(lock.claim()).toBe(true);
  });

  it('survives a release that was never claimed, so a validation failure cannot lock writes out', () => {
    const lock = agentEditState.createWriteLock();
    lock.release();
    lock.release();
    expect(lock.claim()).toBe(true);
  });

  it('reports whether it is held, so the caller can reason about the window', () => {
    const lock = agentEditState.createWriteLock();
    expect(lock.held()).toBe(false);
    lock.claim();
    expect(lock.held()).toBe(true);
    lock.release();
    expect(lock.held()).toBe(false);
  });

  it('gives each screen its own lock, so one agent cannot block another', () => {
    const first = agentEditState.createWriteLock();
    const second = agentEditState.createWriteLock();
    first.claim();
    expect(second.claim()).toBe(true);
  });

  it('admits exactly one of many simultaneous writers', () => {
    const lock = agentEditState.createWriteLock();
    const admitted = Array.from({ length: 25 }, () => lock.claim()).filter(
      Boolean,
    );
    expect(admitted).toHaveLength(1);
  });
});

describe('leaveGuard', () => {
  it('stays closed when nothing is trying to leave', () => {
    expect(
      agentEditState.leaveGuard({
        blockerState: 'unblocked',
        exitRequested: false,
      }),
    ).toStrictEqual({ open: false, discardAction: 'none' });
  });

  it('opens for a blocked router navigation and lets the router proceed', () => {
    expect(
      agentEditState.leaveGuard({
        blockerState: 'blocked',
        exitRequested: false,
      }),
    ).toStrictEqual({ open: true, discardAction: 'proceed' });
  });

  it('opens for the back arrow and exits in-app, since no navigation is pending', () => {
    expect(
      agentEditState.leaveGuard({
        blockerState: 'unblocked',
        exitRequested: true,
      }),
    ).toStrictEqual({ open: true, discardAction: 'exit' });
  });

  it('prefers the router when both are pending, so the queued navigation is not dropped', () => {
    expect(
      agentEditState.leaveGuard({
        blockerState: 'blocked',
        exitRequested: true,
      }),
    ).toStrictEqual({ open: true, discardAction: 'proceed' });
  });

  it.each(['proceeding', 'unblocked'])(
    'stays closed while the blocker is %s and no in-app exit was asked for',
    (blockerState) => {
      expect(
        agentEditState.leaveGuard({ blockerState, exitRequested: false }).open,
      ).toBe(false);
    },
  );
});

describe('agentEditState.modelPickChanged', () => {
  const pick = {
    provider: 'openrouter',
    modelName: 'anthropic/claude-sonnet-4.6',
    providerConfigId: null,
  };

  it('is false when the selector reports the model the form already holds', () => {
    expect(
      agentEditState.modelPickChanged({ picked: pick, current: pick }),
    ).toBe(false);
  });

  it('is true when the model differs', () => {
    expect(
      agentEditState.modelPickChanged({
        picked: { ...pick, modelName: 'openai/gpt-5' },
        current: pick,
      }),
    ).toBe(true);
  });

  it('treats a missing field and an explicit null as the same pick', () => {
    expect(
      agentEditState.modelPickChanged({
        picked: { provider: 'openrouter', modelName: 'x' },
        current: {
          provider: 'openrouter',
          modelName: 'x',
          providerConfigId: null,
        },
      }),
    ).toBe(false);
  });

  it('is true when only the provider config differs', () => {
    expect(
      agentEditState.modelPickChanged({
        picked: { ...pick, providerConfigId: 'cfg_1' },
        current: pick,
      }),
    ).toBe(true);
  });
});
