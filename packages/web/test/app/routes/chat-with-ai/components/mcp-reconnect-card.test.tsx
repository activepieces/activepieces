/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { McpReconnectCard } from '@/app/routes/chat-with-ai/components/mcp-reconnect-card';

vi.mock('i18next', () => ({ t: (key: string) => key }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('McpReconnectCard (characterization)', () => {
  it('opens the connect URL, then resolves with the exact retry message', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const onResolve = vi.fn();
    render(
      <McpReconnectCard
        reconnect={RECONNECT}
        onResolve={onResolve}
        onDismiss={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0]?.[0]).toBe(RECONNECT.connectUrl);
    expect(onResolve).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: "I've reconnected" }));

    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith({
      reconnected: true,
      message: 'The user reconnected Linear. Retry the action that failed.',
    });
  });

  it('today has an X (Dismiss) that calls onDismiss (P4c changes this)', () => {
    const onDismiss = vi.fn();
    render(
      <McpReconnectCard
        reconnect={RECONNECT}
        onResolve={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

const RECONNECT = {
  connectorUuid: 'mcp-1',
  displayName: 'Linear',
  connectUrl: 'https://mcp.linear.app/connect',
};
