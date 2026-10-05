import { beforeEach, describe, expect, it, vi } from 'vitest';
import { newTask } from '../src/lib/triggers/new-task';
import { taskCompleted } from '../src/lib/triggers/task-completed';
import { newProject } from '../src/lib/triggers/new-project';
import { niftyPolling } from '../src/lib/common/polling';
import { ok, task, triggerContext } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

beforeEach(() => {
  sendRequest.mockReset();
});

function hook({ fn, ctx }: { fn: unknown; ctx: unknown }): Promise<unknown> {
  if (typeof fn !== 'function') {
    throw new Error('missing hook');
  }
  return Promise.resolve(Reflect.apply(fn, undefined, [ctx]));
}

const T0 = '2026-10-05T10:00:00.000Z';
const T1 = '2026-10-05T11:00:00.000Z';

describe('advanceTimeCursor', () => {
  const timeOf = (r: Record<string, unknown>) => String(r['created_at']);
  const keyOf = (r: Record<string, unknown>) => String(r['id']);

  it('emits ties at the checkpoint that were not seen, oldest first, and skips the seen ones', () => {
    const { emit, cursor } = niftyPolling.advanceTimeCursor({
      cursor: { cp: T0, seen: ['a'] },
      items: [task({ id: 'c', created_at: T1 }), task({ id: 'a', created_at: T0 }), task({ id: 'b', created_at: T0 })],
      timeOf,
      keyOf,
    });
    expect(emit.map((t) => t['id'])).toEqual(['b', 'c']);
    expect(cursor).toEqual({ cp: T1, seen: ['c'] });
  });

  it('keeps earlier seen keys when the checkpoint does not move', () => {
    const { cursor } = niftyPolling.advanceTimeCursor({ cursor: { cp: T0, seen: ['a'] }, items: [task({ id: 'b', created_at: T0 })], timeOf, keyOf });
    expect(cursor).toEqual({ cp: T0, seen: ['a', 'b'] });
  });

  it('bounds the seen list', () => {
    const items = Array.from({ length: 450 }, (_, i) => task({ id: `t${i}`, created_at: T1 }));
    const { cursor } = niftyPolling.advanceTimeCursor({ cursor: { cp: T0, seen: [] }, items, timeOf, keyOf });
    expect(cursor.seen).toHaveLength(200);
  });

  it('seeds from the newest item, or now when empty', () => {
    expect(niftyPolling.seedTimeCursor({ items: [], timeOf, keyOf, now: T1 })).toEqual({ cp: T1, seen: [] });
    expect(
      niftyPolling.seedTimeCursor({ items: [task({ id: 'x', created_at: T0 }), task({ id: 'y', created_at: T1 })], timeOf, keyOf, now: T0 })
    ).toEqual({ cp: T1, seen: ['y'] });
  });
});

describe('New Task trigger', () => {
  it('does not replay existing tasks, emits a new one once, then nothing', async () => {
    const store = new Map<string, string>();
    const ctx = triggerContext({ propsValue: { project: 'p1', include_subtasks: true }, store });
    sendRequest.mockResolvedValueOnce(ok({ tasks: [task({ id: 'old', created_at: T0 })], hasMore: false }));
    await hook({ fn: newTask.onEnable, ctx });
    expect(sendRequest.mock.calls[0][0].queryParams).toMatchObject({ project_id: 'p1', include_subtasks: 'true' });

    sendRequest.mockResolvedValueOnce(ok({ tasks: [task({ id: 'old', created_at: T0 }), task({ id: 'new', created_at: T1 })] }));
    const first = await hook({ fn: newTask.run, ctx });
    expect(first).toEqual([task({ id: 'new', created_at: T1 })]);

    sendRequest.mockResolvedValueOnce(ok({ tasks: [task({ id: 'old', created_at: T0 }), task({ id: 'new', created_at: T1 })] }));
    expect(await hook({ fn: newTask.run, ctx })).toEqual([]);
  });

  it('skips subtasks when include subtasks is off', async () => {
    const store = new Map<string, string>([['nifty_new_task_cursor', JSON.stringify({ cp: T0, seen: [] })]]);
    const ctx = triggerContext({ propsValue: { project: 'p1', include_subtasks: false }, store });
    sendRequest.mockResolvedValueOnce(ok({ tasks: [task({ id: 'sub', task: 'parent', created_at: T1 }), task({ id: 'top', created_at: T1 })] }));
    const out = await hook({ fn: newTask.run, ctx });
    expect(out).toEqual([task({ id: 'top', created_at: T1 })]);
    expect(sendRequest.mock.calls[0][0].queryParams).not.toHaveProperty('include_subtasks');
  });

  it('keeps the cursor on republish', async () => {
    const store = new Map<string, string>([['nifty_new_task_cursor', JSON.stringify({ cp: T0, seen: ['x'] })]]);
    await hook({ fn: newTask.onEnable, ctx: triggerContext({ propsValue: {}, store, isRepublish: true }) });
    expect(sendRequest).not.toHaveBeenCalled();
    expect(JSON.parse(store.get('nifty_new_task_cursor') ?? '{}')).toEqual({ cp: T0, seen: ['x'] });
  });

  it('throws on API errors instead of advancing', async () => {
    const store = new Map<string, string>([['nifty_new_task_cursor', JSON.stringify({ cp: T0, seen: [] })]]);
    sendRequest.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 500, body: 'down' } }));
    await expect(hook({ fn: newTask.run, ctx: triggerContext({ propsValue: {}, store }) })).rejects.toThrow('HTTP 500');
    expect(JSON.parse(store.get('nifty_new_task_cursor') ?? '{}')).toEqual({ cp: T0, seen: [] });
  });
});

describe('Task Completed trigger', () => {
  it('queries the completed window from the checkpoint and fires again after a re-completion', async () => {
    const store = new Map<string, string>([['nifty_task_completed_cursor', JSON.stringify({ cp: T0, seen: [`t1:${T0}`] })]]);
    const ctx = triggerContext({ propsValue: {}, store });
    sendRequest.mockResolvedValueOnce(
      ok({ tasks: [task({ id: 't1', completed: true, completed_on: T0 }), task({ id: 't1', completed: true, completed_on: T1 })] })
    );
    const out = await hook({ fn: taskCompleted.run, ctx });
    const query = sendRequest.mock.calls[0][0].queryParams;
    expect(query).toMatchObject({ completed: 'true', order: 'completedOn:DESC', completed_from: T0 });
    expect(Date.parse(query.completed_to)).toBeGreaterThan(Date.now());
    expect(out).toEqual([task({ id: 't1', completed: true, completed_on: T1 })]);
  });
});

describe('New Project trigger', () => {
  it('seeds known ids, emits only unseen projects, and strips meeting passwords', async () => {
    const store = new Map<string, string>();
    const ctx = triggerContext({ propsValue: {}, store });
    sendRequest.mockResolvedValueOnce(ok({ projects: [{ id: 'p1', name: 'A' }] }));
    await hook({ fn: newProject.onEnable, ctx });
    sendRequest.mockResolvedValueOnce(ok({ projects: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B', zoom_password: 'z' }] }));
    expect(await hook({ fn: newProject.run, ctx })).toEqual([{ id: 'p2', name: 'B' }]);
    sendRequest.mockResolvedValueOnce(ok({ projects: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] }));
    expect(await hook({ fn: newProject.run, ctx })).toEqual([]);
  });

  it('does not re-emit a known project that drops out of one listing', () => {
    const first = niftyPolling.advanceIdSet({ known: ['a', 'b'], items: [{ id: 'a' }, { id: 'c' }] });
    expect(first.emit).toEqual([{ id: 'c' }]);
    const second = niftyPolling.advanceIdSet({ known: first.known, items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });
    expect(second.emit).toEqual([]);
  });
});
