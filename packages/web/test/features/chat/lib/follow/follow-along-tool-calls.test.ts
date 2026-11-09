// @vitest-environment jsdom
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
  RunContext,
  followAlong,
} from '@/features/chat/lib/follow/follow-along';

const CTX: RunContext = { conversationId: 'c1', runId: 'r1', attach: 'sent' };
const TABLE = { kind: 'table', id: 't1' };

describe('follow-along tool calls', () => {
  beforeEach(() => followAlong.reset());

  it('forgets a call whose output names no resource', () => {
    send([
      started('call-1'),
      { type: 'tool-output-available', toolCallId: 'call-1', output: 'ok' },
      editedTable('call-1'),
    ]);

    expect(
      followAlong.takeUnseen({ resource: TABLE, key: 'flow-step:trigger' }),
    ).toBe(false);
  });

  it('forgets a call that failed', () => {
    send([
      started('call-2'),
      { type: 'tool-output-error', toolCallId: 'call-2', errorText: 'boom' },
      editedTable('call-2'),
    ]);

    expect(
      followAlong.takeUnseen({ resource: TABLE, key: 'flow-step:trigger' }),
    ).toBe(false);
  });

  it('still remembers what a finished call changed', () => {
    send([started('call-3'), editedTable('call-3')]);

    expect(
      followAlong.takeUnseen({ resource: TABLE, key: 'flow-step:trigger' }),
    ).toBe(true);
  });
});

function send(chunks: unknown[]) {
  followAlong.onChunks({ chunks, ctx: CTX });
}

function started(toolCallId: string) {
  return {
    type: 'tool-input-available',
    toolCallId,
    toolName: 'ap_update_trigger',
    input: {},
  };
}

function editedTable(toolCallId: string) {
  return {
    type: 'tool-output-available',
    toolCallId,
    output: {
      content: [{ type: 'text', text: 'done' }],
      _meta: {
        apResource: {
          v: 1,
          kind: 'table',
          id: 't1',
          projectId: 'p1',
          op: 'update',
          label: 'Leads',
        },
      },
    },
  };
}
