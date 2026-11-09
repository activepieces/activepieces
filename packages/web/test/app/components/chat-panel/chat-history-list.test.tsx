/**
 * @vitest-environment jsdom
 */
import {
  AgentConversation,
  AgentConversationStatus,
  AgentRunSource,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatHistoryList } from '@/app/components/chat-panel/chat-history-list';
import { chatApi } from '@/features/chat/lib/chat-api';

const toastMock = vi.hoisted(() => {
  const show = vi.fn((_message: string, _options: ToastOptions) => 'toast-1');
  return Object.assign(show, { dismiss: vi.fn(), error: vi.fn() });
});

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (_match, name: string) => values?.[name] ?? ''),
}));

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn() }),
}));

vi.mock('@/app/components/settings-hub/settings-hub-dialog', () => ({
  SettingsHubDialog: () => null,
}));

vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: {
    listConversations: vi.fn(),
    deleteConversation: vi.fn(async () => undefined),
    updateConversation: vi.fn(async () => undefined),
    getConversation: vi.fn(async () => null),
  },
}));

beforeEach(() => {
  vi.mocked(chatApi.listConversations).mockResolvedValue({
    data: [
      conversation({ id: 'a', title: 'Invoices flow', daysAgo: 0 }),
      conversation({ id: 'b', title: 'Lead table', daysAgo: 1 }),
      conversation({ id: 'c', title: 'Weekly report', daysAgo: 30 }),
    ],
    next: null,
    previous: null,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ChatHistoryList', () => {
  it('groups chats by date', async () => {
    renderList();

    expect(await screen.findByText('Invoices flow')).toBeDefined();
    expect(groupNames()).toEqual(['Today', 'Yesterday', 'Older']);
  });

  it('moves with the arrow keys and opens with Enter', async () => {
    const { onSelect } = renderList();
    await screen.findByText('Invoices flow');

    fireEvent.keyDown(search(), { key: 'ArrowDown' });
    fireEvent.keyDown(search(), { key: 'ArrowDown' });
    fireEvent.keyDown(search(), { key: 'ArrowUp' });
    fireEvent.keyDown(search(), { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('renames inline with F2', async () => {
    const { onRename } = renderList();
    await screen.findByText('Invoices flow');

    fireEvent.keyDown(search(), { key: 'F2' });
    const input = screen.getByRole('textbox', { name: 'Rename chat' });
    fireEvent.change(input, { target: { value: 'Invoice sync' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith({ id: 'a', title: 'Invoice sync' });
  });

  it('hides a deleted chat and brings it back on undo', async () => {
    renderList();
    await screen.findByText('Lead table');

    fireEvent.keyDown(search(), { key: 'ArrowDown' });
    fireEvent.keyDown(search(), { key: 'Delete', shiftKey: true });

    expect(screen.queryByText('Lead table')).toBeNull();
    act(() => lastToast().action.onClick());

    expect(screen.getByText('Lead table')).toBeDefined();
    act(() => lastToast().onAutoClose());
    expect(chatApi.deleteConversation).not.toHaveBeenCalled();
  });

  it('deletes when the undo window ends', async () => {
    renderList();
    await screen.findByText('Lead table');

    fireEvent.keyDown(search(), { key: 'ArrowDown' });
    fireEvent.keyDown(search(), { key: 'Delete', shiftKey: true });
    act(() => lastToast().onAutoClose());

    await waitFor(() =>
      expect(chatApi.deleteConversation).toHaveBeenCalledWith('b'),
    );
    expect(chatApi.deleteConversation).toHaveBeenCalledTimes(1);
  });

  it('deletes right away when the history closes', async () => {
    const { unmount } = renderList();
    await screen.findByText('Lead table');

    fireEvent.keyDown(search(), { key: 'ArrowDown' });
    fireEvent.keyDown(search(), { key: 'Delete', shiftKey: true });
    unmount();

    expect(chatApi.deleteConversation).toHaveBeenCalledWith('b');
    expect(toastMock.dismiss).toHaveBeenCalledWith('toast-1');
  });

  it('leaves the open chat when it is deleted, and reopens it on undo', async () => {
    const { onLeaveCurrent, onSelect, rerender } = renderList({
      currentId: 'a',
    });
    await screen.findByText('Invoices flow');

    fireEvent.keyDown(search(), { key: 'Delete', shiftKey: true });
    expect(onLeaveCurrent).toHaveBeenCalledTimes(1);

    rerender(null);
    act(() => lastToast().action.onClick());
    expect(onSelect).toHaveBeenCalledWith('a');
  });
});

function renderList({ currentId = null }: { currentId?: string | null } = {}) {
  const onSelect = vi.fn();
  const onNewChat = vi.fn();
  const onLeaveCurrent = vi.fn();
  const onRename = vi.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree = (current: string | null) => (
    <QueryClientProvider client={client}>
      <ChatHistoryList
        currentId={current}
        onSelect={onSelect}
        onNewChat={onNewChat}
        onLeaveCurrent={onLeaveCurrent}
        onRename={onRename}
      />
    </QueryClientProvider>
  );
  const utils = render(tree(currentId));
  return {
    ...utils,
    rerender: (current: string | null) => utils.rerender(tree(current)),
    onSelect,
    onLeaveCurrent,
    onRename,
  };
}

function search(): HTMLElement {
  return screen.getByRole('combobox', { name: 'Search chats' });
}

function groupNames(): (string | null)[] {
  return screen
    .getAllByRole('group')
    .map((group) => group.getAttribute('aria-label'));
}

function lastToast(): Required<ToastOptions> {
  const options = toastMock.mock.calls.at(-1)?.[1];
  if (!options?.action || !options.onAutoClose || !options.onDismiss) {
    throw new Error('No undo toast was shown.');
  }
  return {
    duration: options.duration ?? 0,
    action: options.action,
    onAutoClose: options.onAutoClose,
    onDismiss: options.onDismiss,
  };
}

function conversation({
  id,
  title,
  daysAgo,
}: {
  id: string;
  title: string;
  daysAgo: number;
}): AgentConversation {
  const created = new Date(Date.now() - daysAgo * DAY_MS).toISOString();
  return {
    id,
    title,
    created,
    updated: created,
    platformId: 'platform',
    projectId: 'project',
    userId: 'user',
    agentId: null,
    flowRunId: null,
    waitpointId: null,
    aiCredits: null,
    source: AgentRunSource.CHAT,
    modelName: null,
    modelTierId: null,
    providerConfigId: null,
    status: AgentConversationStatus.IDLE,
    activeRunId: null,
    messages: [],
    uiMessages: null,
    summary: null,
    summarizedUpToIndex: null,
  };
}

const DAY_MS = 86_400_000;

type ToastOptions = {
  duration?: number;
  action?: { label: string; onClick: () => void };
  onAutoClose?: () => void;
  onDismiss?: () => void;
};
