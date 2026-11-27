/**
 * @vitest-environment jsdom
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppToaster } from '@/app/components/app-toaster';
import { ChatPanel } from '@/app/components/chat-panel/chat-window';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: ({ position }: { position: string }) => (
    <output aria-label="Toasts">{position}</output>
  ),
}));

vi.mock('@/lib/shell-handle', () => ({
  useShellHandle: () => ({ shell: 'project' }),
  CHAT_ALLOWED: { project: true, builder: true, platform: false },
}));

vi.mock('@/features/workspace/lib/use-chat-on', () => ({
  useChatEnabled: () => true,
  useChatOn: () => true,
}));

vi.mock('@/features/workspace/lib/rail-collapsed', () => ({
  useRailOpen: () => true,
}));

vi.mock('@/app/components/chat-panel/follow-along-controller', () => ({
  FollowAlongController: () => null,
}));

vi.mock('@/app/components/chat-panel/chat-chrome', () => ({
  ChatChrome: () => null,
}));

describe('AppToaster', () => {
  beforeEach(() => {
    window.innerWidth = 1280;
    useChatPanel.setState({ open: true, mode: 'right' });
  });

  afterEach(cleanup);

  it('moves toasts clear of the chat docked on the right', () => {
    renderApp({ withChat: true });

    expect(screen.getByRole('status', { name: 'Toasts' }).textContent).toBe(
      'bottom-left',
    );
  });

  it('puts toasts back once the chat panel is gone', () => {
    const view = renderApp({ withChat: true });
    act(() => view.rerender(app({ withChat: false })));

    expect(screen.getByRole('status', { name: 'Toasts' }).textContent).toBe(
      'bottom-right',
    );
  });

  it('keeps the default corner on pages without the chat', () => {
    renderApp({ withChat: false });

    expect(screen.getByRole('status', { name: 'Toasts' }).textContent).toBe(
      'bottom-right',
    );
  });
});

function renderApp({ withChat }: { withChat: boolean }) {
  return render(app({ withChat }));
}

function app({ withChat }: { withChat: boolean }) {
  return (
    <MemoryRouter initialEntries={['/projects/p1/automations']}>
      {withChat && <ChatPanel />}
      <AppToaster />
    </MemoryRouter>
  );
}
