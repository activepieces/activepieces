/**
 * @vitest-environment jsdom
 */
import { TriggerStatusReport } from '@activepieces/shared';
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, describe, expect, it, vi } from 'vitest';

let report: TriggerStatusReport = { pieces: {} };

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/flows', () => ({
  triggerRunHooks: {
    useStatusReport: () => ({
      data: report,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  },
}));

vi.mock('@/features/pieces', () => ({
  PieceDisplayName: ({ pieceName }: { pieceName: string }) => (
    <span>{pieceName}</span>
  ),
  PieceIconWithPieceName: () => null,
}));

vi.mock('@/app/components/dashboard-page-header', () => ({
  DashboardPageHeader: () => null,
}));

import TriggerHealthPage from '@/app/routes/platform/infra/triggers';

vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-09-28T12:00:00Z'));

const today = dayjs().format('YYYY-MM-DD');
const threeDaysAgo = dayjs().subtract(3, 'day').format('YYYY-MM-DD');

function renderWithPiece(
  dailyStats: Record<string, { success: number; failure: number }>,
) {
  const totalRuns = Object.values(dailyStats).reduce(
    (acc, day) => acc + day.success + day.failure,
    0,
  );
  report = {
    pieces: { '@activepieces/piece-gmail': { dailyStats, totalRuns } },
  };
  render(
    <MemoryRouter>
      <TriggerHealthPage />
    </MemoryRouter>,
  );
}

describe('TriggerHealthPage', () => {
  afterAll(() => {
    vi.useRealTimers();
  });

  it('reports 0% and a fault status when every trigger run failed', () => {
    renderWithPiece({
      [today]: { success: 0, failure: 4 },
      [threeDaysAgo]: { success: 0, failure: 6 },
    });

    expect(screen.getAllByText('0%')).toHaveLength(3);
    expect(screen.queryAllByText('100%')).toHaveLength(0);
    expect(
      screen.getAllByLabelText(
        'All trigger runs failed. Immediate attention required.',
      ),
    ).toHaveLength(1);
  });

  it('reports 100% and a success status when every trigger run succeeded', () => {
    renderWithPiece({ [today]: { success: 5, failure: 0 } });

    expect(screen.getAllByText('100%')).toHaveLength(3);
    expect(
      screen.getAllByLabelText(
        'All trigger runs were successful in the selected period.',
      ),
    ).toHaveLength(1);
  });

  it('reports the success rate and a warning status for mixed runs', () => {
    renderWithPiece({ [today]: { success: 1, failure: 3 } });

    expect(screen.getAllByText('25%')).toHaveLength(3);
    expect(
      screen.getAllByLabelText(
        'Some trigger runs failed. Please review for potential issues.',
      ),
    ).toHaveLength(1);
  });

  it('keeps 100% for a window with no runs', () => {
    renderWithPiece({ [threeDaysAgo]: { success: 0, failure: 2 } });

    expect(screen.getAllByText('100%')).toHaveLength(1);
    expect(screen.getAllByText('0%')).toHaveLength(2);
  });
});
