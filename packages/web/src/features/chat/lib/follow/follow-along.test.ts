import { beforeEach, describe, expect, it, vi } from 'vitest';

const chat = vi.hoisted(() => ({ conversationId: 'c1', announce: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'current-project' },
}));
vi.mock('@/features/workspace/lib/chat-panel-open', () => ({
  useChatPanel: { getState: () => chat },
}));

import {
  FollowChange,
  RunContext,
  followAlong,
  useFollowAlong,
} from './follow-along';

const INITIAL = useFollowAlong.getState();

let nextId = 0;
const uid = (prefix: string) => `${prefix}-${++nextId}`;

function output({
  kind = 'table',
  id,
  op = 'update',
}: {
  kind?: string;
  id: string;
  op?: string;
}) {
  return {
    content: [{ type: 'text', text: 'done' }],
    _meta: {
      apResource: { v: 1, kind, id, projectId: 'p1', op, label: 'Leads' },
    },
  };
}

function toolResult({
  ctx,
  result,
}: {
  ctx: RunContext;
  result: unknown;
}): void {
  followAlong.onChunks({
    chunks: [
      {
        type: 'tool-output-available',
        toolCallId: uid('call'),
        output: result,
      },
    ],
    ctx,
  });
}

const sent = (runId: string, conversationId = 'c1'): RunContext => ({
  conversationId,
  runId,
  attach: 'sent',
});

describe('followAlong', () => {
  beforeEach(() => {
    chat.conversationId = 'c1';
    useFollowAlong.setState(INITIAL, true);
  });

  it('a change of a sent run in the current chat starts editing and targets it', () => {
    const runId = uid('run');
    const seen: FollowChange[] = [];
    const off = followAlong.onToolDone((change) => seen.push(change));
    toolResult({ ctx: sent(runId), result: output({ id: 't1' }) });
    off();

    const state = useFollowAlong.getState();
    expect(state.phase).toBe('editing');
    expect(state.target).toEqual({
      kind: 'table',
      id: 't1',
      projectId: 'p1',
      name: 'Leads',
    });
    expect(seen).toEqual([
      {
        resource: { kind: 'table', id: 't1', projectId: 'p1', name: 'Leads' },
        op: 'update',
        runId,
        navigable: true,
      },
    ]);
  });

  it('ignores results without a resource', () => {
    toolResult({
      ctx: sent(uid('run')),
      result: { content: [{ type: 'text', text: 'done' }] },
    });
    expect(useFollowAlong.getState().phase).toBe('idle');
  });

  it('a resumed run or another chat never drives the page', () => {
    toolResult({
      ctx: { ...sent(uid('run')), attach: 'resumed' },
      result: output({ id: 't1' }),
    });
    toolResult({
      ctx: sent(uid('run'), 'other'),
      result: output({ id: 't2' }),
    });
    const state = useFollowAlong.getState();
    expect(state.phase).toBe('idle');
    expect(state.target).toBeNull();
  });

  it('stops editing when the last navigable run of its chat ends', () => {
    const first = uid('run');
    const second = uid('run');
    toolResult({ ctx: sent(first), result: output({ id: 't1' }) });
    toolResult({ ctx: sent(second), result: output({ id: 't2' }) });

    followAlong.endRun({ conversationId: 'other', runId: first });
    followAlong.endRun({ conversationId: 'c1', runId: first });
    expect(useFollowAlong.getState().phase).toBe('editing');

    followAlong.endRun({ conversationId: 'c1', runId: second });
    expect(useFollowAlong.getState().phase).toBe('idle');
  });

  it('a deleted target is forgotten, another delete keeps it', () => {
    const ctx = sent(uid('run'));
    toolResult({ ctx, result: output({ id: 't1' }) });
    toolResult({ ctx, result: output({ id: 't9', op: 'delete' }) });
    expect(useFollowAlong.getState().target?.id).toBe('t1');
    toolResult({ ctx, result: output({ id: 't1', op: 'delete' }) });
    expect(useFollowAlong.getState().target).toBeNull();
  });

  it('keeps a newer flash of the same key until the next run starts', () => {
    followAlong.flash(['a', 'b']);
    const first = useFollowAlong.getState().flashes;
    followAlong.flash(['b']);
    const next = useFollowAlong.getState().flashes;
    expect(next.a).toBe(first.a);
    expect(next.b).toBeGreaterThan(first.b);

    toolResult({ ctx: sent(uid('run')), result: output({ id: 't1' }) });
    expect(useFollowAlong.getState().flashes).toEqual({});
  });
});
