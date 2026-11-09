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
const api = vi.hoisted(() => ({
  getConversation: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/app/components/app-shell', () => ({
  useShellHandle: () => ({ shell: 'project' }),
}));

vi.mock('@/app/routes/chat-with-ai/ai-chat-box', () => ({
  AIChatBox: ({ autoFocusComposer }: { autoFocusComposer?: boolean }) => {
    React.useEffect(() => {
      mounts.chatBox += 1;
    }, []);
    return <textarea aria-label="Message" autoFocus={autoFocusComposer} />;
  },
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

  it('labels the history toggle Hide history and marks it pressed while open', () => {
    getConversation.mockResolvedValue(conversation({ title: 'Old title' }));
    renderChrome();
    const toggle = screen.getByRole('button', { name: 'History' });

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Hide history' })).toBe(toggle);
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
});

function historyList() {
  return screen.queryByRole('navigation', { name: 'Chat history' });
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
type MenuMock = {
  trigger: React.RefObject<HTMLSpanElement | null>;
  closeFocus: React.RefObject<CloseFocus | undefined>;
};
