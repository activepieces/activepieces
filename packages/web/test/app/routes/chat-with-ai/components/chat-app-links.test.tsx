// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { memo } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatResourceLinks,
  chatAppLinkUtils,
} from '@/app/routes/chat-with-ai/components/chat-app-links';
import {
  AppLinkHandlers,
  AppLinkProvider,
  useAppLinks,
} from '@/components/prompt-kit/app-link';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';

vi.mock('i18next', () => ({ t: (key: string) => key }));

function toolMessage({
  kind,
  id,
  label,
}: {
  kind: 'flow' | 'table';
  id: string;
  label: string;
}): ChatUIMessage {
  return {
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
              kind,
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
}

describe('chatAppLinkUtils.label', () => {
  it('names a single resource page by its kind', () => {
    expect(chatAppLinkUtils.label('/projects/p1/flows/f1?step=2#x')).toBe(
      'Flow',
    );
    expect(chatAppLinkUtils.label('/projects/p1/tables/t1')).toBe('Table');
  });

  it('names list pages', () => {
    expect(chatAppLinkUtils.label('/projects/p1/runs')).toBe('Runs');
    expect(chatAppLinkUtils.label('/projects/p1/automations')).toBe(
      'Automations',
    );
  });

  it('names platform pages', () => {
    expect(chatAppLinkUtils.label('/platform/users')).toBe('Users');
    expect(chatAppLinkUtils.label('/platform/ai/usage?x=1')).toBe('AI');
  });

  it('never shows a raw path for pages it does not know', () => {
    expect(chatAppLinkUtils.label('/platform/setup?tab=1')).toBe(
      'Platform Admin',
    );
    expect(chatAppLinkUtils.label('/projects/p1/unknown/x')).toBe('Open page');
  });
});

describe('chatAppLinkUtils.resourceName', () => {
  const resources = chatAppLinkUtils.resourcesIn([
    toolMessage({ kind: 'table', id: 't1', label: 'Leads' }),
    toolMessage({ kind: 'flow', id: 'f1', label: 'Send welcome email' }),
  ]);

  it('uses the name the chat gave the resource', () => {
    expect(
      chatAppLinkUtils.resourceName({
        route: '/projects/p1/flows/f1?step=2',
        resources,
      }),
    ).toBe('Send welcome email');
    expect(
      chatAppLinkUtils.resourceName({
        route: '/projects/p1/tables/t1',
        resources,
      }),
    ).toBe('Leads');
  });

  it('returns null for resources the chat never touched', () => {
    expect(
      chatAppLinkUtils.resourceName({
        route: '/projects/p1/flows/other',
        resources,
      }),
    ).toBeNull();
    expect(
      chatAppLinkUtils.resourceName({
        route: '/projects/p2/flows/f1',
        resources,
      }),
    ).toBeNull();
  });
});

describe('ChatResourceLinks', () => {
  afterEach(cleanup);

  it('keeps the link names stable while a reply streams', () => {
    const seen: Array<AppLinkHandlers | null> = [];
    const tool = toolMessage({ kind: 'table', id: 't1', label: 'Leads' });
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

    const tool = toolMessage({ kind: 'table', id: 't1', label: 'Leads' });
    rerender(links({ messages: [tool], seen }));

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


const OUTER: AppLinkHandlers = {
  open: () => true,
  label: (route) => route,
};
