import { describe, expect, it, vi } from 'vitest';

import { chatHistoryUtils } from '@/features/chat/lib/chat-history-utils';

vi.mock('i18next', () => ({
  default: { language: 'en-US' },
  t: (key: string) => key,
}));

const NOW = new Date(2026, 5, 10, 15, 0, 0);

describe('chatHistoryUtils.shortTime', () => {
  it('uses short relative times today', () => {
    expect(at(new Date(2026, 5, 10, 14, 59, 40))).toBe('Now');
    expect(at(new Date(2026, 5, 10, 14, 55, 0))).toBe('5m');
    expect(at(new Date(2026, 5, 10, 13, 0, 0))).toBe('2h');
  });

  it('says Yesterday, then a short date', () => {
    expect(at(new Date(2026, 5, 9, 9, 0, 0))).toBe('Yesterday');
    expect(at(new Date(2026, 5, 3, 9, 0, 0))).toBe('Jun 3');
    expect(at(new Date(2025, 5, 3, 9, 0, 0))).toBe('Jun 3, 2025');
  });
});

describe('chatHistoryUtils.showsSearch', () => {
  it('shows search only above the threshold or while a query is typed', () => {
    const limit = chatHistoryUtils.SEARCH_THRESHOLD;
    expect(chatHistoryUtils.showsSearch({ total: limit, query: '' })).toBe(
      false,
    );
    expect(chatHistoryUtils.showsSearch({ total: limit + 1, query: '' })).toBe(
      true,
    );
    expect(chatHistoryUtils.showsSearch({ total: 0, query: 'x' })).toBe(true);
  });
});

function at(date: Date): string {
  return chatHistoryUtils.shortTime({ date, now: NOW });
}
