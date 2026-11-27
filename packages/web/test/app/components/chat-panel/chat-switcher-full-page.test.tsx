// @vitest-environment jsdom
import { AgentConversation, AgentRunSource } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatSwitcher } from '@/app/components/chat-panel/chat-switcher';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatQueryKeys } from '@/features/chat/lib/chat-query-keys';

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string) => key,
}));

vi.mock('@/app/components/settings-hub/settings-hub-dialog', () => ({
  SettingsHubDialog: () => null,
}));

vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: {
    listConversations: vi.fn().mockResolvedValue({ data: [], next: null }),
    updateConversation: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  ),
  DropdownMenuSeparator: () => null,
  DropdownMenuContent: ({
    children,
    onCloseAutoFocus,
  }: React.PropsWithChildren<{
    onCloseAutoFocus?: (event: { preventDefault: () => void }) => void;
  }>) => (
    <div role="menu">
      {children}
      <button
        type="button"
        onClick={() => onCloseAutoFocus?.({ preventDefault: () => undefined })}
      >
        close menu
      </button>
    </div>
  ),
  DropdownMenuItem: ({
    children,
    onSelect,
  }: React.PropsWithChildren<{ onSelect?: () => void }>) => (
    <button type="button" role="menuitem" onClick={() => onSelect?.()}>
      {children}
    </button>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('ChatSwitcher on the full page', () => {
  it('moves focus to Chat actions after a rename ends with Enter', async () => {
    renderFullPage();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    fireEvent.click(screen.getByRole('button', { name: 'close menu' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Chat title' }), {
      key: 'Enter',
    });

    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Chat actions' }),
      ),
    );
  });

  it('does not save a title that Escape canceled', async () => {
    renderFullPage();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    fireEvent.click(screen.getByRole('button', { name: 'close menu' }));
    const input = screen.getByRole('textbox', { name: 'Chat title' });
    input.focus();
    input.textContent = 'Canceled title';
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Chat actions' }),
      ),
    );
    expect(chatApi.updateConversation).not.toHaveBeenCalled();
  });
});

function renderFullPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(
    chatQueryKeys.conversation('c1'),
    AgentConversation.parse({
      id: 'c1',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      platformId: 'platform-1',
      userId: 'user-1',
      source: AgentRunSource.CHAT,
      title: 'Order lookup',
    }),
  );
  render(
    <QueryClientProvider client={queryClient}>
      <ChatSwitcher
        conversationId="c1"
        layout="full"
        typing={false}
        open={false}
        openedBy="pointer"
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        onShowAll={vi.fn()}
        onTitleEdited={vi.fn()}
      />
    </QueryClientProvider>,
  );
}
