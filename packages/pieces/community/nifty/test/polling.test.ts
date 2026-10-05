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
const T2 = '2026-10-05T12:00:00.000Z';

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
    const store = new Map<string, string>([['nifty_new_task_cursor', JSON.stringify({ cp: T0, seen: [], fp: '["p1",false]' })]]);
    const ctx = triggerContext({ propsValue: { project: 'p1', include_subtasks: false }, store });
    sendRequest.mockResolvedValueOnce(ok({ tasks: [task({ id: 'sub', task: 'parent', created_at: T1 }), task({ id: 'top', created_at: T1 })] }));
    const out = await hook({ fn: newTask.run, ctx });
    expect(out).toEqual([task({ id: 'top', created_at: T1 })]);
    expect(sendRequest.mock.calls[0][0].queryParams).not.toHaveProperty('include_subtasks');
  });

  it('keeps the cursor across a republish with the same inputs, so a task created in between still fires', async () => {
    const store = new Map<string, string>();
    const props = { project: 'p1', include_subtasks: true };
    sendRequest.mockResolvedValueOnce(ok({ tasks: [task({ id: 'old', created_at: T0 })] }));
    await hook({ fn: newTask.onEnable, ctx: triggerContext({ propsValue: props, store }) });
    await hook({ fn: newTask.onDisable, ctx: triggerContext({ propsValue: props, store }) });
    await hook({ fn: newTask.onEnable, ctx: triggerContext({ propsValue: props, store, isRepublish: true }) });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    sendRequest.mockResolvedValueOnce(ok({ tasks: [task({ id: 'old', created_at: T0 }), task({ id: 'gap', created_at: T1 })] }));
    expect(await hook({ fn: newTask.run, ctx: triggerContext({ propsValue: props, store }) })).toEqual([task({ id: 'gap', created_at: T1 })]);
  });

  it('reseeds on republish when the inputs changed, and on a plain re-enable', async () => {
    const store = new Map<string, string>([['nifty_new_task_cursor', JSON.stringify({ cp: T0, seen: ['x'], fp: '["p1",true]' })]]);
    sendRequest.mockResolvedValueOnce(ok({ tasks: [task({ id: 'y', created_at: T1 })] }));
    await hook({ fn: newTask.onEnable, ctx: triggerContext({ propsValue: { project: 'p2' }, store, isRepublish: true }) });
    expect(JSON.parse(store.get('nifty_new_task_cursor') ?? '{}')).toEqual({ cp: T1, seen: ['y'], fp: '["p2",true]' });
    sendRequest.mockResolvedValueOnce(ok({ tasks: [task({ id: 'z', created_at: T1 }), task({ id: 'y', created_at: T1 })] }));
    await hook({ fn: newTask.onEnable, ctx: triggerContext({ propsValue: { project: 'p2' }, store }) });
    expect(JSON.parse(store.get('nifty_new_task_cursor') ?? '{}')).toEqual({ cp: T1, seen: ['z', 'y'], fp: '["p2",true]' });
  });

  it('throws on API errors instead of advancing', async () => {
    const store = new Map<string, string>([['nifty_new_task_cursor', JSON.stringify({ cp: T0, seen: [], fp: '[null,true]' })]]);
    sendRequest.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 500, body: 'down' } }));
    await expect(hook({ fn: newTask.run, ctx: triggerContext({ propsValue: {}, store }) })).rejects.toThrow('HTTP 500');
    expect(JSON.parse(store.get('nifty_new_task_cursor') ?? '{}')).toEqual({ cp: T0, seen: [], fp: '[null,true]' });
  });
});

describe('Task Completed trigger', () => {
  it('queries the completed window from the checkpoint and fires again after a re-completion', async () => {
    const store = new Map<string, string>([['nifty_task_completed_cursor', JSON.stringify({ cp: T0, seen: [`t1:${T0}`], fp: '[null,true]' })]]);
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

  it('reads a smaller window instead of skipping completions when a scan is truncated, then catches up', async () => {
    const store = new Map<string, string>([['nifty_task_completed_cursor', JSON.stringify({ cp: T0, seen: [], fp: '[null,true]' })]]);
    const ctx = triggerContext({ propsValue: {}, store });
    const fullPage = Array.from({ length: 1000 }, (_, i) => task({ id: `n${i}`, completed: true, completed_on: T2 }));
    const early = task({ id: 'early', completed: true, completed_on: T1 });
    sendRequest.mockImplementation(async (request: { queryParams: Record<string, string> }) => {
      const to = Date.parse(request.queryParams['completed_to']);
      if (to > Date.parse(T2)) {
        return ok({ tasks: fullPage });
      }
      return ok({ tasks: Date.parse(T1) <= to ? [early] : [] });
    });
    const first = await hook({ fn: taskCompleted.run, ctx });
    expect(first).toEqual([early]);
    const cursor = JSON.parse(store.get('nifty_task_completed_cursor') ?? '{}');
    expect(Date.parse(cursor.cp)).toBeGreaterThanOrEqual(Date.parse(T1));
    expect(Date.parse(cursor.cp)).toBeLessThan(Date.parse(T2));
    const pages = sendRequest.mock.calls.filter((call) => Number(call[0].queryParams['offset'] ?? 0) === 0);
    expect(pages.length).toBeGreaterThan(1);
  });

  it('keeps the completion cursor across a republish with the same inputs', async () => {
    const stored = { cp: T0, seen: [`t1:${T0}`], fp: '["p1",true]' };
    const store = new Map<string, string>([['nifty_task_completed_cursor', JSON.stringify(stored)]]);
    await hook({ fn: taskCompleted.onDisable, ctx: triggerContext({ propsValue: { project: 'p1' }, store }) });
    await hook({ fn: taskCompleted.onEnable, ctx: triggerContext({ propsValue: { project: 'p1' }, store, isRepublish: true }) });
    expect(sendRequest).not.toHaveBeenCalled();
    expect(JSON.parse(store.get('nifty_task_completed_cursor') ?? '{}')).toEqual(stored);
  });

  it('does not advance when even the smallest window is truncated', async () => {
    const stored = { cp: T0, seen: [], fp: '[null,true]' };
    const store = new Map<string, string>([['nifty_task_completed_cursor', JSON.stringify(stored)]]);
    const fullPage = Array.from({ length: 1000 }, (_, i) => task({ id: `n${i}`, completed: true, completed_on: T0 }));
    sendRequest.mockResolvedValue(ok({ tasks: fullPage }));
    await expect(hook({ fn: taskCompleted.run, ctx: triggerContext({ propsValue: {}, store }) })).rejects.toThrow('cannot all be read');
    expect(JSON.parse(store.get('nifty_task_completed_cursor') ?? '{}')).toEqual(stored);
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
    const first = niftyPolling.advanceIdSet({ known: ['a', 'b'], dropped: [], items: [{ id: 'a' }, { id: 'c' }], truncated: false });
    expect(first.emit).toEqual([{ id: 'c' }]);
    expect(first).toMatchObject({ known: ['a', 'c'], dropped: ['b'] });
    const second = niftyPolling.advanceIdSet({ known: first.known, dropped: first.dropped, items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], truncated: false });
    expect(second.emit).toEqual([]);
  });

  it('never re-fires a visible project after more than 10,000 projects have been seen', () => {
    const ids = ({ prefix, count }: { prefix: string; count: number }) => Array.from({ length: count }, (_, i) => `${prefix}${i}`);
    const oldest = { id: 'keep' };
    let state: { known: string[]; dropped: string[] } = { known: ['keep', ...ids({ prefix: 'a', count: 9000 })], dropped: [] };
    const rounds = [ids({ prefix: 'b', count: 9000 }), ids({ prefix: 'c', count: 9000 }), ids({ prefix: 'd', count: 9000 })];
    for (const round of rounds) {
      const result = niftyPolling.advanceIdSet({ ...state, items: [oldest, ...round.map((id) => ({ id }))], truncated: false });
      expect(result.emit).toHaveLength(9000);
      state = { known: result.known, dropped: result.dropped };
    }
    const last = niftyPolling.advanceIdSet({ ...state, items: [oldest, { id: 'd1' }], truncated: false });
    expect(last.emit).toEqual([]);
    expect(JSON.stringify(last).length).toBeLessThan(512 * 1024);
  });

  it('does not forget ids after a truncated listing', () => {
    const result = niftyPolling.advanceIdSet({ known: ['a', 'b'], dropped: [], items: [{ id: 'a' }, { id: 'n' }], truncated: true });
    expect(result).toEqual({ emit: [{ id: 'n' }], known: ['a', 'b', 'n'], dropped: [] });
  });

  it('keeps the known ids across a republish with the same portfolio', async () => {
    const store = new Map<string, string>();
    sendRequest.mockResolvedValueOnce(ok({ projects: [{ id: 'p1', name: 'A' }] }));
    await hook({ fn: newProject.onEnable, ctx: triggerContext({ propsValue: {}, store }) });
    await hook({ fn: newProject.onDisable, ctx: triggerContext({ propsValue: {}, store }) });
    await hook({ fn: newProject.onEnable, ctx: triggerContext({ propsValue: {}, store, isRepublish: true }) });
    sendRequest.mockResolvedValueOnce(ok({ projects: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] }));
    expect(await hook({ fn: newProject.run, ctx: triggerContext({ propsValue: {}, store }) })).toEqual([{ id: 'p2', name: 'B' }]);
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });
});
