import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  RunContext,
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';

const chat = vi.hoisted(() => ({ conversationId: 'c1', announce: vi.fn() }));

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    key.replace('{name}', values?.name ?? ''),
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'p1' },
}));
vi.mock('@/features/workspace/lib/chat-panel-open', () => ({
  useChatPanel: { getState: () => chat },
}));

const INITIAL = useFollowAlong.getState();

function edit({
  runId,
  id,
  label = 'Leads',
}: {
  runId: string;
  id: string;
  label?: string;
}): void {
  const ctx: RunContext = { conversationId: 'c1', runId, attach: 'sent' };
  followAlong.onChunks({
    chunks: [
      {
        type: 'tool-output-available',
        output: {
          _meta: {
            apResource: {
              v: 1,
              kind: 'table',
              id,
              projectId: 'p1',
              op: 'update',
              label,
            },
          },
        },
      },
    ],
    ctx,
  });
}

describe('follow-along session', () => {
  beforeEach(() => {
    chat.announce.mockClear();
    useFollowAlong.setState(INITIAL, true);
  });

  it('announces when editing starts and when the chat moves to another resource', () => {
    edit({ runId: 'r1', id: 't1' });
    edit({ runId: 'r1', id: 't1' });
    edit({ runId: 'r1', id: 't1', label: 'Leads 2' });
    edit({ runId: 'r1', id: 't2', label: 'Deals' });

    expect(chat.announce.mock.calls).toEqual([
      ['The AI is changing Leads.'],
      ['The AI is changing Deals.'],
    ]);
  });

  it('announces again when a new session starts on the same resource', () => {
    edit({ runId: 'r1', id: 't1' });
    followAlong.endRun({ conversationId: 'c1', runId: 'r1' });
    edit({ runId: 'r2', id: 't1' });

    expect(chat.announce).toHaveBeenCalledTimes(2);
  });

  it('pushes history once per run and forgets runs when a new session starts', () => {
    edit({ runId: 'r1', id: 't1' });
    expect(followAlong.claimHistoryPush('r1')).toBe(true);
    expect(followAlong.claimHistoryPush('r1')).toBe(false);
    expect(followAlong.claimHistoryPush(null)).toBe(true);

    followAlong.endRun({ conversationId: 'c1', runId: 'r1' });
    edit({ runId: 'r2', id: 't1' });
    expect(followAlong.claimHistoryPush('r1')).toBe(true);
  });
});
