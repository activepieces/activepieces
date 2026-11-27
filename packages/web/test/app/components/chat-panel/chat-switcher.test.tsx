/**
 * @vitest-environment jsdom
 */
import { AgentConversation, AgentRunSource } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import * as React from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest';

import { ChatChrome } from '@/app/components/chat-panel/chat-chrome';
import { chatDom } from '@/features/chat/lib/chat-dom';
import { useFollowAlong } from '@/features/chat/lib/follow/follow-along';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

const mocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  removeWithUndo: vi.fn(),
  getConversation: vi.fn(),
  updateConversation: vi.fn(),
  listConversations: vi.fn(),
  waitingIds: new Set<string>(),
  fullPage: false,
}));

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string, vars?: Record<string, string>) =>
    Object.entries(vars ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, value),
      key,
    ),
}));

vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));

vi.mock('@/lib/shell-handle', () => ({
  useShellHandle: () =>
    mocks.fullPage ? { shell: 'project', chat: 'full' } : { shell: 'project' },
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
  AIChatBox: () => <textarea aria-label="Message" data-chat-composer="" />,
}));

vi.mock('@/app/components/settings-hub/settings-hub-dialog', () => ({
  SettingsHubDialog: ({ open }: { open: boolean }) =>
    open ? <div role="alertdialog" aria-label="Settings" /> : null,
}));

vi.mock('@/app/components/chat-panel/chat-history-list', () => ({
  ChatHistoryList: () => <nav aria-label="Chat history" />,
}));

vi.mock('@/features/chat/lib/use-conversation-indicators', () => ({
  useConversationIndicators: () => ({
    getIndicator: (conversation: { id: string }) =>
      mocks.waitingIds.has(conversation.id) ? 'waiting' : 'unread',
    markRead: vi.fn(),
  }),
}));

vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: {
    getConversation: mocks.getConversation,
    updateConversation: mocks.updateConversation,
    listConversations: mocks.listConversations,
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

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({ children, className }: MotionMock) => (
      <div className={className}>{children}</div>
    ),
    aside: ({ children, className, 'aria-label': label }: MotionMock) => (
      <aside className={className} aria-label={label} data-chat-rail="">
        {children}
      </aside>
    ),
  },
  useReducedMotion: () => true,
}));

describe('ChatSwitcher', () => {
  beforeEach(() => {
    window.innerWidth = 1280;
    Element.prototype.scrollIntoView = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    mocks.getConversation.mockImplementation((id: string) =>
      Promise.resolve(conversation({ id, title: `Chat ${id.slice(1)}` })),
    );
    listReturns(manyConversations(8));
    useFollowAlong.setState({ phase: 'idle', following: false });
    useChatPanel.setState({
      open: true,
      mode: 'left',
      conversationId: 'c1',
      newChatToken: 0,
      autoFollow: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mocks.waitingIds.clear();
  });

  it('keeps only New, Layout and Close beside the title', async () => {
    renderChrome();
    await titleButton();

    expect(screen.queryByRole('button', { name: 'History' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
    expect(screen.getByRole('button', { name: 'New chat' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Chat layout' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('opens from a click on the title with the search focused', async () => {
    renderChrome();
    fireEvent.click(await titleButton(), { detail: 1 });

    const search = await screen.findByRole('combobox', {
      name: 'Search chats',
    });
    await waitFor(() => expect(document.activeElement).toBe(search));
    expect(switcher().getAttribute('data-opened-by')).toBe('pointer');
  });

  it('stays open after a full pointer press on the title', async () => {
    renderChrome();
    const title = await titleButton();

    fireEvent.pointerDown(title, { button: 0, pointerType: 'mouse' });
    fireEvent.mouseDown(title, { button: 0 });
    fireEvent.pointerUp(title, { button: 0, pointerType: 'mouse' });
    fireEvent.mouseUp(title, { button: 0 });
    fireEvent.click(title, { detail: 1 });

    await screen.findByRole('combobox', { name: 'Search chats' });
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(switcher()).toBeTruthy();
    expect(title.getAttribute('aria-expanded')).toBe('true');
  });

  it('places the switcher from the live header anchor', async () => {
    const rect = vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: Element) {
        return this.isConnected &&
          this.matches('[data-slot="popover-anchor"]')
          ? new DOMRect(0, 0, HEADER_WIDTH_PX, HEADER_HEIGHT_PX)
          : new DOMRect();
      });
    onTestFinished(() => rect.mockRestore());
    renderChrome();

    await openSwitcher();

    const wrapper = switcher().closest<HTMLElement>(
      '[data-radix-popper-content-wrapper]',
    );
    await waitFor(() =>
      expect(
        wrapper?.style.getPropertyValue('--radix-popper-anchor-width'),
      ).toBe(`${HEADER_WIDTH_PX}px`),
    );
  });

  it('opens with only a fade when Enter or Space presses the title', async () => {
    renderChrome();
    fireEvent.click(await titleButton(), { detail: 0 });

    await screen.findByRole('combobox', { name: 'Search chats' });
    expect(switcher().getAttribute('data-opened-by')).toBe('keyboard');
  });

  it('opens and closes with Shift+Cmd+H, search focused', async () => {
    renderChrome();
    await titleButton();

    pressSwitcherShortcut();
    const search = await screen.findByRole('combobox', {
      name: 'Search chats',
    });
    await waitFor(() => expect(document.activeElement).toBe(search));
    expect(switcher().getAttribute('data-opened-by')).toBe('keyboard');

    pressSwitcherShortcut();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('lists the six most recent chats, checks the current one and dots the one waiting', async () => {
    mocks.waitingIds.add('c3');
    renderChrome();
    await openSwitcher();
    await screen.findByText('Chat 6');

    expect(screen.queryByText('Chat 7')).toBeNull();
    expect(screen.getByText('Recent')).toBeTruthy();
    expect(option('Chat 1').getAttribute('aria-current')).toBe('true');
    expect(option('Chat 2').getAttribute('aria-current')).toBeNull();
    const marks = within(switcher()).getAllByText('Waiting for your input');
    expect(marks).toHaveLength(1);
    expect(option('Chat 3').contains(marks[0])).toBe(true);
  });

  it('lists and highlights the current chat even when it is older than the recent ones', async () => {
    useChatPanel.setState({ conversationId: 'c8' });
    renderChrome();
    await openSwitcher({ title: 'Chat 8' });
    await screen.findByText('Chat 5');

    expect(screen.queryByText('Chat 6')).toBeNull();
    expect(option('Chat 8').getAttribute('aria-current')).toBe('true');
    expect(optionLabels()[0]).toContain('Chat 8');
    await waitFor(() =>
      expect(option('Chat 8').getAttribute('aria-selected')).toBe('true'),
    );
    expect(option('Chat 1').getAttribute('aria-selected')).toBe('false');
  });

  it('opens rename with the title selected from its start', async () => {
    renderChrome();
    await openSwitcher();
    fireEvent.click(option(await screen.findByText('Rename')));
    const input = await screen.findByRole('textbox', { name: 'Chat title' });

    await waitFor(() =>
      expect(window.getSelection()?.toString()).toBe('Chat 1'),
    );
    fireEvent.keyDown(input, { key: 'Escape' });
  });

  it('filters the whole history, not just the recent chats', async () => {
    renderChrome();
    await openSwitcher();
    await screen.findByText('Chat 6');

    typeSearch('Chat 8');
    expect(option('Chat 8')).toBeTruthy();
    expect(within(switcher()).queryByText('Chat 1')).toBeNull();
    expect(within(switcher()).queryByText('Rename')).toBeNull();

    typeSearch('nothing');
    expect(screen.getByText('No chats match “nothing”')).toBeTruthy();
  });

  it('searches loaded chats only, then older ones on request, with a retry', async () => {
    mocks.listConversations
      .mockResolvedValueOnce({
        data: manyConversations(8),
        next: 'page-2',
        previous: null,
      })
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce({
        data: [conversation({ id: 'old', title: 'Ancient report' })],
        next: null,
        previous: null,
      });
    renderChrome();
    await openSwitcher();
    await screen.findByText('Chat 6');

    typeSearch('Ancient');
    await screen.findByText('No chats match “Ancient”');
    expect(mocks.listConversations).toHaveBeenCalledTimes(1);

    fireEvent.click(option(await screen.findByText('Search older chats')));
    fireEvent.click(
      option(await screen.findByText("Couldn't load older chats.")),
    );

    expect(option(await screen.findByText('Ancient report'))).toBeTruthy();
    expect(mocks.listConversations).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'page-2' }),
    );
  });

  it('switches to the picked chat and closes', async () => {
    renderChrome();
    await openSwitcher();

    fireEvent.click(option(await screen.findByText('Chat 2')));

    expect(useChatPanel.getState().conversationId).toBe('c2');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('opens the full History list from All chats, with a way back', async () => {
    renderChrome();
    await openSwitcher();

    fireEvent.click(option(await screen.findByText('All chats…')));

    expect(
      screen.getByRole('navigation', { name: 'Chat history' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back to chat' }));
    expect(
      screen.queryByRole('navigation', { name: 'Chat history' }),
    ).toBeNull();
  });

  it('shows Rename and Delete only for a chat that exists', async () => {
    renderChrome();
    await openSwitcher();
    await screen.findByText('Chat 6');
    expect(optionLabels()).toEqual(
      expect.arrayContaining(['Rename', 'Delete', 'Chat settings']),
    );
    cleanup();

    useChatPanel.setState({ conversationId: null });
    renderChrome();
    await openSwitcher({ title: 'New chat' });
    await screen.findByText('Chat 6');

    const labels = optionLabels();
    expect(labels).not.toContain('Rename');
    expect(labels).not.toContain('Delete');
    expect(labels).toEqual(expect.arrayContaining(['Chat settings']));
    expect(within(switcher()).getByText('Follow along')).toBeTruthy();
  });

  it('shows only the actions when there are no chats yet', async () => {
    listReturns([]);
    useChatPanel.setState({ conversationId: null });
    renderChrome();
    await openSwitcher({ title: 'New chat' });
    await screen.findByText('Follow along');

    expect(screen.queryByText('Recent')).toBeNull();
    expect(screen.queryByText('All chats…')).toBeNull();
  });

  it('renames in the title: Enter saves and puts focus back on the title', async () => {
    serverKeepsRenames();
    renderChrome();
    await openSwitcher();

    fireEvent.click(option(await screen.findByText('Rename')));
    const input = await screen.findByRole('textbox', { name: 'Chat title' });
    await waitFor(() => expect(document.activeElement).toBe(input));
    input.textContent = 'Renamed';
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(mocks.updateConversation).toHaveBeenCalledWith('c1', {
        title: 'Renamed',
      }),
    );
    const title = await screen.findByRole('button', { name: 'Renamed' });
    await waitFor(() => expect(document.activeElement).toBe(title));
  });

  it('cancels a rename on Escape without closing the chat', async () => {
    renderChrome();
    await openSwitcher();

    fireEvent.click(option(await screen.findByText('Rename')));
    const input = await screen.findByRole('textbox', { name: 'Chat title' });
    input.textContent = 'Other';
    fireEvent.keyDown(input, { key: 'Escape' });

    const title = await titleButton();
    expect(mocks.updateConversation).not.toHaveBeenCalled();
    expect(useChatPanel.getState().open).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(title));
  });

  it('puts the old title back and says so when a rename fails', async () => {
    mocks.updateConversation.mockRejectedValue(new Error('offline'));
    renderChrome();
    await openSwitcher();

    fireEvent.click(option(await screen.findByText('Rename')));
    const input = await screen.findByRole('textbox', { name: 'Chat title' });
    input.textContent = 'New title';
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Failed to rename conversation',
      ),
    );
    expect(await titleButton()).toBeTruthy();
  });

  it('deletes with undo, starts a new chat, and Undo brings the chat back', async () => {
    renderChrome();
    await openSwitcher();

    fireEvent.click(option(await screen.findByText('Delete')));

    expect(mocks.removeWithUndo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1' }),
    );
    expect(useChatPanel.getState().conversationId).toBeNull();
    const [{ onUndo }] = mocks.removeWithUndo.mock.calls[0];
    act(() => onUndo());
    expect(useChatPanel.getState().conversationId).toBe('c1');
  });

  it('toggles Follow along in place and explains what it does', async () => {
    renderChrome();
    await openSwitcher();
    const follow = option(await screen.findByText('Follow along'));

    expect(within(follow).getByText('On')).toBeTruthy();
    expect(within(follow).getByText('Opens pages the AI edits.')).toBeTruthy();
    fireEvent.click(follow);

    expect(useChatPanel.getState().autoFollow).toBe(false);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(within(follow).getByText('Off')).toBeTruthy();
    expect(
      within(follow).getByText('Doesn’t open pages for you.'),
    ).toBeTruthy();
  });

  it('offers Stop following only while the chat is following', async () => {
    renderChrome();
    await openSwitcher();
    await screen.findByText('Follow along');
    expect(screen.queryByText('Stop following')).toBeNull();

    act(() => useFollowAlong.setState({ phase: 'editing', following: true }));

    expect(screen.getByText('Stop following')).toBeTruthy();
  });

  it('opens Chat settings', async () => {
    renderChrome();
    await openSwitcher();

    fireEvent.click(option(await screen.findByText('Chat settings')));

    expect(screen.getByRole('alertdialog', { name: 'Settings' })).toBeTruthy();
  });

  it('moves into the actions on Tab', async () => {
    renderChrome();
    const search = await openSwitcher();
    await screen.findByText('Chat 6');

    fireEvent.keyDown(search, { key: 'Tab' });

    await waitFor(() =>
      expect(option('Rename').getAttribute('aria-selected')).toBe('true'),
    );
    expect(document.activeElement).toBe(search);
  });

  it('clears the search on the first Escape and closes on the second, focus back on the title', async () => {
    renderChrome();
    const search = await openSwitcher();
    await screen.findByText('Chat 6');
    typeSearch('Chat 8');

    fireEvent.keyDown(search, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(search).toHaveProperty('value', '');
    await within(switcher()).findByText('Chat 1');

    fireEvent.keyDown(search, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const title = await titleButton();
    await waitFor(() => expect(document.activeElement).toBe(title));
    expect(useChatPanel.getState().open).toBe(true);
  });

  it('closes History, not the chat, on Escape', async () => {
    renderChrome();
    await openSwitcher();
    fireEvent.click(option(await screen.findByText('All chats…')));
    const back = screen.getByRole('button', { name: 'Back to chat' });
    back.focus();
    const panelMayClose: boolean[] = [];
    const onWindowKey = (event: KeyboardEvent) =>
      panelMayClose.push(chatDom.escapeFree(event));
    window.addEventListener('keydown', onWindowKey);

    fireEvent.keyDown(back, { key: 'Escape' });
    window.removeEventListener('keydown', onWindowKey);

    expect(historyList()).toBeNull();
    expect(panelMayClose).toEqual([false]);
  });

  it('shows the chat, not History, when the chat opens again', async () => {
    renderChrome();
    await openSwitcher();
    fireEvent.click(option(await screen.findByText('All chats…')));
    expect(historyList()).not.toBeNull();

    act(() => useChatPanel.getState().setOpen(false));
    act(() => useChatPanel.getState().setOpen(true));

    expect(historyList()).toBeNull();
  });

  it('keeps each renamed title when moving between chats', async () => {
    serverKeepsRenames();
    renderChrome();
    await rename({ from: 'Chat 1', to: 'First' });
    await titleButton('First');

    act(() => useChatPanel.getState().showConversation('c2'));
    await rename({ from: 'Chat 2', to: 'Second' });
    await titleButton('Second');

    act(() => useChatPanel.getState().showConversation('c1'));

    expect(await titleButton('First')).toBeTruthy();
  });

  it('brings the chat back when its delete fails', async () => {
    renderChrome();
    await openSwitcher();

    fireEvent.click(option(await screen.findByText('Delete')));
    expect(useChatPanel.getState().conversationId).toBeNull();
    const [{ onFailed }] = mocks.removeWithUndo.mock.calls[0];
    act(() => onFailed());

    expect(useChatPanel.getState().conversationId).toBe('c1');
  });
});

async function titleButton(name = 'Chat 1') {
  return screen.findByRole('button', { name, expanded: false });
}

async function openSwitcher({ title = 'Chat 1' }: { title?: string } = {}) {
  fireEvent.click(await titleButton(title), { detail: 1 });
  return screen.findByRole('combobox', { name: 'Search chats' });
}

async function rename({ from, to }: { from: string; to: string }) {
  await openSwitcher({ title: from });
  fireEvent.click(option(await screen.findByText('Rename')));
  const input = await screen.findByRole('textbox', { name: 'Chat title' });
  input.textContent = to;
  fireEvent.keyDown(input, { key: 'Enter' });
}

function historyList() {
  return screen.queryByRole('navigation', { name: 'Chat history' });
}

function switcher() {
  return screen.getByRole('dialog');
}

function option(target: string | HTMLElement): HTMLElement {
  const element =
    typeof target === 'string'
      ? within(switcher()).getByText(target)
      : target;
  const row = element.closest<HTMLElement>('[role="option"]');
  if (!row) throw new Error('not an option');
  return row;
}

function optionLabels(): string[] {
  return within(switcher())
    .getAllByRole('option')
    .map((row) => row.textContent ?? '');
}

function typeSearch(text: string) {
  fireEvent.change(screen.getByRole('combobox', { name: 'Search chats' }), {
    target: { value: text },
  });
}

function pressSwitcherShortcut() {
  fireEvent.keyDown(document, { key: 'H', metaKey: true, shiftKey: true });
}

function serverKeepsRenames() {
  const titles = new Map<string, string>();
  const titleOf = (id: string) => titles.get(id) ?? `Chat ${id.slice(1)}`;
  mocks.updateConversation.mockImplementation(
    (id: string, request: { title: string }) => {
      titles.set(id, request.title);
      return Promise.resolve(conversation({ id, title: request.title }));
    },
  );
  mocks.getConversation.mockImplementation((id: string) =>
    Promise.resolve(conversation({ id, title: titleOf(id) })),
  );
  mocks.listConversations.mockImplementation(() =>
    Promise.resolve({
      data: manyConversations(8).map((item) =>
        conversation({ id: item.id, title: titleOf(item.id) }),
      ),
      next: null,
      previous: null,
    }),
  );
}

function listReturns(conversations: AgentConversation[]) {
  mocks.listConversations.mockResolvedValue({
    data: conversations,
    next: null,
    previous: null,
  });
}

function manyConversations(count: number): AgentConversation[] {
  return Array.from({ length: count }, (_, index) =>
    conversation({ id: `c${index + 1}`, title: `Chat ${index + 1}` }),
  );
}

function conversation({
  id,
  title,
}: {
  id: string;
  title: string;
}): AgentConversation {
  return AgentConversation.parse({
    id,
    created: NOW,
    updated: NOW,
    platformId: 'platform-1',
    userId: 'user-1',
    source: AgentRunSource.CHAT,
    title,
  });
}

const NOW = new Date().toISOString();

function renderChrome({ fullPage = false }: { fullPage?: boolean } = {}) {
  mocks.fullPage = fullPage;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const chrome = (
    <aside id={chatLayoutUtils.PANEL_ID}>
      <ChatChrome />
    </aside>
  );
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider
        router={createMemoryRouter(
          [
            { path: '/projects/:projectId/automations', element: chrome },
            { path: '/chat/:conversationId', element: chrome },
          ],
          {
            initialEntries: [
              fullPage ? '/chat/c1' : '/projects/p1/automations',
            ],
          },
        )}
      />
    </QueryClientProvider>,
  );
}

const HEADER_WIDTH_PX = 400;
const HEADER_HEIGHT_PX = 56;

type MotionMock = React.PropsWithChildren<{
  className?: string;
  'aria-label'?: string;
}>;

describe('Full-page chat header', () => {
  beforeEach(() => {
    window.innerWidth = 1280;
    Element.prototype.scrollIntoView = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    mocks.getConversation.mockImplementation((id: string) =>
      Promise.resolve(conversation({ id, title: `Chat ${id.slice(1)}` })),
    );
    listReturns(manyConversations(8));
    useFollowAlong.setState({ phase: 'idle', following: false });
    useChatPanel.setState({
      open: true,
      mode: 'left',
      conversationId: 'c1',
      newChatToken: 0,
      autoFollow: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mocks.fullPage = false;
  });

  it('shows the title as plain text, with History and New in the chats column', async () => {
    renderChrome({ fullPage: true });

    const title = await screen.findByRole('heading', { name: 'Chat 1' });
    expect(title.closest('button')).toBeNull();
    expect(screen.getByRole('button', { name: 'Chat actions' })).toBeTruthy();
    const column = screen.getByRole('complementary', { name: 'Chats' });
    expect(
      within(column)
        .getByRole('button', { name: 'Hide chats' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getAllByRole('button', { name: 'New chat' })).toEqual([
      within(column).getByRole('button', { name: 'New chat' }),
    ]);
  });

  it('moves History and New into the chat header when the column is hidden', async () => {
    renderChrome({ fullPage: true });
    await screen.findByRole('heading', { name: 'Chat 1' });

    fireEvent.click(screen.getByRole('button', { name: 'Hide chats' }));

    expect(screen.queryByRole('complementary', { name: 'Chats' })).toBeNull();
    const show = screen.getByRole('button', { name: 'Show chats' });
    expect(show.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: 'New chat' })).toBeTruthy();
  });

  it('toggles the chats column with Shift+Cmd+H instead of opening a menu', async () => {
    renderChrome({ fullPage: true });
    await screen.findByRole('heading', { name: 'Chat 1' });

    pressSwitcherShortcut();
    expect(screen.queryByRole('complementary', { name: 'Chats' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();

    pressSwitcherShortcut();
    expect(
      screen.getByRole('complementary', { name: 'Chats' }),
    ).toBeTruthy();
  });

  it('renames in place from the … menu', async () => {
    mocks.updateConversation.mockResolvedValue(
      conversation({ id: 'c1', title: 'Renamed' }),
    );
    renderChrome({ fullPage: true });
    await screen.findByRole('heading', { name: 'Chat 1' });

    openActions();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const input = await screen.findByRole('textbox', { name: 'Chat title' });
    await waitFor(() => expect(document.activeElement).toBe(input));
    input.textContent = 'Renamed';
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(mocks.updateConversation).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ title: 'Renamed' }),
      ),
    );
  });

  it('turns Follow along off, opens settings and deletes from the … menu', async () => {
    renderChrome({ fullPage: true });
    await screen.findByRole('heading', { name: 'Chat 1' });

    openActions();
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /Follow along/ }),
    );
    expect(useChatPanel.getState().autoFollow).toBe(false);

    openActions();
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Chat settings' }),
    );
    expect(
      await screen.findByRole('alertdialog', { name: 'Settings' }),
    ).toBeTruthy();

    openActions();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(mocks.removeWithUndo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1' }),
    );
  });
});

function openActions() {
  fireEvent.keyDown(screen.getByRole('button', { name: 'Chat actions' }), {
    key: 'Enter',
  });
}
