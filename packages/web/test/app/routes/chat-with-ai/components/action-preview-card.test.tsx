/**
 * @vitest-environment jsdom
 */
import { ActionPreviewEvent } from '@activepieces/shared';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActionPreviewCard } from '@/app/routes/chat-with-ai/components/action-preview-card';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/pieces/components/piece-icon-from-name', () => ({
  PieceIconWithPieceName: () => null,
}));

afterEach(() => {
  cleanup();
});

describe('ActionPreviewCard (characterization)', () => {
  it('calls onRun on Run', () => {
    const { onRun, onCancel, onDismiss } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('calls onCancel on Cancel', () => {
    const { onRun, onCancel } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRun).not.toHaveBeenCalled();
  });

  it('today has an X (Dismiss) that calls onDismiss (P4c removes the X)', () => {
    const { onDismiss } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('today calls onRun on every click of Run (no double-click guard yet; the refactor adds one)', () => {
    const { onRun } = renderCard();
    const run = screen.getByRole('button', { name: 'Run' });

    fireEvent.click(run);
    fireEvent.click(run);

    expect(onRun).toHaveBeenCalledTimes(2);
  });

  it('shows the action name and the input params, without auth', () => {
    renderCard();

    expect(screen.getByText('Send message')).toBeTruthy();
    expect(screen.getByText('channel')).toBeTruthy();
    expect(screen.getByText('#general')).toBeTruthy();
    expect(screen.queryByText('auth')).toBeNull();
  });
});

function renderCard() {
  const onRun = vi.fn();
  const onCancel = vi.fn();
  const onDismiss = vi.fn();
  render(
    <ActionPreviewCard
      preview={PREVIEW}
      onRun={onRun}
      onCancel={onCancel}
      onDismiss={onDismiss}
    />,
  );
  return { onRun, onCancel, onDismiss };
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
