/**
 * @vitest-environment jsdom
 */
import { SubagentActivity } from '@activepieces/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SubagentGroup } from '@/app/routes/chat-with-ai/components/subagent-card';
import { TaskRow } from '@/app/routes/chat-with-ai/lib/message-blocks';
import { ChatStoreProvider } from '@/features/chat/lib/chat-store-context';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: {
    usePieceSummary: () => ({ summary: undefined }),
  },
}));

afterEach(() => {
  cleanup();
});

describe('SubagentGroup', () => {
  it('puts the task that needs you first', () => {
    render(
      <ChatStoreProvider>
        <SubagentGroup
          tasks={[
            task({ id: 'tc-1', title: 'Northwind pricing', status: 'done' }),
            task({ id: 'tc-2', title: 'Contoso pricing', status: 'blocked' }),
          ]}
          toolCallMeta={{}}
          isStreaming={false}
        />
      </ChatStoreProvider>,
    );

    const needsYou = screen.getByText('Contoso pricing');
    const done = screen.getByText('Northwind pricing');
    expect(
      needsYou.compareDocumentPosition(done) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

function task({
  id,
  title,
  status,
}: {
  id: string;
  title: string;
  status: SubagentActivity['status'];
}): TaskRow {
  const activity: SubagentActivity = {
    title,
    status,
    stepCount: 1,
    startedAt: '2026-11-08T10:00:00.000Z',
    durationMs: 41_000,
  };
  return {
    toolCallId: id,
    part: {
      type: 'dynamic-tool',
      toolName: 'ap_run_subagents',
      toolCallId: id,
      state: 'output-available',
      input: {},
      output: { activity },
    },
    output: { activity },
    subject: title,
  };
}
