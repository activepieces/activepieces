/**
 * @vitest-environment jsdom
 */
import { ActionReceiptEvent, BatchProgressData } from '@activepieces/shared';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActionReceiptCard } from '@/app/routes/chat-with-ai/components/action-receipt-card';
import { BatchProgressCard } from '@/app/routes/chat-with-ai/components/batch-progress-card';

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));
vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: {
    usePieceSummary: () => ({
      summary: { displayName: 'Gmail', logoUrl: undefined },
    }),
  },
}));

afterEach(() => {
  cleanup();
});

describe('ActionReceiptCard', () => {
  it('uses the doneTitle when the model gave one', () => {
    render(
      <ActionReceiptCard
        receipt={RECEIPT}
        doneTitle="Sent the welcome email"
      />,
    );
    expect(screen.getByText('Sent the welcome email')).toBeTruthy();
    expect(screen.queryByText('Send email')).toBe(null);
  });

  it('falls back to the action display name', () => {
    render(<ActionReceiptCard receipt={RECEIPT} />);
    expect(screen.getByText('Send email')).toBeTruthy();
  });

  it('shows the failed status in red with the reason', () => {
    render(
      <ActionReceiptCard
        receipt={{
          ...RECEIPT,
          status: 'failed',
          output: null,
          errorMessage: 'Invalid address',
        }}
      />,
    );
    const status = screen.getByText('Failed');
    expect(status.className).toContain('text-danger-11');
    expect(screen.getByText('Gmail · Invalid address')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Show details' }));
    const reason = screen.getAllByText('Invalid address')[0];
    expect(reason.className).toContain('text-danger-11');
  });

  it('opens to the output and switches to JSON', () => {
    render(<ActionReceiptCard receipt={RECEIPT} />);
    expect(screen.queryByText('View as JSON')).toBe(null);

    fireEvent.click(screen.getByRole('button', { name: 'Show details' }));
    fireEvent.click(screen.getByRole('button', { name: 'View as JSON' }));
    expect(screen.getByRole('button', { name: 'View as fields' })).toBeTruthy();
  });
});

describe('BatchProgressCard', () => {
  it('shows the first 3 failures, then all of them on demand', () => {
    render(<BatchProgressCard progress={BATCH} />);
    expect(screen.getByText('Bounced 1')).toBeTruthy();
    expect(screen.getByText('Bounced 3')).toBeTruthy();
    expect(screen.queryByText('Bounced 4')).toBe(null);

    fireEvent.click(
      screen.getByRole('button', {
        name: '{count, plural, =1 {Show all 1 failed} other {Show all # failed}} {"count":5}',
      }),
    );
    expect(screen.getByText('Bounced 5')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByText('Bounced 4')).toBe(null);
  });

  it('uses one ICU string for the counts', () => {
    render(<BatchProgressCard progress={BATCH} />);
    expect(
      screen.getByText(
        '{done} of {total} {"done":8,"total":8} · {count, plural, =1 {1 failed} other {# failed}} {"count":5}',
      ),
    ).toBeTruthy();
  });

  it('folds a finished batch with no failures', () => {
    render(
      <BatchProgressCard
        progress={{ ...BATCH, succeeded: 8, failed: 0, results: [] }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Show details' })).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBe(null);
  });
});

const RECEIPT: ActionReceiptEvent = {
  toolCallId: 'tc-1',
  actionDisplayName: 'Send email',
  pieceName: '@activepieces/piece-gmail',
  status: 'success',
  output: { id: 'm1' },
  timestamp: '2026-11-08T10:00:00.000Z',
};

const BATCH: BatchProgressData = {
  label: 'Sending welcome emails',
  total: 8,
  completed: 8,
  succeeded: 3,
  failed: 5,
  done: true,
  results: [1, 2, 3, 4, 5].map((n) => ({
    index: n,
    success: false,
    error: `Bounced ${n}`,
  })),
};
