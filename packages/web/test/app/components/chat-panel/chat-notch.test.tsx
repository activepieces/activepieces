/**
 * @vitest-environment jsdom
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatNotch } from '@/app/components/chat-panel/chat-notch';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/lib/shell-handle', () => ({
  useShellHandle: () => ({ shell: 'project' }),
  CHAT_ALLOWED: { project: true, builder: true, platform: false },
}));

vi.mock('@/features/workspace/lib/use-chat-on', () => ({
  useChatEnabled: () => true,
  useChatOn: () => true,
}));

vi.mock('@/app/components/chat-panel/chat-chrome', () => ({
  ChatChrome: () => null,
}));

describe('ChatNotch', () => {
  beforeEach(() => {
    window.innerWidth = 1440;
    useChatPanel.setState({ open: false, mode: 'left', gateOpen: false });
  });

  afterEach(cleanup);

  it('opens the dock when the chat is closed', () => {
    renderNotch();

    fireEvent.click(screen.getByRole('button', { name: 'Chat' }));

    expect(useChatPanel.getState().open).toBe(true);
  });

  it('steps out of the way while the dock is open', () => {
    renderNotch();

    act(() => useChatPanel.getState().setOpen(true));

    expect(screen.queryByRole('button', { name: 'Chat' })).toBeNull();
  });

  it('says the chat is waiting for an answer while a card is open', () => {
    useChatPanel.setState({ gateOpen: true });
    renderNotch();

    expect(
      screen.getByRole('button', { name: 'Chat is waiting for your answer' }),
    ).toBeTruthy();
  });

  it('comes back when the dock closes', () => {
    useChatPanel.setState({ open: true, mode: 'right' });
    renderNotch();

    act(() => useChatPanel.getState().setOpen(false));

    expect(
      screen.getByRole('button', { name: 'Chat' }).getAttribute('tabindex'),
    ).toBe('0');
  });
});

function renderNotch() {
  render(
    <MemoryRouter>
      <ChatNotch />
    </MemoryRouter>,
  );
}
