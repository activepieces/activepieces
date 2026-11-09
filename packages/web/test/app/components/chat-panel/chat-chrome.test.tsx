/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatChrome } from '@/app/components/chat-panel/chat-chrome';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

const mounts = vi.hoisted(() => ({ chatBox: 0 }));
const api = vi.hoisted(() => ({
  getConversation: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/app/routes/chat-with-ai/ai-chat-box', () => ({
  AIChatBox: ({ autoFocusComposer }: { autoFocusComposer?: boolean }) => {
    React.useEffect(() => {
      mounts.chatBox += 1;
    }, []);
    return <textarea aria-label="Message" autoFocus={autoFocusComposer} />;
  },
}));

vi.mock('@/features/chat/lib/chat-api', () => ({ chatApi: api }));

const getConversation = api.getConversation;

describe('ChatChrome', () => {
  beforeEach(() => {
    window.innerWidth = 1280;
    mounts.chatBox = 0;
    getConversation.mockReset();
    useChatPanel.setState({
      open: true,
      mode: 'left',
      conversationId: 'c1',
      newChatToken: 0,
    });
  });

  afterEach(cleanup);

  it('starts a fresh chat box for a new chat', async () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    expect(mounts.chatBox).toBe(1);

    act(() => useChatPanel.getState().newChat());

    await waitFor(() => expect(mounts.chatBox).toBe(2));
  });
});

function conversation({ id = 'c1', title }: { id?: string; title: string }) {
  return {
    id,
    created: '',
    updated: '',
    title,
    projectId: 'p1',
    userId: 'u1',
    platformId: 'pl1',
  };
}

function renderChrome() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider
        router={createMemoryRouter(
          [
            {
              path: '/projects/:projectId/automations',
              element: (
                <aside id={chatLayoutUtils.PANEL_ID}>
                  <ChatChrome />
                </aside>
              ),
            },
          ],
          { initialEntries: ['/projects/p1/automations'] },
        )}
      />
    </QueryClientProvider>,
  );
}
