/**
 * @vitest-environment jsdom
 */
import { ActionPreviewEvent } from '@activepieces/shared';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActionPreviewCard } from '@/app/routes/chat-with-ai/components/action-preview-card';
import { McpReconnectCard } from '@/app/routes/chat-with-ai/components/mcp-reconnect-card';
import { QuickReplies } from '@/app/routes/chat-with-ai/components/quick-replies';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: {
    usePieceSummary: () => ({ summary: { displayName: 'Slack' } }),
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ActionPreviewCard', () => {
  it('runs on the action button and cancels on Cancel', () => {
    const first = showPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(first.onRun).toHaveBeenCalledTimes(1);
    expect(first.onCancel).not.toHaveBeenCalled();
    cleanup();

    const second = showPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(second.onCancel).toHaveBeenCalledTimes(1);
    expect(second.onRun).not.toHaveBeenCalled();
  });

  it('runs once on a double click and then ignores Cancel', () => {
    const { onRun, onCancel } = showPreview();
    const run = screen.getByRole('button', { name: 'Send message' });

    fireEvent.click(run);
    fireEvent.click(run);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe('McpReconnectCard', () => {
  it('opens the connect URL, then resolves once with the retry message', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const onResolve = vi.fn();
    render(<McpReconnectCard reconnect={RECONNECT} onResolve={onResolve} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }));
    expect(open.mock.calls[0]?.[0]).toBe(RECONNECT.connectUrl);
    expect(onResolve).not.toHaveBeenCalled();

    const done = screen.getByRole('button', { name: "I've reconnected" });
    fireEvent.click(done);
    fireEvent.click(done);

    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith({
      reconnected: true,
      message: 'The user reconnected Linear. Retry the action that failed.',
    });
  });

  it('dismisses on "Not now"', () => {
    const onDismiss = vi.fn();
    render(
      <McpReconnectCard
        reconnect={RECONNECT}
        onResolve={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('QuickReplies', () => {
  it('sends the exact recurring reply the server guides watch for', () => {
    const onSend = vi.fn();
    render(
      <QuickReplies replies={[]} offerRecurringAutomation onSend={onSend} />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledWith('Run this automatically every day');
  });
});

function showPreview() {
  const onRun = vi.fn();
  const onCancel = vi.fn();
  render(
    <ActionPreviewCard preview={PREVIEW} onRun={onRun} onCancel={onCancel} />,
  );
  return { onRun, onCancel };
}

const PREVIEW: ActionPreviewEvent = {
  toolCallId: 'tc-1',
  pieceName: '@activepieces/piece-slack',
  actionName: 'send_message',
  actionDisplayName: 'Send message',
  input: { channel: '#general' },
  isBatch: false,
};

const RECONNECT = {
  connectorUuid: 'mcp-1',
  displayName: 'Linear',
  connectUrl: 'https://mcp.linear.app/connect',
};
