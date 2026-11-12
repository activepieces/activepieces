// @vitest-environment jsdom
import { AgentConversation, AgentRunSource } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatHistoryList } from '@/app/components/chat-panel/chat-history-list';

const mocks = vi.hoisted(() => ({
  removeWithUndo: vi.fn(),
  listConversations: vi.fn(),
  updateConversation: vi.fn(),
  waitingIds: new Set<string>(),
}));

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string) => key,
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

vi.mock('@/features/chat/lib/use-conversation-indicators', () => ({
  useConversationIndicators: () => ({
    getIndicator: (conversation: { id: string }) =>
      mocks.waitingIds.has(conversation.id) ? 'waiting' : 'unread',
    markRead: vi.fn(),
  }),
}));

vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: {
    listConversations: mocks.listConversations,
    updateConversation: mocks.updateConversation,
  },
}));

vi.mock('@/features/chat/lib/chat-pending-deletes', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/features/chat/lib/chat-pending-deletes')
  >();
  return {
    ...actual,
    chatPendingDeletes: { removeWithUndo: mocks.removeWithUndo },
  };
});

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
    <div role="menu">{children}</div>
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

const NOW = new Date();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.waitingIds.clear();
});

describe('ChatHistoryList', () => {
  it('groups chats under plain labels that do not collapse', async () => {
    listReturns([
      conversation({ id: 'a', title: 'Today chat', daysAgo: 0 }),
      conversation({ id: 'b', title: 'Yesterday chat', daysAgo: 1 }),
      conversation({ id: 'c', title: 'Week chat', daysAgo: 3 }),
      conversation({ id: 'd', title: 'Old chat', daysAgo: 30 }),
    ]);
    renderList();

    await screen.findByText('Today chat');

    expect(
      screen.getAllByRole('heading').map((heading) => heading.textContent),
    ).toEqual(['Today', 'Yesterday', 'Previous 7 days', 'Older']);
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
    expect(
      within(screen.getByRole('region', { name: 'Previous 7 days' })).getByText(
        'Week chat',
      ),
    ).toBeTruthy();
  });

  it('marks only the current chat as selected', async () => {
    listReturns([
      conversation({ id: 'a', title: 'First' }),
      conversation({ id: 'b', title: 'Second' }),
    ]);
    renderList({ selectedId: 'b' });

    const second = (await screen.findByText('Second')).closest('button');
    const first = screen.getByText('First').closest('button');

    expect(second?.getAttribute('aria-current')).toBe('true');
    expect(first?.getAttribute('aria-current')).toBeNull();
  });

  it('opens a chat when its row is clicked', async () => {
    listReturns([conversation({ id: 'a', title: 'First' })]);
    const { onSelect } = renderList();

    fireEvent.click(await screen.findByText('First'));

    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('gives each row one actions menu with Rename and Delete, and no trash icon', async () => {
    listReturns([
      conversation({ id: 'a', title: 'First' }),
      conversation({ id: 'b', title: 'Second' }),
    ]);
    renderList();
    await screen.findByText('First');

    expect(screen.getAllByRole('button', { name: 'Chat actions' })).toHaveLength(
      2,
    );
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    const [menu] = screen.getAllByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Rename', 'Delete']);
  });

  it('deletes with undo and starts a new chat when the current one goes', async () => {
    listReturns([conversation({ id: 'a', title: 'First' })]);
    const { onCurrentDeleted } = renderList({ selectedId: 'a' });
    await screen.findByText('First');

    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(mocks.removeWithUndo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a' }),
    );
    expect(onCurrentDeleted).toHaveBeenCalled();
  });

  it('keeps the current chat when another one is deleted', async () => {
    listReturns([
      conversation({ id: 'a', title: 'First' }),
      conversation({ id: 'b', title: 'Second' }),
    ]);
    const { onCurrentDeleted } = renderList({ selectedId: 'a' });
    await screen.findByText('Second');

    const [, secondDelete] = screen.getAllByRole('menuitem', {
      name: 'Delete',
    });
    fireEvent.click(secondDelete);

    expect(mocks.removeWithUndo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'b' }),
    );
    expect(onCurrentDeleted).not.toHaveBeenCalled();
  });

  it('renames a chat in place', async () => {
    listReturns([conversation({ id: 'a', title: 'First' })]);
    mocks.updateConversation.mockResolvedValue(
      conversation({ id: 'a', title: 'Renamed' }),
    );
    renderList();
    await screen.findByText('First');

    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    const input = screen.getByRole('textbox', { name: 'Chat title' });
    input.textContent = 'Renamed';
    listReturns([conversation({ id: 'a', title: 'Renamed' })]);
    fireEvent.blur(input);

    await waitFor(() =>
      expect(mocks.updateConversation).toHaveBeenCalledWith('a', {
        title: 'Renamed',
      }),
    );
    expect(await screen.findByText('Renamed')).toBeTruthy();
  });

  it('cancels a rename on Escape', async () => {
    listReturns([conversation({ id: 'a', title: 'First' })]);
    renderList();
    await screen.findByText('First');

    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    const input = screen.getByRole('textbox', { name: 'Chat title' });
    input.textContent = 'Other';
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(mocks.updateConversation).not.toHaveBeenCalled();
    expect(screen.getByText('First')).toBeTruthy();
  });

  it('keeps focus on the row after a rename ends with Enter', async () => {
    listReturns([conversation({ id: 'a', title: 'First' })]);
    renderList();
    await screen.findByText('First');

    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    const input = screen.getByRole('textbox', { name: 'Chat title' });
    const enter = fireEvent.keyDown(input, { key: 'Enter' });

    expect(enter).toBe(false);
    expect(document.activeElement?.textContent).toContain('First');
  });

  it('says No chats yet when there are none', async () => {
    listReturns([]);
    renderList();

    expect(await screen.findByText('No chats yet')).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: 'Search chats' })).toBeNull();
  });

  it('hides search at the threshold and shows it above', async () => {
    listReturns(manyConversations(8));
    renderList();
    await screen.findByText('Chat 8');
    expect(screen.queryByRole('textbox', { name: 'Search chats' })).toBeNull();
    cleanup();

    listReturns(manyConversations(9));
    renderList();
    await screen.findByText('Chat 9');
    expect(screen.getByRole('textbox', { name: 'Search chats' })).toBeTruthy();
  });

  it('filters by title and says when nothing matches', async () => {
    listReturns(manyConversations(9));
    renderList();
    const search = await screen.findByRole('textbox', { name: 'Search chats' });

    fireEvent.change(search, { target: { value: 'Chat 3' } });
    expect(screen.getByText('Chat 3')).toBeTruthy();
    expect(screen.queryByText('Chat 4')).toBeNull();

    fireEvent.change(search, { target: { value: 'nothing' } });
    expect(screen.getByText('No chats found')).toBeTruthy();
  });

  it('searches only the loaded chats until asked to search older ones', async () => {
    pagesReturn([
      manyConversations(9),
      [conversation({ id: 'old', title: 'Ancient report' })],
    ]);
    renderList();
    const search = await screen.findByRole('textbox', { name: 'Search chats' });

    fireEvent.change(search, { target: { value: 'Ancient' } });
    await screen.findByText('No chats found');
    expect(mocks.listConversations).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Search older chats' }));

    expect(await screen.findByText('Ancient report')).toBeTruthy();
    expect(mocks.listConversations).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'page-2' }),
    );
  });

  it('shows loading, not No chats found, while older chats load', async () => {
    mocks.listConversations
      .mockResolvedValueOnce({
        data: manyConversations(9),
        next: 'page-2',
        previous: null,
      })
      .mockReturnValueOnce(new Promise(() => undefined));
    renderList();
    const search = await screen.findByRole('textbox', { name: 'Search chats' });
    fireEvent.change(search, { target: { value: 'Ancient' } });

    fireEvent.click(
      await screen.findByRole('button', { name: 'Search older chats' }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Search older chats' }),
      ).toBeNull(),
    );
    expect(screen.queryByText('No chats found')).toBeNull();
  });

  it('offers a retry when older chats fail to load', async () => {
    mocks.listConversations
      .mockResolvedValueOnce({
        data: manyConversations(9),
        next: 'page-2',
        previous: null,
      })
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce({
        data: [conversation({ id: 'old', title: 'Ancient report' })],
        next: null,
        previous: null,
      });
    renderList();
    const search = await screen.findByRole('textbox', { name: 'Search chats' });
    fireEvent.change(search, { target: { value: 'Ancient' } });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Search older chats' }),
    );

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText("Couldn't load older chats.")).toBeTruthy();
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Ancient report')).toBeTruthy();
  });

  it('marks only chats that wait for an answer', async () => {
    mocks.waitingIds.add('b');
    listReturns([
      conversation({ id: 'a', title: 'First' }),
      conversation({ id: 'b', title: 'Second' }),
    ]);
    renderList();
    await screen.findByText('Second');

    const marks = screen.getAllByText('Waiting for your input');
    expect(marks).toHaveLength(1);
    expect(
      screen.getByText('Second').closest('button')?.contains(marks[0]),
    ).toBe(true);
  });
});

function listReturns(conversations: AgentConversation[]) {
  mocks.listConversations.mockResolvedValue({
    data: conversations,
    next: null,
    previous: null,
  });
}

function pagesReturn(pages: AgentConversation[][]) {
  pages.forEach((data, index) => {
    mocks.listConversations.mockResolvedValueOnce({
      data,
      next: index < pages.length - 1 ? `page-${index + 2}` : null,
      previous: null,
    });
  });
}

function manyConversations(count: number): AgentConversation[] {
  return Array.from({ length: count }, (_, index) =>
    conversation({ id: `c${index + 1}`, title: `Chat ${index + 1}` }),
  );
}

function renderList({ selectedId = null }: { selectedId?: string | null } = {}) {
  const onSelect = vi.fn();
  const onCurrentDeleted = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ChatHistoryList
        selectedId={selectedId}
        onSelect={onSelect}
        onCurrentDeleted={onCurrentDeleted}
      />
    </QueryClientProvider>,
  );
  return { onSelect, onCurrentDeleted };
}

function conversation({
  id,
  title,
  daysAgo = 0,
}: {
  id: string;
  title: string;
  daysAgo?: number;
}): AgentConversation {
  const created = new Date(NOW);
  created.setDate(created.getDate() - daysAgo);
  return AgentConversation.parse({
    id,
    created: created.toISOString(),
    updated: created.toISOString(),
    platformId: 'platform-1',
    userId: 'user-1',
    source: AgentRunSource.CHAT,
    title,
  });
}
