/**
 * @vitest-environment jsdom
 */
import { ActionPreviewEvent } from '@activepieces/shared';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActionPreviewCard } from '@/app/routes/chat-with-ai/components/action-preview-card';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: {
    usePieceSummary: () => ({
      summary: { displayName: 'Slack', logoUrl: undefined },
    }),
  },
}));

afterEach(() => {
  cleanup();
});

describe('ActionPreviewCard', () => {
  it('calls onRun on the action button', () => {
    const { onRun, onCancel } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel on Cancel', () => {
    const { onRun, onCancel } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRun).not.toHaveBeenCalled();
  });

  it('has no X (Dismiss) button', () => {
    renderCard();

    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });

  it('calls onRun once on a double click and disables both buttons', () => {
    const { onRun, onCancel } = renderCard();
    const run = screen.getByRole('button', { name: 'Send message' });

    fireEvent.click(run);
    fireEvent.click(run);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('shows the action name, app and connection, and the input params without auth', () => {
    renderCard();

    expect(screen.getAllByText('Send message').length).toBeGreaterThan(0);
    expect(screen.getByText('Slack · Work Slack')).toBeTruthy();
    expect(screen.getByText('channel')).toBeTruthy();
    expect(screen.getByText('#general')).toBeTruthy();
    expect(screen.queryByText('auth')).toBeNull();
  });

  it('shows a batch as one table with a column per field and a remaining count', () => {
    render(
      <ActionPreviewCard
        preview={{
          ...PREVIEW,
          isBatch: true,
          batchCount: 5,
          batchSamples: [
            { to: 'dana@northwind.io', subject: 'Welcome, Dana' },
            { to: 'leo@contoso.com', subject: 'Welcome, Leo' },
          ],
        }}
        onRun={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(
      screen.getAllByRole('columnheader').map((th) => th.textContent),
    ).toEqual(['to', 'subject']);
    expect(screen.getByText('leo@contoso.com')).toBeTruthy();
    expect(screen.getByText('and {count} more')).toBeTruthy();
  });
});

function renderCard() {
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
  connectionLabel: 'Work Slack',
  input: { channel: '#general', text: 'Hello', auth: 'secret' },
  isBatch: false,
};
