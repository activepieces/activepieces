/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';

import { formatSuccessRate } from '@/app/routes/platform/infra/health/components/runs-tab';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const SUMMARY = {
  completed: 40,
  successRate: 87.5,
  previousCompleted: 0,
  previousSuccessRate: 0,
};

describe('formatSuccessRate', () => {
  it('shows a dash when no jobs completed', () => {
    const empty = { ...SUMMARY, completed: 0, successRate: 0 };
    expect(formatSuccessRate(empty)).toBe('—');
  });

  it('shows a dash when there is no summary', () => {
    expect(formatSuccessRate(undefined)).toBe('—');
  });

  it('shows the rate with one decimal when jobs completed', () => {
    expect(formatSuccessRate(SUMMARY)).toBe('87.5%');
  });
});
