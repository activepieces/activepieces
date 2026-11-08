import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const chat = vi.hoisted(() => ({ conversationId: 'c1' }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'current-project' },
}));
vi.mock('@/features/workspace/lib/chat-panel-open', () => ({
  useChatPanel: { getState: () => chat },
}));

import { ResourceRef } from '../resources/registry';

import {
  FollowChange,
  FollowOffer,
  RunContext,
  followAlong,
  useFollowAlong,
} from './follow-along';

const INITIAL = useFollowAlong.getState();

let nextId = 0;
const uid = (prefix: string) => `${prefix}-${++nextId}`;

const text = (value: string) => ({ content: [{ type: 'text', text: value }] });

function callTool({
  runId,
  conversationId = 'c1',
  attach = 'sent',
  toolName,
  input,
  output = text('✅ Done'),
}: {
  runId: string;
  conversationId?: string;
  attach?: 'sent' | 'resumed';
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
}): string {
  const toolCallId = uid('call');
  const ctx = { conversationId, runId, attach };
  followAlong.onChunks({
    chunks: [{ type: 'tool-input-available', toolCallId, toolName, input }],
    ctx,
  });
  followAlong.onChunks({
    chunks: [{ type: 'tool-output-available', toolCallId, output }],
    ctx,
  });
  return toolCallId;
}

const insertRows = (tableId: string) => ({
  toolName: 'ap_insert_records',
  input: { tableId, records: [{}] },
});

describe('followAlong', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    chat.conversationId = 'c1';
    useFollowAlong.setState(INITIAL, true);
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('runs', () => {
    it('a sent run in the current chat starts editing and targets the resource', () => {
      const runId = uid('run');
      const seen: FollowChange[] = [];
      const off = followAlong.onToolDone((change) => seen.push(change));
      const toolCallId = callTool({ runId, ...insertRows('t1') });
      off();

      const state = useFollowAlong.getState();
      expect(state.phase).toBe('editing');
      expect(state.target).toMatchObject({ kind: 'table', id: 't1' });
      expect(seen).toHaveLength(1);
      expect(seen[0]).toMatchObject({ navigable: true, runId });
      expect(state.runs[runId].changes).toEqual([
        {
          toolCallId,
          toolName: 'ap_insert_records',
          input: { tableId: 't1', records: [{}] },
          output: text('✅ Done'),
          highlights: expect.any(Array),
          changed: true,
        },
      ]);
    });

    it('a resumed run records changes but never drives the page', () => {
      const runId = uid('run');
      callTool({ runId, attach: 'resumed', ...insertRows('t1') });
      const state = useFollowAlong.getState();
      expect(state.phase).toBe('idle');
      expect(state.target).toBeNull();
      expect(state.runs[runId].changes).toHaveLength(1);
    });

    it('a run of another chat never drives the page', () => {
      const runId = uid('run');
      const seen: FollowChange[] = [];
      const off = followAlong.onToolDone((change) => seen.push(change));
      callTool({ runId, conversationId: 'other', ...insertRows('t1') });
      off();
      expect(useFollowAlong.getState().target).toBeNull();
      expect(seen[0]?.navigable).toBe(false);
    });

    it('endRun is scoped to its own run and chat', () => {
      const first = uid('run');
      const second = uid('run');
      callTool({ runId: first, ...insertRows('t1') });
      callTool({ runId: second, ...insertRows('t2') });

      followAlong.endRun({ conversationId: 'other', runId: first });
      expect(useFollowAlong.getState().runs[first].ended).toBe(false);

      followAlong.endRun({ conversationId: 'c1', runId: first });
      expect(useFollowAlong.getState().runs[first].ended).toBe(true);
      expect(useFollowAlong.getState().phase).toBe('editing');

      followAlong.endRun({ conversationId: 'c1', runId: second });
      expect(useFollowAlong.getState().phase).toBe('done');
      vi.advanceTimersByTime(2600);
      expect(useFollowAlong.getState().phase).toBe('idle');
    });

    it('drops pending calls of an ended run', () => {
      const runId = uid('run');
      const ctx: RunContext = { conversationId: 'c1', runId, attach: 'sent' };
      const toolCallId = uid('call');
      followAlong.onChunks({
        chunks: [
          {
            type: 'tool-input-available',
            toolCallId,
            ...insertRows('t1'),
          },
        ],
        ctx,
      });
      followAlong.endRun({ conversationId: 'c1', runId });
      followAlong.onChunks({
        chunks: [
          { type: 'tool-output-available', toolCallId, output: text('ok') },
        ],
        ctx,
      });
      expect(useFollowAlong.getState().runs[runId].changes).toHaveLength(0);
    });
  });

  describe('pruning', () => {
    it('keeps the current chat runs and the last five ended runs of other chats', () => {
      const current = uid('run');
      callTool({ runId: current, ...insertRows('t1') });
      followAlong.endRun({ conversationId: 'c1', runId: current });

      const others = Array.from({ length: 8 }, () => uid('run'));
      others.forEach((runId) => {
        callTool({ runId, conversationId: 'old', ...insertRows('t2') });
        followAlong.endRun({ conversationId: 'old', runId });
      });

      const kept = Object.keys(useFollowAlong.getState().runs);
      expect(kept).toContain(current);
      expect(kept.filter((id) => others.includes(id))).toEqual(
        others.slice(-5),
      );
    });

    it('never prunes a live run', () => {
      const live = uid('run');
      callTool({ runId: live, conversationId: 'old', ...insertRows('t2') });
      Array.from({ length: 7 }, () => uid('run')).forEach((runId) => {
        callTool({ runId, conversationId: 'old', ...insertRows('t2') });
        followAlong.endRun({ conversationId: 'old', runId });
      });
      expect(useFollowAlong.getState().runs[live]).toBeDefined();
    });
  });

  describe('offer', () => {
    const table: ResourceRef = { kind: 'table', id: 't1' };

    it('raises, keeps an equal offer and clears', () => {
      const first: FollowOffer = { resource: table, kind: 'ready', runId: 'r' };
      followAlong.offer(first);
      expect(useFollowAlong.getState().offer).toBe(first);

      followAlong.offer({ ...first, resource: { ...table, name: 'Leads' } });
      expect(useFollowAlong.getState().offer).toBe(first);

      const other: FollowOffer = { ...first, kind: 'switch' };
      followAlong.offer(other);
      expect(useFollowAlong.getState().offer).toBe(other);

      followAlong.offer(null);
      expect(useFollowAlong.getState().offer).toBeNull();
    });

    it('a deleted resource clears its target and its offer', () => {
      const runId = uid('run');
      callTool({ runId, ...insertRows('t1') });
      followAlong.offer({ resource: table, kind: 'ready', runId });
      callTool({
        runId,
        toolName: 'ap_delete_table',
        input: { tableId: 't1' },
      });
      const state = useFollowAlong.getState();
      expect(state.target).toBeNull();
      expect(state.offer).toBeNull();
    });

    it('deleting another resource keeps the offer and the target', () => {
      const runId = uid('run');
      callTool({ runId, ...insertRows('t1') });
      followAlong.offer({ resource: table, kind: 'ready', runId });
      callTool({
        runId,
        toolName: 'ap_delete_table',
        input: { tableId: 't9' },
      });
      const state = useFollowAlong.getState();
      expect(state.target).toMatchObject(table);
      expect(state.offer?.resource).toMatchObject(table);
    });
  });

  describe('flash', () => {
    it('lights keys for 2.4 s and keeps a newer flash of the same key', () => {
      followAlong.flash(['a', 'b']);
      vi.advanceTimersByTime(1000);
      followAlong.flash(['b']);
      expect(Object.keys(useFollowAlong.getState().flashes)).toEqual([
        'a',
        'b',
      ]);
      vi.advanceTimersByTime(1400);
      expect(Object.keys(useFollowAlong.getState().flashes)).toEqual(['b']);
      vi.advanceTimersByTime(1000);
      expect(useFollowAlong.getState().flashes).toEqual({});
    });
  });
});
