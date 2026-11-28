import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { todoistFake } from './todoist-fake';

const { trigger, complete, memoryStore, ctx, ids } = todoistFake;

describe('Todoist Task Completed Test trigger sample data', () => {
  beforeEach(() => {
    todoistFake.reset({ at: Date.UTC(2026, 9, 2, 9, 0, 0) });
    complete({ id: 'task-yesterday', at: Date.UTC(2026, 9, 1, 15, 20, 0), visibleFrom: 0 });
    complete({ id: 'task-last-week', at: Date.UTC(2026, 8, 27, 10, 0, 0), visibleFrom: 0 });
  });

  afterEach(() => {
    todoistFake.restore();
  });

  it('returns the most recent completed task when the builder clicks Test', async () => {
    process.env.TZ = 'UTC';
    const sample = await trigger.test(ctx({ store: memoryStore() }));
    expect(ids(sample)).toContain('task-yesterday');
  });
});
