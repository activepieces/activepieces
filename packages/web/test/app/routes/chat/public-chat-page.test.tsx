/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatDrawerSource } from '@/app/builder/types';
import { ChatPage } from '@/app/routes/chat';

const { useGetFlow } = vi.hoisted(() => ({
  useGetFlow: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock('@/features/flows', () => ({
  flowHooks: { useGetFlow },
}));

vi.mock('@/app/routes/chat/flow-chat', () => ({
  FlowChat: ({ mode }: { mode: string | null }) => (
    <div>chat mode: {String(mode)}</div>
  ),
  ChatNotFound: () => <div>not found</div>,
}));

afterEach(() => {
  cleanup();
  useGetFlow.mockClear();
});

describe('public chat page', () => {
  it('opens the chat without reading the flow through the signed-in API', () => {
    renderAt('/chats/flow-1');

    expect(screen.getByText('chat mode: null')).toBeTruthy();
    expect(useGetFlow).not.toHaveBeenCalled();
  });

  it('opens the draft chat when the link asks for it', () => {
    renderAt('/chats/flow-1?useDraft=true');

    expect(
      screen.getByText(`chat mode: ${ChatDrawerSource.TEST_FLOW}`),
    ).toBeTruthy();
    expect(useGetFlow).not.toHaveBeenCalled();
  });
});

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/chats/:flowId" element={<ChatPage />} />
      </Routes>
    </MemoryRouter>,
  );
}
