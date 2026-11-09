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

vi.mock('@/lib/shell-handle', () => ({
  useShellHandle: () => ({ shell: 'project' }),
  CHAT_ALLOWED: { project: true, builder: true, platform: false },
}));

vi.mock('@/features/workspace/lib/use-chat-on', () => ({
  useChatEnabled: () => true,
  useChatOn: () => true,
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

vi.mock('@/features/chat/lib/chat-pending-deletes', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/features/chat/lib/chat-pending-deletes')
  >();
  return { ...actual, chatPendingDeletes: { removeWithUndo } };
});

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

vi.mock('@/app/components/chat-panel/chat-history-list', () => ({
  ChatHistoryList: () => <nav aria-label="Chat history" />,
}));

vi.mock('@/components/ui/dropdown-menu', async () => {
  const { createContext, useContext, useRef } = await import('react');
  const Menu = createContext<MenuMock | null>(null);
  const RadioGroup = createContext<((value: string) => void) | undefined>(
    undefined,
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

  it('starts a fresh chat box for a new chat', async () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    expect(mounts.chatBox).toBe(1);

    act(() => useChatPanel.getState().newChat());

    await waitFor(() => expect(mounts.chatBox).toBe(2));
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
