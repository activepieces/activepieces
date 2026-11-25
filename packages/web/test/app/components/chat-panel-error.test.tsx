// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatPanelError } from '@/app/components/app-shell';

const layout = vi.hoisted(() => ({ width: 'full' as string }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/app/components/chat-panel/chat-window', () => ({
  ChatPanel: () => null,
  useChatWidth: () => layout.width,
  useChatSheet: () => ({ hide: vi.fn() }),
}));

afterEach(cleanup);

describe('ChatPanelError', () => {
  it('leaves the full-page chat when the user closes the error', () => {
    layout.width = 'full';
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/automations', '/chat']}>
        <Routes>
          <Route
            path="/chat"
            element={<ChatPanelError onRetry={vi.fn()} onClose={onClose} />}
          />
          <Route path="/automations" element={<p>Automations</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
    expect(screen.getByText('Automations')).toBeTruthy();
  });

  it('only closes the dock beside a page', () => {
    layout.width = 'left';
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/automations']}>
        <ChatPanelError onRetry={vi.fn()} onClose={onClose} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});
