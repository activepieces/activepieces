/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import * as React from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatChrome } from '@/app/components/chat-panel/chat-chrome';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

const mounts = vi.hoisted(() => ({ chatBox: 0 }));
const toastError = vi.hoisted(() => vi.fn());
const api = vi.hoisted(() => ({
  getConversation: vi.fn(),
  updateConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('sonner', () => ({ toast: { error: toastError } }));

vi.mock('@/app/components/app-shell', () => ({
  useShellHandle: () => ({ shell: 'project' }),
}));

vi.mock('@/app/components/chat-panel/follow-along-controller', () => ({
  FollowAlongController: () => null,
}));

vi.mock('@/app/routes/chat-with-ai/ai-chat-box', () => ({
  AIChatBox: () => {
    React.useEffect(() => {
      mounts.chatBox += 1;
    }, []);
    return null;
  },
}));

vi.mock('@/app/routes/chat-with-ai/conversation-list', () => ({
  ConversationList: () => <nav aria-label="Chat history" />,
}));

vi.mock('@/components/ui/dropdown-menu', () => {
  const Passthrough = ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  );
  return {
    DropdownMenu: Passthrough,
    DropdownMenuTrigger: Passthrough,
    DropdownMenuContent: Passthrough,
    DropdownMenuRadioGroup: Passthrough,
    DropdownMenuRadioItem: Passthrough,
    DropdownMenuCheckboxItem: Passthrough,
    DropdownMenuSeparator: () => null,
    DropdownMenuItem: ({
      children,
      onSelect,
    }: React.PropsWithChildren<{ onSelect?: () => void }>) => (
      <button type="button" onClick={onSelect}>
        {children}
      </button>
    ),
  };
});

vi.mock('@/features/chat/lib/chat-api', () => ({ chatApi: api }));

const getConversation = api.getConversation;
const updateConversation = api.updateConversation;

describe('ChatChrome', () => {
  beforeEach(() => {
    window.innerWidth = 1280;
    mounts.chatBox = 0;
    toastError.mockReset();
    getConversation.mockReset();
    updateConversation.mockReset();
    useChatPanel.setState({ open: true, mode: 'left', conversationId: 'c1' });
  });

  afterEach(cleanup);

  it('shows a placeholder, not "New chat", while an existing chat loads', () => {
    getConversation.mockReturnValue(new Promise(() => undefined));
    renderChrome();

    expect(screen.queryByText('New chat')).toBeNull();
  });

  it('puts the old title back and says so when a rename fails', async () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    updateConversation.mockRejectedValue(new Error('offline'));
    renderChrome();
    await screen.findByText('Old title');

    await rename('New title');

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Failed to rename conversation'),
    );
    expect(screen.getByText('Old title')).toBeTruthy();
  });

  it('keeps one label on the history toggle and marks it pressed', () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    const toggle = screen.getByRole('button', { name: 'History' });

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'History' })).toBe(toggle);
  });

  it('starts a fresh chat box for a new chat', async () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    expect(mounts.chatBox).toBe(1);

    act(() => useChatPanel.getState().newChat());

    await waitFor(() => expect(mounts.chatBox).toBe(2));
  });
});

async function rename(title: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
  const input = await screen.findByRole('textbox', { name: 'Chat title' });
  fireEvent.change(input, { target: { value: title } });
  fireEvent.blur(input);
}

function conversation({ title }: { title: string }) {
  return {
    id: 'c1',
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
          [{ path: '/projects/:projectId/automations', element: <ChatChrome /> }],
          { initialEntries: ['/projects/p1/automations'] },
        )}
      />
    </QueryClientProvider>,
  );
}
