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

describe('McpReconnectCard', () => {
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

  it('has no X; "Not now" calls onDismiss', () => {
    const onDismiss = vi.fn();
    render(
      <McpReconnectCard
        reconnect={RECONNECT}
        onResolve={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('resolves once on a double click of "I\'ve reconnected"', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const onResolve = vi.fn();
    render(<McpReconnectCard reconnect={RECONNECT} onResolve={onResolve} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }));
    const done = screen.getByRole('button', { name: "I've reconnected" });
    fireEvent.click(done);
    fireEvent.click(done);

    expect(onResolve).toHaveBeenCalledTimes(1);
  });

  it('shows a "Connected" line in history', () => {
    render(<McpReconnectCard reconnect={RECONNECT} isInteractive={false} />);

    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

const RECONNECT = {
  connectorUuid: 'mcp-1',
  displayName: 'Linear',
  connectUrl: 'https://mcp.linear.app/connect',
};
