import { describe, expect, it, vi } from 'vitest';

import { ChatUIMessage } from '@/features/chat/lib/chat-types';
import { changeSummary } from '@/features/chat/lib/resources/change-summary';

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getProjectId: () => 'p1',
    appendProjectRoutePrefix: (path: string) => `/projects/p1${path}`,
  },
}));

describe('changeSummary.fromParts', () => {
  it('reads changes only from the tool result meta', () => {
    const changes = changeSummary.fromParts([
      toolPart({ id: 'c1', output: { content: [text('Updated Leads')] } }),
      toolPart({ id: 'c2', output: tagged({ kind: 'table', op: 'update' }) }),
      { type: 'text', text: 'Updated the Leads table.' },
    ]);
    expect(changes).toEqual([
      {
        key: 'table:t1',
        ref: { kind: 'table', id: 't1', projectId: 'p1', name: 'Leads' },
        kind: 'updated',
      },
    ]);
  });

  it('keeps one change per resource with the latest name', () => {
    const changes = changeSummary.fromParts([
      toolPart({ id: 'c1', output: tagged({ kind: 'flow', op: 'create' }) }),
      toolPart({
        id: 'c2',
        output: tagged({ kind: 'flow', op: 'update', label: 'Daily report' }),
      }),
      toolPart({ id: 'c3', output: tagged({ kind: 'table', op: 'update' }) }),
    ]);
    expect(
      changes.map(({ key, kind, ref }) => ({ key, kind, name: ref.name }))
    ).toEqual([
      { key: 'flow:t1', kind: 'created', name: 'Daily report' },
      { key: 'table:t1', kind: 'updated', name: 'Leads' },
    ]);
  });

  it('drops a resource created and deleted in the same reply', () => {
    expect(
      changeSummary.fromParts([
        toolPart({ id: 'c1', output: tagged({ kind: 'flow', op: 'create' }) }),
        toolPart({ id: 'c2', output: tagged({ kind: 'flow', op: 'delete' }) }),
      ])
    ).toEqual([]);
  });

  it('marks an existing resource as deleted', () => {
    const [change] = changeSummary.fromParts([
      toolPart({ id: 'c1', output: tagged({ kind: 'table', op: 'update' }) }),
      toolPart({ id: 'c2', output: tagged({ kind: 'table', op: 'delete' }) }),
    ]);
    expect(change.kind).toBe('deleted');
  });

  it('ignores calls without an output', () => {
    expect(
      changeSummary.fromParts([
        {
          type: 'tool-ap_update_record',
          toolCallId: 'c1',
          state: 'output-error',
          input: {},
          errorText: 'Failed',
        },
        {
          type: 'tool-ap_update_record',
          toolCallId: 'c2',
          state: 'input-available',
          input: {},
        },
      ])
    ).toEqual([]);
  });
});

describe('changeSummary.fromMessages', () => {
  it('collects changes from every reply in order', () => {
    const messages: ChatUIMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          toolPart({
            id: 'c1',
            output: tagged({ kind: 'table', op: 'update' }),
          }),
        ],
      },
      {
        id: 'a2',
        role: 'assistant',
        parts: [
          toolPart({
            id: 'c2',
            output: tagged({ kind: 'flow', op: 'update' }),
          }),
        ],
      },
    ];
    expect(
      changeSummary.fromMessages(messages).map((change) => change.key)
    ).toEqual(['table:t1', 'flow:t1']);
  });
});

function toolPart({
  id,
  output,
}: {
  id: string;
  output: unknown;
}): ChatUIMessage['parts'][number] {
  return {
    type: 'tool-ap_tool',
    toolCallId: id,
    state: 'output-available',
    input: {},
    output,
  };
}

function tagged({
  kind,
  op,
  label = kind === 'table' ? 'Leads' : 'Flow',
}: {
  kind: 'flow' | 'table';
  op: 'create' | 'update' | 'delete';
  label?: string;
}) {
  return {
    content: [text('done')],
    _meta: {
      apResource: { v: 1, kind, id: 't1', projectId: 'p1', op, label },
    },
  };
}

function text(value: string) {
  return { type: 'text', text: value };
}
