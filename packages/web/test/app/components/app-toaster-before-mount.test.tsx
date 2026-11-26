// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppToaster } from '@/app/components/app-toaster';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

const useChatWidth = vi.hoisted(() => vi.fn(() => 'right' as const));

vi.mock('@/app/components/chat-panel/chat-window', () => ({
  useChatWidth,
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: ({ position }: { position: string }) => (
    <div data-testid="toaster" data-position={position} />
  ),
}));

afterEach(() => {
  useChatWidth.mockClear();
  useChatPanel.setState({ panelMounted: false });
});

describe('AppToaster', () => {
  it('does not read the chat layout before the chat panel mounts', () => {
    useChatPanel.setState({ panelMounted: false });

    render(<AppToaster />);

    expect(useChatWidth).not.toHaveBeenCalled();
    expect(screen.getByTestId('toaster').dataset.position).toBe('bottom-right');
  });

  it('moves toasts away from a chat docked on the right', () => {
    useChatPanel.setState({ panelMounted: true });

    render(<AppToaster />);

    expect(screen.getByTestId('toaster').dataset.position).toBe('bottom-left');
  });
});
