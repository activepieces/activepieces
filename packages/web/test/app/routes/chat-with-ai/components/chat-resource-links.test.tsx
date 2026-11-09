// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { memo } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatResourceLinks } from '@/app/routes/chat-with-ai/components/chat-app-links';
import {
  AppLinkHandlers,
  AppLinkProvider,
  useAppLinks,
} from '@/components/prompt-kit/app-link';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';

vi.mock('i18next', () => ({ t: (key: string) => key }));

describe('ChatResourceLinks', () => {
  afterEach(cleanup);

  it('keeps the link names stable while a reply streams', () => {
    const seen: Array<AppLinkHandlers | null> = [];
    const tool = toolMessage({ id: 't1', label: 'Leads' });
    const { rerender } = render(
      links({ messages: [tool, textMessage('Hel')], seen }),
    );

    rerender(links({ messages: [tool, textMessage('Hello')], seen }));
    rerender(links({ messages: [tool, textMessage('Hello th')], seen }));

    expect(new Set(seen).size).toBe(1);
    expect(seen[0]?.label('/projects/p1/tables/t1')).toBe('Leads');
  });

  it('names a resource once its tool finishes', () => {
    const seen: Array<AppLinkHandlers | null> = [];
    const { rerender } = render(links({ messages: [], seen }));

    rerender(
      links({ messages: [toolMessage({ id: 't1', label: 'Leads' })], seen }),
    );

    expect(seen.at(-1)?.label('/projects/p1/tables/t1')).toBe('Leads');
  });
});

const Probe = memo(function Probe({
  seen,
}: {
  seen: Array<AppLinkHandlers | null>;
}) {
  seen.push(useAppLinks());
  return null;
});

function links({
  messages,
  seen,
}: {
  messages: ChatUIMessage[];
  seen: Array<AppLinkHandlers | null>;
}) {
  return (
    <AppLinkProvider value={OUTER}>
      <ChatResourceLinks messages={messages}>
        <Probe seen={seen} />
      </ChatResourceLinks>
    </AppLinkProvider>
  );
}

function textMessage(text: string): ChatUIMessage {
  return { id: 'm-text', role: 'assistant', parts: [{ type: 'text', text }] };
}

function toolMessage({ id, label }: { id: string; label: string }) {
  const message: ChatUIMessage = {
    id: `m-${id}`,
    role: 'assistant',
    parts: [
      {
        type: 'tool-ap_update_resource',
        toolCallId: `call-${id}`,
        state: 'output-available',
        input: {},
        output: {
          content: [{ type: 'text', text: 'done' }],
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
  };
  return message;
}

const OUTER: AppLinkHandlers = {
  open: () => true,
  label: (route) => route,
};
