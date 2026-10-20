import { Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const agents: TestAgent[] = [];

vi.mock('../src/lib/common/client', () => ({
  makeCursorRequest: async () => ({ agents }),
}));

import { agentPullRequestCreatedTrigger } from '../src/lib/triggers/agent-pull-request-created';

describe('agentPullRequestCreatedTrigger', () => {
  beforeEach(() => {
    agents.length = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not emit pull requests that already existed when the trigger was enabled', async () => {
    agents.push(agent({ id: 'existing', prUrl: 'https://github.com/org/repo/pull/1' }));
    const context = makeContext();
    await agentPullRequestCreatedTrigger.onEnable(context);

    expect(await pollAfterAMinute(context)).toEqual([]);
  });

  it('emits a pull request opened later by an agent created before the last poll, once', async () => {
    const olderAgent = agent({ id: 'older' });
    agents.push(olderAgent);
    const context = makeContext();
    await agentPullRequestCreatedTrigger.onEnable(context);
    expect(await pollAfterAMinute(context)).toEqual([]);

    olderAgent.target = { prUrl: 'https://github.com/org/repo/pull/2' };
    const emitted = await pollAfterAMinute(context);
    expect(emitted.map((item) => (item as TestAgent).id)).toEqual(['older']);

    expect(await pollAfterAMinute(context)).toEqual([]);
  });

  it('emits a pull request from an agent created after enable', async () => {
    const context = makeContext();
    await agentPullRequestCreatedTrigger.onEnable(context);

    vi.advanceTimersByTime(30_000);
    agents.push(agent({ id: 'new', prUrl: 'https://github.com/org/repo/pull/3', createdAt: new Date().toISOString() }));
    const emitted = await pollAfterAMinute(context);
    expect(emitted.map((item) => (item as TestAgent).id)).toEqual(['new']);
  });
});

async function pollAfterAMinute(context: Parameters<typeof agentPullRequestCreatedTrigger.run>[0]): Promise<unknown[]> {
  vi.advanceTimersByTime(60_000);
  return agentPullRequestCreatedTrigger.run(context);
}

function agent({ id, prUrl, createdAt = '2024-01-01T00:00:00Z' }: { id: string; prUrl?: string; createdAt?: string }): TestAgent {
  return { id, name: id, status: 'FINISHED', createdAt, target: prUrl ? { prUrl } : {} };
}

function makeContext(): Parameters<typeof agentPullRequestCreatedTrigger.run>[0] {
  return {
    auth: { secret_text: 'key' },
    propsValue: {},
    store: memoryStore(),
    files: {},
  } as unknown as Parameters<typeof agentPullRequestCreatedTrigger.run>[0];
}

function memoryStore(): Store {
  const data = new Map<string, unknown>();
  return {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return (data.get(key) as T) ?? null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

type TestAgent = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  target: { prUrl?: string };
};
