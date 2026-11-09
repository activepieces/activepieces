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
import { chatDom } from '@/features/chat/lib/chat-dom';
import { useFollowAlong } from '@/features/chat/lib/follow/follow-along';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

const mounts = vi.hoisted(() => ({ chatBox: 0 }));
const toastError = vi.hoisted(() => vi.fn());
const removeWithUndo = vi.hoisted(() => vi.fn());
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
  AIChatBox: ({ autoFocusComposer }: { autoFocusComposer?: boolean }) => {
    React.useEffect(() => {
      mounts.chatBox += 1;
    }, []);
    return <textarea aria-label="Message" autoFocus={autoFocusComposer} />;
  },
}));

vi.mock('@/app/components/settings-hub/settings-hub-dialog', () => ({
  SettingsHubDialog: () => null,
}));

vi.mock('@/features/chat/lib/chat-pending-deletes', () => ({
  chatPendingDeletes: { removeWithUndo },
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({ children, className }: MotionMock) => (
      <div className={className}>{children}</div>
    ),
    h2: ({ children, className, title }: MotionMock) => (
      <h2 className={className} title={title}>
        {children}
      </h2>
    ),
  },
  useReducedMotion: () => true,
}));

vi.mock('@/app/routes/chat-with-ai/conversation-list', () => ({
  ConversationList: () => <nav aria-label="Chat history" />,
}));

vi.mock('@/components/ui/dropdown-menu', async () => {
  const { createContext, useContext, useRef } = await import('react');
  const Menu = createContext<MenuMock | null>(null);
  const RadioGroup = createContext<((value: string) => void) | undefined>(
    undefined,
  );
  const Passthrough = ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  );
  const useSelect = (onSelect?: () => void) => {
    const menu = useContext(Menu);
    return () => {
      onSelect?.();
      setTimeout(() => {
        const event = new Event('focusout', { cancelable: true });
        menu?.closeFocus.current?.(event);
        if (!event.defaultPrevented) {
          menu?.trigger.current?.querySelector('button')?.focus();
        }
      }, 0);
    };
  };
  return {
    DropdownMenu: ({ children }: React.PropsWithChildren) => {
      const trigger = useRef<HTMLSpanElement>(null);
      const closeFocus = useRef<CloseFocus | undefined>(undefined);
      return (
        <Menu.Provider value={{ trigger, closeFocus }}>
          {children}
        </Menu.Provider>
      );
    },
    DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
      <span ref={useContext(Menu)?.trigger}>{children}</span>
    ),
    DropdownMenuContent: ({
      children,
      onCloseAutoFocus,
    }: React.PropsWithChildren<{ onCloseAutoFocus?: CloseFocus }>) => {
      const menu = useContext(Menu);
      if (menu) menu.closeFocus.current = onCloseAutoFocus;
      return <>{children}</>;
    },
    DropdownMenuRadioGroup: ({
      children,
      onValueChange,
    }: React.PropsWithChildren<{
      onValueChange?: (value: string) => void;
    }>) => (
      <RadioGroup.Provider value={onValueChange}>
        {children}
      </RadioGroup.Provider>
    ),
    DropdownMenuRadioItem: ({
      children,
      value,
    }: React.PropsWithChildren<{ value: string }>) => {
      const onValueChange = useContext(RadioGroup);
      const select = useSelect(() => onValueChange?.(value));
      return (
        <button type="button" role="menuitemradio" onClick={select}>
          {children}
        </button>
      );
    },
    DropdownMenuCheckboxItem: Passthrough,
    DropdownMenuSeparator: () => null,
    DropdownMenuItem: ({
      children,
      onSelect,
    }: React.PropsWithChildren<{ onSelect?: () => void }>) => {
      const select = useSelect(onSelect);
      return (
        <button type="button" onClick={select}>
          {children}
        </button>
      );
    },
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
    removeWithUndo.mockReset();
    useChatPanel.setState({
      open: true,
      mode: 'left',
      conversationId: 'c1',
      newChatToken: 0,
    });
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

  it('keeps the title field focused after Rename is picked from the menu', async () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    await screen.findByText('Old title');

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const input = await screen.findByRole('textbox', { name: 'Chat title' });

    await waitFor(() => expect(document.activeElement).toBe(input));
    expect(updateConversation).not.toHaveBeenCalled();
  });

  it('does not put focus back on the layout button after a layout is picked', async () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    const layoutButton = screen.getByRole('button', { name: 'Chat layout' });
    const right = screen.getByRole('menuitemradio', { name: 'On the right' });
    right.focus();

    fireEvent.click(right);
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));

    expect(document.activeElement).not.toBe(layoutButton);
  });

  it('offers Stop following only while Follow along is on and following', async () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    useFollowAlong.setState({ phase: 'editing', following: true });
    act(() => useChatPanel.getState().setAutoFollow(false));
    renderChrome();
    await screen.findByText('Old title');

    expect(screen.queryByRole('button', { name: 'Stop following' })).toBeNull();

    act(() => useChatPanel.getState().setAutoFollow(true));

    expect(screen.getByRole('button', { name: 'Stop following' })).toBeTruthy();
    act(() => useFollowAlong.setState({ phase: 'idle', following: true }));
  });

  it('labels the history toggle Hide history and marks it pressed while open', () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    const toggle = screen.getByRole('button', { name: 'History' });

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Hide history' })).toBe(toggle);
  });

  it('closes History, not the chat, on Escape', () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    const toggle = screen.getByRole('button', { name: 'History' });
    fireEvent.click(toggle);
    toggle.focus();
    const panelMayClose: boolean[] = [];
    const onWindowKey = (event: KeyboardEvent) =>
      panelMayClose.push(chatDom.escapeFree(event));
    window.addEventListener('keydown', onWindowKey);

    fireEvent.keyDown(toggle, { key: 'Escape' });
    window.removeEventListener('keydown', onWindowKey);

    expect(historyList()).toBeNull();
    expect(panelMayClose).toEqual([false]);
  });

  it('shows the chat, not History, when the chat opens again', () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(historyList()).not.toBeNull();

    act(() => useChatPanel.getState().setOpen(false));
    act(() => useChatPanel.getState().setOpen(true));

    expect(historyList()).toBeNull();
  });

  it('starts a fresh chat box for a new chat', async () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    expect(mounts.chatBox).toBe(1);

    act(() => useChatPanel.getState().newChat());

    await waitFor(() => expect(mounts.chatBox).toBe(2));
  });

  it('keeps each renamed title when moving between chats', async () => {
    getConversation.mockImplementation((id: string) =>
      Promise.resolve(conversation({ id, title: `Old ${id}` })),
    );
    updateConversation.mockImplementation(
      (id: string, request: { title: string }) =>
        Promise.resolve(conversation({ id, title: request.title })),
    );
    renderChrome();
    await screen.findByText('Old c1');
    await rename('First');
    await screen.findByText('First');

    act(() => useChatPanel.getState().showConversation('c2'));
    await screen.findByText('Old c2');
    await rename('Second');
    await screen.findByText('Second');

    act(() => useChatPanel.getState().showConversation('c1'));

    expect(await screen.findByText('First')).toBeTruthy();
  });

  it('puts focus in the new composer after New chat', async () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    const oldComposer = screen.getByRole('textbox', { name: 'Message' });
    oldComposer.focus();

    fireEvent.click(screen.getByRole('button', { name: 'New chat' }));

    await waitFor(() => expect(mounts.chatBox).toBe(2));
    const composer = screen.getByRole('textbox', { name: 'Message' });
    expect(composer).not.toBe(oldComposer);
    expect(document.activeElement).toBe(composer);
  });
});

function historyList() {
  return screen.queryByRole('navigation', { name: 'Chat history' });
}

async function rename(title: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
  const input = await screen.findByRole('textbox', { name: 'Chat title' });
  fireEvent.change(input, { target: { value: title } });
  fireEvent.blur(input);
}

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

type CloseFocus = (event: Event) => void;
type MotionMock = React.PropsWithChildren<{
  className?: string;
  title?: string;
}>;
type MenuMock = {
  trigger: React.RefObject<HTMLSpanElement | null>;
  closeFocus: React.RefObject<CloseFocus | undefined>;
};
