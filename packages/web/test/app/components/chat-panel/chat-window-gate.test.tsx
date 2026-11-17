/**
 * @vitest-environment jsdom
 */
import { cleanup, renderHook } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatWidth } from '@/app/components/chat-panel/chat-window';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

const gate = vi.hoisted(() => ({ chatOn: true }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/lib/shell-handle', () => ({
  useShellHandle: () => ({ shell: 'project' }),
  CHAT_ALLOWED: { project: true, builder: true, platform: false },
}));

vi.mock('@/features/workspace/lib/use-chat-on', () => ({
  useChatEnabled: () => gate.chatOn,
  useChatOn: () => gate.chatOn,
}));

vi.mock('@/app/components/chat-panel/chat-chrome', () => ({
  ChatChrome: () => null,
}));

describe('useChatWidth', () => {
  beforeEach(() => {
    window.innerWidth = 1440;
    useChatPanel.setState({ open: true, mode: 'left' });
  });

  afterEach(cleanup);

  it('shows the docked chat when chat is on', () => {
    gate.chatOn = true;

    expect(renderWidth()).toBe('left');
  });

  it('keeps the chat closed when the plan or embedding turns chat off', () => {
    gate.chatOn = false;

    expect(renderWidth()).toBe('closed');
  });
});

function renderWidth() {
  const { result } = renderHook(() => useChatWidth(), {
    wrapper: ({ children }: React.PropsWithChildren) => (
      <MemoryRouter>{children}</MemoryRouter>
    ),
  });
  return result.current;
}
